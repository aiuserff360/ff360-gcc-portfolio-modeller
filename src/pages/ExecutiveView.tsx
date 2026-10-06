import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Printer, Layers, Users, Coins, TrendingDown, Timer, AlertTriangle, ArrowRight } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { computeFootprint, computeScenario, computeTimeline, fmtMonth, addMonths, REC_KEYS } from '../lib/model'
import { scoreEntity, entityStatus, formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import { ENTITY_META } from '../data/options'
import { SECTIONS } from '../data/framework'

export default function ExecutiveView() {
  const { entities, locations, allocations, scenarios, waves, transitions, settings, activeCompany } = useApp()
  const scored = useMemo(() => entities.map((e) => ({ e, s: scoreEntity(e) })), [entities])
  const assessed = scored.filter(({ s }) => s.recommendation !== 'Not Assessed')
  const footprint = useMemo(() => computeFootprint(entities, locations, allocations), [entities, locations, allocations])
  const baseline = scenarios.find((s) => s.isBaseline) ?? scenarios[0]
  const scenario = useMemo(() => (baseline ? computeScenario(entities, locations, baseline) : undefined), [baseline, entities, locations])
  const tl = useMemo(() => computeTimeline(waves, transitions, entities, footprint), [waves, transitions, entities, footprint])

  const totalHc = entities.reduce((a, e) => a + e.headcount, 0)
  const totalSpend = entities.reduce((a, e) => a + e.annualSpend, 0)
  const addressable = assessed.filter(({ s }) => s.recommendation === 'GCC Capability Hub' || s.recommendation === 'Early Transition Candidate')
  const addrHc = addressable.reduce((a, { e }) => a + e.headcount, 0)
  const addrSpend = addressable.reduce((a, { e }) => a + e.annualSpend, 0)
  const designed = footprint.filter((r) => r.allocated)
  const designedSavings = designed.reduce((a, r) => a + r.savings, 0)
  const designedToHubs = designed.reduce((a, r) => a + r.toHubs, 0)
  const recRows = REC_KEYS.map((r) => { const items = assessed.filter(({ s }) => s.recommendation === r); return { r, n: items.length, hc: items.reduce((a, { e }) => a + e.headcount, 0) } })
  const recTotal = recRows.reduce((a, r) => a + r.hc, 0)
  const sortedLocs = [...locations].sort((a, b) => a.costIndex === b.costIndex ? a.name.localeCompare(b.name) : b.costIndex - a.costIndex)
  const locTotals = (() => { const cur: Record<string, number> = {}, tgt: Record<string, number> = {}; footprint.forEach((r) => { Object.entries(r.current).forEach(([k, v]) => { cur[k] = (cur[k] ?? 0) + v }); Object.entries(r.target).forEach(([k, v]) => { tgt[k] = (tgt[k] ?? 0) + v }) }); return { cur, tgt } })()
  const locMax = Math.max(1, ...sortedLocs.map((l) => Math.max(locTotals.cur[l.id] ?? 0, locTotals.tgt[l.id] ?? 0)))
  const oppScore = (r: (typeof footprint)[number]) => (r.allocated ? r.savings : r.recommendation === 'GCC Capability Hub' || r.recommendation === 'Early Transition Candidate' ? r.entity.annualSpend * 0.25 : 0)
  const topOpps = [...footprint].filter((r) => r.recommendation !== 'Not Assessed' && r.recommendation !== 'Optimise in Place').sort((a, b) => oppScore(b) - oppScore(a)).slice(0, 5)
  const riskIdx = SECTIONS.findIndex((s) => s.id === 'risk')
  const risks = scored.filter(({ s }) => (s.sections[riskIdx]?.mean ?? 0) >= 2.6).sort((a, b) => (b.s.sections[riskIdx].mean ?? 0) - (a.s.sections[riskIdx].mean ?? 0)).slice(0, 5)
  const statuses = { Draft: 0, 'In Assessment': 0, Assessed: 0 }
  entities.forEach((e) => { statuses[entityStatus(e)]++ })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Executive View</h1>
          <div className="page-sub">{activeCompany.name} · GCC portfolio summary · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{baseline ? ` · scenario "${baseline.name}"` : ''}</div>
        </div>
        <div className="page-actions"><button className="btn btn-primary" onClick={() => window.print()}><Printer /> Print / PDF</button></div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="kpi-icon acc-blue"><Layers /></span><div><div className="kpi-val">{entities.length}</div><div className="kpi-lbl">Items · {statuses.Assessed} assessed, {statuses['In Assessment']} in progress</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-purple"><Users /></span><div><div className="kpi-val">{totalHc.toLocaleString()} FTE</div><div className="kpi-lbl">{formatMoney(totalSpend, settings.currency)} annual spend in scope</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-green"><TrendingDown /></span><div><div className="kpi-val">{addrHc.toLocaleString()} FTE</div><div className="kpi-lbl">GCC-addressable · {formatMoney(addrSpend, settings.currency)} · {totalHc ? Math.round((addrHc / totalHc) * 100) : 0}% of portfolio</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-amber"><Coins /></span><div><div className="kpi-val">{formatMoney(designedSavings, settings.currency)}</div><div className="kpi-lbl">Designed run-rate saving · {Math.round(designedToHubs)} FTE to hubs</div></div></div>
        {scenario && <div className="kpi"><span className="kpi-icon acc-teal"><Timer /></span><div><div className="kpi-val">{scenario.paybackMonths === null ? '—' : `${scenario.paybackMonths} mo`}</div><div className="kpi-lbl">Payback · {formatMoney(scenario.annualSavings, settings.currency)}/yr steady state</div></div></div>}
      </div>

      <div className="exec-grid">
        <div className="card card-pad">
          <div className="exec-section-title">Recommendation mix (assessed FTE)</div>
          {recTotal === 0 ? <div className="small muted">No submitted assessments yet.</div> : (
            <>
              <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 10 }}>{recRows.filter((r) => r.hc > 0).map((r) => <div key={r.r} title={`${r.r}: ${r.hc} FTE`} style={{ width: `${(r.hc / recTotal) * 100}%`, background: RECOMMENDATION_META[r.r].color }} />)}</div>
              {recRows.map((r) => (
                <div className="row" key={r.r} style={{ justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="row small" style={{ gap: 8 }}><i className="type-dot" style={{ background: RECOMMENDATION_META[r.r].color }} /><b>{r.r}</b></span>
                  <span className="small mono">{r.n} items · {r.hc.toLocaleString()} FTE · {Math.round((r.hc / recTotal) * 100)}%</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card card-pad viz-root">
          <div className="exec-section-title">Footprint, current → target FTE</div>
          <div className="legend" style={{ marginBottom: 8 }}><span><i style={{ background: '#9ec5f4' }} /> Current</span><span><i style={{ background: '#1c5cab' }} /> Target</span></div>
          {sortedLocs.map((l) => (
            <div className="pair" key={l.id} style={{ gridTemplateColumns: '120px 1fr 80px' }}>
              <span className="small"><b>{l.name}</b> <span className={`loc-type ${l.type.split(' ')[0]}`}>{l.type}</span></span>
              <div className="bars"><div className="bar-track"><div className="bar-fill cur" style={{ width: `${((locTotals.cur[l.id] ?? 0) / locMax) * 100}%` }} /></div><div className="bar-track"><div className="bar-fill tgt" style={{ width: `${((locTotals.tgt[l.id] ?? 0) / locMax) * 100}%` }} /></div></div>
              <span className="small mono" style={{ textAlign: 'right' }}>{Math.round(locTotals.cur[l.id] ?? 0)} → <b>{Math.round(locTotals.tgt[l.id] ?? 0)}</b></span>
            </div>
          ))}
          <div className="small muted">{designed.length} of {assessed.length} assessed items have a designed target. <Link to="/footprint-designer" className="text-primary">Footprint Designer</Link></div>
        </div>

        <div className="card card-pad viz-root">
          <div className="exec-section-title">Business case · scenario "{baseline?.name ?? '—'}"</div>
          {!scenario ? <div className="small muted">No scenario defined. <Link to="/scenario-modeller" className="text-primary">Create one</Link>.</div> : (
            <>
              <div className="score-grid" style={{ marginBottom: 12 }}>
                <div className="score-tile"><div className="big">{Math.round(scenario.movedFte).toLocaleString()}</div><div className="lbl">FTE moved to {scenario.target?.name ?? 'hub'}</div></div>
                <div className="score-tile"><div className="big">{formatMoney(scenario.annualSavings, settings.currency)}</div><div className="lbl">Annual saving at steady state</div></div>
                <div className="score-tile"><div className="big">{formatMoney(scenario.oneTimeCost, settings.currency)}</div><div className="lbl">One-time transition cost</div></div>
                <div className="score-tile"><div className="big">{formatMoney(scenario.horizonNet, settings.currency)}</div><div className="lbl">{scenario.scenario.horizonYears}-year net benefit</div></div>
              </div>
              {(() => { const max = Math.max(1, ...scenario.years.map((y) => Math.abs(y.cumulative))); return scenario.years.map((y) => (
                <div className="hbar-row" key={y.year} style={{ gridTemplateColumns: '60px 1fr 90px' }}>
                  <span className="small">Year {y.year}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(Math.abs(y.cumulative) / max) * 100}%`, background: y.cumulative >= 0 ? '#1c5cab' : '#e34948' }} /></div>
                  <span className="small mono" style={{ textAlign: 'right' }}>{formatMoney(y.cumulative, settings.currency)}</span>
                </div>
              )) })()}
              <div className="small muted">Cumulative net benefit by year.</div>
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="exec-section-title">Transition roadmap</div>
          {tl.waves.length === 0 ? <div className="small muted">No waves planned. <Link to="/transition-planner" className="text-primary">Transition Planner</Link></div> : (
            <table className="table">
              <thead><tr><th>Wave</th><th>Window</th><th className="num">Items</th><th className="num">FTE</th><th className="num">Saving</th></tr></thead>
              <tbody>
                {tl.waves.map((w) => (
                  <tr key={w.wave.id}><td><div className="bold">{w.wave.name}</div><div className="small muted">{w.items.map((i) => i.entity.name).join(', ') || '—'}</div></td><td className="small">{fmtMonth(w.wave.startMonth)} – {fmtMonth(addMonths(w.wave.startMonth, w.wave.durationMonths - 1))}</td><td className="num">{w.items.length}</td><td className="num">{w.fte}</td><td className="num">{formatMoney(w.savings, settings.currency)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {tl.unassigned.length > 0 && <div className="small muted" style={{ marginTop: 8 }}>{tl.unassigned.length} assessed item{tl.unassigned.length > 1 ? 's' : ''} not yet in a wave.</div>}
        </div>

        <div className="card card-pad">
          <div className="exec-section-title">Top opportunities</div>
          {topOpps.length === 0 ? <div className="small muted">Complete assessments to surface opportunities.</div> : (
            <table className="table">
              <thead><tr><th>Item</th><th>Recommendation</th><th className="num">FTE</th><th className="num">Saving</th></tr></thead>
              <tbody>
                {topOpps.map((r) => (
                  <tr key={r.entity.id}><td><div className="bold">{r.entity.name}</div><div className="small muted">{ENTITY_META[r.entity.type].singular} · {r.entity.businessFunction}</div></td><td className="small bold" style={{ color: RECOMMENDATION_META[r.recommendation].color }}>{r.recommendation}</td><td className="num">{r.entity.headcount}</td><td className="num">{r.allocated ? formatMoney(r.savings, settings.currency) : <span className="muted">not designed</span>}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card card-pad">
          <div className="exec-section-title">Key risks to manage</div>
          {risks.length === 0 ? <div className="small muted">No items with elevated Risk &amp; Compliance ratings.</div> : (
            <div className="stack" style={{ gap: 8 }}>
              {risks.map(({ e, s }) => {
                const resp = e.assessment.responses.risk ?? {}
                const high = SECTIONS[riskIdx].criteria[e.type].filter((c) => resp[c.id]?.rating === 'High' || resp[c.id]?.rating === 'Very High').map((c) => c.title)
                return (
                  <div key={e.id} className="row" style={{ alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--acc-amber)', flex: '0 0 18px', marginTop: 2 }} />
                    <div><div className="bold">{e.name} <span className="small muted">· risk {s.sections[riskIdx].mean?.toFixed(1)}/4</span></div><div className="small muted">{high.join(', ') || 'Elevated across criteria'}</div></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="exec-section-title">Next steps</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.7 }}>
          {statuses.Draft + statuses['In Assessment'] > 0 && <li>Complete {statuses.Draft + statuses['In Assessment']} outstanding assessment{statuses.Draft + statuses['In Assessment'] > 1 ? 's' : ''} to size the full opportunity. <Link to="/assessment" className="text-primary">Assessment <ArrowRight size={12} /></Link></li>}
          {assessed.length - designed.length > 0 && <li>Design the target footprint for {assessed.length - designed.length} assessed item{assessed.length - designed.length > 1 ? 's' : ''}. <Link to="/footprint-designer" className="text-primary">Footprint Designer <ArrowRight size={12} /></Link></li>}
          {tl.unassigned.length > 0 && <li>Sequence {tl.unassigned.length} item{tl.unassigned.length > 1 ? 's' : ''} into transition waves. <Link to="/transition-planner" className="text-primary">Transition Planner <ArrowRight size={12} /></Link></li>}
          {scenarios.length < 2 && <li>Compare at least two scenarios before committing to a business case. <Link to="/scenario-modeller" className="text-primary">Scenario Modeller <ArrowRight size={12} /></Link></li>}
          <li>Validate cost indices and hub capacity with Finance and HR before socialising the numbers.</li>
        </ul>
      </div>
    </div>
  )
}
