import type { Entity, Location, TargetAllocation, Scenario, RecKey, Wave, TransitionItem } from '../types'
import { scoreEntity, type Recommendation } from './scoring'

export const REC_KEYS: RecKey[] = ['GCC Capability Hub', 'Early Transition Candidate', 'Retain at HQ / Hybrid', 'Optimise in Place']

export function costPerFte(e: Entity): number {
  if (e.headcount > 0 && e.annualSpend > 0) return e.annualSpend / e.headcount
  if ('costPerFte' in e && e.costPerFte > 0) return e.costPerFte
  return 0
}

export function findLocation(locations: Location[], name: string): Location | undefined {
  const n = name.trim().toLowerCase()
  return locations.find((l) => l.name.toLowerCase() === n || l.id.toLowerCase().endsWith(`-${n}`))
}

export function hqLocation(locations: Location[]): Location | undefined {
  return locations.find((l) => l.type === 'HQ') ?? locations[0]
}

/** Current FTE by location id, derived from the capture data. Unknown locations fall back to HQ. */
export function currentFteByLocation(e: Entity, locations: Location[]): Record<string, number> {
  const out: Record<string, number> = {}
  const hq = hqLocation(locations)
  const add = (name: string, n: number) => {
    if (n <= 0) return
    const l = findLocation(locations, name) ?? hq
    if (!l) return
    out[l.id] = (out[l.id] ?? 0) + n
  }
  if (e.type === 'workforce' && Object.values(e.fteByLocation).some((v) => v > 0)) {
    const total = Object.values(e.fteByLocation).reduce((a, b) => a + b, 0)
    const scale = e.headcount > 0 ? e.headcount / total : 1
    Object.entries(e.fteByLocation).forEach(([name, n]) => add(name, n * scale))
  } else if (e.locations.length) {
    e.locations.forEach((name) => add(name, e.headcount / e.locations.length))
  } else if (hq) {
    out[hq.id] = e.headcount
  }
  return out
}

export function blendedIndex(fte: Record<string, number>, locations: Location[]): number {
  let total = 0, weighted = 0
  for (const [id, n] of Object.entries(fte)) {
    const l = locations.find((x) => x.id === id)
    if (!l || n <= 0) continue
    total += n
    weighted += n * l.costIndex
  }
  return total ? weighted / total : 1
}

export interface FootprintRow {
  entity: Entity
  recommendation: Recommendation
  current: Record<string, number>
  target: Record<string, number>
  currentIndex: number
  targetIndex: number
  currentCost: number
  targetCost: number
  savings: number
  /** FTE that leave their current location */
  movedFte: number
  /** FTE landing in GCC Hub / Nearshore locations beyond today's level */
  toHubs: number
  totalTarget: number
  allocated: boolean
  allocation?: TargetAllocation
}

export function computeFootprint(entities: Entity[], locations: Location[], allocations: TargetAllocation[]): FootprintRow[] {
  return entities.map((e) => {
    const current = currentFteByLocation(e, locations)
    const allocation = allocations.find((a) => a.entityId === e.id)
    const target = allocation ? { ...allocation.allocation } : { ...current }
    const cpf = costPerFte(e)
    const currentIndex = blendedIndex(current, locations)
    const totalTarget = Object.values(target).reduce((a, b) => a + (b || 0), 0)
    const targetIndex = blendedIndex(target, locations)
    const currentCost = e.annualSpend
    // cost at the target location = HQ-equivalent cost × that location's index
    const hqEquivalent = currentIndex > 0 ? cpf / currentIndex : cpf
    const targetCost = Object.entries(target).reduce((sum, [id, n]) => { const l = locations.find((x) => x.id === id); return sum + (l ? n * hqEquivalent * l.costIndex : 0) }, 0)
    let movedFte = 0, toHubs = 0
    const ids = new Set([...Object.keys(current), ...Object.keys(target)])
    ids.forEach((id) => {
      const delta = (target[id] ?? 0) - (current[id] ?? 0)
      if (delta < 0) movedFte += -delta
      const l = locations.find((x) => x.id === id)
      if (delta > 0 && l && (l.type === 'GCC Hub' || l.type === 'Nearshore')) toHubs += delta
    })
    return { entity: e, recommendation: scoreEntity(e).recommendation, current, target, currentIndex, targetIndex, currentCost, targetCost, savings: allocation ? currentCost - targetCost : 0, movedFte, toHubs, totalTarget, allocated: !!allocation, allocation }
  })
}

/** Suggest a target allocation from the recommendation and a scenario's move percentages. */
export function suggestAllocation(e: Entity, locations: Location[], scenario: Scenario | undefined, fallbackHubId?: string): TargetAllocation {
  const rec = scoreEntity(e).recommendation
  const pct = scenario && rec !== 'Not Assessed' ? scenario.movePct[rec] : 0
  const hubId = scenario?.targetLocationId || fallbackHubId || locations.find((l) => l.type === 'GCC Hub')?.id || ''
  const current = currentFteByLocation(e, locations)
  const total = Object.values(current).reduce((a, b) => a + b, 0)
  const move = Math.round((total * pct) / 100)
  const target: Record<string, number> = {}
  let remaining = move
  // take FTE proportionally from non-hub locations
  const sources = Object.entries(current).filter(([id]) => id !== hubId)
  const sourceTotal = sources.reduce((a, [, n]) => a + n, 0)
  sources.forEach(([id, n], i) => {
    const take = i === sources.length - 1 ? remaining : Math.min(n, Math.round((n / (sourceTotal || 1)) * move))
    remaining -= take
    const keep = Math.round(n - take)
    if (keep > 0) target[id] = keep
  })
  const existingHub = current[hubId] ?? 0
  if (hubId && existingHub + move > 0) target[hubId] = Math.round(existingHub + move)
  // fix rounding drift
  const drift = total - Object.values(target).reduce((a, b) => a + b, 0)
  if (drift !== 0) { const k = hubId && target[hubId] !== undefined ? hubId : Object.keys(target)[0]; if (k) target[k] += drift }
  const targetModel = rec === 'GCC Capability Hub' ? 'In-house (100%)' : rec === 'Early Transition Candidate' ? 'In-house Led (80%)' : rec === 'Retain at HQ / Hybrid' ? 'Hybrid (50/50)' : e.deliveryModel
  return { entityId: e.id, allocation: target, targetModel, notes: '' }
}

export interface ScenarioYear { year: number; savings: number; cost: number; net: number; cumulative: number }
export interface ScenarioResult {
  scenario: Scenario
  target?: Location
  movedFte: number
  inScopeFte: number
  /** steady-state annual savings after overhead */
  annualSavings: number
  oneTimeCost: number
  years: ScenarioYear[]
  paybackMonths: number | null
  horizonNet: number
  roi: number
  byRec: Record<RecKey, { items: number; fte: number; moved: number; savings: number }>
}

export function computeScenario(entities: Entity[], locations: Location[], scenario: Scenario): ScenarioResult {
  const target = locations.find((l) => l.id === scenario.targetLocationId)
  const byRec = Object.fromEntries(REC_KEYS.map((k) => [k, { items: 0, fte: 0, moved: 0, savings: 0 }])) as ScenarioResult['byRec']
  let movedFte = 0, inScopeFte = 0, gross = 0
  for (const e of entities) {
    const rec = scoreEntity(e).recommendation
    if (rec === 'Not Assessed') continue
    const pct = scenario.movePct[rec] ?? 0
    const b = byRec[rec]
    b.items++
    b.fte += e.headcount
    inScopeFte += e.headcount
    if (!target || pct <= 0) continue
    const current = currentFteByLocation(e, locations)
    const currentIndex = blendedIndex(current, locations)
    const cpf = costPerFte(e)
    const hqEquivalent = currentIndex > 0 ? cpf / currentIndex : cpf
    const moved = (e.headcount * pct) / 100
    const perFteSaving = hqEquivalent * (currentIndex - target.costIndex)
    const saving = Math.max(0, moved * perFteSaving)
    movedFte += moved
    gross += saving
    b.moved += moved
    b.savings += saving
  }
  const annualSavings = gross * (1 - scenario.overheadPct / 100)
  const oneTimeCost = movedFte * scenario.transitionCostPerFte
  const years: ScenarioYear[] = []
  let cumulative = 0
  const ramp = Math.max(1, scenario.rampYears)
  for (let y = 1; y <= Math.max(1, scenario.horizonYears); y++) {
    const rampFactor = Math.min(1, y / ramp)
    const dip = y === 1 ? 1 - scenario.productivityDipPct / 100 : 1
    const savings = annualSavings * rampFactor * dip
    const cost = y <= Math.ceil(ramp) ? oneTimeCost / Math.ceil(ramp) : 0
    const net = savings - cost
    cumulative += net
    years.push({ year: y, savings, cost, net, cumulative })
  }
  // Payback: each year's transition cost is committed at the start of the year, savings accrue monthly
  let paybackMonths: number | null = null
  let running = 0
  outer: for (const y of years) {
    running -= y.cost
    for (let m = 1; m <= 12; m++) {
      running += y.savings / 12
      if (running >= 0 && y.savings > 0) { paybackMonths = (y.year - 1) * 12 + m; break outer }
    }
  }
  const horizonNet = cumulative
  return { scenario, target, movedFte, inScopeFte, annualSavings, oneTimeCost, years, paybackMonths, horizonNet, roi: oneTimeCost ? horizonNet / oneTimeCost : 0, byRec }
}

/* ---------- Transition timeline helpers ---------- */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
export function monthDiff(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  return (by - ay) * 12 + (bm - am)
}
export function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return `${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })} '${String(y).slice(2)}`
}
export function defaultDuration(e: Entity): number {
  return e.headcount <= 25 ? 4 : e.headcount <= 60 ? 6 : 9
}
export const STATUS_ORDER: TransitionItem['status'][] = ['Not Started', 'Planning', 'Knowledge Transfer', 'Parallel Run', 'Steady State']

export interface TimelineItem { entity: Entity; wave: Wave; item: TransitionItem; start: number; end: number; savings: number; movedFte: number }
export interface Timeline {
  origin: string
  months: string[]
  items: TimelineItem[]
  waves: { wave: Wave; start: number; end: number; items: TimelineItem[]; fte: number; savings: number }[]
  unassigned: Entity[]
}

export function computeTimeline(waves: Wave[], transitions: TransitionItem[], entities: Entity[], footprint: FootprintRow[]): Timeline {
  const sorted = [...waves].sort((a, b) => a.startMonth.localeCompare(b.startMonth))
  if (!sorted.length) return { origin: '', months: [], items: [], waves: [], unassigned: entities.filter((e) => scoreEntity(e).recommendation !== 'Not Assessed') }
  const origin = sorted[0].startMonth
  const items: TimelineItem[] = []
  for (const t of transitions) {
    const entity = entities.find((e) => e.id === t.entityId)
    const wave = t.waveId ? waves.find((w) => w.id === t.waveId) : undefined
    if (!entity || !wave) continue
    const start = monthDiff(origin, wave.startMonth) + t.offsetMonths
    const row = footprint.find((r) => r.entity.id === entity.id)
    items.push({ entity, wave, item: t, start, end: start + Math.max(1, t.durationMonths), savings: row?.savings ?? 0, movedFte: row?.movedFte ?? 0 })
  }
  const waveRows = sorted.map((wave) => {
    const start = monthDiff(origin, wave.startMonth)
    const wi = items.filter((i) => i.wave.id === wave.id).sort((a, b) => a.start - b.start)
    const end = Math.max(start + wave.durationMonths, ...wi.map((i) => i.end))
    return { wave, start, end, items: wi, fte: wi.reduce((a, i) => a + i.entity.headcount, 0), savings: wi.reduce((a, i) => a + i.savings, 0) }
  })
  const total = Math.max(12, ...waveRows.map((w) => w.end)) + 1
  const months = Array.from({ length: total }, (_, i) => addMonths(origin, i))
  const assigned = new Set(items.map((i) => i.entity.id))
  const unassigned = entities.filter((e) => !assigned.has(e.id) && scoreEntity(e).recommendation !== 'Not Assessed')
  return { origin, months, items, waves: waveRows, unassigned }
}

/** Auto-assign assessed items to waves by recommendation. */
export function autoPlan(entities: Entity[], waves: Wave[], existing: TransitionItem[]): TransitionItem[] {
  const sorted = [...waves].sort((a, b) => a.startMonth.localeCompare(b.startMonth))
  const pick = (i: number) => sorted[Math.min(i, sorted.length - 1)]?.id ?? null
  const out: TransitionItem[] = []
  const counters: Record<string, number> = {}
  for (const e of entities) {
    const rec = scoreEntity(e).recommendation
    if (rec === 'Not Assessed' || rec === 'Optimise in Place') continue
    const waveId = rec === 'Early Transition Candidate' ? pick(0) : rec === 'GCC Capability Hub' ? pick(1) : pick(2)
    const prev = existing.find((t) => t.entityId === e.id)
    const idx = waveId ? (counters[waveId] = (counters[waveId] ?? 0) + 1) - 1 : 0
    out.push({ entityId: e.id, waveId, status: prev?.status ?? 'Not Started', offsetMonths: idx, durationMonths: prev?.durationMonths ?? defaultDuration(e), owner: prev?.owner ?? ('businessOwner' in e ? e.businessOwner : 'reportingTo' in e ? e.reportingTo : ''), notes: prev?.notes ?? '' })
  }
  return out
}
