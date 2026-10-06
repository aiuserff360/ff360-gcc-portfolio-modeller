import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Copy, Trash2, Star, Users, TrendingDown, Coins, Timer, Info } from 'lucide-react'
import { useApp, newId } from '../store/AppContext'
import { computeScenario, REC_KEYS, type ScenarioResult } from '../lib/model'
import { formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import type { Scenario, RecKey } from '../types'
import { Field, TextInput, ConfirmModal } from '../components/ui'

const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#4a3aa7']

function Range({ label, value, min, max, step = 1, unit, onChange, help }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void; help?: string }) {
  return (
    <Field label={label} help={help}>
      <div className="range-row">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="val">{unit === '$' ? formatMoney(value) : `${value}${unit}`}</span>
      </div>
    </Field>
  )
}

export default function ScenarioModeller() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { entities, locations, scenarios, settings, activeCompany, upsertScenario, deleteScenario, setBaselineScenario, notify } = useApp()
  const [toDelete, setToDelete] = useState<Scenario | null>(null)
  const active = scenarios.find((s) => s.id === id) ?? scenarios.find((s) => s.isBaseline) ?? scenarios[0]
  const results = useMemo(() => scenarios.map((s) => computeScenario(entities, locations, s)), [scenarios, entities, locations])
  const res = results.find((r) => r.scenario.id === active?.id)
  const hubs = locations.filter((l) => l.type === 'GCC Hub' || l.type === 'Nearshore')

  const patch = (p: Partial<Scenario>) => { if (active) upsertScenario({ ...active, ...p }) }
  const setPct = (k: RecKey, v: number) => { if (active) upsertScenario({ ...active, movePct: { ...active.movePct, [k]: v } }) }
  const add = (from?: Scenario) => {
    const s: Scenario = from ? { ...from, id: newId('project').replace('pro', 'scn'), name: `${from.name} (Copy)`, isBaseline: false, createdAt: new Date().toISOString() } : { id: newId('project').replace('pro', 'scn'), companyId: activeCompany.id, name: 'New Scenario', description: '', isBaseline: scenarios.length === 0, targetLocationId: hubs[0]?.id ?? '', movePct: { 'GCC Capability Hub': 50, 'Early Transition Candidate': 70, 'Retain at HQ / Hybrid': 0, 'Optimise in Place': 0 }, transitionCostPerFte: 25_000, rampYears: 2, productivityDipPct: 15, overheadPct: 10, horizonYears: 5, createdAt: new Date().toISOString() }
    upsertScenario(s); navigate(`/scenario-modeller/${s.id}`); notify(from ? 'Scenario duplicated' : 'Scenario created')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Scenario Modeller</h1>
          <div className="page-sub">Model how much of the assessed portfolio moves, where, and what it is worth over time. Scenarios read the submitted assessments for <b>{activeCompany.name}</b>.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => add()}><Plus /> New scenario</button>
        </div>
      </div>

      <div className="scn-tabs" style={{ marginBottom: 16 }}>
        {scenarios.map((s, i) => (
          <button key={s.id} className={`scn-tab ${s.id === active?.id ? 'active' : ''}`} onClick={() => navigate(`/scenario-modeller/${s.id}`)}>
            <i className="type-dot" style={{ background: SERIES[i % SERIES.length] }} />{s.name}{s.isBaseline && <Star size={13} fill="currentColor" />}
          </button>
        ))}
      </div>

      {!active || !res ? (
        <div className="card empty"><Info /><div className="bold">No scenarios yet</div><div className="small">Create a scenario to model the GCC business case.</div></div>
      ) : (
        <>
          <div className="kpis" style={{ marginBottom: 18 }}>
            <div className="kpi"><span className="kpi-icon acc-blue"><Users /></span><div><div className="kpi-val">{Math.round(res.movedFte).toLocaleString()} FTE</div><div className="kpi-lbl">Moved to {res.target?.name ?? 'target hub'} · of {res.inScopeFte.toLocaleString()} assessed</div></div></div>
            <div className="kpi"><span className="kpi-icon acc-green"><TrendingDown /></span><div><div className="kpi-val">{formatMoney(res.annualSavings, settings.currency)}</div><div className="kpi-lbl">Steady-state annual saving (net of overhead)</div></div></div>
            <div className="kpi"><span className="kpi-icon acc-amber"><Coins /></span><div><div className="kpi-val">{formatMoney(res.oneTimeCost, settings.currency)}</div><div className="kpi-lbl">One-time transition cost</div></div></div>
            <div className="kpi"><span className="kpi-icon acc-purple"><Timer /></span><div><div className="kpi-val">{res.paybackMonths === null ? '—' : `${res.paybackMonths} mo`}</div><div className="kpi-lbl">Payback · {res.scenario.horizonYears}-yr net {formatMoney(res.horizonNet, settings.currency)}</div></div></div>
          </div>

          <div className="layout-2col" style={{ gridTemplateColumns: '400px minmax(0, 1fr)' }}>
            <div className="stack">
              <div className="card card-pad">
                <div className="card-title">Scenario <span className="right row" style={{ gap: 6 }}>
                  {!active.isBaseline && <button className="btn btn-xs" onClick={() => { setBaselineScenario(active.id); notify(`"${active.name}" is now the baseline`) }}><Star /> Set baseline</button>}
                  <button className="btn btn-xs" onClick={() => add(active)}><Copy /> Duplicate</button>
                  <button className="icon-btn danger" onClick={() => setToDelete(active)} aria-label="Delete scenario"><Trash2 /></button>
                </span></div>
                <div className="stack" style={{ gap: 12 }}>
                  <Field label="Name"><TextInput value={active.name} onChange={(v) => patch({ name: v })} /></Field>
                  <Field label="Description"><TextInput value={active.description} onChange={(v) => patch({ description: v })} placeholder="What this scenario assumes" /></Field>
                  <Field label="Target hub" help={hubs.length ? undefined : 'Add a GCC Hub or Nearshore location in the Footprint Designer'}>
                    <select className="select" value={active.targetLocationId} onChange={(e) => patch({ targetLocationId: e.target.value })}>
                      <option value="">Select hub…</option>
                      {hubs.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.type}, ×{h.costIndex.toFixed(2)})</option>)}
                    </select>
                  </Field>
                  {active.targetLocationId && res.target && <div className="small muted">{res.target.name}: cost index ×{res.target.costIndex.toFixed(2)}{res.target.capacity ? `, capacity ${res.target.capacity} seats${res.movedFte > res.target.capacity ? ' — exceeded' : ''}` : ''}</div>}
                </div>
              </div>
              <div className="card card-pad">
                <div className="card-title">Share of FTE moved, by recommendation</div>
                <div className="stack" style={{ gap: 10 }}>
                  {REC_KEYS.map((k) => (
                    <Range key={k} label={k} value={active.movePct[k]} min={0} max={100} step={5} unit="%" onChange={(v) => setPct(k, v)} help={`${res.byRec[k].items} items · ${res.byRec[k].fte.toLocaleString()} FTE → moves ${Math.round(res.byRec[k].moved)}`} />
                  ))}
                </div>
              </div>
              <div className="card card-pad">
                <div className="card-title">Economics</div>
                <div className="stack" style={{ gap: 10 }}>
                  <Range label="Transition cost per FTE" value={active.transitionCostPerFte} min={5_000} max={80_000} step={1_000} unit="$" onChange={(v) => patch({ transitionCostPerFte: v })} help="Recruiting, knowledge transfer, parallel run, travel" />
                  <Range label="Ramp-up period" value={active.rampYears} min={1} max={4} unit=" yrs" onChange={(v) => patch({ rampYears: v })} help="Years to reach steady-state savings; transition cost is spread over this period" />
                  <Range label="Year-1 productivity dip" value={active.productivityDipPct} min={0} max={50} step={5} unit="%" onChange={(v) => patch({ productivityDipPct: v })} />
                  <Range label="GCC overhead" value={active.overheadPct} min={0} max={40} step={1} unit="%" onChange={(v) => patch({ overheadPct: v })} help="Management, facilities and governance as a share of gross saving" />
                  <Range label="Horizon" value={active.horizonYears} min={3} max={10} unit=" yrs" onChange={(v) => patch({ horizonYears: v })} />
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="card card-pad viz-root">
                <div className="card-title">Cumulative net benefit by year, all scenarios</div>
                <CumulativeChart results={results} activeId={active.id} currency={settings.currency} />
              </div>
              <div className="card card-pad viz-root">
                <div className="card-title">Year-by-year for "{active.name}"</div>
                <table className="table">
                  <thead><tr><th>Year</th><th className="num">Savings</th><th className="num">Transition cost</th><th className="num">Net</th><th className="num">Cumulative</th></tr></thead>
                  <tbody>
                    {res.years.map((y) => (
                      <tr key={y.year}><td>Year {y.year}</td><td className="num">{formatMoney(y.savings, settings.currency)}</td><td className="num">{y.cost ? `(${formatMoney(y.cost, settings.currency)})` : '—'}</td><td className="num" style={{ color: y.net >= 0 ? '#047857' : '#b91c1c', fontWeight: 600 }}>{formatMoney(y.net, settings.currency)}</td><td className="num bold">{formatMoney(y.cumulative, settings.currency)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card card-pad">
                <div className="card-title">Scenario comparison</div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Scenario</th><th>Target</th><th className="num">FTE moved</th><th className="num">Annual saving</th><th className="num">One-time cost</th><th className="num">Payback</th><th className="num">Horizon net</th><th className="num">ROI</th></tr></thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.scenario.id} className="click" onClick={() => navigate(`/scenario-modeller/${r.scenario.id}`)} style={{ fontWeight: r.scenario.id === active.id ? 600 : undefined }}>
                          <td><span className="row" style={{ gap: 8 }}><i className="type-dot" style={{ background: SERIES[i % SERIES.length] }} />{r.scenario.name}{r.scenario.isBaseline && <span className="chip" style={{ padding: '1px 7px', fontSize: 11 }}>Baseline</span>}</span></td>
                          <td className="small">{r.target?.name ?? '—'}</td>
                          <td className="num">{Math.round(r.movedFte).toLocaleString()}</td>
                          <td className="num">{formatMoney(r.annualSavings, settings.currency)}</td>
                          <td className="num">{formatMoney(r.oneTimeCost, settings.currency)}</td>
                          <td className="num">{r.paybackMonths === null ? '—' : `${r.paybackMonths} mo`}</td>
                          <td className="num">{formatMoney(r.horizonNet, settings.currency)}</td>
                          <td className="num">{r.oneTimeCost ? `${r.roi.toFixed(1)}×` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card card-pad">
                <div className="card-title">Savings by recommendation for "{active.name}"</div>
                {(() => { const max = Math.max(1, ...REC_KEYS.map((k) => res.byRec[k].savings)); return REC_KEYS.map((k) => (
                  <div className="hbar-row" key={k} style={{ gridTemplateColumns: '210px 1fr 150px' }}>
                    <span className="small" style={{ color: RECOMMENDATION_META[k].color, fontWeight: 600 }}>{k}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(res.byRec[k].savings / max) * 100}%` }} /></div>
                    <span className="small mono" style={{ textAlign: 'right' }}>{formatMoney(res.byRec[k].savings, settings.currency)} · {Math.round(res.byRec[k].moved)} FTE</span>
                  </div>
                )) })()}
                <div className="small muted" style={{ marginTop: 6 }}>Gross saving before overhead. Per-FTE saving = HQ-equivalent cost × (current blended index − target index).</div>
              </div>
            </div>
          </div>
        </>
      )}
      {toDelete && <ConfirmModal title={`Delete "${toDelete.name}"?`} message="This removes the scenario and its assumptions." confirmLabel="Delete" danger onClose={() => setToDelete(null)} onConfirm={() => { deleteScenario(toDelete.id); navigate('/scenario-modeller'); notify('Scenario deleted', 'info') }} />}
    </div>
  )
}

function CumulativeChart({ results, activeId, currency }: { results: ScenarioResult[]; activeId: string; currency: string }) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null)
  const W = 720, H = 300, P = { l: 70, r: 20, t: 16, b: 36 }
  const years = Math.max(1, ...results.map((r) => r.years.length))
  const vals = results.flatMap((r) => r.years.map((y) => y.cumulative))
  const min = Math.min(0, ...vals), max = Math.max(0, ...vals)
  const sx = (y: number) => P.l + ((y - 0) / years) * (W - P.l - P.r)
  const sy = (v: number) => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b)
  const ticks = 4
  return (
    <div style={{ position: 'relative' }}>
      <div className="legend" style={{ marginBottom: 6 }}>{results.map((r, i) => <span key={r.scenario.id}><i style={{ background: SERIES[i % SERIES.length] }} />{r.scenario.name}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks).map((v) => (
          <g key={v}><line x1={P.l} x2={W - P.r} y1={sy(v)} y2={sy(v)} stroke="var(--grid)" /><text x={P.l - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{formatMoney(v, currency)}</text></g>
        ))}
        <line x1={P.l} x2={W - P.r} y1={sy(0)} y2={sy(0)} stroke="var(--text-secondary)" strokeWidth={1.5} />
        {Array.from({ length: years + 1 }, (_, y) => <text key={y} x={sx(y)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{y === 0 ? 'Start' : `Yr ${y}`}</text>)}
        {results.map((r, i) => {
          const pts = [[sx(0), sy(0)], ...r.years.map((y) => [sx(y.year), sy(y.cumulative)])]
          const active = r.scenario.id === activeId
          return (
            <g key={r.scenario.id}>
              <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={SERIES[i % SERIES.length]} strokeWidth={active ? 3 : 2} opacity={active ? 1 : 0.55} />
              {r.years.map((y) => <circle key={y.year} cx={sx(y.year)} cy={sy(y.cumulative)} r={active ? 5 : 4} fill={SERIES[i % SERIES.length]} stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover({ x: (sx(y.year) / W) * 100, y: (sy(y.cumulative) / H) * 100, text: `${r.scenario.name} · Year ${y.year}: ${formatMoney(y.cumulative, currency)} cumulative` })} />)}
            </g>
          )
        })}
      </svg>
      {hover && <div className="viz-tip" style={{ left: `${hover.x}%`, top: `${hover.y}%`, transform: 'translate(12px, 12px)' }}>{hover.text}</div>}
    </div>
  )
}
