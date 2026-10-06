import { useRef, useState } from 'react'
import { Plus, Trash2, Download, Upload, RotateCcw, Eraser, Check } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { Field, TextInput, Select, Section, ConfirmModal } from '../components/ui'
import { LOCATIONS } from '../data/options'
import type { AppState, Company } from '../types'

export default function SettingsPage() {
  const { state, settings, updateSettings, resetToSample, clearAll, importState, notify } = useApp()
  const [confirm, setConfirm] = useState<'reset' | 'clear' | { company: Company } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const setCompany = (id: string, patch: Partial<Company>) => updateSettings({ companies: settings.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const addCompany = () => {
    const c: Company = { id: `co-${Date.now().toString(36)}`, name: 'New Company', hqLocation: 'US', industry: '' }
    updateSettings({ companies: [...settings.companies, c], activeCompanyId: c.id })
    notify('Company added. Update its name below.', 'info')
  }
  const removeCompany = (c: Company) => {
    const remaining = settings.companies.filter((x) => x.id !== c.id)
    const keep = new Set(state.entities.filter((e) => e.companyId !== c.id).map((e) => e.id))
    importState({
      ...state,
      settings: { ...settings, companies: remaining, activeCompanyId: settings.activeCompanyId === c.id ? remaining[0].id : settings.activeCompanyId },
      entities: state.entities.filter((e) => e.companyId !== c.id),
      locations: state.locations.filter((l) => l.companyId !== c.id),
      scenarios: state.scenarios.filter((s) => s.companyId !== c.id),
      waves: state.waves.filter((w) => w.companyId !== c.id),
      allocations: state.allocations.filter((a) => keep.has(a.entityId)),
      transitions: state.transitions.filter((t) => keep.has(t.entityId)),
    })
    notify(`${c.name} removed`, 'info')
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gcc-portfolio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Portfolio exported')
  }
  const importJson = (file: File) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result)) as AppState
        if (!parsed.settings || !Array.isArray(parsed.entities)) throw new Error('bad')
        importState(parsed)
        notify(`Imported ${parsed.entities.length} items`)
      } catch {
        notify('Could not import this file. Expected a JSON export from this app.', 'error')
      }
    }
    r.readAsText(file)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Companies, your profile, currency and portfolio data.</div>
        </div>
      </div>
      <div className="stack" style={{ maxWidth: 1000 }}>
        <Section n={1} title="Companies">
          <p className="small muted" style={{ margin: 0 }}>Each company has its own portfolio. The active company is selected in the top bar.</p>
          {settings.companies.map((c) => {
            const count = state.entities.filter((e) => e.companyId === c.id).length
            return (
              <div className="fgrid c4" key={c.id} style={{ gridTemplateColumns: '1.4fr 1fr 1fr auto', alignItems: 'end' }}>
                <Field label="Company name"><TextInput value={c.name} onChange={(v) => setCompany(c.id, { name: v })} /></Field>
                <Field label="HQ location"><Select value={c.hqLocation} options={LOCATIONS} onChange={(v) => setCompany(c.id, { hqLocation: v })} allowEmpty={false} /></Field>
                <Field label="Industry"><TextInput value={c.industry} onChange={(v) => setCompany(c.id, { industry: v })} placeholder="e.g. Technology" /></Field>
                <div className="row" style={{ paddingBottom: 1 }}>
                  {settings.activeCompanyId === c.id ? <span className="chip" style={{ color: 'var(--success)' }}><Check size={14} /> Active</span> : <button className="btn btn-sm" onClick={() => updateSettings({ activeCompanyId: c.id })}>Set active</button>}
                  <button className="icon-btn danger" disabled={settings.companies.length === 1} title={count ? `${count} items will be deleted` : 'Remove'} onClick={() => setConfirm({ company: c })}><Trash2 /></button>
                </div>
              </div>
            )
          })}
          <div><button className="btn btn-sm" onClick={addCompany}><Plus /> Add company</button></div>
        </Section>

        <Section n={2} title="Your Profile">
          <div className="fgrid c3">
            <Field label="Name"><TextInput value={settings.userName} onChange={(v) => updateSettings({ userName: v })} /></Field>
            <Field label="Title"><TextInput value={settings.userTitle} onChange={(v) => updateSettings({ userTitle: v })} /></Field>
            <Field label="Currency"><Select value={settings.currency} options={['USD', 'EUR', 'GBP', 'INR']} onChange={(v) => updateSettings({ currency: v as typeof settings.currency })} allowEmpty={false} /></Field>
          </div>
        </Section>

        <Section n={3} title="Portfolio Data">
          <p className="small muted" style={{ margin: 0 }}>Data is stored locally in this browser. Export a JSON backup to share or move it to another machine.</p>
          <div className="row">
            <button className="btn" onClick={exportJson}><Download /> Export JSON</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload /> Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
            <span className="grow" />
            <button className="btn" onClick={() => setConfirm('reset')}><RotateCcw /> Reset to sample data</button>
            <button className="btn btn-danger" onClick={() => setConfirm('clear')}><Eraser /> Clear all items</button>
          </div>
        </Section>
      </div>

      {confirm === 'reset' && <ConfirmModal title="Reset to sample data?" message="This replaces all companies and items with the built-in sample portfolio." confirmLabel="Reset" danger onClose={() => setConfirm(null)} onConfirm={() => { resetToSample(); notify('Sample data restored') }} />}
      {confirm === 'clear' && <ConfirmModal title="Clear all items?" message="This deletes every project, application, role and team across all companies, along with footprint targets and transition plans. Companies, locations, scenarios and waves are kept." confirmLabel="Clear all" danger onClose={() => setConfirm(null)} onConfirm={() => { clearAll(); notify('All items cleared', 'info') }} />}
      {confirm && typeof confirm === 'object' && <ConfirmModal title={`Remove ${confirm.company.name}?`} message={`This removes the company and all ${state.entities.filter((e) => e.companyId === confirm.company.id).length} of its items.`} confirmLabel="Remove" danger onClose={() => setConfirm(null)} onConfirm={() => removeCompany(confirm.company)} />}
    </div>
  )
}
