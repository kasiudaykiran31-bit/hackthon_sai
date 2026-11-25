import { useState, useReducer } from 'react'
import Shell, { Panel, Notices, Hero, Stat } from '../components/Shell.jsx'
import { BarChart, TrendChart, dialog, confirmBox } from '../ui.jsx'
import {
  getSession, getUsers, saveUsers, getReports, saveReports, getNotices, saveNotices, adminCreds, KEY_ADMIN, setSession,
  gradeOf, gradeClass, toast, download, toCSV, newId, today, logActivity, getActivity, timeAgo, latestOf, resetAll, clearSession
} from '../store.js'
import { useNavigate } from 'react-router-dom'

const MENU = [
  { section: 'ADMIN MENU' },
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'students', icon: '👨‍🎓', label: 'Students' },
  { key: 'parents', icon: '👪', label: 'Parents' },
  { key: 'reports', icon: '📄', label: 'Reports' },
  { key: 'notices', icon: '📢', label: 'Notices' },
  { key: 'analytics', icon: '📈', label: 'Analytics' },
  { key: 'settings', icon: '⚙️', label: 'Settings' }
]
const TITLES = { dashboard: 'Admin Dashboard', students: 'Manage Students', parents: 'Manage Parents', reports: 'Manage Reports', notices: 'Manage Notices', analytics: 'Analytics', settings: 'Settings' }
const PROGRAMS = ['B.Tech CSE', 'B.Tech ECE', 'B.Tech EEE', 'B.Tech AI & ML', 'BCA'], YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'], SECTIONS = ['A', 'B', 'C', 'D']
const nameOf = email => getUsers().find(u => u.email === email)?.name
const avgOf = (rs, k) => (rs.length ? Math.round(rs.reduce((a, x) => a + Number(x[k]), 0) / rs.length) : 0)
const latestReports = () => { const m = {}; getReports().forEach(r => (m[r.email] = r)); return Object.values(m) } // newest per student

function ReportTable({ rs, onDelete }) {
  return (
    <div className="table-wrap"><table className="data-table">
      <thead><tr><th>Student</th><th>Email</th><th>Marks</th><th>Attendance</th><th>Grade</th><th>Updated</th>{onDelete && <th>Action</th>}</tr></thead>
      <tbody>{rs.map(r => <tr key={r.id}><td>{nameOf(r.email) || 'Unknown'}</td><td>{r.email}</td><td>{r.marks}%</td>
        <td><span className={Number(r.attendance) < 75 ? 'warn-text' : ''}>{r.attendance}%</span></td>
        <td><span className={'badge' + gradeClass(gradeOf(r.marks))}>{gradeOf(r.marks)}</span></td><td>{r.updated}</td>
        {onDelete && <td><button className="small-btn red" onClick={() => onDelete(r.id)}>Delete</button></td>}</tr>)}
        {!rs.length && <tr><td colSpan="7">No reports.</td></tr>}</tbody>
    </table></div>
  )
}

function LowAttendance({ rs }) {
  const low = rs.filter(r => Number(r.attendance) < 75)
  return (
    <Panel title="Low Attendance Alerts" desc="Students below 75% attendance" icon="⚠️" style={{ marginBottom: 18 }}>
      {low.length ? low.map(r => <div className="notice urgent" key={r.id}><b>{nameOf(r.email) || r.email}</b><span>Attendance {r.attendance}% - needs improvement</span></div>) : <p className="ok-text">✅ All students meet the 75% requirement.</p>}
    </Panel>
  )
}

function Dashboard({ go }) {
  const students = getUsers().filter(x => x.role === 'student'), parents = getUsers().filter(x => x.role === 'parent'), rs = latestReports()
  const act = getActivity()
  return (
    <>
      <Hero title="Admin Dashboard" text="Manage student performance, attendance, grades and reports from one place." icon="📊" />
      <div className="cards">
        <Stat icon="👨‍🎓" value={students.length} label="Total Students" />
        <Stat icon="👪" value={parents.length} label="Parents" />
        <Stat icon="🎯" value={avgOf(rs, 'marks')} suffix="%" label="Average Marks" />
        <Stat icon="🗓️" value={avgOf(rs, 'attendance')} suffix="%" label="Average Attendance" />
      </div>
      <div className="quick no-print">
        {[['students', '➕ Add student'], ['reports', '📝 Add report'], ['notices', '📢 Post notice'], ['analytics', '📈 Analytics']].map(([k, l]) => <button key={k} className="chip" onClick={() => go(k)}>{l}</button>)}
      </div>
      <div className="grid">
        <Panel title="Performance Overview" desc="Latest marks per student" icon="📈">
          <BarChart items={rs.slice(-6).map(r => ({ label: nameOf(r.email)?.split(' ')[0] || 'Student', value: r.marks, text: r.marks + '%' }))} />
        </Panel>
        <Panel title="Recent Activity" desc="What happened lately" icon="🕒">
          {act.length ? <ul className="timeline">{act.slice(0, 6).map((a, i) => <li key={i}><span>{a.text}</span><small>{timeAgo(a.ts)}</small></li>)}</ul> : <p className="empty">No activity yet. Add a student or report to get started.</p>}
        </Panel>
      </div>
      <LowAttendance rs={rs} />
      <div className="grid">
        <Panel title="Recent Reports" desc="Connected student records" icon="📄"><ReportTable rs={getReports().slice(-6).reverse()} /></Panel>
        <Panel title="Recent Notices" desc="Visible to students and parents" icon="📢"><Notices list={getNotices().slice(0, 3)} /></Panel>
      </div>
    </>
  )
}

const studentFields = (u = {}) => [
  { name: 'name', label: 'Full name', value: u.name, placeholder: 'Student name' },
  { name: 'phone', label: 'Phone', value: u.phone, optional: true, type: 'tel' },
  { name: 'program', label: 'Program', options: PROGRAMS, value: u.program || PROGRAMS[0] },
  { name: 'year', label: 'Year', options: YEARS, value: u.year || YEARS[1] },
  { name: 'section', label: 'Section', options: SECTIONS, value: u.section || 'A' }
]

function Students({ bump }) {
  const [q, setQ] = useState(''), [sort, setSort] = useState({ k: 'name', dir: 1 }), [pg, setPg] = useState(0)
  const PER = 8
  const all = getUsers().filter(u => u.role === 'student')
  const list = all.filter(u => (u.name + ' ' + u.id + ' ' + u.email).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => String(a[sort.k] || '').localeCompare(String(b[sort.k] || '')) * sort.dir)
  const pages = Math.max(1, Math.ceil(list.length / PER)), cur = Math.min(pg, pages - 1), shown = list.slice(cur * PER, cur * PER + PER)
  const th = (k, l) => <th className="sortable" onClick={() => setSort(s => ({ k, dir: s.k === k ? -s.dir : 1 }))}>{l}{sort.k === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</th>

  const add = async () => {
    const v = await dialog({
      title: 'Add student', confirmText: 'Add student',
      fields: [{ name: 'email', label: 'Email', type: 'email' }, { name: 'password', label: 'Password (min 6)', value: 'student123', minLength: 6 }, ...studentFields()]
    })
    if (!v) return
    const us = getUsers(), email = v.email.trim().toLowerCase()
    if (us.some(u => u.email.toLowerCase() === email)) return toast('Email already exists', 'err')
    us.push({ id: 'STU' + String(Date.now()).slice(-5), name: v.name.trim(), email, password: v.password, role: 'student', phone: v.phone.trim(), program: v.program, year: v.year, section: v.section })
    saveUsers(us); logActivity('Added student ' + v.name.trim()); toast('Student added'); bump()
  }
  const edit = async u => {
    const v = await dialog({ title: 'Edit ' + u.name, confirmText: 'Save changes', fields: studentFields(u) })
    if (!v) return
    const us = getUsers(), t = us.find(x => x.email === u.email)
    Object.assign(t, { name: v.name.trim(), phone: v.phone.trim(), program: v.program, year: v.year, section: v.section })
    saveUsers(us); logActivity('Updated student ' + t.name); toast('Student updated'); bump()
  }
  const reset = async u => {
    const v = await dialog({ title: 'Reset password', message: 'Set a new password for ' + u.name + '.', confirmText: 'Reset', fields: [{ name: 'p', label: 'New password (min 6)', minLength: 6 }] })
    if (!v) return
    const us = getUsers(); us.find(x => x.email === u.email).password = v.p; saveUsers(us); logActivity('Reset password for ' + u.name); toast('Password reset')
  }
  const del = async u => {
    if (!(await confirmBox('Delete ' + u.name + ' and all of their reports? Linked parents will lose their link.', { title: 'Delete student' }))) return
    saveUsers(getUsers().filter(x => x.email !== u.email)); saveReports(getReports().filter(r => r.email !== u.email))
    localStorage.removeItem('sps_done_' + u.email); localStorage.removeItem('sps_fee_' + u.email)
    logActivity('Deleted student ' + u.name); toast('Student deleted'); bump()
  }
  const exportCsv = () => download('students.csv', toCSV([['ID', 'Name', 'Email', 'Phone', 'Program', 'Year', 'Section'], ...all.map(u => [u.id, u.name, u.email, u.phone || '', u.program || '', u.year || '', u.section || ''])]), 'text/csv')
  return (
    <section className="panel">
      <div className="toolbar"><div><h3>Student Accounts</h3><p className="muted">{all.length} students • search, sort, add, edit and export</p></div>
        <div><button className="btn primary" onClick={add}>+ Add Student</button> <button className="btn alt" onClick={exportCsv}>⬇ Export CSV</button></div></div>
      <input className="search" placeholder="Search by name, ID or email..." value={q} onChange={e => { setQ(e.target.value); setPg(0) }} />
      <div className="table-wrap"><table className="data-table">
        <thead><tr>{th('id', 'ID')}{th('name', 'Name')}{th('email', 'Email')}{th('program', 'Program')}{th('year', 'Year')}<th>Latest</th><th>Action</th></tr></thead>
        <tbody>{shown.map(u => { const r = latestOf(u.email); return (
          <tr key={u.email}><td>{u.id}</td><td><span className="mini-av">{u.name[0]}</span>{u.name}</td><td>{u.email}</td><td>{u.program || 'B.Tech CSE'}</td><td>{u.year || '2nd Year'}</td>
            <td>{r ? <span className={'badge' + gradeClass(gradeOf(r.marks))}>{r.marks}% • {gradeOf(r.marks)}</span> : <span className="muted">No report</span>}</td>
            <td className="actions"><button className="small-btn blue" onClick={() => edit(u)}>Edit</button><button className="small-btn" onClick={() => reset(u)}>Reset Pwd</button><button className="small-btn red" onClick={() => del(u)}>Delete</button></td></tr>) })}
          {!shown.length && <tr><td colSpan="7">No students found.</td></tr>}</tbody>
      </table></div>
      {pages > 1 && <div className="pager"><button className="small-btn" disabled={cur === 0} onClick={() => setPg(cur - 1)}>← Prev</button><span>Page {cur + 1} of {pages}</span><button className="small-btn" disabled={cur >= pages - 1} onClick={() => setPg(cur + 1)}>Next →</button></div>}
    </section>
  )
}

function Parents({ bump }) {
  const ps = getUsers().filter(u => u.role === 'parent')
  const studentOpts = () => getUsers().filter(u => u.role === 'student').map(s => ({ value: s.email, label: s.name + ' — ' + s.email }))
  const add = async () => {
    const opts = studentOpts(); if (!opts.length) return toast('Add a student first', 'err')
    const v = await dialog({ title: 'Add parent', confirmText: 'Add parent', fields: [
      { name: 'name', label: 'Parent name' }, { name: 'email', label: 'Parent email', type: 'email' },
      { name: 'pw', label: 'Password (min 6)', minLength: 6 }, { name: 'se', label: 'Linked student', options: opts, value: opts[0].value }] })
    if (!v) return
    const us = getUsers(), email = v.email.trim().toLowerCase()
    if (us.some(u => u.email.toLowerCase() === email)) return toast('Email already exists', 'err')
    us.push({ id: 'PAR' + String(Date.now()).slice(-5), name: v.name.trim(), email, password: v.pw, role: 'parent', studentEmail: v.se })
    saveUsers(us); logActivity('Added parent ' + v.name.trim()); toast('Parent added'); bump()
  }
  const relink = async p => {
    const opts = studentOpts(); if (!opts.length) return toast('No students available', 'err')
    const v = await dialog({ title: 'Change linked student', confirmText: 'Save', fields: [{ name: 'se', label: 'Student', options: opts, value: p.studentEmail || opts[0].value }] })
    if (!v) return
    const us = getUsers(); us.find(x => x.email === p.email).studentEmail = v.se; saveUsers(us); toast('Link updated'); bump()
  }
  const del = async p => {
    if (!(await confirmBox('Delete the account of ' + p.name + '?', { title: 'Delete parent' }))) return
    saveUsers(getUsers().filter(u => u.email !== p.email)); logActivity('Deleted parent ' + p.name); toast('Parent deleted'); bump()
  }
  return (
    <section className="panel">
      <div className="toolbar"><div><h3>Parent Accounts</h3><p className="muted">Parents can view their linked student's report, fees and notices</p></div>
        <button className="btn primary" onClick={add}>+ Add Parent</button></div>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Linked Student</th><th>Action</th></tr></thead>
        <tbody>{ps.map(p => { const s = getUsers().find(x => x.email === p.studentEmail); return (
          <tr key={p.email}><td>{p.name}</td><td>{p.email}</td><td>{s ? s.name + ' (' + s.email + ')' : <span className="badge warn">Not linked</span>}</td>
            <td className="actions"><button className="small-btn blue" onClick={() => relink(p)}>Change link</button><button className="small-btn red" onClick={() => del(p)}>Delete</button></td></tr>) })}
          {!ps.length && <tr><td colSpan="4">No parent accounts yet.</td></tr>}</tbody>
      </table></div>
    </section>
  )
}

function Reports({ bump }) {
  const students = getUsers().filter(x => x.role === 'student')
  const [f, setF] = useState({ email: students[0]?.email || '', marks: '', att: '', format: 'percentage', remark: '' })
  const [filter, setFilter] = useState('all')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const ten = f.format === '10point'
  const pct = f.marks === '' ? null : Math.round(ten ? Number(f.marks) * 10 : Number(f.marks))
  const submit = e => {
    e.preventDefault()
    if (!f.email) return toast('Add a student first', 'err')
    const obj = { id: newId(), email: f.email, marks: pct, attendance: Number(f.att), format: f.format, remarks: f.remark.trim(), updated: today() }
    saveReports([...getReports(), obj]); logActivity('Report added for ' + nameOf(f.email) + ' (' + pct + '%)')
    toast('Report saved - student dashboard updated'); setF({ ...f, marks: '', att: '', remark: '' }); bump()
  }
  const del = async id => { if (!(await confirmBox('Delete this report?', { title: 'Delete report' }))) return; saveReports(getReports().filter(r => r.id !== id)); toast('Report deleted'); bump() }
  const rows = getReports().filter(r => filter === 'all' || r.email === filter).slice().reverse()
  const exportCsv = () => download('reports.csv', toCSV([['Student', 'Email', 'Marks', 'Attendance', 'Grade', 'Updated', 'Remarks'], ...rows.map(r => [nameOf(r.email) || '', r.email, r.marks, r.attendance, gradeOf(r.marks), r.updated, r.remarks])]), 'text/csv')
  return (
    <>
      <Panel title="Add Student Report" desc="Each save is kept in the student's history; the newest one is shown on dashboards." icon="✏️">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-group"><label>Student</label><select value={f.email} onChange={set('email')}>{students.map(u => <option key={u.email} value={u.email}>{u.name} — {u.email}</option>)}</select></div>
          <div className="form-group"><label>Grade Format</label><select value={f.format} onChange={set('format')}><option value="percentage">Percentage (0-100)</option><option value="10point">10 Point Scale (0-10)</option></select></div>
          <div className="form-group"><label>{ten ? 'Marks (out of 10)' : 'Marks (%)'}</label><input type="number" min="0" max={ten ? 10 : 100} step={ten ? 0.1 : 1} required value={f.marks} onChange={set('marks')} /></div>
          <div className="form-group"><label>Attendance (%)</label><input type="number" min="0" max="100" required value={f.att} onChange={set('att')} /></div>
          <div className="form-group full"><label>Teacher Remarks</label><textarea rows="3" placeholder="Enter remarks" value={f.remark} onChange={set('remark')} /></div>
          <div className="form-group full"><button className="btn primary" type="submit">Save Report</button>
            {pct !== null && <span className="live-grade">Preview: {pct}% → <b className={'badge' + gradeClass(gradeOf(pct))}>{gradeOf(pct)}</b></span>}</div>
        </form>
      </Panel>
      <Panel title="Saved Reports" desc="All student report records (newest first)" icon="📋" style={{ marginTop: 18 }}>
        <div className="toolbar no-print">
          <select className="search" style={{ maxWidth: 320, margin: 0 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All students</option>{students.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}</select>
          <button className="btn alt" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
        <ReportTable rs={rows} onDelete={del} />
      </Panel>
    </>
  )
}

function NoticesPage({ bump }) {
  const [t, setT] = useState(''), [m, setM] = useState(''), [type, setType] = useState('info')
  const publish = e => {
    e.preventDefault(); const ns = getNotices(); ns.unshift({ id: newId(), title: t.trim(), text: m.trim(), type })
    saveNotices(ns); logActivity('Published notice "' + t.trim() + '"'); setT(''); setM(''); toast('Notice published'); bump()
  }
  const del = async n => { if (!(await confirmBox('Delete notice "' + n.title + '"?', { title: 'Delete notice' }))) return; saveNotices(getNotices().filter(x => x.id !== n.id)); toast('Notice deleted'); bump() }
  return (
    <Panel title="Manage Notices" desc="Notices appear on student and parent dashboards, and in their bell menu." icon="📢">
      <form className="form-grid" onSubmit={publish}>
        <div className="form-group"><label>Title</label><input required placeholder="Notice title" value={t} onChange={e => setT(e.target.value)} /></div>
        <div className="form-group"><label>Priority</label><select value={type} onChange={e => setType(e.target.value)}><option value="info">Info</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div>
        <div className="form-group full"><label>Message</label><input required placeholder="Notice message" value={m} onChange={e => setM(e.target.value)} /></div>
        <div className="form-group full"><button className="btn primary">Publish Notice</button></div>
      </form>
      {getNotices().map(n => <div className={'notice ' + (n.type || 'info')} key={n.id}><button className="small-btn red" style={{ float: 'right' }} onClick={() => del(n)}>Delete</button><b>{n.title}{n.type === 'urgent' && <span className="tag">URGENT</span>}</b><span>{n.text}</span></div>)}
    </Panel>
  )
}

function Analytics() {
  const all = getReports(), rs = latestReports(), n = rs.length
  const high = rs.filter(r => r.marks >= 80).length, low = rs.filter(r => r.marks < 60).length
  const g = { 'A+': 0, A: 0, B: 0, C: 0, D: 0 }; rs.forEach(r => g[gradeOf(r.marks)]++)
  const top = [...rs].sort((a, b) => b.marks - a.marks).slice(0, 3), risk = rs.filter(r => r.marks < 60 || r.attendance < 75)
  const bands = [['<60', 0, 60], ['60-74', 60, 75], ['75-89', 75, 90], ['90+', 90, 101]].map(([label, a, b]) => ({ label, value: rs.filter(r => r.attendance >= a && r.attendance < b).length }))
  const trend = all.slice(-8).map((r, i) => ({ label: (nameOf(r.email) || 'S').split(' ')[0].slice(0, 5), value: r.marks }))
  return (
    <>
      <div className="cards">
        <Stat icon="🎯" value={avgOf(rs, 'marks')} suffix="%" label="Average Marks" />
        <Stat icon="🏆" value={high} label="Students ≥ 80%" />
        <Stat icon="📉" value={low} label="Students below 60%" />
        <Stat icon="📄" value={all.length} label="Reports Recorded" />
      </div>
      <div className="grid">
        <Panel title="Grade Distribution" desc="Number of students per grade (latest report)" icon="📊">
          <BarChart items={Object.keys(g).map(k => ({ label: k, value: g[k], text: g[k] }))} max={Math.max(1, ...Object.values(g))} />
        </Panel>
        <Panel title="Top Performers" desc="Highest marks" icon="🏆">
          {top.length ? top.map((r, i) => <div className="notice info" key={r.id}><b>{['🥇', '🥈', '🥉'][i]} {nameOf(r.email) || r.email}</b><span>{r.marks}% marks, {r.attendance}% attendance</span></div>) : <p className="empty">No reports yet.</p>}
        </Panel>
      </div>
      <div className="grid">
        <Panel title="Attendance Bands" desc="Students per attendance range" icon="🗓️"><BarChart items={bands.map(b => ({ ...b, text: b.value }))} max={Math.max(1, ...bands.map(b => b.value))} /></Panel>
        <Panel title="At-Risk Students" desc="Marks below 60% or attendance below 75%" icon="⚠️">
          {risk.length ? risk.map(r => <div className="notice urgent" key={r.id}><b>{nameOf(r.email) || r.email}</b><span>{r.marks}% marks • {r.attendance}% attendance</span></div>) : <p className="ok-text">✅ No students at risk.</p>}
        </Panel>
      </div>
      <Panel title="Recent Marks Trend" desc="Last 8 reports recorded" icon="📈"><TrendChart points={trend} /></Panel>
      <Panel title="All Reports" icon="📄" style={{ marginTop: 18 }}><ReportTable rs={[...all].reverse()} /></Panel>
    </>
  )
}

function Settings({ bump }) {
  const nav = useNavigate()
  const a = adminCreds()
  const [f, setF] = useState({ cur: '', mail: a.email, p1: '', p2: '' })
  const [msg, setMsg] = useState({ t: '', ok: false })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = e => {
    e.preventDefault()
    const cur = adminCreds(), email = f.mail.trim().toLowerCase(), bad = t => setMsg({ t, ok: false })
    if (f.cur !== cur.password) return bad('Current password is incorrect.')
    if (f.p1 && f.p1 !== f.p2) return bad('New passwords do not match.')
    if (getUsers().some(u => u.role !== 'admin' && u.email.toLowerCase() === email)) return bad('That email is already used by another account.')
    localStorage.setItem(KEY_ADMIN, JSON.stringify({ email, password: f.p1 || cur.password }))
    setSession({ email, role: 'admin' }); getUsers()
    setMsg({ t: 'Admin login updated. Use the new details next time you log in.', ok: true }); toast('Admin login updated')
    setF({ ...f, cur: '', p1: '', p2: '' })
  }
  const backup = () => download('sps-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ users: getUsers().filter(u => u.role !== 'admin'), reports: getReports(), notices: getNotices() }, null, 2), 'application/json')
  const restore = file => {
    if (!file) return
    const r = new FileReader()
    r.onload = async () => {
      try {
        const d = JSON.parse(r.result)
        if (!Array.isArray(d.users) || !Array.isArray(d.reports) || !Array.isArray(d.notices)) throw 0
        if (!(await confirmBox('Restore this backup? Current students, reports and notices will be replaced.', { title: 'Restore backup', confirmText: 'Restore', danger: false }))) return
        saveUsers(d.users.filter(u => u.role !== 'admin')); saveReports(d.reports); saveNotices(d.notices); getUsers(); logActivity('Backup restored'); toast('Backup restored'); bump()
      } catch { toast('Invalid backup file', 'err') }
    }
    r.readAsText(file)
  }
  const wipe = async () => {
    if (!(await confirmBox('This erases ALL students, parents, reports, notices and settings in this browser and signs you out. Download a backup first!', { title: 'Reset all data', confirmText: 'Erase everything' }))) return
    resetAll(); clearSession(); nav('/')
  }
  return (
    <>
      <Panel title="Admin Login Settings" desc="Change the admin email and password" icon="🔐">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-group"><label>Current Password</label><input type="password" required value={f.cur} onChange={set('cur')} /></div>
          <div className="form-group"><label>Admin Email</label><input type="email" required value={f.mail} onChange={set('mail')} /></div>
          <div className="form-group"><label>New Password (min 8, leave blank to keep)</label><input type="password" minLength={8} value={f.p1} onChange={set('p1')} /></div>
          <div className="form-group"><label>Confirm New Password</label><input type="password" value={f.p2} onChange={set('p2')} /></div>
          <div className="form-group full"><button className="btn primary" type="submit">Update Admin Login</button></div>
        </form>
        <div className={'msg ' + (msg.ok ? 'ok' : 'error')}>{msg.t}</div>
      </Panel>
      <Panel title="Backup & Restore" desc="Data lives in this browser only. Download a backup to keep or move it." icon="💾" style={{ marginTop: 18 }}>
        <button className="btn primary" onClick={backup}>⬇ Download Backup</button>{' '}
        <label className="btn alt" style={{ display: 'inline-block' }}>⬆ Restore Backup<input type="file" accept=".json" hidden onChange={e => { restore(e.target.files[0]); e.target.value = '' }} /></label>
      </Panel>
      <Panel title="Danger Zone" desc="Start again with a clean system" icon="🧨" style={{ marginTop: 18 }}>
        <button className="btn danger" onClick={wipe}>Reset all data</button>
      </Panel>
    </>
  )
}

export default function Admin() {
  const [page, setPage] = useState('dashboard')
  const [, bump] = useReducer(x => x + 1, 0)
  getSession()
  const views = { dashboard: <Dashboard go={setPage} />, students: <Students bump={bump} />, parents: <Parents bump={bump} />, reports: <Reports bump={bump} />, notices: <NoticesPage bump={bump} />, analytics: <Analytics />, settings: <Settings bump={bump} /> }
  return (
    <Shell avatar="AD" name="Admin" sub="Administrator" menu={MENU} page={page} setPage={setPage}
      title={TITLES[page]} subtitle="Manage students and academic reports" topName="Administrator">
      {views[page]}
    </Shell>
  )
}
