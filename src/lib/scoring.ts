import { RATING_SCORE, SECTIONS } from '../data/framework'
import type { Assessment, Entity } from '../types'

export interface SectionScore {
  sectionId: string
  title: string
  answered: number
  total: number
  /** mean raw rating 1..4 (undefined if nothing answered) */
  mean?: number
  /** mean favourability-adjusted score 1..4 */
  adjusted?: number
}

export type Recommendation =
  | 'GCC Capability Hub'
  | 'Early Transition Candidate'
  | 'Retain at HQ / Hybrid'
  | 'Optimise in Place'
  | 'Not Assessed'

export interface EntityScore {
  sections: SectionScore[]
  answered: number
  total: number
  completion: number
  /** 1..4 strategic value from HQ perspective */
  strategicValue?: number
  /** 1..4 GCC feasibility */
  feasibility?: number
  recommendation: Recommendation
}

export function emptyAssessment(): Assessment {
  return { responses: {}, submitted: false }
}

export function scoreEntity(entity: Entity): EntityScore {
  const sections: SectionScore[] = []
  let answered = 0
  let total = 0
  for (const section of SECTIONS) {
    const criteria = section.criteria[entity.type]
    const responses = entity.assessment.responses[section.id] ?? {}
    let raw = 0
    let adj = 0
    let n = 0
    for (const c of criteria) {
      const r = responses[c.id]
      if (r?.rating) {
        const s = RATING_SCORE[r.rating]
        raw += s
        adj += c.favourable ? s : 5 - s
        n++
      }
    }
    answered += n
    total += criteria.length
    sections.push({
      sectionId: section.id,
      title: section.title,
      answered: n,
      total: criteria.length,
      mean: n ? raw / n : undefined,
      adjusted: n ? adj / n : undefined,
    })
  }
  const value = sections[0].mean
  const feasSections = sections.slice(1).filter((s) => s.adjusted !== undefined)
  const feasibility = feasSections.length ? feasSections.reduce((a, s) => a + (s.adjusted ?? 0), 0) / feasSections.length : undefined
  let recommendation: Recommendation = 'Not Assessed'
  if (value !== undefined && feasibility !== undefined && answered === total) {
    const hiValue = value >= 2.5
    const hiFeas = feasibility >= 2.5
    recommendation = hiValue && hiFeas ? 'GCC Capability Hub' : !hiValue && hiFeas ? 'Early Transition Candidate' : hiValue && !hiFeas ? 'Retain at HQ / Hybrid' : 'Optimise in Place'
  }
  return { sections, answered, total, completion: total ? answered / total : 0, strategicValue: value, feasibility, recommendation }
}

export const RECOMMENDATION_META: Record<Recommendation, { color: string; description: string }> = {
  'GCC Capability Hub': { color: '#1baf7a', description: 'High strategic value and feasible to deliver from a GCC. Build a strategic capability hub with strong HQ governance.' },
  'Early Transition Candidate': { color: '#2a78d6', description: 'Standardised, lower-risk work that can transition early to realise quick wins and build momentum.' },
  'Retain at HQ / Hybrid': { color: '#eb6834', description: 'Strategically important but constrained by proximity, risk or complexity. Retain at HQ or explore a hybrid model.' },
  'Optimise in Place': { color: '#6b7280', description: 'Lower strategic value and limited feasibility today. Optimise the current delivery model before reconsidering.' },
  'Not Assessed': { color: '#9ca3af', description: 'Assessment is incomplete. Complete all sections to generate a recommendation.' },
}

export function formatMoney(v: number, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'
  if (v < 0) return `−${formatMoney(-v, currency)}`
  if (v >= 1_000_000_000) return `${sym}${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(0)}K`
  return `${sym}${v.toLocaleString()}`
}

export function formatMoneyFull(v: number, currency = 'USD') {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'
  return `${sym}${Math.round(v).toLocaleString()}`
}

export function entityStatus(entity: Entity): 'Draft' | 'In Assessment' | 'Assessed' {
  if (entity.assessment.submitted) return 'Assessed'
  const any = Object.values(entity.assessment.responses).some((sec) => Object.values(sec).some((r) => r.rating))
  return any ? 'In Assessment' : 'Draft'
}
