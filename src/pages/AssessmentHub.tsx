import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardCheck, Play, Eye, Inbox } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { ENTITY_META } from '../data/options'
import { scoreEntity, entityStatus, RECOMMENDATION_META } from '../lib/scoring'
import { StatusPill } from '../components/ui'
import type { EntityType } from '../types'

export default function AssessmentHub() {
  const { entities } = useApp()
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const rows = useMemo(() => entities.filter((e) => !type || e.type === type).filter((e) => !status || entityStatus(e) === status).sort((a, b) => scoreEntity(a).completion - scoreEntity(b).completion), [entities, type, status])
  const counts = { total: entities.length, assessed: entities.filter((e) => e.assessment.submitted).length, inProgress: entities.filter((e) => entityStatus(e) === 'In Assessment').length }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Assessment</h1>
          <div className="page-sub">Rate each item across five dimensions from the global HQ perspective. {counts.assessed} of {counts.total} submitted, {counts.inProgress} in progress.</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-pad filters">
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{(Object.keys(ENTITY_META) as EntityType[]).map((t) => <option key={t} value={t}>{ENTITY_META[t].plural}</option>)}</select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Draft</option><option>In Assessment</option><option>Assessed</option></select>
        </div>
      </div>
      <div className="card table-wrap">
        {rows.length === 0 ? (
          <div className="empty"><Inbox /><div className="bold">Nothing to assess</div><div className="small">Capture a project, application, role or team first.</div><div style={{ marginTop: 12 }}><Link to="/" className="btn btn-primary">Go to Portfolio Capture</Link></div></div>
        ) : (
          <table className="table">
            <thead><tr><th>Item</th><th>Type</th><th>Function</th><th>Status</th><th style={{ minWidth: 180 }}>Progress</th><th>Strategic value</th><th>GCC feasibility</th><th>Recommendation</th><th /></tr></thead>
            <tbody>
              {rows.map((e) => {
                const sc = scoreEntity(e)
                const st = entityStatus(e)
                return (
                  <tr key={e.id} className="click" onClick={() => navigate(`/assessment/${e.id}`)}>
                    <td><div className="bold">{e.name}</div><div className="small muted">{[e.capability, e.subCapability].filter(Boolean).join(' › ')}</div></td>
                    <td><span className="row small" style={{ gap: 6 }}><i className="type-dot" style={{ background: ENTITY_META[e.type].color }} />{ENTITY_META[e.type].singular}</span></td>
                    <td className="small">{e.businessFunction}</td>
                    <td><StatusPill status={st} /></td>
                    <td><div className="row" style={{ gap: 8 }}><div className="progress grow"><div style={{ width: `${Math.round(sc.completion * 100)}%` }} /></div><span className="small muted mono">{sc.answered}/{sc.total}</span></div></td>
                    <td className="mono">{sc.strategicValue ? sc.strategicValue.toFixed(1) : '—'}</td>
                    <td className="mono">{sc.feasibility ? sc.feasibility.toFixed(1) : '—'}</td>
                    <td className="small bold" style={{ color: RECOMMENDATION_META[sc.recommendation].color }}>{sc.recommendation === 'Not Assessed' ? <span className="muted" style={{ fontWeight: 400 }}>—</span> : sc.recommendation}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <Link to={`/assessment/${e.id}`} className={`btn btn-sm ${st === 'Assessed' ? '' : 'btn-primary'}`}>{st === 'Assessed' ? <><Eye /> Review</> : st === 'In Assessment' ? <><ClipboardCheck /> Continue</> : <><Play /> Start</>}</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
