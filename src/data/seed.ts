import type { AppState, Application, Assessment, Entity, EntityType, Project, Role, Workforce, Rating, Location, Scenario, Wave, TransitionItem, TargetAllocation } from '../types'
import { SECTIONS } from './framework'

const now = new Date().toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

function a(partial: Record<string, Record<string, Rating>> = {}, submitted = false): Assessment {
  const responses: Assessment['responses'] = {}
  for (const [sec, crits] of Object.entries(partial)) {
    responses[sec] = {}
    for (const [c, rating] of Object.entries(crits)) responses[sec][c] = { rating, rationale: '' }
  }
  return { responses, submitted, submittedAt: submitted ? daysAgo(3) : undefined }
}

/** Build a full assessment for a given entity type from a profile of ratings per section. */
function full(type: EntityType, profile: Record<string, Rating | Rating[]>, submitted = true): Assessment {
  const responses: Assessment['responses'] = {}
  for (const section of SECTIONS) {
    responses[section.id] = {}
    const p = profile[section.id]
    section.criteria[type].forEach((c, i) => {
      const rating = Array.isArray(p) ? p[i % p.length] : p
      responses[section.id][c.id] = { rating, rationale: `${c.title} rated ${rating} based on current HQ operating context.` }
    })
  }
  return { responses, submitted, submittedAt: submitted ? daysAgo(2) : undefined }
}

const base = (type: EntityType, id: string, name: string, code: string) => ({
  id, type, companyId: 'gtc', name, code, createdAt: daysAgo(12), updatedAt: daysAgo(1),
})

export const seedEntities: Entity[] = [
  {
    ...base('project', 'prj-s4', 'S/4HANA Transformation', 'S4HANA'),
    type: 'project',
    businessFunction: 'IT', capability: 'Enterprise Applications', subCapability: 'SAP', lifecycleStage: 'Transform',
    description: 'Global transformation of finance, procurement and supply chain processes onto a common SAP S/4HANA platform, including data migration, integration and enablement.',
    rationale: 'Standardize core processes, retire legacy ERP platforms, improve financial visibility, reduce operating cost and create a scalable digital foundation for future growth.',
    objectives: ['Implement a single global ERP platform', 'Standardize finance and procurement processes', 'Improve supply chain visibility', 'Reduce total cost of ownership by 20%'],
    outcomes: ['Single global ERP platform', 'Improved financial and supply chain visibility', 'Process standardization and automation', '20% reduction in total cost of ownership'],
    processes: ['Finance', 'Procurement', 'Supply Chain', 'Master Data'], geographies: ['US', 'UK', 'Germany', 'India'], outOfScope: '',
    headcount: 140, locations: ['US', 'UK', 'India'], deliveryModel: 'Provider Led (80%)', provider: 'Accenture', annualSpend: 8_400_000,
    spendType: 'Run', duration: '3 – 5 Years', businessOwner: 'CIO', stakeholders: ['CFO', 'Head of Procurement', 'IT Leadership'],
    assessment: a({ strategic: { importance: 'High', differentiation: 'Medium', complexity: 'High', interdependencies: 'High', changeImpact: 'Medium', ip: 'Medium', visibility: 'High' } }),
  } as Project,
  {
    ...base('application', 'app-s4', 'S/4HANA', 'S4HANA'),
    type: 'application',
    businessFunction: 'IT', capability: 'Enterprise Applications', subCapability: 'SAP',
    category: 'ERP', appType: 'Commercial Off-the-Shelf', deploymentModel: 'On-Premise (Current)',
    description: 'Global ERP platform supporting finance, procurement and supply chain processes across all business units.',
    rationale: 'Standardize core processes, improve financial visibility, enable global integration and create a scalable foundation for future growth.',
    processes: ['Finance', 'Procurement', 'Supply Chain'], businessOwner: 'CFO', itOwner: 'Head of Enterprise Applications',
    users: ['Finance Teams', 'Procurement Teams', 'Supply Chain Teams', 'Executives'], criticality: 'High',
    vendor: 'SAP', productVersion: 'S/4HANA 2022', hosting: 'On-Premise', integrations: ['SuccessFactors', 'Ariba', 'Concur'],
    dataSensitivity: 'High', dataResidency: 'Global', techStack: 'SAP HANA, Fiori, BW', licenseModel: 'Perpetual',
    totalUsers: 3200, headcount: 140, locations: ['US', 'UK', 'Germany', 'India'], deliveryModel: 'Provider Led (80%)', provider: 'Accenture', annualSpend: 8_400_000,
    assessment: a(),
  } as Application,
  {
    ...base('role', 'role-sapfc', 'SAP Functional Consultant', 'SAP-FC'),
    type: 'role',
    businessFunction: 'IT', capability: 'Enterprise Applications', subCapability: 'SAP',
    roleFamily: 'Consulting', roleLevel: 'Individual Contributor', experience: '5 – 8 Years', employmentType: 'Full-time',
    purpose: 'Provides functional expertise to configure, maintain and enhance SAP S/4HANA modules in Finance and Procurement to support global business processes.',
    description: 'Provides functional expertise to configure, maintain and enhance SAP S/4HANA modules in Finance and Procurement to support global business processes.',
    rationale: '',
    responsibilities: ['Gather and analyse business requirements', 'Configure and customize SAP modules (FI, CO, MM)', 'Support testing, deployment and hypercare', 'Work with business users on process improvements'],
    processes: ['Finance', 'Procurement', 'Accounts Payable', 'Accounts Receivable'], tools: ['SAP S/4HANA', 'SAP Fiori', 'ServiceNow', 'Excel'],
    internalStakeholders: ['Finance Teams', 'Procurement Teams', 'IT Leadership', 'End Users'], externalStakeholders: ['SAP Partner', 'Auditors'],
    technicalSkills: ['SAP FI', 'SAP CO', 'Configuration', 'Data Migration', 'Testing', 'Process Mapping'],
    behaviouralSkills: ['Communication', 'Problem Solving', 'Stakeholder Management', 'Analytical Thinking'],
    certifications: ['SAP S/4HANA Finance', 'SAP Certified Application Associate'],
    headcount: 25, locations: ['US', 'UK', 'India'], deliveryModel: 'Provider Led (80%)', provider: 'Accenture', annualSpend: 3_000_000, costPerFte: 120_000,
    assessment: a({
      strategic: { importance: 'High', complexity: 'High', differentiation: 'Medium', interdependencies: 'High', ip: 'Medium' },
      proximity: { stakeholder: 'Medium', customer: 'High', domain: 'Medium', onsite: 'Medium', timezone: 'High' },
    }),
  } as Role,
  {
    ...base('workforce', 'wf-sapams', 'SAP Application Management Team', 'IT-SAP-AMS'),
    type: 'workforce',
    businessFunction: 'IT', capability: 'Enterprise Applications', subCapability: 'SAP',
    teamType: 'Run / Operations', teamCode: 'IT-SAP-AMS', reportingTo: 'Head of Enterprise Applications',
    purpose: 'Provide application management, support, enhancement and continuous improvement for SAP across Finance, Procurement and Supply Chain.',
    description: 'Provide application management, support, enhancement and continuous improvement for SAP across Finance, Procurement and Supply Chain.',
    rationale: 'Ensures stable and efficient operation of core SAP systems, supports business continuity, enables process improvements and drives cost efficiency.',
    processes: ['Finance', 'Procurement', 'Supply Chain'], platforms: ['S/4HANA', 'SAP ECC', 'SAP BW'], geographies: ['US', 'UK', 'Germany'],
    stakeholders: ['CFO', 'Head of Procurement', 'Supply Chain Teams'],
    headcount: 85, employmentSplit: { employees: 60, contractors: 15, provider: 10 },
    roleFamilyMix: { 'Functional / Config': 25, Development: 20, 'Integration / Middleware': 12, 'Basis / Infrastructure': 8, 'Testing / QA': 12, 'PMO / Management': 8 },
    seniorityMix: { 'Junior (0–3 yrs)': 13, 'Mid (4–8 yrs)': 38, 'Senior (9–15 yrs)': 26, 'Leadership (15+ yrs)': 8 },
    locations: ['US', 'UK', 'Germany', 'India'], fteByLocation: { US: 20, UK: 15, Germany: 10, India: 40 },
    deliveryModel: 'Provider Led (80%)', provider: 'Accenture', annualSpend: 7_200_000, costPerFte: 84_700,
    assessment: a({ strategic: { importance: 'High', complexity: 'Medium', differentiation: 'High', interdependencies: 'High', ip: 'Medium', leadership: 'Medium' } }),
  } as Workforce,

  // ---- Fully assessed examples so the Opportunity Map and Reports have content ----
  {
    ...base('workforce', 'wf-servicedesk', 'Global IT Service Desk', 'IT-SD'),
    type: 'workforce', businessFunction: 'IT', capability: 'IT Service Management', subCapability: 'Service Desk',
    teamType: 'Run / Operations', teamCode: 'IT-SD', reportingTo: 'Head of Infrastructure',
    purpose: 'Provide L1/L2 IT support to all employees globally via phone, chat and portal.',
    description: 'Provide L1/L2 IT support to all employees globally via phone, chat and portal.',
    rationale: 'Keeps the workforce productive and resolves incidents against agreed SLAs.',
    processes: ['Incident Management', 'Request Fulfilment', 'Access Management'], platforms: ['ServiceNow', 'Microsoft 365', 'Intune'], geographies: ['US', 'UK', 'Germany', 'India'],
    stakeholders: ['All Employees', 'IT Leadership'],
    headcount: 120, employmentSplit: { employees: 30, contractors: 10, provider: 80 },
    roleFamilyMix: { 'Functional / Config': 10, Development: 0, 'Integration / Middleware': 0, 'Basis / Infrastructure': 90, 'Testing / QA': 5, 'PMO / Management': 15 },
    seniorityMix: { 'Junior (0–3 yrs)': 70, 'Mid (4–8 yrs)': 35, 'Senior (9–15 yrs)': 12, 'Leadership (15+ yrs)': 3 },
    locations: ['US', 'Poland', 'India'], fteByLocation: { US: 20, Poland: 30, India: 70 },
    deliveryModel: 'Fully Outsourced (100%)', provider: 'TCS', annualSpend: 5_600_000, costPerFte: 46_700,
    assessment: full('workforce', { strategic: ['Low', 'Low', 'Low', 'Medium', 'Low', 'Low'], proximity: ['Medium', 'Low', 'Low', 'Low', 'Medium'], delivery: 'Very High', risk: ['Low', 'Medium', 'Medium', 'Low', 'Low'], economic: ['High', 'Very High', 'Low', 'High', 'Very High'] }),
  } as Workforce,
  {
    ...base('application', 'app-datalake', 'Enterprise Data Platform', 'EDP'),
    type: 'application', businessFunction: 'IT', capability: 'Data & Analytics', subCapability: 'Data Engineering',
    category: 'Other', appType: 'Custom Built', deploymentModel: 'Public Cloud (IaaS/PaaS)',
    description: 'Cloud data lakehouse consolidating ERP, CRM and IoT data for enterprise reporting and advanced analytics.',
    rationale: 'Single source of truth for enterprise KPIs, enables AI/ML use cases across the business.',
    processes: ['Reporting', 'Forecasting', 'Customer Analytics'], businessOwner: 'CFO', itOwner: 'Head of Data & Analytics',
    users: ['Finance Teams', 'Sales Operations', 'Data Scientists'], criticality: 'High',
    vendor: 'Databricks', productVersion: 'Lakehouse Platform', hosting: 'Azure', integrations: ['S/4HANA', 'Salesforce', 'Power BI'],
    dataSensitivity: 'High', dataResidency: 'Global', techStack: 'Azure, Databricks, Power BI, Python', licenseModel: 'Subscription',
    totalUsers: 850, headcount: 45, locations: ['US', 'India'], deliveryModel: 'In-house Led (80%)', provider: 'Infosys', annualSpend: 6_100_000,
    assessment: full('application', { strategic: ['High', 'High', 'High', 'High', 'Medium', 'High', 'High'], proximity: ['Medium', 'Low', 'Medium', 'Low', 'Medium'], delivery: ['High', 'High', 'Very High', 'High', 'Medium'], risk: ['Medium', 'High', 'Medium', 'Low', 'Medium'], economic: ['High', 'High', 'Medium', 'Very High', 'High'] }),
  } as Application,
  {
    ...base('role', 'role-salesforce-dev', 'Salesforce Developer', 'SFDC-DEV'),
    type: 'role', businessFunction: 'IT', capability: 'Enterprise Applications', subCapability: 'Salesforce',
    roleFamily: 'Engineering', roleLevel: 'Individual Contributor', experience: '2 – 5 Years', employmentType: 'Full-time',
    purpose: 'Design, build and maintain Salesforce customisations, integrations and Lightning components for global sales and service teams.',
    description: 'Design, build and maintain Salesforce customisations, integrations and Lightning components.',
    rationale: '',
    responsibilities: ['Develop Apex and Lightning components', 'Build integrations with ERP and marketing platforms', 'Support releases and defect resolution'],
    processes: ['Lead to Order', 'Case Management'], tools: ['Salesforce', 'MuleSoft', 'Jira', 'Git'],
    internalStakeholders: ['Sales Operations', 'Customer Service'], externalStakeholders: ['Salesforce Partner'],
    technicalSkills: ['Apex', 'LWC', 'SOQL', 'MuleSoft', 'CI/CD'], behaviouralSkills: ['Collaboration', 'Problem Solving'], certifications: ['Salesforce Platform Developer I'],
    headcount: 18, locations: ['US', 'India'], deliveryModel: 'Hybrid (50/50)', provider: 'Cognizant', annualSpend: 1_900_000, costPerFte: 105_000,
    assessment: full('role', { strategic: ['Medium', 'Medium', 'Low', 'Medium', 'Low'], proximity: ['Medium', 'Low', 'Medium', 'Low', 'Medium'], delivery: ['High', 'High', 'High', 'High', 'High'], risk: ['Low', 'Medium', 'Low', 'Low', 'Low'], economic: ['Medium', 'High', 'Low', 'High', 'High'] }),
  } as Role,
  {
    ...base('project', 'prj-cyber', 'Zero Trust Security Programme', 'ZTSP'),
    type: 'project', businessFunction: 'IT', capability: 'Cybersecurity', subCapability: 'Identity & Access', lifecycleStage: 'Build',
    description: 'Multi-year programme to implement zero trust network access, identity governance and privileged access management across the enterprise.',
    rationale: 'Reduce cyber risk exposure, meet regulatory obligations and enable secure hybrid working.',
    objectives: ['Deploy identity governance platform', 'Implement PAM for all privileged accounts', 'Segment the corporate network'],
    outcomes: ['Reduced attack surface', 'Audit-ready access controls', 'Faster onboarding and offboarding'],
    processes: ['Identity Lifecycle', 'Access Review', 'Network Security'], geographies: ['US', 'UK', 'Germany'], outOfScope: 'OT / plant networks',
    headcount: 35, locations: ['US', 'UK'], deliveryModel: 'In-house Led (80%)', provider: 'Deloitte', annualSpend: 4_300_000,
    spendType: 'Project', duration: '2 – 3 Years', businessOwner: 'CIO', stakeholders: ['CISO', 'Legal & Compliance', 'IT Leadership'],
    assessment: full('project', { strategic: ['Very High', 'High', 'Medium', 'Very High', 'High', 'High', 'Very High'], proximity: ['High', 'Low', 'High', 'Medium', 'High'], delivery: ['Medium', 'Medium', 'Medium', 'Low', 'Medium'], risk: ['High', 'Very High', 'High', 'Medium', 'High'], economic: ['Medium', 'Low', 'High', 'Medium', 'Low'] }),
  } as Project,
  {
    ...base('workforce', 'wf-fpa', 'FP&A Reporting Team', 'FIN-FPA'),
    type: 'workforce', businessFunction: 'Finance', capability: 'FP&A', subCapability: '',
    teamType: 'Run / Operations', teamCode: 'FIN-FPA', reportingTo: 'Head of Finance Operations',
    purpose: 'Produce monthly management reporting, variance analysis and forecast consolidation for the group.',
    description: 'Produce monthly management reporting, variance analysis and forecast consolidation for the group.',
    rationale: 'Provides leadership with timely, accurate financial insight to steer the business.',
    processes: ['Management Reporting', 'Forecasting', 'Budgeting'], platforms: ['SAP BW', 'Anaplan', 'Power BI'], geographies: ['US', 'UK'],
    stakeholders: ['CFO', 'Business Unit Leaders'],
    headcount: 32, employmentSplit: { employees: 28, contractors: 4, provider: 0 },
    roleFamilyMix: { 'Functional / Config': 20, Development: 4, 'Integration / Middleware': 0, 'Basis / Infrastructure': 0, 'Testing / QA': 0, 'PMO / Management': 8 },
    seniorityMix: { 'Junior (0–3 yrs)': 10, 'Mid (4–8 yrs)': 12, 'Senior (9–15 yrs)': 8, 'Leadership (15+ yrs)': 2 },
    locations: ['US', 'UK'], fteByLocation: { US: 20, UK: 12 },
    deliveryModel: 'In-house (100%)', provider: 'None / In-house', annualSpend: 3_800_000, costPerFte: 118_750,
    assessment: full('workforce', { strategic: ['High', 'Medium', 'Low', 'High', 'Medium', 'High'], proximity: ['Very High', 'Low', 'High', 'Low', 'High'], delivery: ['Medium', 'Medium', 'Low', 'Medium', 'High'], risk: ['Medium', 'High', 'Medium', 'Low', 'Medium'], economic: ['Medium', 'Medium', 'Medium', 'Medium', 'Medium'] }),
  } as Workforce,
  {
    ...base('project', 'prj-hr-cloud', 'HR Cloud Consolidation', 'HRC'),
    type: 'project', businessFunction: 'HR', capability: 'HR Operations', subCapability: '', lifecycleStage: 'Plan',
    description: 'Consolidate regional HR systems onto a single Workday tenant and standardise core HR, payroll and absence processes.',
    rationale: 'Single global employee record, simplified compliance and reduced licence and support cost.',
    objectives: ['Single Workday tenant', 'Standard global HR processes', 'Retire 6 regional HRIS platforms'],
    outcomes: ['One employee master', '30% lower HRIS run cost'],
    processes: ['Hire to Retire', 'Payroll', 'Absence'], geographies: ['US', 'UK', 'Germany', 'India', 'Singapore'], outOfScope: '',
    headcount: 28, locations: ['US', 'India'], deliveryModel: 'Provider Led (80%)', provider: 'Capgemini', annualSpend: 2_700_000,
    spendType: 'Both', duration: '1 – 2 Years', businessOwner: 'CHRO', stakeholders: ['CHRO', 'Head of Finance Operations'],
    assessment: full('project', { strategic: ['Medium', 'Medium', 'Low', 'Medium', 'Medium', 'Low', 'Medium'], proximity: ['Medium', 'Low', 'Medium', 'Low', 'Low'], delivery: ['High', 'High', 'High', 'High', 'Medium'], risk: ['Medium', 'High', 'Medium', 'Medium', 'Low'], economic: ['Medium', 'High', 'Medium', 'Medium', 'High'] }),
  } as Project,

  // ---- Second company ----
  {
    ...base('application', 'app-lims', 'Laboratory Information Management', 'LIMS'),
    companyId: 'nwp',
    type: 'application', businessFunction: 'R&D / Engineering', capability: 'Testing & Validation', subCapability: '',
    category: 'Other', appType: 'Commercial Off-the-Shelf', deploymentModel: 'On-Premise (Current)',
    description: 'LIMS supporting sample tracking, batch release and stability studies across 4 manufacturing sites.',
    rationale: 'GxP-critical system required for regulatory batch release.',
    processes: ['Sample Management', 'Batch Release', 'Stability Testing'], businessOwner: 'COO', itOwner: 'Head of Enterprise Applications',
    users: ['QC Labs', 'QA', 'Manufacturing'], criticality: 'Mission Critical',
    vendor: 'LabWare', productVersion: 'LabWare 8', hosting: 'On-Premise', integrations: ['SAP ECC', 'Empower'],
    dataSensitivity: 'High', dataResidency: 'Country Specific', techStack: 'Oracle, LabWare LIMS', licenseModel: 'Perpetual',
    totalUsers: 600, headcount: 22, locations: ['US', 'Germany'], deliveryModel: 'In-house (100%)', provider: 'None / In-house', annualSpend: 2_100_000,
    assessment: a(),
  } as Application,
]

const loc = (companyId: string, id: string, name: string, type: Location['type'], costIndex: number, capacity: number, timezone: string, notes = ''): Location => ({ id: `${companyId}-${id}`, companyId, name, type, costIndex, capacity, timezone, notes })

export const seedLocations: Location[] = [
  loc('gtc', 'us', 'US', 'HQ', 1.0, 0, 'UTC−5 to −8', 'Global headquarters'),
  loc('gtc', 'uk', 'UK', 'Onshore', 0.95, 0, 'UTC+0'),
  loc('gtc', 'germany', 'Germany', 'Onshore', 0.98, 0, 'UTC+1'),
  loc('gtc', 'india', 'India', 'GCC Hub', 0.32, 600, 'UTC+5:30', 'Primary GCC, Bengaluru'),
  loc('gtc', 'poland', 'Poland', 'Nearshore', 0.5, 150, 'UTC+1', 'EU nearshore centre, Kraków'),
  loc('gtc', 'mexico', 'Mexico', 'Nearshore', 0.45, 100, 'UTC−6', 'Americas nearshore, Guadalajara'),
  loc('gtc', 'philippines', 'Philippines', 'GCC Hub', 0.3, 200, 'UTC+8', 'Service desk and operations'),
  loc('nwp', 'germany', 'Germany', 'HQ', 1.0, 0, 'UTC+1', 'Group headquarters'),
  loc('nwp', 'us', 'US', 'Onshore', 0.98, 0, 'UTC−5'),
  loc('nwp', 'india', 'India', 'GCC Hub', 0.32, 300, 'UTC+5:30', 'Hyderabad'),
  loc('nwp', 'poland', 'Poland', 'Nearshore', 0.5, 80, 'UTC+1'),
]

const scn = (id: string, name: string, description: string, isBaseline: boolean, movePct: Scenario['movePct'], extra: Partial<Scenario> = {}): Scenario => ({
  id, companyId: 'gtc', name, description, isBaseline, targetLocationId: 'gtc-india', movePct, transitionCostPerFte: 25_000, rampYears: 2, productivityDipPct: 15, overheadPct: 10, horizonYears: 5, createdAt: daysAgo(5), ...extra,
})

export const seedScenarios: Scenario[] = [
  scn('scn-balanced', 'Balanced', 'Move most early-transition work and a majority of capability-hub work to India over two years.', true, { 'GCC Capability Hub': 60, 'Early Transition Candidate': 80, 'Retain at HQ / Hybrid': 20, 'Optimise in Place': 0 }),
  scn('scn-aggressive', 'Aggressive', 'Maximise GCC scale quickly, including hybrid delivery for HQ-retained work.', false, { 'GCC Capability Hub': 80, 'Early Transition Candidate': 100, 'Retain at HQ / Hybrid': 40, 'Optimise in Place': 20 }, { transitionCostPerFte: 30_000, rampYears: 1, productivityDipPct: 20 }),
  scn('scn-conservative', 'Conservative', 'Early-transition work only, with a slower three-year ramp and a Poland nearshore hub.', false, { 'GCC Capability Hub': 30, 'Early Transition Candidate': 60, 'Retain at HQ / Hybrid': 0, 'Optimise in Place': 0 }, { targetLocationId: 'gtc-poland', transitionCostPerFte: 20_000, rampYears: 3, productivityDipPct: 10, overheadPct: 12 }),
]

export const seedWaves: Wave[] = [
  { id: 'wave-1', companyId: 'gtc', name: 'Wave 1 – Quick Wins', startMonth: '2027-01', durationMonths: 6, description: 'Standardised, low-risk work: service desk, HR cloud, Salesforce engineering.' },
  { id: 'wave-2', companyId: 'gtc', name: 'Wave 2 – Capability Hub', startMonth: '2027-07', durationMonths: 9, description: 'Build the data and analytics capability hub with HQ governance.' },
  { id: 'wave-3', companyId: 'gtc', name: 'Wave 3 – Hybrid & Optimise', startMonth: '2028-04', durationMonths: 9, description: 'Hybrid delivery for strategically sensitive programmes.' },
]

export const seedTransitions: TransitionItem[] = [
  { entityId: 'wf-servicedesk', waveId: 'wave-1', status: 'Planning', offsetMonths: 0, durationMonths: 5, owner: 'Head of Infrastructure', notes: 'Provider contract renewal aligned to go-live.' },
  { entityId: 'role-salesforce-dev', waveId: 'wave-1', status: 'Not Started', offsetMonths: 1, durationMonths: 4, owner: 'Head of Enterprise Applications', notes: '' },
  { entityId: 'prj-hr-cloud', waveId: 'wave-1', status: 'Not Started', offsetMonths: 2, durationMonths: 4, owner: 'CHRO', notes: '' },
  { entityId: 'app-datalake', waveId: 'wave-2', status: 'Not Started', offsetMonths: 0, durationMonths: 8, owner: 'Head of Data & Analytics', notes: 'Requires Azure landing zone in India region.' },
  { entityId: 'prj-cyber', waveId: 'wave-3', status: 'Not Started', offsetMonths: 0, durationMonths: 6, owner: 'CISO', notes: 'Hybrid model only; privileged access stays at HQ.' },
]

export const seedAllocations: TargetAllocation[] = [
  { entityId: 'wf-servicedesk', allocation: { 'gtc-us': 10, 'gtc-poland': 20, 'gtc-india': 50, 'gtc-philippines': 40 }, targetModel: 'In-house Led (80%)', notes: 'Follow-the-sun across India and Philippines; Poland covers EU languages.' },
  { entityId: 'app-datalake', allocation: { 'gtc-us': 15, 'gtc-india': 30 }, targetModel: 'In-house (100%)', notes: 'Product ownership and architecture remain at HQ.' },
  { entityId: 'role-salesforce-dev', allocation: { 'gtc-us': 6, 'gtc-india': 12 }, targetModel: 'In-house (100%)', notes: '' },
  { entityId: 'prj-cyber', allocation: { 'gtc-us': 20, 'gtc-uk': 8, 'gtc-india': 7 }, targetModel: 'In-house Led (80%)', notes: 'SOC monitoring only moves to India.' },
  { entityId: 'prj-hr-cloud', allocation: { 'gtc-us': 6, 'gtc-india': 22 }, targetModel: 'Hybrid (50/50)', notes: '' },
]

export const seedState: AppState = {
  locations: seedLocations,
  allocations: seedAllocations,
  scenarios: seedScenarios,
  waves: seedWaves,
  transitions: seedTransitions,
  settings: {
    activeCompanyId: 'gtc',
    companies: [
      { id: 'gtc', name: 'Global Tech Co.', hqLocation: 'US', industry: 'Technology' },
      { id: 'nwp', name: 'Northwind Pharma', hqLocation: 'Germany', industry: 'Life Sciences' },
    ],
    userName: 'John Doe',
    userTitle: 'Portfolio Lead',
    currency: 'USD',
  },
  entities: seedEntities,
}

export { now }
