import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, X, Info, Check, AlertCircle, ChevronDown } from 'lucide-react'

/* ---------- Field wrappers ---------- */
export function Field({ label, required, help, error, children, hint, className }: { label?: string; required?: boolean; help?: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`field ${className ?? ''}`}>
      {label && (
        <label className="label">
          {label} {required && <span className="req">*</span>} {hint && <Info className="hint-icon" aria-label={hint} />}
        </label>
      )}
      {help && <div className="help">{help}</div>}
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, invalid, type = 'text', ...rest }: { value: string | number; onChange: (v: string) => void; placeholder?: string; invalid?: boolean; type?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return <input className={`input ${invalid ? 'invalid' : ''}`} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...rest} />
}

export function NumberInput({ value, onChange, invalid, ...rest }: { value: number; onChange: (v: number) => void; invalid?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [text, setText] = useState(value ? value.toLocaleString() : '')
  useEffect(() => {
    const parsed = Number(text.replace(/[^0-9.]/g, ''))
    if (parsed !== value) setText(value ? value.toLocaleString() : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      className={`input mono ${invalid ? 'invalid' : ''}`}
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value.replace(/[^0-9.]/g, ''))
        onChange(isNaN(n) ? 0 : n)
      }}
      onBlur={() => setText(value ? value.toLocaleString() : '')}
      {...rest}
    />
  )
}

/** Money input that accepts shorthand like 8.4M, 120K, 7,200,000 */
export function MoneyInput({ value, onChange, invalid, currency = 'USD' }: { value: number; onChange: (v: number) => void; invalid?: boolean; currency?: string }) {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'
  const fmt = (v: number) => (v >= 1_000_000 ? `${sym}${+(v / 1_000_000).toFixed(2)}M` : v >= 1000 ? `${sym}${+(v / 1000).toFixed(1)}K` : v ? `${sym}${v}` : '')
  const [text, setText] = useState(fmt(value))
  useEffect(() => {
    if (parse(text) !== value) setText(fmt(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  function parse(t: string) {
    const m = t.replace(/[^0-9.kKmMbB]/g, '')
    const num = parseFloat(m)
    if (isNaN(num)) return 0
    if (/[bB]/.test(m)) return Math.round(num * 1_000_000_000)
    if (/[mM]/.test(m)) return Math.round(num * 1_000_000)
    if (/[kK]/.test(m)) return Math.round(num * 1000)
    return Math.round(num)
  }
  return <input className={`input mono ${invalid ? 'invalid' : ''}`} value={text} placeholder={`${sym}0`} onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value)) }} onBlur={() => setText(fmt(value))} />
}

export function Select({ value, onChange, options, placeholder, invalid, allowEmpty = true }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; invalid?: boolean; allowEmpty?: boolean }) {
  return (
    <select className={`select ${invalid ? 'invalid' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {(allowEmpty || !value) && <option value="">{placeholder ?? 'Select…'}</option>}
      {!options.includes(value) && value && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

export function TextArea({ value, onChange, placeholder, max = 500, invalid, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; max?: number; invalid?: boolean; rows?: number }) {
  return (
    <div className="textarea-wrap">
      <textarea className={`textarea ${invalid ? 'invalid' : ''}`} value={value} rows={rows} placeholder={placeholder} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      <span className="counter">{value.length} / {max}</span>
    </div>
  )
}

export function Segmented({ value, onChange, options, full, size, disabled }: { value: string; onChange: (v: string) => void; options: string[]; full?: boolean; size?: 'sm'; disabled?: boolean }) {
  return (
    <div className={`seg ${full ? 'full' : ''} ${size ?? ''}`}>
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? 'on' : ''} onClick={() => onChange(o)} disabled={disabled}>{o}</button>
      ))}
    </div>
  )
}

export function RadioRow({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: string[]; name: string }) {
  return (
    <div className="radio-row">
      {options.map((o) => (
        <label key={o}><input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} /> {o}</label>
      ))}
    </div>
  )
}

/* ---------- Tag input with suggestions ---------- */
export function TagInput({ value, onChange, suggestions = [], placeholder = 'Add', invalid }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string; invalid?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [hl, setHl] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  const filtered = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(text.toLowerCase())).slice(0, 8)
  const add = (t: string) => {
    const v = t.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setText('')
    setHl(0)
  }
  return (
    <div className="tags-wrap">
      <div className={`tags ${invalid ? 'invalid' : ''}`} onClick={() => setEditing(true)}>
        {value.map((t) => (
          <span className="tag" key={t}>
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x !== t)) }}><X /></button>
          </span>
        ))}
        {editing ? (
          <input
            ref={ref}
            className="tag-input"
            value={text}
            placeholder="Type and press Enter"
            onChange={(e) => { setText(e.target.value); setHl(0) }}
            onBlur={() => { setTimeout(() => { if (text.trim()) add(text); setEditing(false) }, 120) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(filtered.length && text ? filtered[hl] ?? text : text) }
              else if (e.key === 'Escape') { setEditing(false); setText('') }
              else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
              else if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(h + 1, filtered.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)) }
            }}
          />
        ) : (
          <button type="button" className="tag-add" onClick={() => setEditing(true)}><Plus /> {placeholder}</button>
        )}
      </div>
      {editing && filtered.length > 0 && (
        <div className="suggest">
          {filtered.map((s, i) => (
            <button type="button" key={s} className={i === hl ? 'hl' : ''} onMouseDown={(e) => { e.preventDefault(); add(s) }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Editable bullet list ---------- */
export function BulletList({ value, onChange, placeholder = 'Add an item…', invalid }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; invalid?: boolean }) {
  const items = value.length ? value : ['']
  const set = (i: number, v: string) => { const next = [...items]; next[i] = v; onChange(next) }
  return (
    <div className={`bullet-box ${invalid ? 'invalid' : ''}`} style={invalid ? { borderColor: 'var(--danger)' } : undefined}>
      <ul className="bullet-list">
        {items.map((it, i) => (
          <li key={i}>
            <input
              value={it}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); const next = [...items]; next.splice(i + 1, 0, ''); onChange(next); setTimeout(() => { const el = (e.target as HTMLElement).closest('ul')?.querySelectorAll('input')[i + 1] as HTMLInputElement | undefined; el?.focus() }, 0) }
                if (e.key === 'Backspace' && !it && items.length > 1) { e.preventDefault(); onChange(items.filter((_, j) => j !== i)) }
              }}
            />
            {items.length > 1 && <button type="button" className="icon-btn danger" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}><X /></button>}
          </li>
        ))}
      </ul>
      <button type="button" className="tag-add" onClick={() => onChange([...items, ''])}><Plus /> Add item</button>
    </div>
  )
}

/* ---------- Section card ---------- */
export function Section({ n, title, children, right }: { n: number | ReactNode; title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="section">
      <div className="section-head">
        {typeof n === 'number' ? <span className="num-badge">{n}</span> : n}
        <h3>{title}</h3>
        {right && <span className="right">{right}</span>}
      </div>
      <div className="section-body">{children}</div>
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, width }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }: { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose} width={460} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</button></>}>
      <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  )
}

/* ---------- Toasts ---------- */
export function Toasts({ toasts }: { toasts: { id: number; message: string; kind: string }[] }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>{t.kind === 'error' ? <AlertCircle /> : t.kind === 'success' ? <Check /> : <Info />}{t.message}</div>
      ))}
    </div>
  )
}

/* ---------- Dropdown menu ---------- */
export function Menu({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div className="menu-wrap" ref={ref}>
      <span onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>{trigger}</span>
      {open && <div className="menu" onClick={(e) => { e.stopPropagation(); setOpen(false) }}>{children}</div>}
    </div>
  )
}

export function StatusPill({ status }: { status: 'Draft' | 'In Assessment' | 'Assessed' }) {
  return <span className={`pill-status ${status.split(' ')[0]}`}>{status}</span>
}

export function Collapsible({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)}><ChevronDown style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .12s' }} /> {title}</button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  )
}
