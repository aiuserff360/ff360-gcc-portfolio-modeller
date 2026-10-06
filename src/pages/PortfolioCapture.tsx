import type { LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, AppWindow, UserSquare2, Users, Plus, ArrowRight, Layers, Coins, ClipboardCheck, Map, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { ENTITY_META } from '../data/options'
import type { EntityType } from '../types'
import { scoreEntity, entityStatus, formatMoney, RECOMMENDATION_META } from '../lib/scoring'
import { StatusPill } from '../components/ui'

const ICONS: Record<EntityType, LucideIcon> = { project: FolderKanban, application: AppWindow, role: UserSquare2, workforce: Users }
const DESC: Record<EntityType, string> = {
  project: 'Programmes, projects and services with a defined scope and outcome.',
  application: 'Business and technology applications that are run and supported.',
  role: 'Individual job roles with skills, scope and cost profile.',
  workforce: 'Teams and groups with composition, footprint and commercials.',
}

export default function PortfolioCapture() {
  const { entities, settings, activeCompany } = useApp()
  const navigate = useNavigate()
  const types: EntityType[] = ['project', 'application', 'role', 'workforce']
  const totalHc = entities.reduce((a, e) => a + e.headcount, 0)
  const totalSpend = entities.reduce((a, e) => a + e.annualSpend, 0)
  const statuses = { Draft: 0, 'In Assessment': 0, Assessed: 0 }
  entities.forEach((e) => { statuses[entityStatus(e)]++ })
  const recent = [...entities].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8)
  const assessedPct = entities.length ? Math.round((statuses.Assessed / entities.length) * 100) : 0

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Portfolio Capture</h1>
          <div className="page-sub">Capture the projects, applications, roles and teams in scope for <b>{activeCompany.name}</b>, then assess each from the global HQ perspective.</div>
        </div>
        <div className="page-actions">
          <Link to="/assessment" className="btn"><ClipboardCheck /> Assessments</Link>
          <Link to="/opportunity-map" className="btn btn-primary"><Map /> Opportunity Map</Link>
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="kpi-icon acc-blue"><Layers /></span><div><div className="kpi-val">{entities.length}</div><div className="kpi-lbl">Items captured</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-purple"><Users /></span><div><div className="kpi-val">{totalHc.toLocaleString()}</div><div className="kpi-lbl">Total headcount (FTE)</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-amber"><Coins /></span><div><div className="kpi-val">{formatMoney(totalSpend, settings.currency)}</div><div className="kpi-lbl">Annual spend in scope</div></div></div>
        <div className="kpi"><span className="kpi-icon acc-green"><CheckCircle2 /></span><div><div className="kpi-val">{assessedPct}%</div><div className="kpi-lbl">{statuses.Assessed} assessed · {statuses['In Assessment']} in progress · {statuses.Draft} draft</div></div></div>
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 10 }}>What would you like to capture?</h3>
      <div className="tiles" style={{ marginBottom: 20 }}>
        {types.map((t) => {
          const Icon = ICONS[t]
          const items = entities.filter((e) => e.type === t)
          const assessed = items.filter((e) => e.assessment.submitted).length
          return (
            <div className="tile" key={t}>
              <div className="tile-head"><span className="kpi-icon" style={{ background: `${ENTITY_META[t].color}22`, color: ENTITY_META[t].color }}><Icon size={20} /></span><span className="bold" style={{ fontSize: 15 }}>{ENTITY_META[t].plural}</span></div>
              <div className="tile-count">{items.length}</div>
              <div className="small muted">{DESC[t]}</div>
              <div className="progress"><div style={{ width: items.length ? `${(assessed / items.length) * 100}%` : '0%' }} /></div>
              <div className="small muted">{assessed} of {items.length} assessed</div>
              <div className="tile-foot">
                <Link className="btn btn-primary btn-sm" to={`/${ENTITY_META[t].route}/new`}><Plus /> Add</Link>
                <Link className="btn btn-sm" to={`/${ENTITY_META[t].route}`}>View all <ArrowRight /></Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="layout-2col">
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 6 }}><div className="card-title">Recently updated</div></div>
          {recent.length === 0 ? (
            <div className="empty">Nothing captured yet. Use the tiles above to add your first item.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Type</th><th>Function</th><th className="num">FTE</th><th>Status</th><th>Recommendation</th></tr></thead>
              <tbody>
                {recent.map((e) => {
                  const sc = scoreEntity(e)
                  return (
                    <tr key={e.id} className="click" onClick={() => navigate(`/${ENTITY_META[e.type].route}/${e.id}`)}>
                      <td><div className="bold">{e.name}</div><div className="small muted">Updated {new Date(e.updatedAt).toLocaleDateString()}</div></td>
                      <td><span className="row small" style={{ gap: 6 }}><i className="type-dot" style={{ background: ENTITY_META[e.type].color }} />{ENTITY_META[e.type].singular}</span></td>
                      <td className="small">{e.businessFunction}</td>
                      <td className="num">{e.headcount || '—'}</td>
                      <td><StatusPill status={entityStatus(e)} /></td>
                      <td className="small" style={{ color: RECOMMENDATION_META[sc.recommendation].color, fontWeight: 600 }}>{sc.recommendation === 'Not Assessed' ? <span className="muted" style={{ fontWeight: 400 }}>—</span> : sc.recommendation}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="aside">
          <div className="aside-card">
            <h4>Assessment pipeline</h4>
            {(['Draft', 'In Assessment', 'Assessed'] as const).map((s) => (
              <div className="hbar-row" key={s} style={{ gridTemplateColumns: '110px 1fr 30px' }}>
                <span className="small">{s}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: entities.length ? `${(statuses[s] / entities.length) * 100}%` : 0 }} /></div>
                <span className="small muted mono" style={{ textAlign: 'right' }}>{statuses[s]}</span>
              </div>
            ))}
          </div>
          <div className="aside-card blue">
            <h4>How it works</h4>
            <ul>
              <li><b>Capture</b> each project, application, role or team with its scope, scale and cost.</li>
              <li><b>Assess</b> it across five HQ-perspective dimensions: strategic relevance, business proximity, delivery, risk and economics.</li>
              <li><b>Map</b> the results on the Opportunity Map to see what belongs in a GCC capability hub, what can transition early and what should stay at HQ.</li>
              <li><b>Report</b> headcount, spend and recommendations across the portfolio.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
