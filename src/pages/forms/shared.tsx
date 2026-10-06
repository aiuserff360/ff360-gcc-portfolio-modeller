import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { useApp, newId } from '../../store/AppContext'
import type { Entity, EntityType } from '../../types'
import { ENTITY_META } from '../../data/options'
import { emptyAssessment } from '../../lib/scoring'

export type Errors = Record<string, string>

export function useEntityForm<T extends Entity>(type: EntityType, blank: (companyId: string) => T) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getEntity, upsertEntity, notify, activeCompany } = useApp()
  const existing = id ? (getEntity(id) as T | undefined) : undefined
  const [draft, setDraft] = useState<T>(() => existing ?? blank(activeCompany.id))
  const [errors, setErrors] = useState<Errors>({})
  const [showErrors, setShowErrors] = useState(false)
  const notFound = !!id && !existing

  const set = <K extends keyof T>(k: K, v: T[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const patch = (p: Partial<T>) => setDraft((d) => ({ ...d, ...p }))

  function saveDraft(validate: (d: T) => Errors) {
    const errs = validate(draft)
    if (!draft.name.trim()) {
      setErrors({ name: 'Name is required' })
      setShowErrors(true)
      notify('Please enter a name before saving', 'error')
      return
    }
    setErrors(errs)
    upsertEntity(draft)
    notify('Saved as draft')
    if (!id) navigate(`/${ENTITY_META[type].route}/${draft.id}`, { replace: true })
  }

  function next(validate: (d: T) => Errors) {
    const errs = validate(draft)
    setErrors(errs)
    setShowErrors(true)
    if (Object.keys(errs).length) {
      notify(`Please complete ${Object.keys(errs).length} required field${Object.keys(errs).length > 1 ? 's' : ''}`, 'error')
      setTimeout(() => document.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }
    upsertEntity(draft)
    notify('Details saved')
    navigate(`/assessment/${draft.id}`)
  }

  const err = (k: string) => (showErrors ? errors[k] : undefined)
  const inv = (k: string) => showErrors && !!errors[k]

  return { draft, set, patch, saveDraft, next, err, inv, isNew: !id, notFound, navigate }
}

export function baseBlank(type: EntityType, companyId: string) {
  const now = new Date().toISOString()
  return {
    id: newId(type), type, companyId, name: '', code: '', businessFunction: 'IT', capability: '', subCapability: '', description: '', rationale: '',
    locations: [] as string[], deliveryModel: '', provider: '', headcount: 0, annualSpend: 0, createdAt: now, updatedAt: now, assessment: emptyAssessment(),
  }
}

export function FormShell({ type, title, subtitle, onSave, onNext, children, aside, backTo }: { type: EntityType; title: string; subtitle: string; onSave: () => void; onNext: () => void; children: ReactNode; aside?: ReactNode; backTo?: string }) {
  const meta = ENTITY_META[type]
  return (
    <div>
      <div className="page-head">
        <div>
          <Link to={backTo ?? `/${meta.route}`} className="back-link"><ArrowLeft size={16} /> Back to {backTo ? 'Portfolio' : meta.plural}</Link>
          <h1 className="page-title">{title}</h1>
          <div className="page-sub">{subtitle}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onSave}><Save /> Save as Draft</button>
          <button className="btn btn-primary" onClick={onNext}>Next: Go to Assessment <ArrowRight /></button>
        </div>
      </div>
      {aside ? (
        <div className="layout-2col">
          <div className="stack">{children}</div>
          <div className="aside">{aside}</div>
        </div>
      ) : (
        <div className="stack">{children}</div>
      )}
    </div>
  )
}

export function NotFound({ type }: { type: EntityType }) {
  const meta = ENTITY_META[type]
  return (
    <div className="card card-pad">
      <h2 style={{ marginBottom: 8 }}>{meta.singular} not found</h2>
      <p className="muted">This item may have been deleted or belongs to a different company.</p>
      <Link to={`/${meta.route}`} className="btn">Back to {meta.plural}</Link>
    </div>
  )
}

export function TipsCard({ title = 'Tips for Good Inputs', tips }: { title?: string; tips: string[] }) {
  return (
    <div className="aside-card blue">
      <h4><LightbulbIcon /> {title}</h4>
      <ul>{tips.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  )
}

function LightbulbIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
}

export const required = (v: unknown) => (typeof v === 'string' ? !v.trim() : Array.isArray(v) ? v.filter((x) => typeof x !== 'string' || x.trim()).length === 0 : typeof v === 'number' ? !(v > 0) : !v)
