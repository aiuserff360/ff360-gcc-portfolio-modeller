import type { EntityType } from '../types'

export const BUSINESS_FUNCTIONS = ['IT', 'Finance', 'HR', 'Procurement', 'Supply Chain', 'Sales & Marketing', 'Operations', 'Legal & Compliance', 'R&D / Engineering', 'Customer Service']

export const CAPABILITIES: Record<string, string[]> = {
  IT: ['Enterprise Applications', 'Infrastructure & Cloud', 'Data & Analytics', 'Cybersecurity', 'Digital & Product Engineering', 'IT Service Management', 'Architecture & Governance'],
  Finance: ['Record to Report', 'Procure to Pay', 'Order to Cash', 'FP&A', 'Treasury', 'Tax'],
  HR: ['Talent Acquisition', 'HR Operations', 'Learning & Development', 'Compensation & Benefits', 'HR Analytics'],
  Procurement: ['Strategic Sourcing', 'Category Management', 'Procurement Operations', 'Supplier Management'],
  'Supply Chain': ['Planning', 'Logistics', 'Manufacturing Support', 'Inventory Management'],
  'Sales & Marketing': ['Sales Operations', 'Marketing Operations', 'Digital Marketing', 'Customer Insights'],
  Operations: ['Shared Services', 'Process Excellence', 'Quality', 'Facilities'],
  'Legal & Compliance': ['Contract Management', 'Regulatory Compliance', 'Legal Operations'],
  'R&D / Engineering': ['Product Development', 'Testing & Validation', 'Research'],
  'Customer Service': ['Contact Centre', 'Technical Support', 'Customer Success'],
}

export const SUB_CAPABILITIES: Record<string, string[]> = {
  'Enterprise Applications': ['SAP', 'Oracle', 'Salesforce', 'Workday', 'ServiceNow', 'Microsoft Dynamics', 'Custom Applications'],
  'Infrastructure & Cloud': ['Cloud Platforms', 'Network', 'End User Computing', 'Data Centre', 'Middleware'],
  'Data & Analytics': ['Data Engineering', 'BI & Reporting', 'Advanced Analytics', 'Data Governance'],
  Cybersecurity: ['Security Operations', 'Identity & Access', 'Governance Risk & Compliance', 'Application Security'],
  'Digital & Product Engineering': ['Web & Mobile', 'Platform Engineering', 'DevOps', 'QA & Testing'],
  'IT Service Management': ['Service Desk', 'Incident & Problem', 'Change & Release'],
  'Architecture & Governance': ['Enterprise Architecture', 'Portfolio Management', 'Vendor Management'],
}

export const LOCATIONS = ['US', 'UK', 'Germany', 'India', 'Canada', 'France', 'Netherlands', 'Singapore', 'Australia', 'Poland', 'Mexico', 'Brazil', 'Japan', 'China', 'Philippines']

export const DELIVERY_MODELS = ['In-house (100%)', 'In-house Led (80%)', 'Hybrid (50/50)', 'Provider Led (80%)', 'Fully Outsourced (100%)']

export const PROVIDERS = ['Accenture', 'TCS', 'Infosys', 'Wipro', 'Capgemini', 'IBM', 'Cognizant', 'HCL', 'Deloitte', 'DXC', 'None / In-house']

export const LIFECYCLE_STAGES = ['Ideate', 'Plan', 'Build', 'Transform', 'Run', 'Optimise', 'Retire']

export const DURATIONS = ['< 6 Months', '6 – 12 Months', '1 – 2 Years', '2 – 3 Years', '3 – 5 Years', '5+ Years', 'Ongoing']

export const BUSINESS_OWNERS = ['CEO', 'CFO', 'CIO', 'CTO', 'COO', 'CHRO', 'CPO', 'Head of Enterprise Applications', 'Head of Infrastructure', 'Head of Data & Analytics', 'Head of Finance Operations', 'Head of Procurement', 'VP Supply Chain']

export const APP_CATEGORIES = ['ERP', 'CRM', 'HCM', 'SCM', 'Other']
export const APP_TYPES = ['Commercial Off-the-Shelf', 'Custom Built', 'Hybrid']
export const DEPLOYMENT_MODELS = ['On-Premise (Current)', 'Private Cloud', 'Public Cloud (IaaS/PaaS)', 'SaaS', 'Hybrid']
export const HOSTING = ['On-Premise', 'Private Cloud', 'AWS', 'Azure', 'GCP', 'Vendor SaaS']
export const CRITICALITY = ['Low', 'Medium', 'High', 'Mission Critical']
export const DATA_RESIDENCY = ['Global', 'EU Only', 'US Only', 'UK Only', 'India Only', 'Country Specific']
export const LICENSE_MODELS = ['Perpetual', 'Subscription', 'Usage Based', 'Open Source', 'Enterprise Agreement']

export const ROLE_FAMILIES = ['Consulting', 'Engineering', 'Operations', 'Data & Analytics', 'Infrastructure', 'Security', 'Program Management', 'Other']
export const ROLE_LEVELS = ['Entry Level', 'Individual Contributor', 'Senior Individual Contributor', 'Team Lead', 'Manager', 'Senior Manager', 'Director']
export const EXPERIENCE = ['0 – 2 Years', '2 – 5 Years', '5 – 8 Years', '8 – 12 Years', '12+ Years']
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractor', 'Provider Staff']

export const TEAM_TYPES = ['Run / Operations', 'Change / Project', 'Support / Enabling']
export const ROLE_FAMILY_MIX_KEYS = ['Functional / Config', 'Development', 'Integration / Middleware', 'Basis / Infrastructure', 'Testing / QA', 'PMO / Management']
export const SENIORITY_KEYS = ['Junior (0–3 yrs)', 'Mid (4–8 yrs)', 'Senior (9–15 yrs)', 'Leadership (15+ yrs)']

export const ENTITY_META: Record<EntityType, { singular: string; plural: string; route: string; color: string }> = {
  project: { singular: 'Project', plural: 'Projects', route: 'projects', color: '#2a78d6' },
  application: { singular: 'Application', plural: 'Applications', route: 'applications', color: '#eb6834' },
  role: { singular: 'Role', plural: 'Roles', route: 'roles', color: '#1baf7a' },
  workforce: { singular: 'Workforce / Team', plural: 'Workforce', route: 'workforce', color: '#4a3aa7' },
}
