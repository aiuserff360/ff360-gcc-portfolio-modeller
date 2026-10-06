import type { LucideIcon } from 'lucide-react'
import { Pencil, UserSquare2, Layers, Users as UsersIcon, Briefcase, Clock, MapPin, Network, DollarSign, BadgeDollarSign, Layers3 } from 'lucide-react'
import type { Role } from '../../types'
import { useEntityForm, baseBlank, FormShell, NotFound, TipsCard, required, type Errors } from './shared'
import { Field, TextInput, Select, TextArea, TagInput, BulletList, NumberInput, MoneyInput, Section } from '../../components/ui'
import { BUSINESS_FUNCTIONS, CAPABILITIES, LOCATIONS, DELIVERY_MODELS, PROVIDERS, ROLE_FAMILIES, ROLE_LEVELS, EXPERIENCE, EMPLOYMENT_TYPES } from '../../data/options'
import { useApp } from '../../store/AppContext'
import { formatMoney, formatMoneyFull } from '../../lib/scoring'

const PROCESS_SUGGESTIONS = ['Finance', 'Procurement', 'Accounts Payable', 'Accounts Receivable', 'General Ledger', 'Supply Chain', 'HR', 'Reporting']
const TOOL_SUGGESTIONS = ['SAP S/4HANA', 'SAP Fiori', 'ServiceNow', 'Excel', 'Salesforce', 'Jira', 'Power BI', 'Workday', 'Azure DevOps']
const INTERNAL_SUGGESTIONS = ['Finance Teams', 'Procurement Teams', 'IT Leadership', 'End Users', 'HR Teams', 'Sales Operations']
const EXTERNAL_SUGGESTIONS = ['SAP Partner', 'Auditors', 'Customers', 'Suppliers', 'Regulators']
const TECH_SUGGESTIONS = ['SAP FI', 'SAP CO', 'SAP MM', 'Configuration', 'Data Migration', 'Testing', 'Process Mapping', 'ABAP', 'Integration', 'SQL', 'Python']
const BEHAV_SUGGESTIONS = ['Communication', 'Problem Solving', 'Stakeholder Management', 'Analytical Thinking', 'Collaboration', 'Leadership', 'Adaptability']
const CERT_SUGGESTIONS = ['SAP S/4HANA Finance', 'SAP Certified Application Associate', 'PMP', 'ITIL v4', 'AWS Solutions Architect', 'CISSP']

export function blankRole(companyId: string): Role {
  return { ...baseBlank('role', companyId), type: 'role', roleFamily: '', roleLevel: '', experience: '', employmentType: '', purpose: '', responsibilities: [], processes: [], tools: [], internalStakeholders: [], externalStakeholders: [], technicalSkills: [], behaviouralSkills: [], certifications: [], costPerFte: 0 }
}

function validate(d: Role): Errors {
  const e: Errors = {}
  if (required(d.name)) e.name = 'Required'
  if (required(d.roleFamily)) e.roleFamily = 'Required'
  if (required(d.businessFunction)) e.businessFunction = 'Required'
  if (required(d.capability)) e.capability = 'Required'
  if (required(d.roleLevel)) e.roleLevel = 'Required'
  if (required(d.experience)) e.experience = 'Required'
  if (required(d.employmentType)) e.employmentType = 'Required'
  if (required(d.locations)) e.locations = 'Add at least one location'
  if (required(d.purpose)) e.purpose = 'Required'
  if (required(d.responsibilities)) e.responsibilities = 'Add at least one responsibility'
  if (required(d.processes)) e.processes = 'Add at least one process'
  if (required(d.tools)) e.tools = 'Add at least one tool'
  if (required(d.internalStakeholders)) e.internalStakeholders = 'Add at least one stakeholder'
  if (required(d.technicalSkills)) e.technicalSkills = 'Add at least one skill'
  if (required(d.behaviouralSkills)) e.behaviouralSkills = 'Add at least one skill'
  if (required(d.headcount)) e.headcount = 'Required'
  if (required(d.deliveryModel)) e.deliveryModel = 'Required'
  if (required(d.annualSpend)) e.annualSpend = 'Required'
  return e
}

const FAMILY_HINTS: [string, string][] = [['Consulting', 'Functional & technical consulting roles'], ['Engineering', 'Product, software and platform engineering'], ['Operations', 'Application support and operations'], ['Data & Analytics', 'Data engineering, analytics, BI'], ['Infrastructure', 'IT infrastructure and cloud operations'], ['Security', 'Cybersecurity and risk'], ['Program Management', 'Project and program roles'], ['Other', 'Specialist or niche roles']]

export default function RoleForm() {
  const f = useEntityForm<Role>('role', blankRole)
  const { settings } = useApp()
  if (f.notFound) return <NotFound type="role" />
  const d = f.draft
  const caps = CAPABILITIES[d.businessFunction] ?? []
  const costPerFte = d.costPerFte || (d.headcount ? Math.round(d.annualSpend / d.headcount) : 0)

  const summary: [LucideIcon, string, string, string][] = [
    [UserSquare2, 'Role Title', d.name || '—', 'var(--acc-blue)'],
    [Layers3, 'Function', d.businessFunction || '—', 'var(--acc-teal)'],
    [Briefcase, 'Role Level', d.roleLevel || '—', 'var(--acc-green)'],
    [Clock, 'Experience', d.experience || '—', 'var(--acc-red)'],
    [MapPin, 'Current Locations', d.locations.join(', ') || '—', 'var(--acc-red)'],
    [Network, 'Delivery Model', d.deliveryModel || '—', 'var(--acc-purple)'],
    [UsersIcon, 'Current Headcount', d.headcount ? String(d.headcount) : '—', 'var(--acc-purple)'],
    [DollarSign, 'Annual Cost', d.annualSpend ? formatMoney(d.annualSpend, settings.currency) : '—', 'var(--acc-amber)'],
    [BadgeDollarSign, 'Cost per FTE', costPerFte ? formatMoneyFull(costPerFte, settings.currency) : '—', 'var(--acc-red)'],
  ]

  const aside = (
    <>
      <div className="aside-card">
        <h4><UserSquare2 /> Role Summary <button className="btn btn-xs right" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Pencil /> Edit</button></h4>
        <div className="kv">
          {summary.map(([Icon, k, v, color]) => (
            <span key={k} style={{ display: 'contents' }}>
              <span className="kv-icon" style={{ color, background: 'var(--surface-2)' }}><Icon size={14} /></span>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </span>
          ))}
        </div>
      </div>
      <TipsCard tips={['Focus on the actual work performed, not job titles alone.', 'Include major processes, applications and stakeholders.', 'Capture skills and certifications relevant for the work.', 'Keep the description concise and outcome focused.']} />
      <div className="aside-card purple">
        <h4><Layers style={{ color: '#7c3aed' }} /> Common Role Families</h4>
        <div className="cat-list">
          {FAMILY_HINTS.map(([c, h]) => (
            <span key={c} style={{ display: 'contents' }}>
              <button type="button" className="pill" style={{ border: 'none', cursor: 'pointer' }} onClick={() => f.set('roleFamily', c)}>{c}</button>
              <span>{h}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <FormShell type="role" title="Role Details" subtitle="Capture key information about the role before proceeding to the assessment." onSave={() => f.saveDraft(validate)} onNext={() => f.next(validate)} aside={aside}>
      <Section n={1} title="Basic Information">
        <div className="fgrid c5">
          <Field label="Role Title" required error={f.err('name')}><TextInput value={d.name} onChange={(v) => f.set('name', v)} placeholder="e.g. SAP Functional Consultant" invalid={f.inv('name')} /></Field>
          <Field label="Role Code (Optional)"><TextInput value={d.code} onChange={(v) => f.set('code', v)} placeholder="e.g. SAP-FC" /></Field>
          <Field label="Role Family" required error={f.err('roleFamily')}><Select value={d.roleFamily} options={ROLE_FAMILIES} onChange={(v) => f.set('roleFamily', v)} invalid={f.inv('roleFamily')} /></Field>
          <Field label="Function" required error={f.err('businessFunction')}><Select value={d.businessFunction} options={BUSINESS_FUNCTIONS} onChange={(v) => f.patch({ businessFunction: v, capability: '' })} invalid={f.inv('businessFunction')} allowEmpty={false} /></Field>
          <Field label="Sub Function / Capability" required error={f.err('capability')}><Select value={d.capability} options={caps} onChange={(v) => f.set('capability', v)} invalid={f.inv('capability')} /></Field>
        </div>
        <div className="fgrid c4">
          <Field label="Role Level" required error={f.err('roleLevel')}><Select value={d.roleLevel} options={ROLE_LEVELS} onChange={(v) => f.set('roleLevel', v)} invalid={f.inv('roleLevel')} /></Field>
          <Field label="Typical Experience (Years)" required error={f.err('experience')}><Select value={d.experience} options={EXPERIENCE} onChange={(v) => f.set('experience', v)} invalid={f.inv('experience')} /></Field>
          <Field label="Employment Type" required error={f.err('employmentType')}><Select value={d.employmentType} options={EMPLOYMENT_TYPES} onChange={(v) => f.set('employmentType', v)} invalid={f.inv('employmentType')} /></Field>
          <Field label="Location(s) (Current)" required error={f.err('locations')}><TagInput value={d.locations} onChange={(v) => f.set('locations', v)} suggestions={LOCATIONS} invalid={f.inv('locations')} /></Field>
        </div>
      </Section>

      <Section n={2} title="Role Purpose & Scope">
        <div className="fgrid c2">
          <Field label="Role Purpose" required help="Why does this role exist? What is the primary objective?" error={f.err('purpose')}><TextArea value={d.purpose} onChange={(v) => f.patch({ purpose: v, description: v })} invalid={f.inv('purpose')} /></Field>
          <Field label="Key Responsibilities" required help="What are the main activities and deliverables?" error={f.err('responsibilities')}><BulletList value={d.responsibilities} onChange={(v) => f.set('responsibilities', v)} invalid={f.inv('responsibilities')} placeholder="e.g. Configure and customize SAP modules" /></Field>
        </div>
      </Section>

      <Section n={3} title="Business Context">
        <div className="fgrid c2">
          <Field label="Key Processes Supported" required error={f.err('processes')}><TagInput value={d.processes} onChange={(v) => f.set('processes', v)} suggestions={PROCESS_SUGGESTIONS} invalid={f.inv('processes')} /></Field>
          <Field label="Applications / Tools Used" required error={f.err('tools')}><TagInput value={d.tools} onChange={(v) => f.set('tools', v)} suggestions={TOOL_SUGGESTIONS} invalid={f.inv('tools')} /></Field>
          <Field label="Business Stakeholders (Internal)" required error={f.err('internalStakeholders')}><TagInput value={d.internalStakeholders} onChange={(v) => f.set('internalStakeholders', v)} suggestions={INTERNAL_SUGGESTIONS} invalid={f.inv('internalStakeholders')} /></Field>
          <Field label="Key External Stakeholders (Optional)"><TagInput value={d.externalStakeholders} onChange={(v) => f.set('externalStakeholders', v)} suggestions={EXTERNAL_SUGGESTIONS} /></Field>
        </div>
      </Section>

      <Section n={4} title="Skills and Competencies">
        <div className="fgrid c3">
          <Field label="Technical Skills" required error={f.err('technicalSkills')}><TagInput value={d.technicalSkills} onChange={(v) => f.set('technicalSkills', v)} suggestions={TECH_SUGGESTIONS} invalid={f.inv('technicalSkills')} /></Field>
          <Field label="Behavioural Skills" required error={f.err('behaviouralSkills')}><TagInput value={d.behaviouralSkills} onChange={(v) => f.set('behaviouralSkills', v)} suggestions={BEHAV_SUGGESTIONS} invalid={f.inv('behaviouralSkills')} /></Field>
          <Field label="Certifications (Optional)"><TagInput value={d.certifications} onChange={(v) => f.set('certifications', v)} suggestions={CERT_SUGGESTIONS} /></Field>
        </div>
      </Section>

      <Section n={5} title="Scale and Cost">
        <div className="fgrid c6">
          <Field label="Current Headcount" required error={f.err('headcount')}><NumberInput value={d.headcount} onChange={(v) => f.set('headcount', v)} invalid={f.inv('headcount')} /></Field>
          <Field label="Locations" required><TagInput value={d.locations} onChange={(v) => f.set('locations', v)} suggestions={LOCATIONS} /></Field>
          <Field label="Current Delivery Model" required error={f.err('deliveryModel')}><Select value={d.deliveryModel} options={DELIVERY_MODELS} onChange={(v) => f.set('deliveryModel', v)} invalid={f.inv('deliveryModel')} /></Field>
          <Field label="Current Provider"><Select value={d.provider} options={PROVIDERS} onChange={(v) => f.set('provider', v)} /></Field>
          <Field label={`Annual Cost (${settings.currency})`} required error={f.err('annualSpend')}><MoneyInput value={d.annualSpend} onChange={(v) => f.set('annualSpend', v)} invalid={f.inv('annualSpend')} currency={settings.currency} /></Field>
          <Field label={`Average Cost per FTE (${settings.currency})`} help={!d.costPerFte && costPerFte ? 'Auto-calculated' : undefined}><MoneyInput value={d.costPerFte || costPerFte} onChange={(v) => f.set('costPerFte', v)} currency={settings.currency} /></Field>
        </div>
      </Section>
    </FormShell>
  )
}
