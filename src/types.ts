export type EntityType = 'project' | 'application' | 'role' | 'workforce'

export type Rating = 'Low' | 'Medium' | 'High' | 'Very High'

export interface CriterionResponse {
  rating: Rating | null
  rationale: string
}

export interface Assessment {
  /** sectionId -> criterionId -> response */
  responses: Record<string, Record<string, CriterionResponse>>
  submitted: boolean
  submittedAt?: string
  reviewNotes?: string
}

export type EntityStatus = 'Draft' | 'In Assessment' | 'Assessed'

export interface BaseEntity {
  id: string
  type: EntityType
  companyId: string
  name: string
  code: string
  businessFunction: string
  capability: string
  subCapability: string
  description: string
  rationale: string
  locations: string[]
  deliveryModel: string
  provider: string
  headcount: number
  annualSpend: number
  createdAt: string
  updatedAt: string
  assessment: Assessment
}

export interface Project extends BaseEntity {
  type: 'project'
  lifecycleStage: string
  objectives: string[]
  outcomes: string[]
  processes: string[]
  geographies: string[]
  outOfScope: string
  spendType: 'Run' | 'Project' | 'Both'
  duration: string
  businessOwner: string
  stakeholders: string[]
}

export interface Application extends BaseEntity {
  type: 'application'
  category: string
  appType: string
  deploymentModel: string
  processes: string[]
  businessOwner: string
  itOwner: string
  users: string[]
  criticality: string
  vendor: string
  productVersion: string
  hosting: string
  integrations: string[]
  dataSensitivity: string
  dataResidency: string
  techStack: string
  licenseModel: string
  totalUsers: number
}

export interface Role extends BaseEntity {
  type: 'role'
  roleFamily: string
  roleLevel: string
  experience: string
  employmentType: string
  purpose: string
  responsibilities: string[]
  processes: string[]
  tools: string[]
  internalStakeholders: string[]
  externalStakeholders: string[]
  technicalSkills: string[]
  behaviouralSkills: string[]
  certifications: string[]
  costPerFte: number
}

export interface Workforce extends BaseEntity {
  type: 'workforce'
  teamType: string
  teamCode: string
  reportingTo: string
  purpose: string
  processes: string[]
  platforms: string[]
  geographies: string[]
  stakeholders: string[]
  employmentSplit: { employees: number; contractors: number; provider: number }
  roleFamilyMix: Record<string, number>
  seniorityMix: Record<string, number>
  fteByLocation: Record<string, number>
  costPerFte: number
}

export type Entity = Project | Application | Role | Workforce

export interface Company {
  id: string
  name: string
  hqLocation: string
  industry: string
}

export interface Settings {
  activeCompanyId: string
  companies: Company[]
  userName: string
  userTitle: string
  currency: 'USD' | 'EUR' | 'GBP' | 'INR'
}

export type LocationType = 'HQ' | 'Onshore' | 'Nearshore' | 'GCC Hub'

export interface Location {
  id: string
  companyId: string
  name: string
  type: LocationType
  /** fully loaded cost relative to HQ (1.0) */
  costIndex: number
  /** planned seat capacity (0 = unconstrained) */
  capacity: number
  timezone: string
  notes: string
}

/** Target FTE per location for one entity, designed in the Footprint Designer */
export interface TargetAllocation {
  entityId: string
  allocation: Record<string, number>
  targetModel: string
  notes: string
}

export type RecKey = 'GCC Capability Hub' | 'Early Transition Candidate' | 'Retain at HQ / Hybrid' | 'Optimise in Place'

export interface Scenario {
  id: string
  companyId: string
  name: string
  description: string
  isBaseline: boolean
  targetLocationId: string
  /** % of FTE moved to the target hub, per recommendation */
  movePct: Record<RecKey, number>
  transitionCostPerFte: number
  rampYears: number
  productivityDipPct: number
  overheadPct: number
  horizonYears: number
  createdAt: string
}

export type TransitionStatus = 'Not Started' | 'Planning' | 'Knowledge Transfer' | 'Parallel Run' | 'Steady State'

export interface Wave {
  id: string
  companyId: string
  name: string
  /** YYYY-MM */
  startMonth: string
  durationMonths: number
  description: string
}

export interface TransitionItem {
  entityId: string
  waveId: string | null
  status: TransitionStatus
  offsetMonths: number
  durationMonths: number
  owner: string
  notes: string
}

export interface AppState {
  settings: Settings
  entities: Entity[]
  locations: Location[]
  allocations: TargetAllocation[]
  scenarios: Scenario[]
  waves: Wave[]
  transitions: TransitionItem[]
}
