import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Wand2, Info, CalendarRange, Users, TrendingDown, Flag } from 'lucide-react'
import { useApp, newId } from '../store/AppContext'
import { computeFootprint, computeTimeline, autoPlan, fmtMonth, addMonths, defaultDuration, STATUS_ORDER } from '../lib/model'
import { formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import { ENTITY_META } from '../data/options'
import type { Wave, TransitionItem, TransitionStatus } from '../types'
import { Field, TextInput, Modal, ConfirmModal } from '../components/ui'

const WAVE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#4a3aa7', '#eda100', '#e34948']

export default function TransitionPlanner() {
  const { entities, locations, allocations, waves, transitions, settings, activeCompany, upsertWave, deleteWave, setTransition, setTransitions, notify } = useApp()
  const [editWave, setEditWave] = useState<Wave | null>(null)
  const [delWave, setDelWave] = useState<Wave | null>(null)
  const footprint = useMemo(() => computeFootprint(entities, locations, allocations), [entities, locations, allocations])
  const tl = useMemo(() => computeTimeline(waves, transitions, entities, footprint), [waves, transitions, entities, footprint])
  const sortedWaves = useMemo(() => [...waves].sort((a, b) => a.startMonth.localeCompare(b.startMonth)), [waves])
  const colorOf = (waveId: string) => WAVE_COLORS[sortedWaves.findIndex((w) => w.id === waveId) % WAVE_COLORS.length]
  const totalFte = tl.items.reduce((a, i) => a + i.entity.headcount, 0)
  const totalSavings = tl.items.reduce((a, i) => a + i.savings, 0)
  const steady = tl.items.filter((i) => i.item.status === 'Steady State').length
  const lastEnd = tl.months.length ? addMonths(tl.origin, Math.max(0, ...tl.items.map((i) => i.end)) - 1) : null

  const assign = (entityId: string, waveId: string | null) => {
    const e = entities.find((x) => x.id === entityId); if (!e) return
    const prev = transitions.find((t) => t.entityId === entityId)
    setTransition({ entityId, waveId, status: prev?.status ?? 'Not Started', offsetMonths: prev?.offsetMonths ?? 0, durationMonths: prev?.durationMonths ?? defaultDuration(e), owner: prev?.owner ?? '', notes: prev?.notes ?? '' })
  }
  const patchItem = (t: TransitionItem, p: Partial<TransitionItem>) => setTransition({ ...t, ...p })
  const doAutoPlan = () => {
    if (!waves.length) { notify('Add at least one wave first', 'error'); return }
    const list = autoPlan(entities, waves, transitions)
    setTransitions(list)
    notify(`Planned ${list.length} items across ${Math.min(waves.length, 3)} waves`)
  }
  const saveWave = () => {
    if (!editWave) return
    if (!editWave.name.trim() || !/^\d{4}-\d{2}$/.test(editWave.startMonth)) { notify('Wave needs a name and a start month', 'error'); return }
    upsertWave(editWave); setEditWave(null); notify('Wave saved')
  }
  const newWave = () => {
    const last = sortedWaves[sortedWaves.length - 1]
    const start = last ? addMonths(last.startMonth, last.durationMonths) : `${new Date().getFullYear() + 1}-01`
    setEditWave({ id: newId('project').replace('pro', 'wave'), companyId: activeCompany.id, name: `Wave ${waves.length + 1}`, startMonth: start, durationMonths: 6, description: '' })
  }
  const ganttCols = tl.months.length
  const colW = 30

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Transition Planner</h1>
          <div className="page-sub">Sequence the designed footprint into waves and track each transition for <b>{activeCompany.name}</b>.</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={doAutoPlan}><Wand2 /> Auto-plan by recommendation</button>
          <button className="btn btn-primary" onClick={newWave}><Plus /> Add wave</button>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="kpi-icon acc-blue"><CalendarRange /></span><div><div className="kpi-val">{waves.length}</div><div className="kpi-lbl">Waves · {tl.months.length ? `${fmtMonth(tl.origin)} – ${fmtMonth(lastEnd ?? tl.origin)}` : 'no dates yet'}</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-purple"><Users /></span><div><div className="kpi-val">{totalFte.toLocaleString()} FTE</div><div className="kpi-lbl">{tl.items.length} items planned · {tl.unassigned.length} unassigned</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-green"><TrendingDown /></span><div><div className="kpi-val">{formatMoney(totalSavings, settings.currency)}</div><div className="kpi-lbl">Run-rate saving from designed footprint</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-amber"><Flag /></span><div><div className="kpi-val">{steady}/{tl.items.length}</div><div className="kpi-lbl">Transitions at steady state</div></div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title">Timeline</div>
        {tl.months.length === 0 ? (
          <div className="empty"><Info /><div className="bold">No waves defined</div><div className="small">Add a wave to start planning.</div></div>
        ) : (
          <div className="gantt">
            <div className="gantt-grid" style={{ gridTemplateColumns: `260px repeat(${ganttCols}, ${colW}px)`, minWidth: 260 + ganttCols * colW }}>
              <div />
              {tl.months.map((m) => <div key={m} className={`gantt-head ${m.endsWith('-01') ? 'year' : ''}`}>{m.endsWith('-01') ? m.slice(0, 4) : m.endsWith('-04') || m.endsWith('-07') || m.endsWith('-10') ? `Q${Math.ceil(Number(m.slice(5)) / 3)}` : ''}</div>)}
              {tl.waves.map((w, wi) => (
                <span key={w.wave.id} style={{ display: 'contents' }}>
                  <div className="gantt-label" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <div className="bold" style={{ color: WAVE_COLORS[wi % WAVE_COLORS.length] }}>{w.wave.name}</div>
                    <div className="small muted">{fmtMonth(w.wave.startMonth)} · {w.wave.durationMonths} mo · {w.fte} FTE · {formatMoney(w.savings, settings.currency)}</div>
                  </div>
                  <div style={{ gridColumn: `2 / span ${ganttCols}`, borderTop: '1px solid var(--border)', paddingTop: 12, position: 'relative', minHeight: 30 }}>
                    <div className="gantt-wave" style={{ marginLeft: w.start * colW, width: w.wave.durationMonths * colW, background: WAVE_COLORS[wi % WAVE_COLORS.length] }} />
                  </div>
                  {w.items.map((i) => (
                    <span key={i.entity.id} style={{ display: 'contents' }}>
                      <div className="gantt-label" style={{ paddingLeft: 14 }}>
                        <div className="truncate" title={i.entity.name}><i className="type-dot" style={{ background: ENTITY_META[i.entity.type].color, marginRight: 6 }} />{i.entity.name}</div>
                        <div className="small muted">{i.entity.headcount} FTE · <span className={`status-pill s${STATUS_ORDER.indexOf(i.item.status)}`}>{i.item.status}</span></div>
                      </div>
                      <div style={{ gridColumn: `2 / span ${ganttCols}`, position: 'relative', height: 38, display: 'flex', alignItems: 'center', backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${colW}px)` }}>
                        <div className="gantt-bar" title={`${fmtMonth(addMonths(tl.origin, i.start))} – ${fmtMonth(addMonths(tl.origin, i.end - 1))}`} style={{ marginLeft: i.start * colW, width: (i.end - i.start) * colW - 4, background: WAVE_COLORS[wi % WAVE_COLORS.length], opacity: i.item.status === 'Steady State' ? 0.5 : 1 }}>{fmtMonth(addMonths(tl.origin, i.start))} → {fmtMonth(addMonths(tl.origin, i.end - 1))}</div>
                      </div>
                    </span>
                  ))}
                  {w.items.length === 0 && <><div className="gantt-label small muted" style={{ paddingLeft: 14 }}>No items assigned</div><div style={{ gridColumn: `2 / span ${ganttCols}` }} /></>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="layout-2col" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="card table-wrap">
          <div className="card-pad" style={{ paddingBottom: 6 }}><div className="card-title">Transition plan</div></div>
          {tl.items.length === 0 && tl.unassigned.length === 0 ? (
            <div className="empty"><Info /><div className="bold">Nothing to plan yet</div><div className="small">Submit assessments and design the footprint, then assign items to waves.</div><div style={{ marginTop: 10 }}><Link to="/assessment" className="btn btn-primary">Go to Assessment</Link></div></div>
          ) : (
            <table className="table">
              <thead><tr><th>Item</th><th>Recommendation</th><th>Wave</th><th>Offset</th><th>Duration</th><th>Status</th><th>Owner</th><th className="num">FTE</th><th className="num">Saving</th></tr></thead>
              <tbody>
                {[...tl.items.sort((a, b) => a.start - b.start).map((i) => ({ e: i.entity, t: i.item, s: i.savings })), ...tl.unassigned.map((e) => ({ e, t: transitions.find((t) => t.entityId === e.id), s: footprint.find((r) => r.entity.id === e.id)?.savings ?? 0 }))].map(({ e, t, s }) => {
                  const rec = footprint.find((r) => r.entity.id === e.id)?.recommendation ?? 'Not Assessed'
                  return (
                    <tr key={e.id}>
                      <td><div className="bold">{e.name}</div><div className="small muted">{ENTITY_META[e.type].singular} · {e.businessFunction}</div></td>
                      <td className="small bold" style={{ color: RECOMMENDATION_META[rec].color }}>{rec}</td>
                      <td><select className="select inline" value={t?.waveId ?? ''} onChange={(ev) => assign(e.id, ev.target.value || null)}><option value="">Unassigned</option>{sortedWaves.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></td>
                      <td>{t?.waveId ? <input className="input inline mono" type="number" min={0} max={24} value={t.offsetMonths} onChange={(ev) => patchItem(t, { offsetMonths: Math.max(0, Number(ev.target.value) || 0) })} /> : <span className="muted">—</span>}</td>
                      <td>{t?.waveId ? <span className="row" style={{ gap: 4 }}><input className="input inline mono" type="number" min={1} max={36} value={t.durationMonths} onChange={(ev) => patchItem(t, { durationMonths: Math.max(1, Number(ev.target.value) || 1) })} /><span className="small muted">mo</span></span> : <span className="muted">—</span>}</td>
                      <td>{t?.waveId ? <select className="select inline" value={t.status} onChange={(ev) => patchItem(t, { status: ev.target.value as TransitionStatus })}>{STATUS_ORDER.map((st) => <option key={st}>{st}</option>)}</select> : <span className="muted">—</span>}</td>
                      <td>{t?.waveId ? <input className="input inline" style={{ width: 150 }} value={t.owner} placeholder="Owner" onChange={(ev) => patchItem(t, { owner: ev.target.value })} /> : <span className="muted">—</span>}</td>
                      <td className="num">{e.headcount}</td>
                      <td className="num" style={{ color: s > 0 ? '#047857' : undefined }}>{s ? formatMoney(s, settings.currency) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="aside">
          <div className="aside-card">
            <h4><CalendarRange /> Waves</h4>
            {sortedWaves.length === 0 && <p>No waves yet.</p>}
            {sortedWaves.map((w, i) => (
              <div key={w.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="row" style={{ gap: 8 }}><i className="type-dot" style={{ background: WAVE_COLORS[i % WAVE_COLORS.length] }} /><span className="bold grow">{w.name}</span><button className="btn btn-xs" onClick={() => setEditWave({ ...w })}>Edit</button><button className="icon-btn danger" onClick={() => setDelWave(w)} aria-label="Delete wave"><Trash2 /></button></div>
                <div className="small muted" style={{ marginTop: 2 }}>{fmtMonth(w.startMonth)} – {fmtMonth(addMonths(w.startMonth, w.durationMonths - 1))} · {w.durationMonths} months</div>
                {w.description && <div className="small" style={{ marginTop: 2 }}>{w.description}</div>}
              </div>
            ))}
          </div>
          <div className="aside-card blue">
            <h4><Info /> Milestones per transition</h4>
            <ul>
              <li><b>Planning</b> – mobilise, finalise scope and hiring plan.</li>
              <li><b>Knowledge Transfer</b> – shadowing and documentation, typically the first 40% of the window.</li>
              <li><b>Parallel Run</b> – GCC delivers with HQ oversight.</li>
              <li><b>Steady State</b> – SLAs met, HQ steps back.</li>
            </ul>
            <p style={{ marginTop: 8 }}>Auto-plan places Early Transition work in wave 1, Capability Hub work in wave 2 and Hybrid work in wave 3, staggering items by a month.</p>
          </div>
        </div>
      </div>

      {editWave && (
        <Modal title={waves.some((w) => w.id === editWave.id) ? 'Edit wave' : 'Add wave'} onClose={() => setEditWave(null)} width={520} footer={<><button className="btn" onClick={() => setEditWave(null)}>Cancel</button><button className="btn btn-primary" onClick={saveWave}>Save</button></>}>
          <div className="fgrid c2">
            <Field label="Name" required><TextInput value={editWave.name} onChange={(v) => setEditWave({ ...editWave, name: v })} /></Field>
            <Field label="Start month" required><input className="input" type="month" value={editWave.startMonth} onChange={(e) => setEditWave({ ...editWave, startMonth: e.target.value })} /></Field>
            <Field label="Duration (months)"><input className="input mono" type="number" min={1} max={36} value={editWave.durationMonths} onChange={(e) => setEditWave({ ...editWave, durationMonths: Math.max(1, Number(e.target.value) || 1) })} /></Field>
            <Field label="Description" className="span2"><TextInput value={editWave.description} onChange={(v) => setEditWave({ ...editWave, description: v })} placeholder="Scope and intent of this wave" /></Field>
          </div>
        </Modal>
      )}
      {delWave && <ConfirmModal title={`Delete ${delWave.name}?`} message="Items in this wave become unassigned." confirmLabel="Delete" danger onClose={() => setDelWave(null)} onConfirm={() => { deleteWave(delWave.id); notify('Wave deleted', 'info') }} />}
    </div>
  )
}
