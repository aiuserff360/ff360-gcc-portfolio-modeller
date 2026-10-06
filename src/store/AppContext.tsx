import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, Entity, Settings, EntityType, CriterionResponse, Location, TargetAllocation, Scenario, Wave, TransitionItem } from '../types'
import { seedState } from '../data/seed'

const STORAGE_KEY = 'gcc-modeller-state-v1'

interface Toast { id: number; message: string; kind: 'success' | 'info' | 'error' }

interface Ctx {
  state: AppState
  entities: Entity[] // scoped to the active company
  locations: Location[]
  allocations: TargetAllocation[]
  scenarios: Scenario[]
  waves: Wave[]
  transitions: TransitionItem[]
  settings: Settings
  activeCompany: Settings['companies'][number]
  upsertLocation: (l: Location) => void
  deleteLocation: (id: string) => void
  setAllocation: (a: TargetAllocation) => void
  setAllocations: (list: TargetAllocation[]) => void
  clearAllocation: (entityId: string) => void
  upsertScenario: (s: Scenario) => void
  deleteScenario: (id: string) => void
  setBaselineScenario: (id: string) => void
  upsertWave: (w: Wave) => void
  deleteWave: (id: string) => void
  setTransition: (t: TransitionItem) => void
  setTransitions: (list: TransitionItem[]) => void
  upsertEntity: (e: Entity) => void
  deleteEntity: (id: string) => void
  duplicateEntity: (id: string) => Entity | undefined
  getEntity: (id: string) => Entity | undefined
  setResponse: (id: string, sectionId: string, criterionId: string, patch: Partial<CriterionResponse>) => void
  submitAssessment: (id: string, notes: string) => void
  reopenAssessment: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetToSample: () => void
  clearAll: () => void
  importState: (s: AppState) => void
  toasts: Toast[]
  notify: (message: string, kind?: Toast['kind']) => void
}

const AppCtx = createContext<Ctx | null>(null)

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      if (parsed && parsed.settings && Array.isArray(parsed.entities)) {
        return {
          settings: parsed.settings,
          entities: parsed.entities,
          locations: parsed.locations ?? seedState.locations,
          allocations: parsed.allocations ?? [],
          scenarios: parsed.scenarios ?? seedState.scenarios,
          waves: parsed.waves ?? seedState.waves,
          transitions: parsed.transitions ?? seedState.transitions,
        }
      }
    }
  } catch {
    /* ignore */
  }
  return seedState
}

export function newId(type: EntityType) {
  return `${type.slice(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const notify = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const upsertEntity = useCallback((e: Entity) => {
    setState((s) => {
      const exists = s.entities.some((x) => x.id === e.id)
      const updated = { ...e, updatedAt: new Date().toISOString() }
      return { ...s, entities: exists ? s.entities.map((x) => (x.id === e.id ? updated : x)) : [...s.entities, updated] }
    })
  }, [])

  const deleteEntity = useCallback((id: string) => {
    setState((s) => ({ ...s, entities: s.entities.filter((x) => x.id !== id), allocations: s.allocations.filter((a) => a.entityId !== id), transitions: s.transitions.filter((t) => t.entityId !== id) }))
  }, [])

  const upsertLocation = useCallback((l: Location) => setState((s) => ({ ...s, locations: s.locations.some((x) => x.id === l.id) ? s.locations.map((x) => (x.id === l.id ? l : x)) : [...s.locations, l] })), [])
  const deleteLocation = useCallback((id: string) => setState((s) => ({
    ...s,
    locations: s.locations.filter((x) => x.id !== id),
    allocations: s.allocations.map((a) => { const alloc = { ...a.allocation }; delete alloc[id]; return { ...a, allocation: alloc } }),
    scenarios: s.scenarios.map((sc) => (sc.targetLocationId === id ? { ...sc, targetLocationId: '' } : sc)),
  })), [])
  const setAllocation = useCallback((a: TargetAllocation) => setState((s) => ({ ...s, allocations: s.allocations.some((x) => x.entityId === a.entityId) ? s.allocations.map((x) => (x.entityId === a.entityId ? a : x)) : [...s.allocations, a] })), [])
  const setAllocations = useCallback((list: TargetAllocation[]) => setState((s) => { const ids = new Set(list.map((a) => a.entityId)); return { ...s, allocations: [...s.allocations.filter((a) => !ids.has(a.entityId)), ...list] } }), [])
  const clearAllocation = useCallback((entityId: string) => setState((s) => ({ ...s, allocations: s.allocations.filter((a) => a.entityId !== entityId) })), [])
  const upsertScenario = useCallback((sc: Scenario) => setState((s) => ({ ...s, scenarios: s.scenarios.some((x) => x.id === sc.id) ? s.scenarios.map((x) => (x.id === sc.id ? sc : x)) : [...s.scenarios, sc] })), [])
  const deleteScenario = useCallback((id: string) => setState((s) => ({ ...s, scenarios: s.scenarios.filter((x) => x.id !== id) })), [])
  const setBaselineScenario = useCallback((id: string) => setState((s) => { const target = s.scenarios.find((x) => x.id === id); return { ...s, scenarios: s.scenarios.map((x) => (x.companyId === target?.companyId ? { ...x, isBaseline: x.id === id } : x)) } }), [])
  const upsertWave = useCallback((w: Wave) => setState((s) => ({ ...s, waves: s.waves.some((x) => x.id === w.id) ? s.waves.map((x) => (x.id === w.id ? w : x)) : [...s.waves, w] })), [])
  const deleteWave = useCallback((id: string) => setState((s) => ({ ...s, waves: s.waves.filter((x) => x.id !== id), transitions: s.transitions.map((t) => (t.waveId === id ? { ...t, waveId: null } : t)) })), [])
  const setTransition = useCallback((t: TransitionItem) => setState((s) => ({ ...s, transitions: s.transitions.some((x) => x.entityId === t.entityId) ? s.transitions.map((x) => (x.entityId === t.entityId ? t : x)) : [...s.transitions, t] })), [])
  const setTransitions = useCallback((list: TransitionItem[]) => setState((s) => { const ids = new Set(list.map((t) => t.entityId)); return { ...s, transitions: [...s.transitions.filter((t) => !ids.has(t.entityId)), ...list] } }), [])

  const duplicateEntity = useCallback(
    (id: string) => {
      const src = state.entities.find((x) => x.id === id)
      if (!src) return undefined
      const copy: Entity = { ...src, id: newId(src.type), name: `${src.name} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), assessment: { responses: {}, submitted: false } }
      setState((s) => ({ ...s, entities: [...s.entities, copy] }))
      return copy
    },
    [state.entities],
  )

  const getEntity = useCallback((id: string) => state.entities.find((x) => x.id === id), [state.entities])

  const setResponse = useCallback((id: string, sectionId: string, criterionId: string, patch: Partial<CriterionResponse>) => {
    setState((s) => ({
      ...s,
      entities: s.entities.map((e) => {
        if (e.id !== id) return e
        const sec = { ...(e.assessment.responses[sectionId] ?? {}) }
        const prev = sec[criterionId] ?? { rating: null, rationale: '' }
        sec[criterionId] = { ...prev, ...patch }
        return { ...e, updatedAt: new Date().toISOString(), assessment: { ...e.assessment, responses: { ...e.assessment.responses, [sectionId]: sec } } }
      }),
    }))
  }, [])

  const submitAssessment = useCallback((id: string, notes: string) => {
    setState((s) => ({
      ...s,
      entities: s.entities.map((e) => (e.id === id ? { ...e, updatedAt: new Date().toISOString(), assessment: { ...e.assessment, submitted: true, submittedAt: new Date().toISOString(), reviewNotes: notes } } : e)),
    }))
  }, [])

  const reopenAssessment = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      entities: s.entities.map((e) => (e.id === id ? { ...e, assessment: { ...e.assessment, submitted: false, submittedAt: undefined } } : e)),
    }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const resetToSample = useCallback(() => setState(seedState), [])
  const clearAll = useCallback(() => setState((s) => ({ ...s, entities: [], allocations: [], transitions: [] })), [])
  const importState = useCallback((incoming: AppState) => setState({ settings: incoming.settings, entities: incoming.entities, locations: incoming.locations ?? seedState.locations, allocations: incoming.allocations ?? [], scenarios: incoming.scenarios ?? [], waves: incoming.waves ?? [], transitions: incoming.transitions ?? [] }), [])

  const value = useMemo<Ctx>(() => {
    const activeCompany = state.settings.companies.find((c) => c.id === state.settings.activeCompanyId) ?? state.settings.companies[0]
    const entities = state.entities.filter((e) => e.companyId === activeCompany?.id)
    const ids = new Set(entities.map((e) => e.id))
    return {
      state,
      settings: state.settings,
      activeCompany,
      entities,
      locations: state.locations.filter((l) => l.companyId === activeCompany?.id),
      allocations: state.allocations.filter((a) => ids.has(a.entityId)),
      scenarios: state.scenarios.filter((s) => s.companyId === activeCompany?.id),
      waves: state.waves.filter((w) => w.companyId === activeCompany?.id),
      transitions: state.transitions.filter((t) => ids.has(t.entityId)),
      upsertEntity, deleteEntity, duplicateEntity, getEntity, setResponse, submitAssessment, reopenAssessment, updateSettings, resetToSample, clearAll, importState,
      upsertLocation, deleteLocation, setAllocation, setAllocations, clearAllocation, upsertScenario, deleteScenario, setBaselineScenario, upsertWave, deleteWave, setTransition, setTransitions,
      toasts, notify,
    }
  }, [state, toasts, upsertEntity, deleteEntity, duplicateEntity, getEntity, setResponse, submitAssessment, reopenAssessment, updateSettings, resetToSample, clearAll, importState, upsertLocation, deleteLocation, setAllocation, setAllocations, clearAllocation, upsertScenario, deleteScenario, setBaselineScenario, upsertWave, deleteWave, setTransition, setTransitions, notify])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
