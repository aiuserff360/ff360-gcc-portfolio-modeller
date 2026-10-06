import { useNavigate } from 'react-router-dom'
import type { Project } from '../../types'
import { useEntityForm, baseBlank, FormShell, NotFound, required, type Errors } from './shared'
import { Field, TextInput, Select, TextArea, Segmented, TagInput, BulletList, NumberInput, MoneyInput, RadioRow, Section } from '../../components/ui'
import { BUSINESS_FUNCTIONS, CAPABILITIES, SUB_CAPABILITIES, LIFECYCLE_STAGES, LOCATIONS, DELIVERY_MODELS, PROVIDERS, DURATIONS, BUSINESS_OWNERS } from '../../data/options'
import { useApp } from '../../store/AppContext'

const PROCESS_SUGGESTIONS = ['Finance', 'Procurement', 'Supply Chain', 'Master Data', 'HR', 'Sales', 'Manufacturing', 'Logistics', 'Reporting', 'Planning']
const STAKEHOLDER_SUGGESTIONS = ['CEO', 'CFO', 'CIO', 'COO', 'CHRO', 'Head of Procurement', 'IT Leadership', 'Business Unit Leaders', 'Finance Teams']

export function blankProject(companyId: string): Project {
  return { ...baseBlank('project', companyId), type: 'project', lifecycleStage: '', objectives: [], outcomes: [], processes: [], geographies: [], outOfScope: '', spendType: 'Run', duration: '', businessOwner: '', stakeholders: [] }
}

function validate(d: Project): Errors {
  const e: Errors = {}
  if (required(d.name)) e.name = 'Required'
  if (required(d.businessFunction)) e.businessFunction = 'Required'
  if (required(d.capability)) e.capability = 'Required'
  if (required(d.lifecycleStage)) e.lifecycleStage = 'Required'
  if (required(d.description)) e.description = 'Required'
  if (required(d.rationale)) e.rationale = 'Required'
  if (required(d.objectives)) e.objectives = 'Add at least one objective'
  if (required(d.outcomes)) e.outcomes = 'Add at least one outcome'
  if (required(d.headcount)) e.headcount = 'Required'
  if (required(d.locations)) e.locations = 'Add at least one location'
  if (required(d.deliveryModel)) e.deliveryModel = 'Required'
  if (required(d.annualSpend)) e.annualSpend = 'Required'
  if (required(d.duration)) e.duration = 'Required'
  if (required(d.businessOwner)) e.businessOwner = 'Required'
  return e
}

const TYPE_ROUTES: Record<string, string> = { 'Project / Service': '/projects/new', Application: '/applications/new', Role: '/roles/new', Workforce: '/workforce/new' }

export default function ProjectForm() {
  const f = useEntityForm<Project>('project', blankProject)
  const { settings } = useApp()
  const navigate = useNavigate()
  if (f.notFound) return <NotFound type="project" />
  const d = f.draft
  const caps = CAPABILITIES[d.businessFunction] ?? []
  const subs = SUB_CAPABILITIES[d.capability] ?? []

  return (
    <FormShell type="project" title="Project / Application Details" subtitle="Capture key information about the project, application or service before proceeding to the assessment." onSave={() => f.saveDraft(validate)} onNext={() => f.next(validate)}>
      <Section n={1} title="Basic Information">
        <div className="fgrid c4">
          <Field label="Assessment Type" required className="span2">
            <Segmented full value="Project / Service" options={Object.keys(TYPE_ROUTES)} onChange={(v) => { if (v !== 'Project / Service') navigate(TYPE_ROUTES[v]) }} disabled={!f.isNew} />
          </Field>
          <Field label="Project / Application Name" required error={f.err('name')}><TextInput value={d.name} onChange={(v) => f.set('name', v)} placeholder="e.g. S/4HANA Transformation" invalid={f.inv('name')} /></Field>
          <Field label="Short Name / Code"><TextInput value={d.code} onChange={(v) => f.set('code', v)} placeholder="e.g. S4HANA" /></Field>
        </div>
        <div className="fgrid c4">
          <Field label="Business Function" required error={f.err('businessFunction')}><Select value={d.businessFunction} options={BUSINESS_FUNCTIONS} onChange={(v) => f.patch({ businessFunction: v, capability: '', subCapability: '' })} invalid={f.inv('businessFunction')} allowEmpty={false} /></Field>
          <Field label="Business Capability" required error={f.err('capability')}><Select value={d.capability} options={caps} onChange={(v) => f.patch({ capability: v, subCapability: '' })} invalid={f.inv('capability')} /></Field>
          <Field label="Sub Capability"><Select value={d.subCapability} options={subs} onChange={(v) => f.set('subCapability', v)} placeholder={subs.length ? 'Select…' : 'None'} /></Field>
          <Field label="Lifecycle Stage" required error={f.err('lifecycleStage')}><Select value={d.lifecycleStage} options={LIFECYCLE_STAGES} onChange={(v) => f.set('lifecycleStage', v)} invalid={f.inv('lifecycleStage')} /></Field>
        </div>
      </Section>

      <Section n={2} title="Description & Rationale">
        <div className="fgrid c2">
          <Field label="Project / Application Description" required help="What work is performed? What is included in scope?" error={f.err('description')}><TextArea value={d.description} onChange={(v) => f.set('description', v)} invalid={f.inv('description')} placeholder="Describe the work, scope and key activities…" /></Field>
          <Field label="Business Rationale" required help="Why is this project important to the business?" error={f.err('rationale')}><TextArea value={d.rationale} onChange={(v) => f.set('rationale', v)} invalid={f.inv('rationale')} placeholder="Explain the business value and drivers…" /></Field>
        </div>
      </Section>

      <Section n={3} title="Objectives & Expected Outcomes">
        <div className="fgrid c2">
          <Field label="Key Objectives" required error={f.err('objectives')}><BulletList value={d.objectives} onChange={(v) => f.set('objectives', v)} invalid={f.inv('objectives')} placeholder="e.g. Implement a single global ERP platform" /></Field>
          <Field label="Expected Business Outcomes" required error={f.err('outcomes')}><BulletList value={d.outcomes} onChange={(v) => f.set('outcomes', v)} invalid={f.inv('outcomes')} placeholder="e.g. 20% reduction in total cost of ownership" /></Field>
        </div>
      </Section>

      <Section n={4} title="Scope and Coverage">
        <div className="fgrid c3">
          <Field label="Key Processes / Modules in Scope"><TagInput value={d.processes} onChange={(v) => f.set('processes', v)} suggestions={PROCESS_SUGGESTIONS} /></Field>
          <Field label="Geographies in Scope"><TagInput value={d.geographies} onChange={(v) => f.set('geographies', v)} suggestions={LOCATIONS} /></Field>
          <Field label="Out of Scope (if any)"><TextInput value={d.outOfScope} onChange={(v) => f.set('outOfScope', v)} placeholder="e.g. HR, Manufacturing, CRM" /></Field>
        </div>
      </Section>

      <Section n={5} title="Scale and Delivery">
        <div className="fgrid c5">
          <Field label="Current Headcount (FTE)" required error={f.err('headcount')}><NumberInput value={d.headcount} onChange={(v) => f.set('headcount', v)} invalid={f.inv('headcount')} /></Field>
          <Field label="Current Locations" required error={f.err('locations')}><TagInput value={d.locations} onChange={(v) => f.set('locations', v)} suggestions={LOCATIONS} invalid={f.inv('locations')} /></Field>
          <Field label="Current Delivery Model" required error={f.err('deliveryModel')}><Select value={d.deliveryModel} options={DELIVERY_MODELS} onChange={(v) => f.set('deliveryModel', v)} invalid={f.inv('deliveryModel')} /></Field>
          <Field label="Current Provider"><Select value={d.provider} options={PROVIDERS} onChange={(v) => f.set('provider', v)} /></Field>
          <Field label={`Expected Spend (${settings.currency})`} required error={f.err('annualSpend')}><MoneyInput value={d.annualSpend} onChange={(v) => f.set('annualSpend', v)} invalid={f.inv('annualSpend')} currency={settings.currency} /></Field>
        </div>
        <div className="fgrid c4">
          <Field label="Spend Type" required><RadioRow name="spendType" value={d.spendType} options={['Run', 'Project', 'Both']} onChange={(v) => f.set('spendType', v as Project['spendType'])} /></Field>
          <Field label="Expected Duration" required error={f.err('duration')}><Select value={d.duration} options={DURATIONS} onChange={(v) => f.set('duration', v)} invalid={f.inv('duration')} /></Field>
          <Field label="Primary Business Owner" required error={f.err('businessOwner')}><Select value={d.businessOwner} options={BUSINESS_OWNERS} onChange={(v) => f.set('businessOwner', v)} invalid={f.inv('businessOwner')} /></Field>
          <Field label="Key Stakeholders (Optional)"><TagInput value={d.stakeholders} onChange={(v) => f.set('stakeholders', v)} suggestions={STAKEHOLDER_SUGGESTIONS} /></Field>
        </div>
      </Section>
    </FormShell>
  )
}
