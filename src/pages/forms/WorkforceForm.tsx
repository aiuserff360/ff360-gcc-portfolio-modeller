import type { LucideIcon } from 'lucide-react'
import { Pencil, Users, Lightbulb, LayoutGrid, MapPin, AppWindow, Workflow, PieChart, Coins, Building2, Layers3, GitBranch, CircleDot } from 'lucide-react'
import type { Workforce } from '../../types'
import { useEntityForm, baseBlank, FormShell, NotFound, required, type Errors } from './shared'
import { Field, TextInput, Select, TextArea, Segmented, TagInput, NumberInput, MoneyInput, Section } from '../../components/ui'
import { BUSINESS_FUNCTIONS, CAPABILITIES, SUB_CAPABILITIES, LOCATIONS, DELIVERY_MODELS, PROVIDERS, BUSINESS_OWNERS, TEAM_TYPES, ROLE_FAMILY_MIX_KEYS, SENIORITY_KEYS } from '../../data/options'
import { useApp } from '../../store/AppContext'
import { formatMoney, formatMoneyFull } from '../../lib/scoring'

const PROCESS_SUGGESTIONS = ['Finance', 'Procurement', 'Supply Chain', 'HR', 'Reporting', 'Incident Management', 'Request Fulfilment', 'Planning']
const PLATFORM_SUGGESTIONS = ['S/4HANA', 'SAP ECC', 'SAP BW', 'Salesforce', 'ServiceNow', 'Workday', 'Power BI', 'Azure', 'AWS']
const STAKEHOLDER_SUGGESTIONS = ['CFO', 'CIO', 'Head of Procurement', 'Supply Chain Teams', 'Finance Teams', 'IT Leadership', 'All Employees']

export function blankWorkforce(companyId: string): Workforce {
  return { ...baseBlank('workforce', companyId), type: 'workforce', teamType: '', teamCode: '', reportingTo: '', purpose: '', processes: [], platforms: [], geographies: [], stakeholders: [], employmentSplit: { employees: 0, contractors: 0, provider: 0 }, roleFamilyMix: {}, seniorityMix: {}, fteByLocation: {}, costPerFte: 0 }
}

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + (b || 0), 0)

function validate(d: Workforce): Errors {
  const e: Errors = {}
  if (required(d.name)) e.name = 'Required'
  if (required(d.businessFunction)) e.businessFunction = 'Required'
  if (required(d.capability)) e.capability = 'Required'
  if (required(d.teamType)) e.teamType = 'Select a team type'
  if (required(d.purpose)) e.purpose = 'Required'
  if (required(d.rationale)) e.rationale = 'Required'
  if (required(d.processes)) e.processes = 'Add at least one process'
  if (required(d.platforms)) e.platforms = 'Add at least one platform'
  if (required(d.geographies)) e.geographies = 'Add at least one geography'
  if (required(d.stakeholders)) e.stakeholders = 'Add at least one stakeholder'
  if (required(d.headcount)) e.headcount = 'Required'
  const es = d.employmentSplit.employees + d.employmentSplit.contractors + d.employmentSplit.provider
  if (es && d.headcount && es !== d.headcount) e.employmentSplit = `Split totals ${es}, headcount is ${d.headcount}`
  if (!es) e.employmentSplit = 'Enter the employment split'
  if (!sum(d.roleFamilyMix)) e.roleFamilyMix = 'Enter the role family mix'
  if (!sum(d.seniorityMix)) e.seniorityMix = 'Enter the seniority mix'
  if (required(d.locations)) e.locations = 'Add at least one location'
  const fl = sum(d.fteByLocation)
  if (!fl) e.fteByLocation = 'Enter FTE by location'
  else if (d.headcount && fl !== d.headcount) e.fteByLocation = `Location FTE totals ${fl}, headcount is ${d.headcount}`
  if (required(d.deliveryModel)) e.deliveryModel = 'Required'
  if (required(d.annualSpend)) e.annualSpend = 'Required'
  return e
}

function MixEditor({ keys, value, onChange, total }: { keys: string[]; value: Record<string, number>; onChange: (v: Record<string, number>) => void; total: number }) {
  const t = total || sum(value) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {keys.map((k) => {
        const v = value[k] ?? 0
        const pct = Math.round((v / t) * 100)
        return (
          <div className="mix-row" key={k}>
            <span className="muted">{k}</span>
            <input className="input" inputMode="numeric" value={v || ''} placeholder="0" onChange={(e) => onChange({ ...value, [k]: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} />
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, pct)}%` }} /></div>
            <span className="muted mono" style={{ textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function WorkforceForm() {
  const f = useEntityForm<Workforce>('workforce', blankWorkforce)
  const { settings } = useApp()
  if (f.notFound) return <NotFound type="workforce" />
  const d = f.draft
  const caps = CAPABILITIES[d.businessFunction] ?? []
  const subs = SUB_CAPABILITIES[d.capability] ?? []
  const hc = d.headcount || 0
  const es = d.employmentSplit
  const pct = (n: number) => (hc ? `${Math.round((n / hc) * 100)}%` : '—')
  const costPerFte = d.costPerFte || (hc ? Math.round(d.annualSpend / hc) : 0)
  const locTotal = sum(d.fteByLocation)

  // Key insights, computed live
  const insights: string[] = []
  if (hc) insights.push(`Team of ${hc} FTE${d.businessFunction ? ` in ${d.businessFunction}` : ''}${d.processes.length ? ` supporting ${d.processes.slice(0, 3).join(', ')}` : ''}.`)
  if (locTotal) {
    const [topLoc, topN] = Object.entries(d.fteByLocation).sort((a, b) => b[1] - a[1])[0]
    insights.push(`Majority of workforce (${Math.round((topN / locTotal) * 100)}%) is currently in ${topLoc}.`)
  }
  const mixTotal = sum(d.roleFamilyMix)
  if (mixTotal) {
    const top2 = Object.entries(d.roleFamilyMix).sort((a, b) => b[1] - a[1]).slice(0, 2)
    insights.push(`${top2.map(([k]) => k.split(' / ')[0]).join(' and ')} roles together account for ${Math.round((top2.reduce((a, [, v]) => a + v, 0) / mixTotal) * 100)}% of the team.`)
  }
  if (d.deliveryModel && d.annualSpend) insights.push(`${d.deliveryModel.replace(/ \(.*\)/, '')} delivery model with an annual spend of ${formatMoney(d.annualSpend, settings.currency)}.`)
  const senTotal = sum(d.seniorityMix)
  if (senTotal) {
    const jr = d.seniorityMix[SENIORITY_KEYS[0]] ?? 0
    if (jr / senTotal > 0.5) insights.push(`Junior-heavy profile (${Math.round((jr / senTotal) * 100)}% with 0–3 years) suggests standardised, trainable work.`)
  }

  const snapshot: [LucideIcon, string, string, string][] = [
    [Users, 'Team Name', d.name || '—', 'var(--acc-blue)'],
    [LayoutGrid, 'Function', d.businessFunction || '—', 'var(--acc-green)'],
    [Layers3, 'Capability', d.capability || '—', 'var(--acc-green)'],
    [GitBranch, 'Sub Capability', d.subCapability || '—', 'var(--acc-teal)'],
    [CircleDot, 'Team Type', d.teamType || '—', 'var(--acc-blue)'],
    [Users, 'Total Headcount', hc ? `${hc} FTE` : '—', 'var(--acc-pink)'],
    [MapPin, 'Locations', d.locations.join(', ') || '—', 'var(--acc-red)'],
    [AppWindow, 'Applications', d.platforms.join(', ') || '—', 'var(--acc-amber)'],
    [Workflow, 'Key Processes', d.processes.join(', ') || '—', 'var(--acc-amber)'],
    [PieChart, 'Employment Split', es.employees + es.contractors + es.provider ? `${es.employees} | ${es.contractors} | ${es.provider}` : '—', 'var(--acc-purple)'],
    [Coins, 'Annual Spend', d.annualSpend ? formatMoney(d.annualSpend, settings.currency) : '—', 'var(--acc-red)'],
    [Building2, 'Provider', d.provider || '—', 'var(--acc-purple)'],
  ]

  const aside = (
    <>
      <div className="aside-card">
        <h4>Team Snapshot <button className="btn btn-xs right" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Pencil /> Edit</button></h4>
        <div className="kv">
          {snapshot.map(([Icon, k, v, color]) => (
            <span key={k} style={{ display: 'contents' }}>
              <span className="kv-icon" style={{ color, background: 'var(--surface-2)' }}><Icon size={14} /></span>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="aside-card blue">
        <h4><Lightbulb /> Key Insights</h4>
        {insights.length ? <ul>{insights.map((t) => <li key={t}>{t}</li>)}</ul> : <p>Insights will appear as you complete the workforce composition and footprint sections.</p>}
      </div>
    </>
  )

  return (
    <FormShell type="workforce" title="Workforce / Team Details" subtitle="Capture key information about the team before proceeding to the assessment." onSave={() => f.saveDraft(validate)} onNext={() => f.next(validate)} aside={aside}>
      <Section n={1} title="Team Identification">
        <div className="fgrid c4">
          <Field label="Team / Group Name" required error={f.err('name')}><TextInput value={d.name} onChange={(v) => f.set('name', v)} placeholder="e.g. SAP Application Management Team" invalid={f.inv('name')} /></Field>
          <Field label="Function" required error={f.err('businessFunction')}><Select value={d.businessFunction} options={BUSINESS_FUNCTIONS} onChange={(v) => f.patch({ businessFunction: v, capability: '', subCapability: '' })} invalid={f.inv('businessFunction')} allowEmpty={false} /></Field>
          <Field label="Business Capability" required error={f.err('capability')}><Select value={d.capability} options={caps} onChange={(v) => f.patch({ capability: v, subCapability: '' })} invalid={f.inv('capability')} /></Field>
          <Field label="Sub Capability"><Select value={d.subCapability} options={subs} onChange={(v) => f.set('subCapability', v)} placeholder={subs.length ? 'Select…' : 'None'} /></Field>
        </div>
        <div className="fgrid c4">
          <Field label="Team Type" required className="span2" error={f.err('teamType')}><Segmented full value={d.teamType} options={TEAM_TYPES} onChange={(v) => f.set('teamType', v)} /></Field>
          <Field label="Team Code (Optional)"><TextInput value={d.teamCode} onChange={(v) => f.patch({ teamCode: v, code: v })} placeholder="e.g. IT-SAP-AMS" /></Field>
          <Field label="Reporting To (Optional)"><Select value={d.reportingTo} options={BUSINESS_OWNERS} onChange={(v) => f.set('reportingTo', v)} /></Field>
        </div>
      </Section>

      <Section n={2} title="Team Purpose & Scope">
        <div className="fgrid c2">
          <Field label="Team Purpose" required help="What does this team exist to deliver?" error={f.err('purpose')}><TextArea value={d.purpose} onChange={(v) => f.patch({ purpose: v, description: v })} invalid={f.inv('purpose')} /></Field>
          <Field label="Business Rationale" required help="Why is this team important to the enterprise?" error={f.err('rationale')}><TextArea value={d.rationale} onChange={(v) => f.set('rationale', v)} invalid={f.inv('rationale')} /></Field>
        </div>
      </Section>

      <Section n={3} title="Business Coverage">
        <div className="fgrid c4">
          <Field label="Key Processes Supported" required error={f.err('processes')}><TagInput value={d.processes} onChange={(v) => f.set('processes', v)} suggestions={PROCESS_SUGGESTIONS} invalid={f.inv('processes')} /></Field>
          <Field label="Applications / Platforms Supported" required error={f.err('platforms')}><TagInput value={d.platforms} onChange={(v) => f.set('platforms', v)} suggestions={PLATFORM_SUGGESTIONS} invalid={f.inv('platforms')} /></Field>
          <Field label="Geographies Served" required error={f.err('geographies')}><TagInput value={d.geographies} onChange={(v) => f.set('geographies', v)} suggestions={LOCATIONS} invalid={f.inv('geographies')} /></Field>
          <Field label="Key Stakeholders / Users" required error={f.err('stakeholders')}><TagInput value={d.stakeholders} onChange={(v) => f.set('stakeholders', v)} suggestions={STAKEHOLDER_SUGGESTIONS} invalid={f.inv('stakeholders')} /></Field>
        </div>
      </Section>

      <Section n={4} title="Workforce Composition">
        <div className="fgrid c4" style={{ gridTemplateColumns: '150px 185px 1.6fr 1.3fr' }}>
          <Field label="Total Headcount (FTE)" required error={f.err('headcount')}><NumberInput value={d.headcount} onChange={(v) => f.set('headcount', v)} invalid={f.inv('headcount')} /></Field>
          <Field label="Employment Type Split" required error={f.err('employmentSplit')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['employees', 'contractors', 'provider'] as const).map((k) => (
                <div key={k} className="mix-row" style={{ gridTemplateColumns: '76px 50px minmax(44px, 1fr)' }}>
                  <span className="muted" style={{ textTransform: 'capitalize' }}>{k}</span>
                  <input className="input" inputMode="numeric" value={es[k] || ''} placeholder="0" onChange={(e) => f.set('employmentSplit', { ...es, [k]: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} />
                  <span className="chip" style={{ padding: '4px 8px', justifyContent: 'center' }}>{pct(es[k])}</span>
                </div>
              ))}
            </div>
          </Field>
          <Field label="Role Family Mix (FTE)" required error={f.err('roleFamilyMix')}><MixEditor keys={ROLE_FAMILY_MIX_KEYS} value={d.roleFamilyMix} onChange={(v) => f.set('roleFamilyMix', v)} total={hc} /></Field>
          <Field label="Seniority Mix" required error={f.err('seniorityMix')}><MixEditor keys={SENIORITY_KEYS} value={d.seniorityMix} onChange={(v) => f.set('seniorityMix', v)} total={hc} /></Field>
        </div>
      </Section>

      <Section n={5} title="Current Delivery Footprint & Commercials">
        <div className="fgrid c3" style={{ gridTemplateColumns: '1fr 1.1fr 1.2fr' }}>
          <Field label="Current Locations" required error={f.err('locations')}>
            <TagInput value={d.locations} onChange={(v) => { const fl = { ...d.fteByLocation }; Object.keys(fl).forEach((k) => { if (!v.includes(k)) delete fl[k] }); f.patch({ locations: v, fteByLocation: fl }) }} suggestions={LOCATIONS} invalid={f.inv('locations')} />
          </Field>
          <Field label="FTE by Location" required error={f.err('fteByLocation')}>
            {d.locations.length ? (
              <table className="mini-table">
                <thead><tr><th>Location</th><th>FTE</th><th>% of Total</th></tr></thead>
                <tbody>
                  {d.locations.map((loc) => (
                    <tr key={loc}>
                      <td>{loc}</td>
                      <td><input inputMode="numeric" value={d.fteByLocation[loc] || ''} placeholder="0" onChange={(e) => f.set('fteByLocation', { ...d.fteByLocation, [loc]: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} /></td>
                      <td>{locTotal ? `${Math.round(((d.fteByLocation[loc] || 0) / locTotal) * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                  <tr className="total"><td>Total</td><td>{locTotal}</td><td>{locTotal ? '100%' : '—'}</td></tr>
                </tbody>
              </table>
            ) : (
              <div className="readonly">Add current locations first</div>
            )}
          </Field>
          <div className="stack" style={{ gap: 14 }}>
            <div className="fgrid c2">
              <Field label="Current Delivery Model" required error={f.err('deliveryModel')}><Select value={d.deliveryModel} options={DELIVERY_MODELS} onChange={(v) => f.set('deliveryModel', v)} invalid={f.inv('deliveryModel')} /></Field>
              <Field label="Current Provider (Optional)"><Select value={d.provider} options={PROVIDERS} onChange={(v) => f.set('provider', v)} /></Field>
            </div>
            <div className="fgrid c2">
              <Field label={`Annual Spend (${settings.currency})`} required error={f.err('annualSpend')}><MoneyInput value={d.annualSpend} onChange={(v) => f.set('annualSpend', v)} invalid={f.inv('annualSpend')} currency={settings.currency} /></Field>
              <Field label={`Cost per FTE (${settings.currency}) (Optional)`} help={!d.costPerFte && costPerFte ? `Auto-calculated: ${formatMoneyFull(costPerFte, settings.currency)}` : undefined}><MoneyInput value={d.costPerFte || costPerFte} onChange={(v) => f.set('costPerFte', v)} currency={settings.currency} /></Field>
            </div>
          </div>
        </div>
      </Section>
    </FormShell>
  )
}
