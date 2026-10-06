import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { ENTITY_META, BUSINESS_FUNCTIONS } from '../data/options'
import { scoreEntity, RECOMMENDATION_META, formatMoney, type Recommendation } from '../lib/scoring'
import type { Entity, EntityType } from '../types'

const QUADS: { rec: Recommendation; x: 0 | 1; y: 0 | 1 }[] = [
  { rec: 'Retain at HQ / Hybrid', x: 0, y: 1 },
  { rec: 'GCC Capability Hub', x: 1, y: 1 },
  { rec: 'Optimise in Place', x: 0, y: 0 },
  { rec: 'Early Transition Candidate', x: 1, y: 0 },
]

/* Marker shape per entity type so identity is not carried by colour alone. */
function Marker({ type, cx, cy, r, color, ...rest }: { type: EntityType; cx: number; cy: number; r: number; color: string } & React.SVGProps<SVGElement>) {
  const common = { fill: color, stroke: '#fff', strokeWidth: 2, ...(rest as object) }
  if (type === 'project') return <circle cx={cx} cy={cy} r={r} {...common} />
  if (type === 'application') return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={3} {...common} />
  if (type === 'role') return <polygon points={`${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`} {...common} />
  return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} {...common} />
}

export default function OpportunityMap() {
  const { entities, settings } = useApp()
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [fn, setFn] = useState('')
  const [hover, setHover] = useState<{ e: Entity; x: number; y: number } | null>(null)

  const scored = useMemo(() => entities.map((e) => ({ e, s: scoreEntity(e) })).filter(({ e, s }) => s.strategicValue !== undefined && s.feasibility !== undefined && s.answered === s.total && (!type || e.type === type) && (!fn || e.businessFunction === fn)), [entities, type, fn])
  const unassessed = entities.filter((e) => scoreEntity(e).recommendation === 'Not Assessed').length

  const W = 760, H = 520, P = { l: 56, r: 24, t: 28, b: 52 }
  const pw = W - P.l - P.r, ph = H - P.t - P.b
  const sx = (v: number) => P.l + ((v - 1) / 3) * pw
  const sy = (v: number) => P.t + ph - ((v - 1) / 3) * ph
  const maxHc = Math.max(1, ...scored.map(({ e }) => e.headcount))
  const rad = (hc: number) => 7 + Math.sqrt(hc / maxHc) * 16

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Opportunity Map</h1>
          <div className="page-sub">Strategic value versus GCC feasibility for every submitted assessment. Marker size reflects headcount.</div>
        </div>
        <div className="filters">
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{(Object.keys(ENTITY_META) as EntityType[]).map((t) => <option key={t} value={t}>{ENTITY_META[t].plural}</option>)}</select>
          <select className="select" value={fn} onChange={(e) => setFn(e.target.value)}><option value="">All functions</option>{BUSINESS_FUNCTIONS.map((f) => <option key={f}>{f}</option>)}</select>
        </div>
      </div>

      <div className="layout-2col">
        <div className="card card-pad viz-root" style={{ position: 'relative' }}>
          <div className="legend" style={{ marginBottom: 8 }}>
            {(Object.keys(ENTITY_META) as EntityType[]).map((t) => (
              <span key={t}><svg width="14" height="14"><Marker type={t} cx={7} cy={7} r={5} color={ENTITY_META[t].color} /></svg>{ENTITY_META[t].plural}</span>
            ))}
          </div>
          {scored.length === 0 ? (
            <div className="empty" style={{ height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Info />
              <div className="bold">No completed assessments to plot</div>
              <div className="small">Complete all five sections of an assessment and it will appear here.</div>
              <div style={{ marginTop: 12 }}><Link to="/assessment" className="btn btn-primary">Go to Assessment</Link></div>
            </div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => setHover(null)}>
              {QUADS.map((q) => (
                <rect key={q.rec} x={q.x ? sx(2.5) : P.l} y={q.y ? P.t : sy(2.5)} width={pw / 2} height={ph / 2} fill={RECOMMENDATION_META[q.rec].color} opacity={0.06} />
              ))}
              {[1, 2, 3, 4].map((v) => (
                <g key={v}>
                  <line x1={sx(v)} x2={sx(v)} y1={P.t} y2={P.t + ph} stroke="var(--grid)" />
                  <line x1={P.l} x2={P.l + pw} y1={sy(v)} y2={sy(v)} stroke="var(--grid)" />
                  <text x={sx(v)} y={P.t + ph + 18} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{v}</text>
                  <text x={P.l - 10} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{v}</text>
                </g>
              ))}
              <line x1={sx(2.5)} x2={sx(2.5)} y1={P.t} y2={P.t + ph} stroke="var(--text-secondary)" strokeDasharray="4 4" opacity={0.5} />
              <line x1={P.l} x2={P.l + pw} y1={sy(2.5)} y2={sy(2.5)} stroke="var(--text-secondary)" strokeDasharray="4 4" opacity={0.5} />
              <text x={P.l + pw / 2} y={H - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-secondary)">GCC Feasibility →</text>
              <text transform={`translate(14 ${P.t + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-secondary)">Strategic Value (HQ) →</text>
              {scored.sort((a, b) => b.e.headcount - a.e.headcount).map(({ e, s }) => {
                const cx = sx(s.feasibility!), cy = sy(s.strategicValue!)
                return (
                  <g key={e.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assessment/${e.id}/review`)} onMouseEnter={(ev) => { const box = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect(); setHover({ e, x: ((cx / W) * box.width), y: ((cy / H) * box.height) }) }}>
                    <circle cx={cx} cy={cy} r={rad(e.headcount) + 8} fill="transparent" />
                    <Marker type={e.type} cx={cx} cy={cy} r={rad(e.headcount)} color={ENTITY_META[e.type].color} opacity={hover && hover.e.id !== e.id ? 0.45 : 0.92} />
                    <text x={cx} y={cy - rad(e.headcount) - 5} textAnchor="middle" fontSize="11" fill="var(--text-primary)" fontWeight="500">{e.code || e.name.slice(0, 14)}</text>
                  </g>
                )
              })}
              {QUADS.map((q) => (
                <text key={q.rec} className="quad-label" x={q.x ? P.l + pw - 10 : P.l + 10} y={q.y ? P.t + 16 : P.t + ph - 10} textAnchor={q.x ? 'end' : 'start'}>{q.rec}</text>
              ))}
            </svg>
          )}
          {hover && (
            <div className="viz-tip" style={{ left: hover.x + 14, top: hover.y + 60 }}>
              <div className="bold">{hover.e.name}</div>
              <div style={{ opacity: 0.85 }}>{ENTITY_META[hover.e.type].singular} · {hover.e.businessFunction}</div>
              <div style={{ marginTop: 4 }}>Strategic value {scoreEntity(hover.e).strategicValue!.toFixed(1)} · Feasibility {scoreEntity(hover.e).feasibility!.toFixed(1)}</div>
              <div>{hover.e.headcount} FTE · {formatMoney(hover.e.annualSpend, settings.currency)}</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>{scoreEntity(hover.e).recommendation}</div>
            </div>
          )}
        </div>

        <div className="aside">
          {QUADS.map((q) => {
            const items = scored.filter(({ s }) => s.recommendation === q.rec)
            const hc = items.reduce((a, { e }) => a + e.headcount, 0)
            const spend = items.reduce((a, { e }) => a + e.annualSpend, 0)
            const m = RECOMMENDATION_META[q.rec]
            return (
              <div className="aside-card" key={q.rec} style={{ borderLeft: `4px solid ${m.color}` }}>
                <h4 style={{ marginBottom: 4 }}><span style={{ color: m.color }}>{q.rec}</span><span className="right chip" style={{ padding: '2px 8px' }}>{items.length}</span></h4>
                <p>{m.description}</p>
                {items.length > 0 && <div className="small muted" style={{ marginTop: 6 }}>{hc.toLocaleString()} FTE · {formatMoney(spend, settings.currency)}</div>}
                {items.length > 0 && <ul style={{ marginTop: 6, paddingLeft: 16 }}>{items.map(({ e }) => <li key={e.id}><Link to={`/assessment/${e.id}/review`} className="text-primary">{e.name}</Link></li>)}</ul>}
              </div>
            )
          })}
          {unassessed > 0 && <div className="aside-card blue"><p><b>{unassessed}</b> item{unassessed > 1 ? 's are' : ' is'} not yet fully assessed and {unassessed > 1 ? 'are' : 'is'} not shown. <Link to="/assessment" className="text-primary">Continue assessments</Link></p></div>}
        </div>
      </div>

      {scored.length > 0 && (
        <div className="card table-wrap" style={{ marginTop: 18 }}>
          <table className="table">
            <thead><tr><th>Item</th><th>Type</th><th>Function</th><th className="num">FTE</th><th className="num">Spend</th><th className="num">Strategic value</th><th className="num">Feasibility</th><th>Recommendation</th></tr></thead>
            <tbody>
              {[...scored].sort((a, b) => (b.s.strategicValue! + b.s.feasibility!) - (a.s.strategicValue! + a.s.feasibility!)).map(({ e, s }) => (
                <tr key={e.id} className="click" onClick={() => navigate(`/assessment/${e.id}/review`)}>
                  <td className="bold">{e.name}</td>
                  <td><span className="row small" style={{ gap: 6 }}><i className="type-dot" style={{ background: ENTITY_META[e.type].color }} />{ENTITY_META[e.type].singular}</span></td>
                  <td className="small">{e.businessFunction}</td>
                  <td className="num">{e.headcount.toLocaleString()}</td>
                  <td className="num">{formatMoney(e.annualSpend, settings.currency)}</td>
                  <td className="num mono">{s.strategicValue!.toFixed(1)}</td>
                  <td className="num mono">{s.feasibility!.toFixed(1)}</td>
                  <td className="small bold" style={{ color: RECOMMENDATION_META[s.recommendation].color }}>{s.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
