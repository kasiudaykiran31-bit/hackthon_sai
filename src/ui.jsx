import { useState, useEffect, useRef } from 'react'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- animated number ----------
export function CountUp({ value, suffix = '', decimals = 0, dur = 900 }) {
  const v = Number(value) || 0
  const [n, setN] = useState(reduced() ? v : 0)
  useEffect(() => {
    if (reduced()) return setN(v)
    let raf, t0
    const step = t => { t0 ??= t; const p = Math.min(1, (t - t0) / dur); setN(v * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [v, dur])
  return <>{n.toFixed(decimals)}{suffix}</>
}

// ---------- animated donut ----------
export function Ring({ value = 0, size = 130, label, color = 'var(--blue)' }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t) }, [])
  const r = size / 2 - 10, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} />
        <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r} stroke={color} strokeDasharray={c}
          strokeDashoffset={c * (1 - (on ? pct : 0) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-label"><b>{pct}%</b>{label && <small>{label}</small>}</div>
    </div>
  )
}

// ---------- bar chart (items: [{label, value, text}]) ----------
export function BarChart({ items, max = 100 }) {
  return (
    <div className="chart">
      {items.map((it, i) => (
        <div className="bar-col" key={i}>
          <em>{it.text ?? it.value}</em>
          <div className="bar" style={{ height: Math.max(4, (it.value / max) * 100) + '%', '--i': i }} title={it.label + ': ' + (it.text ?? it.value)}></div>
          <label>{it.label}</label>
        </div>
      ))}
      {!items.length && <p className="empty" style={{ margin: 'auto' }}>No data yet.</p>}
    </div>
  )
}

// ---------- animated line chart (points: [{label, value}]) ----------
export function TrendChart({ points, max = 100, min = 0 }) {
  const W = 420, H = 210, px = 30, py = 24, n = points.length
  if (!n) return <p className="empty">No data yet.</p>
  const x = i => px + (n === 1 ? (W - 2 * px) / 2 : (i * (W - 2 * px)) / (n - 1))
  const y = v => H - py - ((v - min) / (max - min)) * (H - 2 * py)
  const d = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join(' ')
  const area = d + ` L${x(n - 1)} ${H - py} L${x(0)} ${H - py} Z`
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart">
      {[0, 25, 50, 75, 100].map(g => <g key={g}><line x1={px} x2={W - px} y1={y(min + (g / 100) * (max - min))} y2={y(min + (g / 100) * (max - min))} className="grid-line" />
        <text x={4} y={y(min + (g / 100) * (max - min)) + 4} className="axis">{Math.round(min + (g / 100) * (max - min))}</text></g>)}
      {n > 1 && <path d={area} className="trend-area" />}
      {n > 1 && <path d={d} pathLength="1" className="trend-line" />}
      {points.map((p, i) => <g key={i} className="trend-dot" style={{ '--i': i }}>
        <circle cx={x(i)} cy={y(p.value)} r="5" /><text x={x(i)} y={y(p.value) - 10} textAnchor="middle" className="val">{p.value}</text>
        <text x={x(i)} y={H - 6} textAnchor="middle" className="axis">{p.label}</text></g>)}
    </svg>
  )
}

// ---------- toasts ----------
export function ToastHost() {
  const [list, setList] = useState([])
  useEffect(() => {
    const h = e => {
      const id = Math.random()
      setList(l => [...l.slice(-3), { id, ...e.detail }])
      setTimeout(() => setList(l => l.filter(x => x.id !== id)), 2800)
    }
    window.addEventListener('sps-toast', h)
    return () => window.removeEventListener('sps-toast', h)
  }, [])
  return (
    <div className="toasts" aria-live="polite">
      {list.map(t => <div key={t.id} className={'toast ' + t.kind}>{t.kind === 'err' ? '⚠️' : '✅'} {t.t}</div>)}
    </div>
  )
}

// ---------- promise based dialogs (replace prompt / confirm) ----------
let open = null
export const dialog = cfg => new Promise(res => (open ? open({ ...cfg, res }) : res(null)))
export const confirmBox = (message, { title = 'Please confirm', confirmText = 'Delete', danger = true } = {}) =>
  dialog({ title, message, confirmText, danger }).then(v => !!v)

export function DialogHost() {
  const [d, setD] = useState(null), [vals, setVals] = useState({}), [err, setErr] = useState('')
  const first = useRef()
  useEffect(() => {
    open = x => { setVals(Object.fromEntries((x.fields || []).map(f => [f.name, f.value ?? ''])) ); setErr(''); setD(x) }
    return () => { open = null }
  }, [])
  useEffect(() => { if (d) setTimeout(() => first.current?.focus(), 50) }, [d])
  useEffect(() => {
    if (!d) return
    const k = e => { if (e.key === 'Escape') close(null) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  if (!d) return null
  const close = v => { d.res(v); setD(null) }
  const submit = e => {
    e.preventDefault()
    if (d.validate) { const m = d.validate(vals); if (m) return setErr(m) }
    close(d.fields ? vals : true)
  }
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && close(null)}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true">
        <h3>{d.title}</h3>
        {d.message && <p className="modal-msg">{d.message}</p>}
        {(d.fields || []).map((f, i) => (
          <div className="form-group" key={f.name} style={{ marginTop: 12 }}>
            <label>{f.label}</label>
            {f.options
              ? <select ref={i === 0 ? first : null} value={vals[f.name]} onChange={e => setVals({ ...vals, [f.name]: e.target.value })}>
                  {f.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
              : <input ref={i === 0 ? first : null} type={f.type || 'text'} required={f.required !== false && !f.optional} minLength={f.minLength}
                  placeholder={f.placeholder} value={vals[f.name]} onChange={e => setVals({ ...vals, [f.name]: e.target.value })} />}
          </div>
        ))}
        {err && <div className="msg error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn alt" onClick={() => close(null)}>Cancel</button>
          <button type="submit" className={'btn ' + (d.danger ? 'danger' : 'primary')} ref={d.fields ? null : first}>{d.confirmText || 'Save'}</button>
        </div>
      </form>
    </div>
  )
}

// ---------- password strength ----------
export function strength(p) {
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
  return s
}
export function StrengthMeter({ value }) {
  const s = value ? strength(value) : 0, names = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong']
  return (
    <div className="strength" data-s={s}>
      <div><i></i><i></i><i></i><i></i></div>
      <small>{value ? names[s] : 'Use 6+ characters, mix cases, numbers & symbols'}</small>
    </div>
  )
}
