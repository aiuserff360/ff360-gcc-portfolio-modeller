import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, ArrowRight, Info, Save, Check, Lightbulb, BarChart3, ChevronRight, UserSquare2, Users, FolderKanban, AppWindow, RotateCcw, Send, CircleDot, Target, Settings, Gem, Share2, Database, Network, Handshake, Globe, Clock, FileText, LayoutGrid, Cpu, GraduationCap, Gauge, Scale, ShieldCheck, AlertTriangle, FileSignature, Route, Wallet, TrendingDown, Coins, TrendingUp, Timer } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SECTIONS, REVIEW_SECTION, RATINGS, RATING_GUIDE, sectionSubtitle, type Criterion, type Section } from '../data/framework'
import { ENTITY_META } from '../data/options'
import { scoreEntity, formatMoney, RECOMMENDATION_META, type EntityScore } from '../lib/scoring'
import type { Entity, EntityType, Rating } from '../types'
import { Modal, TextArea } from '../components/ui'

const CRIT_ICONS: Record<string, LucideIcon> = { Target, Settings, Gem, Share2, Database, BarChart3, Network, Users, Handshake, Globe, Clock, FileText, LayoutGrid, Cpu, GraduationCap, Gauge, Scale, ShieldCheck, AlertTriangle, FileSignature, Route, Wallet, TrendingDown, Coins, TrendingUp, Timer, Lightbulb }
const TYPE_ICON: Record<EntityType, LucideIcon> = { project: FolderKanban, application: AppWindow, role: UserSquare2, workforce: Users }

/** Per-type presentation, matching the reference screens. */
const LAYOUT: Record<EntityType, { stacked: boolean; rightPanel: boolean; leftTitle: string; numbered: boolean; rationaleLabel: string; placeholder: string; title: string; subtitle: string; back: string; noun: string }> = {
  project: { stacked: true, rightPanel: false, leftTitle: 'Assessment Sections', numbered: true, rationaleLabel: 'Rationale', placeholder: 'Explain why you selected this rating from an HQ perspective...', title: 'Assessment Framework (HQ Perspective)', subtitle: 'Rate the project/application based on your current context at the global HQ.', back: 'Back to Project Details', noun: 'work' },
  application: { stacked: true, rightPanel: false, leftTitle: 'Assessment Sections', numbered: true, rationaleLabel: 'Rationale', placeholder: 'Explain why you selected this rating from an HQ perspective...', title: 'Assessment Framework (HQ Perspective)', subtitle: 'Rate the project/application based on your current context at the global HQ.', back: 'Back to Application Details', noun: 'application' },
  role: { stacked: false, rightPanel: false, leftTitle: 'Assessment Progress', numbered: false, rationaleLabel: 'Rationale (HQ Perspective)', placeholder: 'Explain why you selected this rating...', title: 'Role Assessment', subtitle: 'Evaluate the role based on your current context at the Global HQ.', back: 'Back to Role Details', noun: 'role' },
  workforce: { stacked: false, rightPanel: true, leftTitle: 'Assessment Sections', numbered: true, rationaleLabel: 'Rationale (HQ Perspective)', placeholder: 'Explain why you selected this rating...', title: 'Team Assessment (HQ Perspective)', subtitle: 'Evaluate the team based on importance, complexity and business considerations from the global HQ perspective.', back: 'Back to Workforce Details', noun: 'team' },
}

function CritIcon({ name, accent }: { name: string; accent: string }) {
  const Cmp = CRIT_ICONS[name] ?? CircleDot
  return <span className={`crit-icon acc-${accent}`}><Cmp size={28} /></span>
}

function chips(e: Entity, currency: string): string[] {
  const c: string[] = []
  if (e.type === 'role') { if (e.roleLevel) c.push(e.roleLevel); if (e.experience) c.push(e.experience) }
  if (e.headcount) c.push(`${e.headcount} FTE`)
  if (e.type === 'workforce' && e.locations.length) c.push(e.locations.join(', '))
  if (e.annualSpend) c.push(`${formatMoney(e.annualSpend, currency)} ${e.type === 'role' ? 'Annual Cost' : 'Spend'}`)
  if (e.deliveryModel) c.push(e.deliveryModel)
  if (e.type === 'project' && e.lifecycleStage) c.push(e.lifecycleStage)
  if (e.type === 'workforce' && e.teamType) c.push(e.teamType)
  return c
}

export default function AssessmentWizard() {
  const { id, sectionId } = useParams()
  const navigate = useNavigate()
  const { getEntity, setResponse, submitAssessment, reopenAssessment, notify, settings } = useApp()
  const entity = id ? getEntity(id) : undefined
  const [guide, setGuide] = useState(false)
  const [notes, setNotes] = useState(entity?.assessment.reviewNotes ?? '')
  const [scrolledId, setScrolledId] = useState<string>(SECTIONS[0].id)
  const score = useMemo(() => (entity ? scoreEntity(entity) : undefined), [entity])
  const layout = entity ? LAYOUT[entity.type] : LAYOUT.project
  const isReview = sectionId === REVIEW_SECTION.id
  const current = sectionId ?? SECTIONS[0].id
  const idx = isReview ? SECTIONS.length : Math.max(0, SECTIONS.findIndex((s) => s.id === current))

  // Stacked (project/application): scroll to the requested section and track the one in view
  const stackRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!layout.stacked || isReview) { window.scrollTo({ top: 0 }); return }
    if (sectionId) {
      const el = document.getElementById(`sec-${sectionId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else window.scrollTo({ top: 0 })
  }, [sectionId, isReview, layout.stacked])
  useEffect(() => {
    if (!layout.stacked || isReview) return
    const els = SECTIONS.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean) as HTMLElement[]
    const onScroll = () => {
      let best = SECTIONS[0].id
      for (const el of els) { if (el.getBoundingClientRect().top <= 160) best = el.id.replace('sec-', '') }
      setScrolledId(best)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [layout.stacked, isReview, entity?.id])

  if (!entity || !score) {
    return <div className="card card-pad"><h2>Item not found</h2><p className="muted">It may have been deleted or belongs to another company.</p><Link to="/assessment" className="btn">Back to Assessment</Link></div>
  }
  const meta = ENTITY_META[entity.type]
  const locked = entity.assessment.submitted
  const activeIdx = layout.stacked ? (isReview ? SECTIONS.length : SECTIONS.findIndex((s) => s.id === scrolledId)) : idx
  const go = (i: number) => {
    if (layout.stacked) {
      if (i >= SECTIONS.length) navigate(`/assessment/${entity.id}/${REVIEW_SECTION.id}`)
      else if (isReview) navigate(`/assessment/${entity.id}/${SECTIONS[i].id}`)
      else document.getElementById(`sec-${SECTIONS[i].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate(`/assessment/${entity.id}/${i >= SECTIONS.length ? REVIEW_SECTION.id : SECTIONS[i].id}`)
  }
  const sectionDone = (i: number) => score.sections[i].answered === score.sections[i].total
  const completedSections = score.sections.filter((s) => s.answered === s.total).length + (locked ? 1 : 0)
  const Icon = TYPE_ICON[entity.type]
  const shortTitle = (s: Section) => s.title.split(' and ')[0]
  const nextLabel = layout.stacked ? (isReview ? null : 'Next: Review & Results') : idx < SECTIONS.length ? (idx + 1 < SECTIONS.length ? `Next: ${shortTitle(SECTIONS[idx + 1])}` : 'Next: Review & Submit') : null
  const prevLabel = layout.stacked ? (isReview ? 'Previous: Assessment Framework' : null) : idx > 0 ? `Previous: ${idx - 1 < SECTIONS.length ? shortTitle(SECTIONS[idx - 1]) : ''}` : null
  const onNext = () => go(layout.stacked ? SECTIONS.length : idx + 1)
  const onPrev = () => (layout.stacked ? navigate(`/assessment/${entity.id}`) : go(idx - 1))

  const submit = () => {
    if (score.answered < score.total) { notify(`Rate all ${score.total} criteria before submitting (${score.total - score.answered} remaining)`, 'error'); return }
    submitAssessment(entity.id, notes)
    notify('Assessment submitted')
    navigate('/opportunity-map')
  }
  const reopen = () => { reopenAssessment(entity.id); notify('Assessment reopened for editing', 'info') }

  const steps = [...SECTIONS.map((s) => ({ id: s.id, n: s.number, title: s.title })), { id: REVIEW_SECTION.id, n: REVIEW_SECTION.number, title: REVIEW_SECTION.title }]
  const stepLabel = (s: { n: number; title: string }, i: number) => (layout.numbered && !(layout.stacked && i === SECTIONS.length) ? `${s.n}. ${s.title}` : s.title)

  const renderSection = (section: Section, i: number, withAnchor: boolean) => (
    <div key={section.id} id={withAnchor ? `sec-${section.id}` : undefined} style={withAnchor ? { scrollMarginTop: 24 } : undefined}>
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 6 }}>
        <span className="num-badge" style={{ width: 32, height: 32, flexBasis: 32, fontSize: 15 }}>{section.number}</span>
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>{section.title}</h2>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{sectionSubtitle(section, entity.type)}</div>
        </div>
        <span className="right small muted mono">{score.sections[i].answered}/{score.sections[i].total} rated</span>
      </div>
      <div className="crit-wrap">
        {section.criteria[entity.type].map((c: Criterion) => {
          const r = entity.assessment.responses[section.id]?.[c.id]
          return (
            <div className="crit" key={c.id}>
              <CritIcon name={c.icon} accent={c.accent} />
              <div>
                <div className="crit-title">{c.title}</div>
                <div className="crit-q">{c.question}</div>
              </div>
              <div className="crit-rate">
                <div className="rate" role="radiogroup" aria-label={c.title}>
                  {RATINGS.map((rt: Rating) => (
                    <button key={rt} type="button" role="radio" aria-checked={r?.rating === rt} disabled={locked} className={r?.rating === rt ? `on acc-${c.accent}` : ''} onClick={() => setResponse(entity.id, section.id, c.id, { rating: r?.rating === rt ? null : rt })}>{rt}</button>
                  ))}
                </div>
              </div>
              <div className="crit-rat">
                <div className="label">{layout.rationaleLabel}</div>
                {locked ? <div className="readonly small" style={{ minHeight: 72 }}>{r?.rationale || <span className="muted">No rationale provided</span>}</div> : <TextArea value={r?.rationale ?? ''} onChange={(v) => setResponse(entity.id, section.id, c.id, { rationale: v })} placeholder={layout.placeholder} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const lockedBanner = locked && <div className="aside-card" style={{ background: '#dcf6ec', borderColor: '#b7ecd6', padding: '10px 14px', marginBottom: 10 }}><p style={{ color: '#047857' }}><b>Submitted</b> on {new Date(entity.assessment.submittedAt ?? '').toLocaleString()}. Ratings are read-only. Use <b>Reopen</b> to edit.</p></div>

  const leftPanel = (
    <div className="aside">
      <div className="aside-card" style={{ padding: 12 }}>
        <h4 style={{ padding: '2px 8px' }}>{layout.leftTitle}</h4>
        <div className="steps">
          {steps.map((s, i) => {
            const isReviewStep = i === SECTIONS.length
            const done = !isReviewStep ? sectionDone(i) : locked
            return (
              <span key={s.id} style={{ display: 'contents' }}>
                {isReviewStep && layout.stacked && <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '6px 8px' }} />}
                <button className={`step ${i === activeIdx ? 'active' : ''}`} onClick={() => go(i)}>
                  {isReviewStep && layout.stacked ? <span className={`num-badge ${done ? 'done' : 'grey'}`} style={{ background: done ? undefined : '#dbe3ef', color: done ? '#fff' : 'var(--navy)' }}>{done ? <Check size={14} /> : <BarChart3 size={14} />}</span> : <span className={`num-badge ${done ? 'done' : i === activeIdx ? '' : 'grey'}`}>{done ? <Check size={14} /> : s.n}</span>}
                  <span>{stepLabel(s, i)}</span>
                </button>
              </span>
            )
          })}
        </div>
      </div>
      <div className="aside-card blue">
        <p style={{ color: 'var(--text)', fontWeight: 500, display: 'flex', gap: 8 }}><Info size={18} style={{ color: 'var(--primary)', flex: '0 0 18px' }} /> Assess the {layout.noun} as it operates today from the Global HQ / business perspective.</p>
        <p style={{ marginTop: 10 }}>Do not consider India/GCC talent availability, compensation or delivery advantages at this stage.</p>
      </div>
    </div>
  )

  const rightPanel = layout.rightPanel && (
    <div className="aside aside-right">
      <div className="aside-card">
        <h4>Assessment Progress</h4>
        <div className="progress-ring"><Ring value={completedSections} total={steps.length} /></div>
        <div className="steps">
          {steps.map((s, i) => {
            const done = i < SECTIONS.length ? sectionDone(i) : locked
            return (
              <button key={s.id} className="step" style={{ padding: '6px 4px' }} onClick={() => go(i)}>
                <span className={`num-badge ${done ? 'done' : i === activeIdx ? '' : 'grey'}`} style={{ width: 22, height: 22, flexBasis: 22, fontSize: 12 }}>{done ? <Check size={12} /> : s.n}</span>
                <span className="small">{s.n}. {s.title}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="aside-card">
        <h4><Info /> Rating Guide</h4>
        {RATING_GUIDE.map((g) => <div className="guide-row" key={g.rating}><span className={`guide-pill ${g.rating.replace(' ', '')}`}>{g.rating}</span><span>{g.text}</span></div>)}
      </div>
      <div className="aside-card">
        <h4><Lightbulb /> Tips for Assessment</h4>
        <ul>
          <li>Focus on the {layout.noun} as it operates today from the HQ perspective.</li>
          <li>Use evidence such as stakeholder input, process documentation and experience.</li>
          <li>Be objective and consistent across {entity.type === 'workforce' ? 'teams' : `${layout.noun}s`}.</li>
          <li>Capture clear rationale for each rating.</li>
          <li>Do not consider India/GCC talent availability, compensation or delivery advantages at this stage.</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to={`/${meta.route}/${entity.id}`} className="back-link"><ArrowLeft size={16} /> {layout.back}</Link>
          <h1 className="page-title">{layout.title}</h1>
          <div className="page-sub">{layout.subtitle}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => setGuide(true)}><Info /> Assessment Guidance</button>
          <button className="btn" onClick={() => notify('Draft saved')}><Save /> Save as Draft</button>
          {prevLabel && <button className="btn" onClick={onPrev}><ArrowLeft /> {prevLabel}</button>}
          {locked && <button className="btn" onClick={reopen}><RotateCcw /> Reopen</button>}
          {nextLabel ? <button className="btn btn-primary" onClick={onNext}>{nextLabel} <ArrowRight /></button> : !locked && <button className="btn btn-primary" onClick={submit}><Send /> Submit Assessment</button>}
        </div>
      </div>

      <div className="banner" style={{ marginBottom: 16 }}>
        <span className="banner-icon"><Icon size={28} /></span>
        <div>
          <div className="banner-title">{entity.name}</div>
          <div className="crumb">{[entity.businessFunction, entity.capability, entity.subCapability].filter(Boolean).map((p, i) => <span key={i} className="row" style={{ gap: 8 }}>{i > 0 && <ChevronRight />}{p}</span>)}</div>
        </div>
        <div className="banner-chips">{chips(entity, settings.currency).map((c) => <span className="chip" key={c}>{c}</span>)}</div>
      </div>

      <div className={layout.rightPanel ? 'layout-3col' : 'layout-2col-wide'}>
        {leftPanel}
        <div className="card card-pad" ref={stackRef}>
          {isReview ? (
            <ReviewPanel entity={entity} score={score} notes={notes} setNotes={setNotes} onSubmit={submit} onReopen={reopen} />
          ) : layout.stacked ? (
            <>
              {lockedBanner}
              <div className="stack" style={{ gap: 28 }}>{SECTIONS.map((s, i) => renderSection(s, i, true))}</div>
              <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={onNext}>Next: Review &amp; Results <ArrowRight /></button>
              </div>
            </>
          ) : (
            <>
              {lockedBanner}
              {renderSection(SECTIONS[idx], idx, false)}
              <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                {prevLabel ? <button className="btn" onClick={onPrev}><ArrowLeft /> {prevLabel}</button> : <span />}
                {nextLabel && <button className="btn btn-primary" onClick={onNext}>{nextLabel} <ArrowRight /></button>}
              </div>
            </>
          )}
        </div>
        {rightPanel}
      </div>

      {guide && (
        <Modal title="Assessment Guidance" onClose={() => setGuide(false)} width={720} footer={<button className="btn btn-primary" onClick={() => setGuide(false)}>Got it</button>}>
          <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.55 }}>Rate each criterion as the {layout.noun} operates <b>today, from the global HQ / business perspective</b>. The purpose of this stage is to understand strategic importance, proximity to the business, delivery characteristics, risk and economics. Location-specific advantages such as GCC talent availability or cost arbitrage are deliberately excluded and are considered later in the Footprint Designer and Scenario Modeller.</p>
          <div>
            <div className="bold" style={{ marginBottom: 8 }}>Rating scale</div>
            {RATING_GUIDE.map((g) => <div className="guide-row" key={g.rating}><span className={`guide-pill ${g.rating.replace(' ', '')}`}>{g.rating}</span><span>{g.text}</span></div>)}
          </div>
          <div>
            <div className="bold" style={{ marginBottom: 8 }}>Sections</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {SECTIONS.map((s) => <li key={s.id}><b>{s.title}.</b> {sectionSubtitle(s, entity.type)}</li>)}
              <li><b>Review &amp; Submit.</b> Check the scores, add overall notes and submit. Submitted assessments feed the Opportunity Map, Footprint Designer, Scenario Modeller and Reports.</li>
            </ul>
          </div>
          <div>
            <div className="bold" style={{ marginBottom: 8 }}>How scores are derived</div>
            <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.55 }}><b>Strategic Value</b> is the average rating in Strategic Relevance and Complexity. <b>GCC Feasibility</b> averages the remaining four sections, where criteria that make work harder to relocate (proximity, risk, investment) are inverted so a higher score always means more feasible. Items above 2.5 on both axes become GCC Capability Hub candidates.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Ring({ value, total }: { value: number; total: number }) {
  const r = 44, c = 2 * Math.PI * r, pct = total ? value / total : 0
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e5ebf5" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 55 55)" />
      <text x="55" y="61" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--navy)">{value}/{total}</text>
    </svg>
  )
}

function ReviewPanel({ entity, score: sc, notes, setNotes, onSubmit, onReopen }: { entity: Entity; score: EntityScore; notes: string; setNotes: (v: string) => void; onSubmit: () => void; onReopen: () => void }) {
  const rec = RECOMMENDATION_META[sc.recommendation]
  const complete = sc.answered === sc.total
  const navigate = useNavigate()
  const stacked = LAYOUT[entity.type].stacked
  return (
    <>
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 14 }}>
        <span className="num-badge" style={{ width: 32, height: 32, flexBasis: 32, fontSize: 15 }}><BarChart3 size={16} /></span>
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>Review &amp; {stacked ? 'Results' : 'Submit'}</h2>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>Check the ratings across all sections, then submit to place this item on the Opportunity Map.</div>
        </div>
      </div>

      <div className="score-grid" style={{ marginBottom: 16 }}>
        <div className="score-tile"><div className="big">{sc.answered}/{sc.total}</div><div className="lbl">Criteria rated</div></div>
        <div className="score-tile"><div className="big">{sc.strategicValue ? sc.strategicValue.toFixed(1) : '—'}</div><div className="lbl">Strategic value (1–4)</div></div>
        <div className="score-tile"><div className="big">{sc.feasibility ? sc.feasibility.toFixed(1) : '—'}</div><div className="lbl">GCC feasibility (1–4)</div></div>
        <div className="score-tile" style={{ borderColor: rec.color }}><div className="big" style={{ fontSize: 17, color: rec.color }}>{sc.recommendation}</div><div className="lbl">Indicative recommendation</div></div>
      </div>

      <div className="rec-box" style={{ background: `${rec.color}14`, borderColor: `${rec.color}66`, marginBottom: 16 }}>
        <Lightbulb size={22} style={{ color: rec.color, flex: '0 0 22px' }} />
        <div><div className="rec-name" style={{ color: rec.color }}>{sc.recommendation}</div><div style={{ color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>{rec.description}</div></div>
      </div>

      <table className="table review-table" style={{ marginBottom: 16 }}>
        <thead><tr><th>Section</th><th className="num">Rated</th><th className="num">Avg rating</th><th>Ratings</th><th /></tr></thead>
        <tbody>
          {SECTIONS.map((s, i) => {
            const ss = sc.sections[i]
            return (
              <tr key={s.id}>
                <td className="bold">{s.number}. {s.title}</td>
                <td className="num mono">{ss.answered}/{ss.total}</td>
                <td className="num mono">{ss.mean ? ss.mean.toFixed(1) : '—'}</td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    {s.criteria[entity.type].map((c) => {
                      const r = entity.assessment.responses[s.id]?.[c.id]?.rating
                      return <span key={c.id} className={`guide-pill ${r ? r.replace(' ', '') : ''}`} style={{ padding: '3px 8px', background: r ? undefined : '#e6ebf2', color: r ? undefined : 'var(--text-3)' }} title={`${c.title}: ${r ?? 'Not rated'}${entity.assessment.responses[s.id]?.[c.id]?.rationale ? ` — ${entity.assessment.responses[s.id][c.id].rationale}` : ''}`}>{c.title.length > 22 ? `${c.title.slice(0, 20)}…` : c.title}{r ? `: ${r}` : ''}</span>
                    })}
                  </div>
                </td>
                <td><button className="btn btn-xs" onClick={() => navigate(`/assessment/${entity.id}/${s.id}`)}>{ss.answered < ss.total ? 'Complete' : 'Edit'}</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="field" style={{ marginBottom: 16 }}>
        <label className="label">Overall notes (optional)</label>
        {entity.assessment.submitted ? <div className="readonly">{entity.assessment.reviewNotes || <span className="muted">No notes</span>}</div> : <TextArea value={notes} onChange={setNotes} placeholder="Summarise key considerations, caveats or follow-ups for this assessment…" max={1000} />}
      </div>

      {entity.assessment.submitted ? (
        <div className="row"><span className="chip" style={{ color: 'var(--success)' }}><Check size={14} /> Submitted {new Date(entity.assessment.submittedAt ?? '').toLocaleString()}</span><button className="btn" onClick={onReopen}><RotateCcw /> Reopen for editing</button><Link to="/opportunity-map" className="btn btn-primary">View on Opportunity Map <ArrowRight /></Link></div>
      ) : (
        <div className="row">
          {!complete && <span className="small muted">{sc.total - sc.answered} criteria still need a rating before you can submit.</span>}
          <button className="btn btn-primary right" onClick={onSubmit} disabled={!complete}><Send /> Submit Assessment</button>
        </div>
      )}
    </>
  )
}
