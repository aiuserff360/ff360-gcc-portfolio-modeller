import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Wand2, RotateCcw, Globe2, Users, Coins, TrendingDown, Info, MapPin } from 'lucide-react'
import { useApp, newId } from '../store/AppContext'
import { computeFootprint, suggestAllocation, type FootprintRow } from '../lib/model'
import { formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import { ENTITY_META } from '../data/options'
import type { Location, LocationType, TargetAllocation } from '../types'
import { Field, TextInput, Select, Modal, ConfirmModal } from '../components/ui'

const LOC_TYPES: LocationType[] = ['HQ', 'Onshore', 'Nearshore', 'GCC Hub']

export default function FootprintDesigner() {
  const { entities, locations, allocations, scenarios, settings, setAllocation, setAllocations, clearAllocation, upsertLocation, deleteLocation, activeCompany, notify } = useApp()
  const [editLoc, setEditLoc] = useState<Location | null>(null)
  const [delLoc, setDelLoc] = useState<Location | null>(null)
  const [onlyAssessed, setOnlyAssessed] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const baseline = scenarios.find((s) => s.isBaseline) ?? scenarios[0]

  const rows = useMemo(() => computeFootprint(entities, locations, allocations).filter((r) => !onlyAssessed || r.recommendation !== 'Not Assessed').sort((a, b) => b.entity.headcount - a.entity.headcount), [entities, locations, allocations, onlyAssessed])
  const sortedLocs = useMemo(() => [...locations].sort((a, b) => LOC_TYPES.indexOf(a.type) - LOC_TYPES.indexOf(b.type) || a.name.localeCompare(b.name)), [locations])

  const totals = useMemo(() => {
    const cur: Record<string, number> = {}, tgt: Record<string, number> = {}
    let curCost = 0, tgtCost = 0, moved = 0, toHubs = 0, designed = 0
    rows.forEach((r) => {
      Object.entries(r.current).forEach(([k, v]) => { cur[k] = (cur[k] ?? 0) + v })
      Object.entries(r.target).forEach(([k, v]) => { tgt[k] = (tgt[k] ?? 0) + v })
      curCost += r.currentCost; tgtCost += r.allocated ? r.targetCost : r.currentCost; moved += r.movedFte; toHubs += r.toHubs; if (r.allocated) designed++
    })
    return { cur, tgt, curCost, tgtCost, moved, toHubs, designed }
  }, [rows])
  const hubShare = (m: Record<string, number>) => { const t = Object.values(m).reduce((a, b) => a + b, 0); const h = Object.entries(m).filter(([id]) => ['GCC Hub', 'Nearshore'].includes(locations.find((l) => l.id === id)?.type ?? '')).reduce((a, [, v]) => a + v, 0); return t ? h / t : 0 }

  const setCell = (row: FootprintRow, locId: string, value: number) => {
    const base: TargetAllocation = row.allocation ?? { entityId: row.entity.id, allocation: { ...row.current }, targetModel: row.entity.deliveryModel, notes: '' }
    const allocation = { ...base.allocation, [locId]: value }
    if (!value) delete allocation[locId]
    setAllocation({ ...base, allocation })
  }
  const applyDefaults = () => {
    const list = rows.filter((r) => r.recommendation !== 'Not Assessed').map((r) => suggestAllocation(r.entity, locations, baseline))
    setAllocations(list)
    notify(`Applied ${baseline ? `"${baseline.name}"` : 'default'} targets to ${list.length} items`)
  }
  const saveLoc = () => {
    if (!editLoc) return
    if (!editLoc.name.trim()) { notify('Location needs a name', 'error'); return }
    upsertLocation(editLoc); setEditLoc(null); notify('Location saved')
  }
  const sel = rows.find((r) => r.entity.id === selected)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Footprint Designer</h1>
          <div className="page-sub">Design the target delivery footprint for <b>{activeCompany.name}</b>: allocate each item's FTE across locations and see the cost impact.</div>
        </div>
        <div className="page-actions">
          <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={onlyAssessed} onChange={(e) => setOnlyAssessed(e.target.checked)} /> Assessed items only</label>
          <button className="btn" onClick={applyDefaults} disabled={!rows.length}><Wand2 /> Apply {baseline ? `"${baseline.name}"` : 'scenario'} defaults</button>
          <button className="btn btn-primary" onClick={() => setEditLoc({ id: newId('project').replace('pro', 'loc'), companyId: activeCompany.id, name: '', type: 'GCC Hub', costIndex: 0.35, capacity: 0, timezone: '', notes: '' })}><Plus /> Add location</button>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="kpi-icon acc-blue"><Users /></span><div><div className="kpi-val">{Math.round(totals.toHubs).toLocaleString()} FTE</div><div className="kpi-lbl">Added to GCC / nearshore hubs</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-purple"><Globe2 /></span><div><div className="kpi-val">{Math.round(hubShare(totals.cur) * 100)}% → {Math.round(hubShare(totals.tgt) * 100)}%</div><div className="kpi-lbl">Share of FTE in hubs, current → target</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-amber"><Coins /></span><div><div className="kpi-val">{formatMoney(totals.curCost, settings.currency)} → {formatMoney(totals.tgtCost, settings.currency)}</div><div className="kpi-lbl">Annual cost, current → target</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-green"><TrendingDown /></span><div><div className="kpi-val">{formatMoney(totals.curCost - totals.tgtCost, settings.currency)}</div><div className="kpi-lbl">Run-rate saving · {totals.designed} of {rows.length} items designed</div></div></div>
      </div>

      <div className="layout-2col" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 8 }}>
              <div className="card-title">Target FTE by location</div>
              <div className="small muted">Enter the target FTE per location for each item. Row totals are checked against current headcount. Click a row to see its cost detail.</div>
            </div>
            <div className="table-wrap" style={{ maxHeight: 560, overflow: 'auto' }}>
              {rows.length === 0 ? (
                <div className="empty"><Info /><div className="bold">No items to design</div><div className="small">Submit assessments first, or untick "Assessed items only".</div><div style={{ marginTop: 10 }}><Link to="/assessment" className="btn btn-primary">Go to Assessment</Link></div></div>
              ) : (
                <table className="matrix">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Current FTE</th>
                      {sortedLocs.map((l) => <th key={l.id}>{l.name}<div style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>×{l.costIndex.toFixed(2)}</div></th>)}
                      <th>Target</th>
                      <th>Saving</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const mismatch = r.allocated && Math.round(r.totalTarget) !== Math.round(r.entity.headcount)
                      return (
                        <tr key={r.entity.id} className={selected === r.entity.id ? 'sel' : ''} style={{ background: selected === r.entity.id ? '#eef4fe' : undefined, cursor: 'pointer' }} onClick={() => setSelected(r.entity.id)}>
                          <td style={{ background: selected === r.entity.id ? '#eef4fe' : undefined }}>
                            <div className="bold" style={{ whiteSpace: 'normal' }}>{r.entity.name}</div>
                            <div className="small" style={{ color: RECOMMENDATION_META[r.recommendation].color, fontWeight: 600 }}><i className="type-dot" style={{ background: ENTITY_META[r.entity.type].color, marginRight: 6 }} />{r.recommendation}</div>
                          </td>
                          <td className="mono">{r.entity.headcount}<div className="small muted">{Object.entries(r.current).map(([id, n]) => `${locations.find((l) => l.id === id)?.name ?? '?'} ${Math.round(n)}`).join(' · ')}</div></td>
                          {sortedLocs.map((l) => (
                            <td key={l.id} onClick={(e) => e.stopPropagation()}>
                              <input inputMode="numeric" value={r.target[l.id] ? Math.round(r.target[l.id]) : ''} placeholder={r.current[l.id] ? String(Math.round(r.current[l.id])) : '–'} onChange={(e) => setCell(r, l.id, Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} onFocus={() => setSelected(r.entity.id)} style={{ background: r.allocated ? '#fff' : 'var(--surface-2)' }} />
                            </td>
                          ))}
                          <td className={`mono ${mismatch ? 'neg' : ''}`} title={mismatch ? `Target totals ${Math.round(r.totalTarget)} vs headcount ${r.entity.headcount}` : ''}>{r.allocated ? Math.round(r.totalTarget) : '—'}{mismatch && ' ⚠'}</td>
                          <td className={`mono ${r.savings > 0 ? 'pos' : r.savings < 0 ? 'neg' : ''}`}>{r.allocated ? formatMoney(r.savings, settings.currency) : '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {r.allocated ? <button className="icon-btn" title="Reset to current" onClick={() => clearAllocation(r.entity.id)}><RotateCcw /></button> : <button className="btn btn-xs" onClick={() => setAllocation(suggestAllocation(r.entity, locations, baseline))}><Wand2 /> Suggest</button>}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="total">
                      <td>Total</td>
                      <td className="mono">{Math.round(Object.values(totals.cur).reduce((a, b) => a + b, 0))}</td>
                      {sortedLocs.map((l) => <td key={l.id} className="mono">{Math.round(totals.tgt[l.id] ?? 0)}<div className="small muted" style={{ fontWeight: 400 }}>now {Math.round(totals.cur[l.id] ?? 0)}</div></td>)}
                      <td className="mono">{Math.round(Object.values(totals.tgt).reduce((a, b) => a + b, 0))}</td>
                      <td className="mono pos">{formatMoney(totals.curCost - totals.tgtCost, settings.currency)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card card-pad viz-root">
            <div className="card-title">FTE by location, current vs target</div>
            <div className="legend" style={{ marginBottom: 10 }}><span><i style={{ background: '#9ec5f4' }} /> Current</span><span><i style={{ background: '#1c5cab' }} /> Target</span></div>
            {(() => { const max = Math.max(1, ...sortedLocs.map((l) => Math.max(totals.cur[l.id] ?? 0, totals.tgt[l.id] ?? 0))); return sortedLocs.map((l) => (
              <div className="pair" key={l.id}>
                <span><span className="bold">{l.name}</span> <span className={`loc-type ${l.type.split(' ')[0]}`}>{l.type}</span></span>
                <div className="bars">
                  <div className="bar-track"><div className="bar-fill cur" style={{ width: `${((totals.cur[l.id] ?? 0) / max) * 100}%` }} /></div>
                  <div className="bar-track"><div className="bar-fill tgt" style={{ width: `${((totals.tgt[l.id] ?? 0) / max) * 100}%` }} /></div>
                </div>
                <span className="mono small" style={{ textAlign: 'right' }}>{Math.round(totals.cur[l.id] ?? 0)} → <b>{Math.round(totals.tgt[l.id] ?? 0)}</b>{l.capacity > 0 && (totals.tgt[l.id] ?? 0) > l.capacity ? <div style={{ color: 'var(--danger)' }}>over capacity {l.capacity}</div> : null}</span>
              </div>
            )) })()}
          </div>
        </div>

        <div className="aside">
          <div className="aside-card">
            <h4><MapPin /> Locations</h4>
            <div className="small muted" style={{ marginBottom: 8 }}>Cost index is fully loaded cost relative to HQ = 1.00.</div>
            {sortedLocs.map((l) => (
              <div key={l.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                <div className="grow"><div className="bold">{l.name} <span className={`loc-type ${l.type.split(' ')[0]}`}>{l.type}</span></div><div className="small muted">×{l.costIndex.toFixed(2)}{l.capacity ? ` · cap ${l.capacity}` : ''}{l.timezone ? ` · ${l.timezone}` : ''}</div></div>
                <button className="btn btn-xs" onClick={() => setEditLoc({ ...l })}>Edit</button>
                <button className="icon-btn danger" onClick={() => setDelLoc(l)} aria-label="Delete"><Trash2 /></button>
              </div>
            ))}
          </div>
          {sel ? (
            <div className="aside-card blue">
              <h4>{sel.entity.name}</h4>
              <div className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
                <span className="k">Recommendation</span><span className="v" style={{ color: RECOMMENDATION_META[sel.recommendation].color }}>{sel.recommendation}</span>
                <span className="k">Cost per FTE</span><span className="v">{sel.entity.headcount ? formatMoney(sel.entity.annualSpend / sel.entity.headcount, settings.currency) : '—'}</span>
                <span className="k">Blended index</span><span className="v">×{sel.currentIndex.toFixed(2)} → ×{sel.targetIndex.toFixed(2)}</span>
                <span className="k">Annual cost</span><span className="v">{formatMoney(sel.currentCost, settings.currency)} → {formatMoney(sel.allocated ? sel.targetCost : sel.currentCost, settings.currency)}</span>
                <span className="k">FTE moved</span><span className="v">{Math.round(sel.movedFte)}</span>
                <span className="k">Target model</span><span className="v">
                  <Select value={sel.allocation?.targetModel ?? sel.entity.deliveryModel} options={['In-house (100%)', 'In-house Led (80%)', 'Hybrid (50/50)', 'Provider Led (80%)', 'Fully Outsourced (100%)']} onChange={(v) => setAllocation({ ...(sel.allocation ?? { entityId: sel.entity.id, allocation: { ...sel.current }, notes: '' }), targetModel: v })} allowEmpty={false} />
                </span>
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <label className="label">Design notes</label>
                <textarea className="textarea" rows={3} value={sel.allocation?.notes ?? ''} placeholder="Constraints, sequencing, dependencies…" onChange={(e) => setAllocation({ ...(sel.allocation ?? { entityId: sel.entity.id, allocation: { ...sel.current }, targetModel: sel.entity.deliveryModel }), notes: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="aside-card blue"><h4><Info /> How to use</h4><ul><li>Use <b>Apply defaults</b> to seed targets from the baseline scenario's move percentages.</li><li>Type target FTE per location. Empty cells mean zero.</li><li>Target cost = HQ-equivalent cost per FTE × location index.</li><li>The Transition Planner and Executive View read these targets.</li></ul></div>
          )}
        </div>
      </div>

      {editLoc && (
        <Modal title={locations.some((l) => l.id === editLoc.id) ? 'Edit location' : 'Add location'} onClose={() => setEditLoc(null)} width={520} footer={<><button className="btn" onClick={() => setEditLoc(null)}>Cancel</button><button className="btn btn-primary" onClick={saveLoc}>Save</button></>}>
          <div className="fgrid c2">
            <Field label="Name" required><TextInput value={editLoc.name} onChange={(v) => setEditLoc({ ...editLoc, name: v })} placeholder="e.g. India" /></Field>
            <Field label="Type"><Select value={editLoc.type} options={LOC_TYPES} onChange={(v) => setEditLoc({ ...editLoc, type: v as LocationType })} allowEmpty={false} /></Field>
            <Field label="Cost index (HQ = 1.00)"><input className="input mono" type="number" step="0.01" min="0.05" max="2" value={editLoc.costIndex} onChange={(e) => setEditLoc({ ...editLoc, costIndex: Math.max(0.05, Number(e.target.value) || 0) })} /></Field>
            <Field label="Capacity (seats, 0 = unlimited)"><input className="input mono" type="number" min="0" value={editLoc.capacity} onChange={(e) => setEditLoc({ ...editLoc, capacity: Math.max(0, Number(e.target.value) || 0) })} /></Field>
            <Field label="Time zone"><TextInput value={editLoc.timezone} onChange={(v) => setEditLoc({ ...editLoc, timezone: v })} placeholder="e.g. UTC+5:30" /></Field>
            <Field label="Notes"><TextInput value={editLoc.notes} onChange={(v) => setEditLoc({ ...editLoc, notes: v })} placeholder="e.g. Primary GCC, Bengaluru" /></Field>
          </div>
        </Modal>
      )}
      {delLoc && <ConfirmModal title={`Remove ${delLoc.name}?`} message="Target FTE allocated to this location will be dropped. Current headcount data on items is unchanged." confirmLabel="Remove" danger onClose={() => setDelLoc(null)} onConfirm={() => { deleteLocation(delLoc.id); notify(`${delLoc.name} removed`, 'info') }} />}
    </div>
  )
}
