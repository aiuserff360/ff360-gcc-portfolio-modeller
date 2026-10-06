import { useMemo } from 'react'
import { Download, Printer, Layers, Users, Coins, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { ENTITY_META } from '../data/options'
import { scoreEntity, entityStatus, formatMoney, RECOMMENDATION_META, type Recommendation } from '../lib/scoring'
import type { EntityType } from '../types'
import { StatusPill } from '../components/ui'

function HBars({ rows, fmt }: { rows: [string, number][]; fmt: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  if (!rows.length) return <div className="small muted">No data</div>
  return (
    <div>
      {rows.map(([k, v]) => (
        <div className="hbar-row" key={k}>
          <span className="small truncate" title={k}>{k}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(v / max) * 100}%` }} /></div>
          <span className="small mono" style={{ textAlign: 'right' }}>{fmt(v)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const { entities, settings, activeCompany, notify } = useApp()
  const scored = useMemo(() => entities.map((e) => ({ e, s: scoreEntity(e) })), [entities])
  const totalHc = entities.reduce((a, e) => a + e.headcount, 0)
  const totalSpend = entities.reduce((a, e) => a + e.annualSpend, 0)
  const assessed = scored.filter(({ s }) => s.recommendation !== 'Not Assessed')

  const group = (key: (e: (typeof entities)[number]) => string, val: (e: (typeof entities)[number]) => number): [string, number][] => {
    const m = new Map<string, number>()
    entities.forEach((e) => { const k = key(e) || 'Unspecified'; m.set(k, (m.get(k) ?? 0) + val(e)) })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  const hcByFn = group((e) => e.businessFunction, (e) => e.headcount)
  const spendByModel = group((e) => e.deliveryModel, (e) => e.annualSpend)
  const spendByProvider = group((e) => (e.provider && e.provider !== 'None / In-house' ? e.provider : 'In-house'), (e) => e.annualSpend)
  const hcByLocation: [string, number][] = (() => {
    const m = new Map<string, number>()
    entities.forEach((e) => {
      if (e.type === 'workforce' && Object.keys(e.fteByLocation).length) Object.entries(e.fteByLocation).forEach(([l, n]) => m.set(l, (m.get(l) ?? 0) + n))
      else if (e.locations.length) e.locations.forEach((l) => m.set(l, (m.get(l) ?? 0) + e.headcount / e.locations.length))
    })
    return [...m.entries()].map(([k, v]) => [k, Math.round(v)] as [string, number]).sort((a, b) => b[1] - a[1])
  })()

  const recs: Recommendation[] = ['GCC Capability Hub', 'Early Transition Candidate', 'Retain at HQ / Hybrid', 'Optimise in Place']
  const recRows = recs.map((r) => { const items = assessed.filter(({ s }) => s.recommendation === r); return { r, n: items.length, hc: items.reduce((a, { e }) => a + e.headcount, 0), spend: items.reduce((a, { e }) => a + e.annualSpend, 0) } })
  const recHcTotal = recRows.reduce((a, r) => a + r.hc, 0)
  const addressable = recRows.filter((r) => r.r === 'GCC Capability Hub' || r.r === 'Early Transition Candidate')
  const addrHc = addressable.reduce((a, r) => a + r.hc, 0)
  const addrSpend = addressable.reduce((a, r) => a + r.spend, 0)

  const types = Object.keys(ENTITY_META) as EntityType[]
  const statusMatrix = types.map((t) => { const items = entities.filter((e) => e.type === t); return { t, Draft: items.filter((e) => entityStatus(e) === 'Draft').length, 'In Assessment': items.filter((e) => entityStatus(e) === 'In Assessment').length, Assessed: items.filter((e) => entityStatus(e) === 'Assessed').length, total: items.length } })

  const exportCsv = () => {
    const header = ['Name', 'Code', 'Type', 'Function', 'Capability', 'Sub Capability', 'Headcount', 'Annual Spend', 'Locations', 'Delivery Model', 'Provider', 'Status', 'Criteria Rated', 'Strategic Value', 'GCC Feasibility', 'Recommendation', 'Submitted At']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = scored.map(({ e, s }) => [e.name, e.code, ENTITY_META[e.type].singular, e.businessFunction, e.capability, e.subCapability, e.headcount, e.annualSpend, e.locations.join('; '), e.deliveryModel, e.provider, entityStatus(e), `${s.answered}/${s.total}`, s.strategicValue?.toFixed(2) ?? '', s.feasibility?.toFixed(2) ?? '', s.recommendation, e.assessment.submittedAt ?? ''].map(esc).join(','))
    const blob = new Blob([[header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `gcc-portfolio-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
    notify('CSV exported')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-sub">Portfolio summary for <b>{activeCompany.name}</b> · generated {new Date().toLocaleDateString()}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportCsv}><Download /> Export CSV</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer /> Print / PDF</button>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="kpi-icon acc-blue"><Layers /></span><div><div className="kpi-val">{entities.length}</div><div className="kpi-lbl">Items in portfolio</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-purple"><Users /></span><div><div className="kpi-val">{totalHc.toLocaleString()}</div><div className="kpi-lbl">Total FTE</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-amber"><Coins /></span><div><div className="kpi-val">{formatMoney(totalSpend, settings.currency)}</div><div className="kpi-lbl">Annual spend</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-green"><CheckCircle2 /></span><div><div className="kpi-val">{addrHc.toLocaleString()} FTE</div><div className="kpi-lbl">GCC-addressable ({formatMoney(addrSpend, settings.currency)})</div></div></div>
      </div>

      <div className="card card-pad viz-root" style={{ marginBottom: 18 }}>
        <div className="card-title">Recommendation mix (submitted assessments, by FTE)</div>
        {recHcTotal === 0 ? <div className="small muted">No submitted assessments yet.</div> : (
          <>
            <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
              {recRows.filter((r) => r.hc > 0).map((r) => <div key={r.r} title={`${r.r}: ${r.hc} FTE`} style={{ width: `${(r.hc / recHcTotal) * 100}%`, background: RECOMMENDATION_META[r.r].color }} />)}
            </div>
            <table className="table">
              <thead><tr><th>Recommendation</th><th className="num">Items</th><th className="num">FTE</th><th className="num">% FTE</th><th className="num">Annual spend</th></tr></thead>
              <tbody>
                {recRows.map((r) => (
                  <tr key={r.r}><td><span className="row" style={{ gap: 8 }}><i className="type-dot" style={{ background: RECOMMENDATION_META[r.r].color }} /><b>{r.r}</b></span><div className="small muted" style={{ paddingLeft: 18 }}>{RECOMMENDATION_META[r.r].description}</div></td><td className="num">{r.n}</td><td className="num">{r.hc.toLocaleString()}</td><td className="num">{recHcTotal ? Math.round((r.hc / recHcTotal) * 100) : 0}%</td><td className="num">{formatMoney(r.spend, settings.currency)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="fgrid c2" style={{ marginBottom: 18 }}>
        <div className="card card-pad viz-root"><div className="card-title">Headcount by business function</div><HBars rows={hcByFn} fmt={(v) => `${v.toLocaleString()} FTE`} /></div>
        <div className="card card-pad viz-root"><div className="card-title">Headcount by location</div><HBars rows={hcByLocation} fmt={(v) => `${v.toLocaleString()} FTE`} /></div>
        <div className="card card-pad viz-root"><div className="card-title">Annual spend by delivery model</div><HBars rows={spendByModel} fmt={(v) => formatMoney(v, settings.currency)} /></div>
        <div className="card card-pad viz-root"><div className="card-title">Annual spend by provider</div><HBars rows={spendByProvider} fmt={(v) => formatMoney(v, settings.currency)} /></div>
      </div>

      <div className="card table-wrap" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ paddingBottom: 6 }}><div className="card-title">Assessment status by type</div></div>
        <table className="table">
          <thead><tr><th>Type</th><th className="num">Draft</th><th className="num">In Assessment</th><th className="num">Assessed</th><th className="num">Total</th><th style={{ minWidth: 160 }}>Completion</th></tr></thead>
          <tbody>
            {statusMatrix.map((r) => (
              <tr key={r.t}><td><span className="row" style={{ gap: 8 }}><i className="type-dot" style={{ background: ENTITY_META[r.t].color }} />{ENTITY_META[r.t].plural}</span></td><td className="num">{r.Draft}</td><td className="num">{r['In Assessment']}</td><td className="num">{r.Assessed}</td><td className="num bold">{r.total}</td><td><div className="row" style={{ gap: 8 }}><div className="progress grow"><div style={{ width: r.total ? `${(r.Assessed / r.total) * 100}%` : 0 }} /></div><span className="small muted mono">{r.total ? Math.round((r.Assessed / r.total) * 100) : 0}%</span></div></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <div className="card-pad" style={{ paddingBottom: 6 }}><div className="card-title">Full portfolio</div></div>
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Function / Capability</th><th className="num">FTE</th><th className="num">Spend</th><th>Delivery</th><th>Status</th><th className="num">Value</th><th className="num">Feasibility</th><th>Recommendation</th></tr></thead>
          <tbody>
            {scored.map(({ e, s }) => (
              <tr key={e.id}>
                <td><div className="bold">{e.name}</div><div className="small muted">{e.code}</div></td>
                <td className="small">{ENTITY_META[e.type].singular}</td>
                <td className="small">{e.businessFunction}<div className="muted">{e.capability}</div></td>
                <td className="num">{e.headcount.toLocaleString()}</td>
                <td className="num">{formatMoney(e.annualSpend, settings.currency)}</td>
                <td className="small">{e.deliveryModel || '—'}</td>
                <td><StatusPill status={entityStatus(e)} /></td>
                <td className="num mono">{s.strategicValue?.toFixed(1) ?? '—'}</td>
                <td className="num mono">{s.feasibility?.toFixed(1) ?? '—'}</td>
                <td className="small bold" style={{ color: RECOMMENDATION_META[s.recommendation].color }}>{s.recommendation === 'Not Assessed' ? <span className="muted" style={{ fontWeight: 400 }}>—</span> : s.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
