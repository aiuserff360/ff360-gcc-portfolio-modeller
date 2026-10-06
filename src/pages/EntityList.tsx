import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Pencil, ClipboardCheck, Copy, Trash2, Inbox } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { EntityType } from '../types'
import { ENTITY_META, BUSINESS_FUNCTIONS } from '../data/options'
import { scoreEntity, entityStatus, formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import { StatusPill, Menu, ConfirmModal } from '../components/ui'

export default function EntityList({ type }: { type: EntityType }) {
  const { entities, settings, deleteEntity, duplicateEntity, notify } = useApp()
  const navigate = useNavigate()
  const meta = ENTITY_META[type]
  const [q, setQ] = useState('')
  const [fn, setFn] = useState('')
  const [status, setStatus] = useState('')
  const [toDelete, setToDelete] = useState<string | null>(null)

  const rows = useMemo(() => {
    return entities
      .filter((e) => e.type === type)
      .filter((e) => !fn || e.businessFunction === fn)
      .filter((e) => !status || entityStatus(e) === status)
      .filter((e) => !q || `${e.name} ${e.code} ${e.capability} ${e.subCapability} ${e.provider}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [entities, type, q, fn, status])

  const totalHc = rows.reduce((a, e) => a + e.headcount, 0)
  const totalSpend = rows.reduce((a, e) => a + e.annualSpend, 0)
  const del = entities.find((e) => e.id === toDelete)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{meta.plural}</h1>
          <div className="page-sub">{rows.length} {rows.length === 1 ? 'item' : 'items'} · {totalHc.toLocaleString()} FTE · {formatMoney(totalSpend, settings.currency)} annual spend</div>
        </div>
        <div className="page-actions">
          <Link to={`/${meta.route}/new`} className="btn btn-primary"><Plus /> Add {meta.singular}</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-pad filters">
          <div className="search grow" style={{ maxWidth: 360 }}><Search /><input className="input" placeholder={`Search ${meta.plural.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="select" value={fn} onChange={(e) => setFn(e.target.value)}><option value="">All functions</option>{BUSINESS_FUNCTIONS.map((f) => <option key={f}>{f}</option>)}</select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Draft</option><option>In Assessment</option><option>Assessed</option></select>
          {(q || fn || status) && <button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setFn(''); setStatus('') }}>Clear</button>}
        </div>
      </div>

      <div className="card table-wrap">
        {rows.length === 0 ? (
          <div className="empty">
            <Inbox />
            <div className="bold">No {meta.plural.toLowerCase()} yet</div>
            <div className="small" style={{ marginBottom: 12 }}>{q || fn || status ? 'No items match your filters.' : `Capture your first ${meta.singular.toLowerCase()} to begin the assessment.`}</div>
            {!(q || fn || status) && <Link to={`/${meta.route}/new`} className="btn btn-primary"><Plus /> Add {meta.singular}</Link>}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Function / Capability</th>
                <th className="num">FTE</th>
                <th className="num">Annual Spend</th>
                <th>Locations</th>
                <th>Delivery</th>
                <th>Status</th>
                <th style={{ minWidth: 140 }}>Assessment</th>
                <th>Recommendation</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const sc = scoreEntity(e)
                const st = entityStatus(e)
                return (
                  <tr key={e.id} className="click" onClick={() => navigate(`/${meta.route}/${e.id}`)}>
                    <td>
                      <div className="bold">{e.name}</div>
                      <div className="small muted">{e.code || '—'}</div>
                    </td>
                    <td>
                      <div>{e.businessFunction}</div>
                      <div className="small muted">{[e.capability, e.subCapability].filter(Boolean).join(' › ') || '—'}</div>
                    </td>
                    <td className="num">{e.headcount ? e.headcount.toLocaleString() : '—'}</td>
                    <td className="num">{e.annualSpend ? formatMoney(e.annualSpend, settings.currency) : '—'}</td>
                    <td className="small">{e.locations.join(', ') || '—'}</td>
                    <td className="small">{e.deliveryModel || '—'}{e.provider && e.provider !== 'None / In-house' ? <div className="muted">{e.provider}</div> : null}</td>
                    <td><StatusPill status={st} /></td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="progress grow"><div style={{ width: `${Math.round(sc.completion * 100)}%` }} /></div>
                        <span className="small muted mono">{sc.answered}/{sc.total}</span>
                      </div>
                    </td>
                    <td>
                      {sc.recommendation !== 'Not Assessed' ? (
                        <span className="row small bold" style={{ gap: 6, color: RECOMMENDATION_META[sc.recommendation].color }}><i className="type-dot" style={{ background: RECOMMENDATION_META[sc.recommendation].color }} />{sc.recommendation}</span>
                      ) : <span className="small muted">—</span>}
                    </td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <Menu trigger={<button className="icon-btn" aria-label="Actions"><MoreHorizontal /></button>}>
                        <button onClick={() => navigate(`/${meta.route}/${e.id}`)}><Pencil /> Edit details</button>
                        <button onClick={() => navigate(`/assessment/${e.id}`)}><ClipboardCheck /> {st === 'Assessed' ? 'Review assessment' : st === 'In Assessment' ? 'Continue assessment' : 'Start assessment'}</button>
                        <button onClick={() => { const c = duplicateEntity(e.id); if (c) { notify('Duplicated'); navigate(`/${meta.route}/${c.id}`) } }}><Copy /> Duplicate</button>
                        <button className="danger" onClick={() => setToDelete(e.id)}><Trash2 /> Delete</button>
                      </Menu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {del && (
        <ConfirmModal title={`Delete ${meta.singular.toLowerCase()}?`} message={<>This will permanently delete <b>{del.name}</b> and its assessment. This cannot be undone.</>} confirmLabel="Delete" danger onClose={() => setToDelete(null)} onConfirm={() => { deleteEntity(del.id); notify(`${del.name} deleted`, 'info') }} />
      )}
    </div>
  )
}
