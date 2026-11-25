import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, toggleDark, isDark, getSeen, setSeen, toast, greeting } from '../store.js'
import { CountUp } from '../ui.jsx'

function Bell({ list, id, goNotices }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeenState] = useState(() => getSeen(id))
  const ref = useRef()
  const unread = list.filter(n => !seen.includes(n.id)).length
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const markAll = () => { const ids = list.map(n => n.id); setSeen(id, ids); setSeenState(ids) }
  return (
    <div className="bell-wrap" ref={ref}>
      <button className={'bell' + (unread ? ' ring-it' : '')} onClick={() => setOpen(o => !o)} aria-label="Notifications">
        🔔{unread > 0 && <span className="badge-dot">{unread}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head"><b>Notifications</b><button className="link-btn" onClick={markAll}>Mark all read</button></div>
          {list.slice(0, 5).map(n => (
            <div key={n.id} className={'bell-item ' + (n.type || 'info') + (seen.includes(n.id) ? '' : ' unread')}><b>{n.title}</b><span>{n.text}</span></div>
          ))}
          {!list.length && <p className="empty">No notices.</p>}
          {goNotices && <button className="link-btn" style={{ margin: '8px 12px' }} onClick={() => { goNotices(); setOpen(false) }}>View all notices →</button>}
        </div>
      )}
    </div>
  )
}

// Sidebar + topbar layout shared by Student / Admin / Parent
export default function Shell({ brand = 'STUDENT PROGRAM', avatar, name, sub, menu, page, setPage, title, subtitle, topName, notices, noticeId, noticePage = 'notices', children }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(isDark())
  const nav = useNavigate()
  const logout = () => { clearSession(); toast('Logged out'); nav('/') }
  useEffect(() => { window.scrollTo({ top: 0 }) }, [page])
  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="side-brand"><div className="mini-logo">🎓</div><div><b>{brand}</b><small>SYSTEM</small></div></div>
        <div className="profile"><div className="avatar">{avatar}</div><div><b>{name}</b><small>{sub}</small></div></div>
        <div className="side-scroll">
          {menu.map((m, i) => m.section
            ? <div className="menu-label" key={i}>{m.section}</div>
            : <button key={m.key} className={'nav' + (page === m.key ? ' active' : '')} onClick={() => { setPage(m.key); setOpen(false) }}><span>{m.icon}</span>{m.label}</button>)}
        </div>
        <div className="side-bottom">
          <button className="nav" onClick={() => setDark(toggleDark())}><span>{dark ? '☀️' : '🌙'}</span>{dark ? 'Light Mode' : 'Dark Mode'}</button>
          <button className="nav logout-side" onClick={logout}><span>↪️</span>Logout</button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="hamb" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
          <div><h2>{title}</h2><small>{subtitle}</small></div>
          <div className="top-user">
            {notices && <Bell list={notices} id={noticeId} goNotices={() => setPage(noticePage)} />}
            <div className="top-avatar">{avatar}</div><b>{topName}</b>
          </div>
        </header>
        <section className="content" key={page}>{children}</section>
      </main>
    </div>
  )
}

export const Panel = ({ title, desc, icon, children, style, className = '' }) => (
  <section className={'panel ' + className} style={style}>
    <div className="panel-title"><div><h3>{title}</h3>{desc && <p>{desc}</p>}</div><span className="panel-ico">{icon}</span></div>
    {children}
  </section>
)
export const Notices = ({ list }) => (
  <>
    {list.map(n => <div className={'notice ' + (n.type || 'info')} key={n.id}><b>{n.title}{n.type === 'urgent' && <span className="tag">URGENT</span>}</b><span>{n.text}</span></div>)}
    {!list.length && <p className="empty">No notices right now.</p>}
  </>
)
export const Hero = ({ title, text, icon }) => (
  <div className="hero"><div><h1>{title}</h1><p>{text}</p></div><div className="hero-icon">{icon}</div></div>
)
export const Stat = ({ icon, value, suffix, decimals, label, text }) => (
  <div className="stat"><span className="ico">{icon}</span>
    <b>{text ?? <CountUp value={value} suffix={suffix} decimals={decimals} />}</b><small>{label}</small></div>
)
export const ResultBoxes = ({ r }) => (
  <>
    <div className="big-result">
      <div className="result-box"><b><CountUp value={r.marks} suffix="%" /></b><span>Latest Marks</span></div>
      <div className="result-box"><b><CountUp value={r.attendance} suffix="%" /></b><span>Attendance</span></div>
      <div className="result-box"><b>{gradeOfLocal(r.marks)}</b><span>Grade</span></div>
    </div>
    <div className="info" style={{ marginTop: 14 }}><small>Teacher Remarks</small><b>{r.remarks || '—'}</b></div>
  </>
)
const gradeOfLocal = m => (m >= 90 ? 'A+' : m >= 80 ? 'A' : m >= 70 ? 'B' : m >= 60 ? 'C' : 'D')
export { greeting }
