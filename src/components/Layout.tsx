import { NavLink, Outlet } from 'react-router-dom'
import { LayoutGrid, FolderKanban, AppWindow, UserSquare2, Users, ClipboardCheck, Map, FileBarChart2, Settings, ChevronDown, Globe2, SlidersHorizontal, CalendarRange, Presentation } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { Toasts } from './ui'

const GROUPS = [
  { label: 'Capture', items: [
    { to: '/', label: 'Portfolio Capture', icon: LayoutGrid, end: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/applications', label: 'Applications', icon: AppWindow },
    { to: '/roles', label: 'Roles', icon: UserSquare2 },
    { to: '/workforce', label: 'Workforce', icon: Users },
  ] },
  { label: 'Assess', items: [
    { to: '/assessment', label: 'Assessment', icon: ClipboardCheck },
    { to: '/opportunity-map', label: 'Opportunity Map', icon: Map },
  ] },
  { label: 'Model', items: [
    { to: '/footprint-designer', label: 'Footprint Designer', icon: Globe2 },
    { to: '/scenario-modeller', label: 'Scenario Modeller', icon: SlidersHorizontal },
    { to: '/transition-planner', label: 'Transition Planner', icon: CalendarRange },
  ] },
  { label: 'Insight', items: [
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/executive-view', label: 'Executive View', icon: Presentation },
  ] },
]

export default function Layout() {
  const { settings, updateSettings, toasts, activeCompany } = useApp()
  const initials = settings.userName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GCC</div>
          <div className="brand-sub">Portfolio &amp;<br />Footprint Modeller</div>
        </div>
        <nav className="nav nav-scroll">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <div className="nav-group">{g.label}</div>
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <n.icon /> {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <nav className="nav nav-bottom">
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}><Settings /> Settings</NavLink>
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <div />
          <div className="topbar-right">
            <div className="company-select">
              <select value={activeCompany.id} onChange={(e) => updateSettings({ activeCompanyId: e.target.value })} aria-label="Active company">
                {settings.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <NavLink to="/settings" className="user-chip">
              <span className="avatar">{initials}</span>
              {settings.userName}
              <ChevronDown size={16} />
            </NavLink>
          </div>
        </div>
        <main className="page">
          <Outlet />
        </main>
      </div>
      <Toasts toasts={toasts} />
    </div>
  )
}
