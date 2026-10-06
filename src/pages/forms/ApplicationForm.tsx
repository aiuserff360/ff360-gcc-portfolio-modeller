import { FileText, Layers } from 'lucide-react'
import type { Application } from '../../types'
import { useEntityForm, baseBlank, FormShell, NotFound, TipsCard, required, type Errors } from './shared'
import { Field, TextInput, Select, TextArea, Segmented, TagInput, NumberInput, MoneyInput, Section } from '../../components/ui'
import { BUSINESS_FUNCTIONS, CAPABILITIES, LOCATIONS, DELIVERY_MODELS, PROVIDERS, BUSINESS_OWNERS, APP_CATEGORIES, APP_TYPES, DEPLOYMENT_MODELS, HOSTING, CRITICALITY, DATA_RESIDENCY, LICENSE_MODELS } from '../../data/options'
import { useApp } from '../../store/AppContext'

const PROCESS_SUGGESTIONS = ['Finance', 'Procurement', 'Supply Chain', 'HR', 'Sales', 'Customer Service', 'Reporting', 'Manufacturing']
const USER_SUGGESTIONS = ['Finance Teams', 'Procurement Teams', 'Supply Chain Teams', 'Executives', 'HR Teams', 'Sales Teams', 'All Employees', 'IT Teams']
const INTEGRATION_SUGGESTIONS = ['SuccessFactors', 'Ariba', 'Concur', 'Salesforce', 'ServiceNow', 'Workday', 'Power BI', 'S/4HANA', 'SAP ECC']

export function blankApplication(companyId: string): Application {
  return { ...baseBlank('application', companyId), type: 'application', category: '', appType: '', deploymentModel: '', processes: [], businessOwner: '', itOwner: '', users: [], criticality: '', vendor: '', productVersion: '', hosting: '', integrations: [], dataSensitivity: '', dataResidency: '', techStack: '', licenseModel: '', totalUsers: 0 }
}

function validate(d: Application): Errors {
  const e: Errors = {}
  if (required(d.name)) e.name = 'Required'
  if (required(d.businessFunction)) e.businessFunction = 'Required'
  if (required(d.capability)) e.capability = 'Required'
  if (required(d.category)) e.category = 'Select a category'
  if (required(d.appType)) e.appType = 'Select a type'
  if (required(d.deploymentModel)) e.deploymentModel = 'Required'
  if (required(d.description)) e.description = 'Required'
  if (required(d.rationale)) e.rationale = 'Required'
  if (required(d.processes)) e.processes = 'Add at least one process'
  if (required(d.businessOwner)) e.businessOwner = 'Required'
  if (required(d.itOwner)) e.itOwner = 'Required'
  if (required(d.criticality)) e.criticality = 'Select criticality'
  if (required(d.vendor)) e.vendor = 'Required'
  if (required(d.hosting)) e.hosting = 'Required'
  return e
}

const CATEGORY_HINTS: [string, string][] = [['ERP', 'e.g. SAP, Oracle, Microsoft Dynamics'], ['CRM', 'e.g. Salesforce, Microsoft Dynamics CRM'], ['HCM', 'e.g. Workday, SAP SuccessFactors'], ['SCM', 'e.g. SAP Ariba, Blue Yonder'], ['Collaboration', 'e.g. Microsoft 365, Atlassian'], ['IT Management', 'e.g. ServiceNow'], ['Analytics & BI', 'e.g. Tableau, Power BI'], ['Custom', 'In-house developed applications'], ['Other', 'Industry specific or niche applications']]

export default function ApplicationForm() {
  const f = useEntityForm<Application>('application', blankApplication)
  const { settings } = useApp()
  if (f.notFound) return <NotFound type="application" />
  const d = f.draft
  const caps = CAPABILITIES[d.businessFunction] ?? []

  const aside = (
    <>
      <div className="aside-card">
        <h4><FileText /> Application Information</h4>
        <p>This information will be used for the GCC assessment from a global HQ perspective.</p>
      </div>
      <TipsCard tips={['Focus on what the application does, not how it is delivered.', 'Highlight key business processes and outcomes.', 'Include major users and stakeholders.', 'Be clear about current deployment and integrations.']} />
      <div className="aside-card">
        <h4><Layers /> Common Application Categories</h4>
        <div className="cat-list">
          {CATEGORY_HINTS.map(([c, h]) => (
            <span key={c} style={{ display: 'contents' }}>
              <button type="button" className="pill" style={{ border: 'none', cursor: 'pointer' }} onClick={() => f.set('category', APP_CATEGORIES.includes(c) ? c : 'Other')}>{c}</button>
              <span>{h}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <FormShell type="application" title="Application Details" subtitle="Capture key information about the application before proceeding to the assessment." onSave={() => f.saveDraft(validate)} onNext={() => f.next(validate)} aside={aside}>
      <Section n={1} title="Basic Information">
        <div className="fgrid c4">
          <Field label="Application Name" required error={f.err('name')}><TextInput value={d.name} onChange={(v) => f.set('name', v)} placeholder="e.g. S/4HANA" invalid={f.inv('name')} /></Field>
          <Field label="Short Name / Code"><TextInput value={d.code} onChange={(v) => f.set('code', v)} placeholder="e.g. S4HANA" /></Field>
          <Field label="Business Function" required error={f.err('businessFunction')}><Select value={d.businessFunction} options={BUSINESS_FUNCTIONS} onChange={(v) => f.patch({ businessFunction: v, capability: '', subCapability: '' })} invalid={f.inv('businessFunction')} allowEmpty={false} /></Field>
          <Field label="Business Capability" required error={f.err('capability')}><Select value={d.capability} options={caps} onChange={(v) => f.patch({ capability: v, subCapability: '' })} invalid={f.inv('capability')} /></Field>
        </div>
        <div className="fgrid c3">
          <Field label="Application Category" required error={f.err('category')}><Segmented full value={d.category} options={APP_CATEGORIES} onChange={(v) => f.set('category', v)} /></Field>
          <Field label="Application Type" required error={f.err('appType')}><Segmented full value={d.appType} options={APP_TYPES} onChange={(v) => f.set('appType', v)} /></Field>
          <Field label="Deployment Model" required error={f.err('deploymentModel')}><Select value={d.deploymentModel} options={DEPLOYMENT_MODELS} onChange={(v) => f.set('deploymentModel', v)} invalid={f.inv('deploymentModel')} /></Field>
        </div>
      </Section>

      <Section n={2} title="Application Overview">
        <div className="fgrid c2">
          <Field label="Application Description" required help="What does this application do? What key business processes does it support?" error={f.err('description')}><TextArea value={d.description} onChange={(v) => f.set('description', v)} invalid={f.inv('description')} /></Field>
          <Field label="Business Rationale" required help="Why is this application important to the business?" error={f.err('rationale')}><TextArea value={d.rationale} onChange={(v) => f.set('rationale', v)} invalid={f.inv('rationale')} /></Field>
        </div>
      </Section>

      <Section n={3} title="Business Details">
        <div className="fgrid c3">
          <Field label="Key Business Processes Supported" required error={f.err('processes')}><TagInput value={d.processes} onChange={(v) => f.set('processes', v)} suggestions={PROCESS_SUGGESTIONS} invalid={f.inv('processes')} /></Field>
          <Field label="Primary Business Owner" required error={f.err('businessOwner')}><Select value={d.businessOwner} options={BUSINESS_OWNERS} onChange={(v) => f.set('businessOwner', v)} invalid={f.inv('businessOwner')} /></Field>
          <Field label="IT Owner" required error={f.err('itOwner')}><Select value={d.itOwner} options={BUSINESS_OWNERS} onChange={(v) => f.set('itOwner', v)} invalid={f.inv('itOwner')} /></Field>
        </div>
        <div className="fgrid c3">
          <Field label="Key Users / Personas" className="span2"><TagInput value={d.users} onChange={(v) => f.set('users', v)} suggestions={USER_SUGGESTIONS} /></Field>
          <Field label="Business Criticality" required error={f.err('criticality')}><Segmented full value={d.criticality} options={CRITICALITY} onChange={(v) => f.set('criticality', v)} /></Field>
        </div>
      </Section>

      <Section n={4} title="Technical Details">
        <div className="fgrid c4">
          <Field label="Vendor" required error={f.err('vendor')}><TextInput value={d.vendor} onChange={(v) => f.set('vendor', v)} placeholder="e.g. SAP" invalid={f.inv('vendor')} /></Field>
          <Field label="Product / Version"><TextInput value={d.productVersion} onChange={(v) => f.set('productVersion', v)} placeholder="e.g. S/4HANA 2022" /></Field>
          <Field label="Hosting Environment" required error={f.err('hosting')}><Select value={d.hosting} options={HOSTING} onChange={(v) => f.set('hosting', v)} invalid={f.inv('hosting')} /></Field>
          <Field label="Integration Landscape"><TagInput value={d.integrations} onChange={(v) => f.set('integrations', v)} suggestions={INTEGRATION_SUGGESTIONS} /></Field>
        </div>
        <div className="fgrid c4">
          <Field label="Data Sensitivity"><Segmented full value={d.dataSensitivity} options={['Low', 'Medium', 'High']} onChange={(v) => f.set('dataSensitivity', v)} /></Field>
          <Field label="Data Residency Requirements"><Select value={d.dataResidency} options={DATA_RESIDENCY} onChange={(v) => f.set('dataResidency', v)} /></Field>
          <Field label="Technology Stack (if any)"><TextInput value={d.techStack} onChange={(v) => f.set('techStack', v)} placeholder="e.g. SAP HANA, Fiori, BW" /></Field>
          <Field label="License Model"><Select value={d.licenseModel} options={LICENSE_MODELS} onChange={(v) => f.set('licenseModel', v)} /></Field>
        </div>
      </Section>

      <Section n={5} title="Scale and Footprint">
        <div className="fgrid c6">
          <Field label="Total Users"><NumberInput value={d.totalUsers} onChange={(v) => f.set('totalUsers', v)} /></Field>
          <Field label="Total Headcount Supporting" hint="FTE involved in running, supporting and enhancing this application"><NumberInput value={d.headcount} onChange={(v) => f.set('headcount', v)} /></Field>
          <Field label="Current Locations"><TagInput value={d.locations} onChange={(v) => f.set('locations', v)} suggestions={LOCATIONS} /></Field>
          <Field label="Current Delivery Model"><Select value={d.deliveryModel} options={DELIVERY_MODELS} onChange={(v) => f.set('deliveryModel', v)} /></Field>
          <Field label="Current Provider"><Select value={d.provider} options={PROVIDERS} onChange={(v) => f.set('provider', v)} /></Field>
          <Field label={`Annual Spend (${settings.currency})`}><MoneyInput value={d.annualSpend} onChange={(v) => f.set('annualSpend', v)} currency={settings.currency} /></Field>
        </div>
      </Section>
    </FormShell>
  )
}
