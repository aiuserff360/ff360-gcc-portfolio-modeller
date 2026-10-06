import type { EntityType, Rating } from '../types'

export type Accent = 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'slate' | 'teal' | 'pink'

export interface Criterion {
  id: string
  title: string
  question: string
  icon: string
  accent: Accent
  /** Whether a high rating makes the work MORE suitable for a GCC (true) or LESS suitable (false). */
  favourable: boolean
}

export interface Section {
  id: string
  number: number
  title: string
  subtitle: string
  /** polarity used in scoring: 'value' contributes to strategic value; 'feasibility' to GCC feasibility */
  axis: 'value' | 'feasibility'
  criteria: Record<EntityType, Criterion[]>
}

export const RATINGS: Rating[] = ['Low', 'Medium', 'High', 'Very High']
export const RATING_SCORE: Record<Rating, number> = { Low: 1, Medium: 2, High: 3, 'Very High': 4 }

const subj: Record<EntityType, string> = {
  project: 'this work',
  application: 'this application',
  role: 'this role',
  workforce: 'this team',
}

function forAll(make: (s: string, t: EntityType) => Criterion[]): Record<EntityType, Criterion[]> {
  return {
    project: make(subj.project, 'project'),
    application: make(subj.application, 'application'),
    role: make(subj.role, 'role'),
    workforce: make(subj.workforce, 'workforce'),
  }
}

export const SECTIONS: Section[] = [
  {
    id: 'strategic',
    number: 1,
    title: 'Strategic Relevance and Complexity',
    subtitle: 'How important and complex is {subject} for the global enterprise, from an HQ perspective?',
    axis: 'value',
    criteria: forAll((s, t) => {
      if (t === 'project' || t === 'application') {
        return [
          { id: 'importance', title: 'Strategic Importance', question: `How critical is ${s} to the company's overall strategy, growth and competitiveness?`, icon: 'Target', accent: 'blue', favourable: false },
          { id: 'differentiation', title: 'Differentiation', question: `Does ${s} create a material competitive advantage or is it largely non-differentiating?`, icon: 'Gem', accent: 'green', favourable: false },
          { id: 'complexity', title: t === 'project' ? 'Business Complexity' : 'Technical Complexity', question: t === 'project' ? 'How complex are the processes, integrations, data and technology involved?' : 'How complex is the architecture, customisation, integration and data landscape of this application?', icon: 'Settings', accent: 'purple', favourable: false },
          { id: 'interdependencies', title: 'Enterprise Interdependencies', question: `How interdependent is ${s} with other business functions, applications or global initiatives?`, icon: 'Network', accent: 'amber', favourable: false },
          { id: 'changeImpact', title: 'Change Impact', question: `What is the potential impact on people, processes and business operations if ${s} is moved or transformed?`, icon: 'BarChart3', accent: 'red', favourable: false },
          { id: 'ip', title: 'IP and Proprietary Knowledge', question: `Does ${s} involve proprietary IP, core product knowledge or sensitive business information?`, icon: 'Lightbulb', accent: 'purple', favourable: false },
          { id: 'visibility', title: 'Leadership and Stakeholder Visibility', question: `How visible is ${s} to executive leadership and key global stakeholders?`, icon: 'Network', accent: 'slate', favourable: false },
        ]
      }
      if (t === 'role') {
        return [
          { id: 'importance', title: 'Strategic Importance', question: "How critical is this role to the company's overall strategy, growth and competitiveness?", icon: 'Target', accent: 'blue', favourable: false },
          { id: 'complexity', title: 'Role Complexity', question: 'Does this role require deep technical, functional or domain expertise to perform effectively?', icon: 'Settings', accent: 'purple', favourable: false },
          { id: 'differentiation', title: 'Differentiation', question: 'Does this role create a material competitive advantage or is it standardized/commoditized?', icon: 'Lightbulb', accent: 'amber', favourable: false },
          { id: 'interdependencies', title: 'Enterprise Interdependencies', question: 'How interdependent is this role with other functions, applications or global initiatives?', icon: 'Share2', accent: 'green', favourable: false },
          { id: 'ip', title: 'Proprietary Knowledge', question: 'Does this role involve proprietary IP, core product knowledge or sensitive business information?', icon: 'Database', accent: 'red', favourable: false },
        ]
      }
      return [
        { id: 'importance', title: 'Strategic Importance', question: "How critical is this team to the company's overall strategy, growth and competitiveness?", icon: 'Target', accent: 'blue', favourable: false },
        { id: 'complexity', title: 'Team Complexity', question: 'Does this team handle complex processes, diverse technologies or require deep domain expertise?', icon: 'Settings', accent: 'purple', favourable: false },
        { id: 'differentiation', title: 'Differentiation', question: 'Does this team create a material competitive advantage or is it standardized/commoditized?', icon: 'Lightbulb', accent: 'amber', favourable: false },
        { id: 'interdependencies', title: 'Enterprise Interdependencies', question: 'How interdependent is this team with other functions, applications or global initiatives?', icon: 'Share2', accent: 'green', favourable: false },
        { id: 'ip', title: 'Proprietary Knowledge', question: 'Does this team manage proprietary IP, sensitive business information or unique process knowledge?', icon: 'Database', accent: 'red', favourable: false },
        { id: 'leadership', title: 'Leadership & Decision Making', question: 'To what extent does this team drive decisions, set standards or influence enterprise-wide outcomes?', icon: 'Users', accent: 'teal', favourable: false },
      ]
    }),
  },
  {
    id: 'proximity',
    number: 2,
    title: 'Business Proximity',
    subtitle: 'Assess how close {subject} is to business stakeholders and customers from an HQ perspective.',
    axis: 'feasibility',
    criteria: forAll((s) => [
      { id: 'stakeholder', title: 'Stakeholder Interaction', question: `How much direct interaction does ${s} have with global business stakeholders, executives or end users?`, icon: 'Users', accent: 'blue', favourable: false },
      { id: 'customer', title: 'Customer Proximity', question: `How closely does ${s} work with external customers, partners or market-facing teams?`, icon: 'Handshake', accent: 'green', favourable: false },
      { id: 'domain', title: 'Business Domain Knowledge', question: `How important is deep understanding of the business domain, industry context or market dynamics for ${s}?`, icon: 'BarChart3', accent: 'purple', favourable: false },
      { id: 'onsite', title: 'Physical / On-site Dependency', question: `Does ${s} require physical presence at customer sites, plants, retail locations or other facilities (e.g. for workshops, go-lives, support)?`, icon: 'Globe', accent: 'amber', favourable: false },
      { id: 'timezone', title: 'Time Zone Dependencies', question: `How critical is real-time or significant time zone overlap with global stakeholders, customers or business teams for ${s}?`, icon: 'Clock', accent: 'red', favourable: false },
    ]),
  },
  {
    id: 'delivery',
    number: 3,
    title: 'Delivery Characteristics',
    subtitle: 'Evaluate how {subject} is delivered today and how transferable the work is.',
    axis: 'feasibility',
    criteria: forAll((s) => [
      { id: 'documentation', title: 'Process Maturity & Documentation', question: `How well defined, documented and repeatable are the processes and procedures behind ${s}?`, icon: 'FileText', accent: 'blue', favourable: true },
      { id: 'standardisation', title: 'Standardisation & Repeatability', question: `To what extent is ${s} standardised, rules-based and repeatable rather than ad-hoc or judgement-driven?`, icon: 'LayoutGrid', accent: 'green', favourable: true },
      { id: 'automation', title: 'Tooling & Automation Readiness', question: `How well supported is ${s} by modern tooling, workflow platforms and automation?`, icon: 'Cpu', accent: 'purple', favourable: true },
      { id: 'knowledge', title: 'Knowledge Transfer Feasibility', question: `How feasible is it to transfer the knowledge required for ${s} through structured training and shadowing?`, icon: 'GraduationCap', accent: 'teal', favourable: true },
      { id: 'performance', title: 'Current Delivery Performance', question: `How stable and well performing is the current delivery of ${s} (SLAs, quality, backlog)?`, icon: 'Gauge', accent: 'amber', favourable: true },
    ]),
  },
  {
    id: 'risk',
    number: 4,
    title: 'Risk and Compliance',
    subtitle: 'Identify regulatory, security and continuity constraints that affect where {subject} can be delivered.',
    axis: 'feasibility',
    criteria: forAll((s) => [
      { id: 'regulatory', title: 'Regulatory / Compliance Exposure', question: `How exposed is ${s} to regulatory, licensing or jurisdictional constraints (e.g. export control, financial regulation)?`, icon: 'Scale', accent: 'red', favourable: false },
      { id: 'data', title: 'Data Privacy & Security Sensitivity', question: `How sensitive is the data handled by ${s} (PII, financial, trade secrets) and how strict are the access controls?`, icon: 'ShieldCheck', accent: 'blue', favourable: false },
      { id: 'continuity', title: 'Business Continuity Risk', question: `What is the operational impact if ${s} is disrupted during a transition or outage?`, icon: 'AlertTriangle', accent: 'amber', favourable: false },
      { id: 'contractual', title: 'Vendor / Contractual Constraints', question: `Are there vendor contracts, licensing terms or works-council agreements that constrain changes to ${s}?`, icon: 'FileSignature', accent: 'purple', favourable: false },
      { id: 'transition', title: 'Transition Risk', question: `How risky is the transition of ${s} considering attrition, knowledge loss and parallel-run requirements?`, icon: 'Route', accent: 'slate', favourable: false },
    ]),
  },
  {
    id: 'economic',
    number: 5,
    title: 'Economic Considerations',
    subtitle: 'Assess the cost base and the economic case for delivering {subject} differently.',
    axis: 'feasibility',
    criteria: forAll((s) => [
      { id: 'costBase', title: 'Cost Base Significance', question: `How significant is the current cost of ${s} relative to the function's total spend?`, icon: 'Wallet', accent: 'blue', favourable: true },
      { id: 'savings', title: 'Cost Reduction Potential', question: `What is the potential for cost reduction or cost avoidance through an alternative delivery model for ${s}?`, icon: 'TrendingDown', accent: 'green', favourable: true },
      { id: 'investment', title: 'Investment Required', question: `How much one-time investment (transition, tooling, parallel run) would be required to move ${s}?`, icon: 'Coins', accent: 'amber', favourable: false },
      { id: 'scalability', title: 'Scalability / Growth Outlook', question: `Is demand for ${s} expected to grow, requiring a scalable talent pool and delivery capacity?`, icon: 'TrendingUp', accent: 'purple', favourable: true },
      { id: 'timeline', title: 'Value Realisation Timeline', question: `How quickly could benefits be realised once ${s} is transitioned?`, icon: 'Timer', accent: 'teal', favourable: true },
    ]),
  },
]

export const REVIEW_SECTION = { id: 'review', number: 6, title: 'Review & Submit' }

export function sectionSubtitle(section: Section, type: EntityType) {
  return section.subtitle.replace('{subject}', subj[type])
}

export const RATING_GUIDE: { rating: Rating; text: string }[] = [
  { rating: 'Low', text: 'Minimal importance or complexity from HQ perspective.' },
  { rating: 'Medium', text: 'Moderate importance or complexity.' },
  { rating: 'High', text: 'Significant importance or complexity.' },
  { rating: 'Very High', text: 'Mission critical or highly complex for the global enterprise.' },
]
