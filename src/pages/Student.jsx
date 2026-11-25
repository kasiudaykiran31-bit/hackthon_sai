import { useState, useReducer } from 'react'
import Shell, { Panel, Notices, Hero, ResultBoxes, Stat, greeting } from '../components/Shell.jsx'
import { Ring, TrendChart, CountUp, confirmBox } from '../ui.jsx'
import { StrengthMeter } from '../ui.jsx'
import {
  getSession, getUsers, saveUsers, findUser, reportsOf, getNotices, gradeOf, gradeClass, initials, toast, inr, fmtDate,
  getAssignments, getDone, setDone, getFee, setFee, today, download, toCSV
} from '../store.js'

const MENU = [
  { section: 'MAIN MENU' },
  { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { key: 'profile', icon: '👤', label: 'My Profile' },
  { key: 'academics', icon: '📚', label: 'Academics' },
  { key: 'attendance', icon: '🗓️', label: 'Attendance' },
  { key: 'results', icon: '📊', label: 'Results' },
  { section: 'STUDENT SERVICES' },
  { key: 'fees', icon: '💳', label: 'Fee Details' },
  { key: 'timetable', icon: '🕘', label: 'Time Table' },
  { key: 'assignments', icon: '📝', label: 'Assignments' },
  { key: 'notices', icon: '📢', label: 'Notices' },
  { key: 'reports', icon: '📄', label: 'Reports' }
]
const TITLES = { dashboard: 'Student Dashboard', profile: 'My Profile', academics: 'Academics', attendance: 'Attendance', results: 'Results', fees: 'Fee Details', timetable: 'Time Table', assignments: 'Assignments', notices: 'Notices', reports: 'Reports' }
const SUBJECTS = [['CSE401', 'Java Programming', 4, 'Dr. Rao', 91], ['CSE402', 'Data Structures', 4, 'Dr. Kumar', 84], ['CSE403', 'Database Systems', 4, 'Dr. Priya', 87], ['MAT401', 'Engineering Mathematics', 4, 'Dr. Reddy', 74], ['CSE404', 'Operating Systems', 4, 'Dr. Singh', 89], ['CSE405', 'Computer Networks', 3, 'Dr. Nair', 82]]
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TT = {
  Monday: [['09:00', 'Java Programming', 'Dr. Rao'], ['10:00', 'Data Structures', 'Dr. Kumar'], ['11:00', 'Database Systems', 'Dr. Priya'], ['14:00', 'Mathematics', 'Dr. Reddy'], ['15:00', 'Computer Networks', 'Dr. Nair']],
  Tuesday: [['09:00', 'Operating Systems', 'Dr. Singh'], ['10:00', 'Java Programming Lab', 'Dr. Rao'], ['11:00', 'Java Programming Lab', 'Dr. Rao'], ['14:00', 'Data Structures', 'Dr. Kumar']],
  Wednesday: [['09:00', 'Mathematics', 'Dr. Reddy'], ['10:00', 'Database Systems', 'Dr. Priya'], ['11:00', 'Computer Networks', 'Dr. Nair'], ['14:00', 'Operating Systems', 'Dr. Singh'], ['15:00', 'Mentoring', 'Dr. Rao']],
  Thursday: [['09:00', 'Data Structures', 'Dr. Kumar'], ['10:00', 'Database Lab', 'Dr. Priya'], ['11:00', 'Database Lab', 'Dr. Priya'], ['14:00', 'Java Programming', 'Dr. Rao']],
  Friday: [['09:00', 'Computer Networks', 'Dr. Nair'], ['10:00', 'Mathematics', 'Dr. Reddy'], ['11:00', 'Operating Systems', 'Dr. Singh'], ['14:00', 'Seminar / Sports', '—']]
}

function SubjectTable() {
  return (
    <div className="table-wrap"><table className="data-table">
      <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Faculty</th><th>Attendance</th><th>Status</th></tr></thead>
      <tbody>{SUBJECTS.slice(0, 4).map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}%</td>
        <td><span className={'badge' + (r[4] < 75 ? ' warn' : '')}>{r[4] < 75 ? 'Improve' : 'Good'}</span></td></tr>)}</tbody>
    </table></div>
  )
}

// How many more classes must be attended (or can be skipped) to stay at 75%
function Planner() {
  const [held, setHeld] = useState(40), [att, setAtt] = useState(32)
  const pct = held > 0 ? Math.round((att / held) * 100) : 0
  const need = Math.max(0, Math.ceil((0.75 * held - att) / 0.25))
  const canMiss = Math.max(0, Math.floor(att / 0.75 - held))
  return (
    <Panel title="Attendance Planner" desc="Enter classes held and attended to see where you stand against 75%" icon="🧮" style={{ marginTop: 18 }}>
      <div className="form-grid">
        <div className="form-group"><label>Classes held</label><input type="number" min="0" value={held} onChange={e => setHeld(Math.max(0, +e.target.value))} /></div>
        <div className="form-group"><label>Classes attended</label><input type="number" min="0" max={held} value={att} onChange={e => setAtt(Math.min(held, Math.max(0, +e.target.value)))} /></div>
      </div>
      <div className="planner">
        <Ring value={pct} size={110} color={pct < 75 ? 'var(--orange)' : 'var(--green)'} />
        <p>{pct >= 75
          ? <>You are above 75%. You can safely miss up to <b>{canMiss}</b> more class{canMiss === 1 ? '' : 'es'}.</>
          : <>You are below 75%. Attend the next <b>{need}</b> class{need === 1 ? '' : 'es'} in a row to reach 75%.</>}</p>
      </div>
    </Panel>
  )
}

function Profile({ u, bump }) {
  const [phone, setPhone] = useState(u.phone || '')
  const [pw, setPw] = useState({ cur: '', nw: '', conf: '' })
  const [msg, setMsg] = useState({ t: '', ok: false })
  const savePhone = e => {
    e.preventDefault()
    const us = getUsers(); us.find(a => a.email === u.email).phone = phone.trim(); saveUsers(us); toast('Phone saved'); bump()
  }
  const changePw = e => {
    e.preventDefault()
    const us = getUsers(), x = us.find(a => a.email === u.email), bad = t => setMsg({ t, ok: false })
    if (x.password !== pw.cur) return bad('Current password is incorrect.')
    if (pw.nw.length < 6) return bad('New password must be at least 6 characters.')
    if (pw.nw !== pw.conf) return bad('New passwords do not match.')
    x.password = pw.nw; saveUsers(us); setMsg({ t: 'Password changed successfully.', ok: true }); toast('Password changed'); setPw({ cur: '', nw: '', conf: '' })
  }
  const info = [['Student ID', u.id], ['Full Name', u.name], ['Email', u.email], ['Phone', u.phone || 'Not added'], ['Program', u.program || 'B.Tech CSE'], ['Year', u.year || '2nd Year'], ['Section', u.section || 'A'], ['Status', 'Active']]
  return (
    <>
      <div className="profile-head"><div className="big-avatar">{initials(u.name)}</div><div><h2>{u.name}</h2><p>{u.program || 'B.Tech CSE'} • {u.year || '2nd Year'} • Section {u.section || 'A'}</p></div></div>
      <Panel title="My Profile" desc="Student account information" icon="👤" style={{ marginTop: 18 }}>
        <div className="profile-grid">{info.map(x => <div className="info" key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}</div>
      </Panel>
      <div className="grid" style={{ marginTop: 18 }}>
        <Panel title="Update Phone" desc="Keep your contact number current" icon="📞">
          <form className="form-grid" onSubmit={savePhone}>
            <div className="form-group full"><label>Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="form-group full"><button className="btn primary" type="submit">Save Phone</button></div>
          </form>
        </Panel>
        <Panel title="Change Password" desc="Use at least 6 characters" icon="🔐">
          <form className="form-grid" onSubmit={changePw}>
            <div className="form-group full"><label>Current Password</label><input type="password" required value={pw.cur} onChange={e => setPw({ ...pw, cur: e.target.value })} /></div>
            <div className="form-group"><label>New Password</label><input type="password" minLength={6} required value={pw.nw} onChange={e => setPw({ ...pw, nw: e.target.value })} /></div>
            <div className="form-group"><label>Confirm</label><input type="password" required value={pw.conf} onChange={e => setPw({ ...pw, conf: e.target.value })} /></div>
            <div className="form-group full"><StrengthMeter value={pw.nw} /></div>
            <div className="form-group full"><button className="btn primary" type="submit">Change Password</button></div>
          </form>
          <div className={'msg ' + (msg.ok ? 'ok' : 'error')}>{msg.t}</div>
        </Panel>
      </div>
    </>
  )
}

function Assignments({ email, bump }) {
  const [filter, setFilter] = useState('all')
  const list = getAssignments(), done = getDone(email), now = new Date().setHours(0, 0, 0, 0)
  const pct = Math.round((done.filter(d => list.some(a => a.id === d)).length / list.length) * 100)
  const toggle = id => { const d = done.includes(id) ? done.filter(x => x !== id) : [...done, id]; setDone(email, d); toast(done.includes(id) ? 'Marked as pending' : 'Assignment submitted 🎉'); bump() }
  const status = a => done.includes(a.id) ? 'done' : a.due < now ? 'late' : 'pending'
  const shown = list.filter(a => filter === 'all' || status(a) === filter || (filter === 'pending' && status(a) === 'late'))
  return (
    <Panel title="Assignments" desc="Tick an assignment when you have submitted it" icon="📝">
      <div className="progress-row"><span>Completion</span><div className="progress big"><i style={{ width: pct + '%' }}></i></div><b><CountUp value={pct} suffix="%" /></b></div>
      <div className="seg small">{[['all', 'All'], ['pending', 'Pending'], ['done', 'Submitted']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
      <div className="task-list">
        {shown.map(a => { const s = status(a); return (
          <label className={'task ' + s} key={a.id}>
            <input type="checkbox" checked={s === 'done'} onChange={() => toggle(a.id)} />
            <span className="check-box">✓</span>
            <div><b>{a.title}</b><small>{a.subject} • Due {fmtDate(a.due)}</small></div>
            <span className={'badge' + (s === 'late' ? ' red' : s === 'pending' ? ' warn' : '')}>{s === 'done' ? 'Submitted' : s === 'late' ? 'Overdue' : 'Pending'}</span>
          </label>) })}
        {!shown.length && <p className="empty">Nothing here.</p>}
      </div>
    </Panel>
  )
}

function Fees({ u, bump }) {
  const f = getFee(u.email), pend = f.total - f.paid, pct = Math.round((f.paid / f.total) * 100)
  const pay = async () => {
    if (!(await confirmBox('Pay ' + inr(pend) + ' now? (demo payment - no real money is used)', { title: 'Pay pending fee', confirmText: 'Pay ' + inr(pend), danger: false }))) return
    setFee(u.email, { ...f, paid: f.total, receipts: [{ no: 'RCPT' + String(Date.now()).slice(-6), amount: pend, date: today() }, ...(f.receipts || [])] })
    toast('Payment successful'); bump()
  }
  return (
    <>
      <Panel title="Fee Details" desc="Semester fee information" icon="💳">
        <div className="big-result">
          <div className="result-box"><b>{inr(f.total)}</b><span>Total Fee</span></div>
          <div className="result-box"><b>{inr(f.paid)}</b><span>Paid</span></div>
          <div className="result-box"><b className={pend ? 'warn-text' : 'ok-text'}>{inr(pend)}</b><span>Pending</span></div>
        </div>
        <div className="progress big"><i style={{ width: pct + '%' }}></i></div>
        <p className="muted">{pct}% paid</p>
        {pend > 0 ? <button className="btn primary no-print" onClick={pay}>💳 Pay Pending {inr(pend)}</button> : <p className="ok-text"><b>✅ All fees cleared. Thank you!</b></p>}
      </Panel>
      {!!(f.receipts || []).length && (
        <Panel title="Payment Receipts" desc="Your recent payments" icon="🧾" style={{ marginTop: 18 }}>
          <table className="data-table"><thead><tr><th>Receipt</th><th>Date</th><th>Amount</th><th></th></tr></thead>
            <tbody>{f.receipts.map(r => <tr key={r.no}><td>{r.no}</td><td>{r.date}</td><td>{inr(r.amount)}</td>
              <td><button className="small-btn" onClick={() => download(r.no + '.txt', `PAYMENT RECEIPT\nReceipt: ${r.no}\nStudent: ${u.name} (${u.id})\nDate: ${r.date}\nAmount: ${inr(r.amount)}\nStatus: PAID\n`)}>Download</button></td></tr>)}</tbody></table>
        </Panel>
      )}
    </>
  )
}

function Timetable() {
  const d = new Date().getDay(), [day, setDay] = useState(d >= 1 && d <= 5 ? DAYS[d - 1] : 'Monday')
  const hhmm = new Date().toTimeString().slice(0, 5), isToday = DAYS[d - 1] === day
  return (
    <Panel title={day + "'s Time Table"} desc="Current semester" icon="🕘">
      <div className="seg small">{DAYS.map(x => <button key={x} className={day === x ? 'on' : ''} onClick={() => setDay(x)}>{x.slice(0, 3)}</button>)}</div>
      <table className="data-table"><thead><tr><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th></tr></thead>
        <tbody>{TT[day].map((x, i, arr) => {
          const now = isToday && hhmm >= x[0] && (!arr[i + 1] || hhmm < arr[i + 1][0])
          return <tr key={i} className={now ? 'now-row' : ''}><td>{x[0]}{now && <span className="tag live">NOW</span>}</td><td>{x[1]}</td><td>{x[2]}</td><td>CSE-{i + 1}</td></tr>
        })}</tbody></table>
    </Panel>
  )
}

export default function Student() {
  const [page, setPage] = useState('dashboard')
  const [, bump] = useReducer(x => x + 1, 0)
  const u = findUser(getSession().email)
  const history = reportsOf(u.email), mine = [...history].reverse()
  const r = mine[0] || { marks: 0, attendance: 0, remarks: 'No report yet.' }
  const notices = getNotices()
  const done = getDone(u.email), pending = getAssignments().filter(a => !done.includes(a.id)).length
  const trend = history.length >= 2
    ? history.slice(-6).map((x, i) => ({ label: 'R' + (history.length - Math.min(6, history.length) + i + 1), value: x.marks }))
    : [{ label: 'Sem I', value: 78 }, { label: 'Sem II', value: 81 }, { label: 'Sem III', value: 84 }, { label: 'Current', value: r.marks || 86 }]
  const csv = () => download('my-reports.csv', toCSV([['Date', 'Marks', 'Attendance', 'Grade', 'Remarks'], ...mine.map(x => [x.updated, x.marks, x.attendance, gradeOf(x.marks), x.remarks])]), 'text/csv')

  let view
  if (page === 'dashboard') view = (
    <>
      <Hero title={greeting() + ', ' + u.name.split(' ')[0] + ' 👋'} text={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' • Track your progress, attendance and updates.'} icon="🎓" />
      {r.attendance > 0 && r.attendance < 75 && <div className="alert-bar">⚠️ Your attendance is {r.attendance}% - below the required 75%. Check the Attendance Planner.</div>}
      <div className="cards">
        <Stat icon="📚" value={r.marks / 10} decimals={2} text={r.marks ? undefined : '-'} label="Current CGPA" />
        <Stat icon="🎯" value={r.marks} suffix="%" label="Latest Marks" />
        <Stat icon="🗓️" value={r.attendance} suffix="%" label="Attendance" />
        <Stat icon="📝" value={pending} label="Pending Assignments" />
      </div>
      <div className="grid">
        <Panel title="Performance Trend" desc={history.length >= 2 ? 'Marks across your reports' : 'Semester performance (sample until more reports are added)'} icon="📈"><TrendChart points={trend} /></Panel>
        <Panel title="Latest Notices" desc="Important announcements" icon="📢"><Notices list={notices.slice(0, 3)} /></Panel>
      </div>
      <div className="grid">
        <Panel title="Current Semester Subjects" desc="Attendance and status" icon="📚"><SubjectTable /></Panel>
        <Panel title="Attendance" desc="Overall" icon="🗓️"><div style={{ display: 'grid', placeItems: 'center', padding: '8px 0' }}><Ring value={r.attendance} label="present" color={r.attendance < 75 ? 'var(--orange)' : 'var(--green)'} /></div></Panel>
      </div>
    </>
  )
  else if (page === 'profile') view = <Profile u={u} bump={bump} />
  else if (page === 'academics') view = (
    <Panel title="Current Semester Subjects" desc="Academic course details" icon="📚">
      <div className="subject-grid">{SUBJECTS.map((x, i) =>
        <div className="subject" key={x[0]} style={{ '--i': i }}><b>{x[1]}</b><small>{x[0]} • {x[2]} Credits • {x[3]}</small><div className="progress"><i style={{ width: x[4] + '%' }}></i></div><small>{x[4]}% attendance</small></div>)}</div>
    </Panel>
  )
  else if (page === 'attendance') view = (<><Panel title="Attendance" desc="Subject-wise attendance (minimum 75%)" icon="🗓️"><SubjectTable /></Panel><Planner /></>)
  else if (page === 'results') view = (
    <Panel title="Results" desc="Latest academic report from admin" icon="📊">
      <ResultBoxes r={r} />
      <div className="legend"><span>A+ ≥ 90</span><span>A ≥ 80</span><span>B ≥ 70</span><span>C ≥ 60</span><span>D &lt; 60</span></div>
      <button className="btn primary no-print" style={{ marginTop: 14 }} onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
    </Panel>
  )
  else if (page === 'fees') view = <Fees u={u} bump={bump} />
  else if (page === 'timetable') view = <Timetable />
  else if (page === 'assignments') view = <Assignments email={u.email} bump={bump} />
  else if (page === 'notices') view = <Panel title="Latest Notices" desc="College announcements" icon="📢"><Notices list={notices} /></Panel>
  else view = (
    <Panel title="My Reports" desc="Reports uploaded by the administrator" icon="📄">
      <div className="no-print" style={{ marginBottom: 12 }}>
        <button className="btn alt" onClick={csv} disabled={!mine.length}>⬇ Export CSV</button>{' '}
        <button className="btn alt" onClick={() => window.print()}>🖨️ Print</button>
      </div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Marks</th><th>Attendance</th><th>Grade</th><th>Remarks</th></tr></thead>
        <tbody>{mine.map(x => <tr key={x.id}><td>{x.updated}</td><td>{x.marks}%</td><td>{x.attendance}%</td><td><span className={'badge' + gradeClass(gradeOf(x.marks))}>{gradeOf(x.marks)}</span></td><td>{x.remarks}</td></tr>)}
          {!mine.length && <tr><td colSpan="5">No reports available.</td></tr>}</tbody></table></div>
    </Panel>
  )

  return (
    <Shell avatar={initials(u.name)} name={u.name} sub={u.id} menu={MENU} page={page} setPage={setPage}
      title={TITLES[page]} subtitle="Welcome to Student Program System" topName={u.name} notices={notices} noticeId={u.email}>
      {view}
    </Shell>
  )
}
