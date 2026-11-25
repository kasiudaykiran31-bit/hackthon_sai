import { useState } from 'react'
import Shell, { Panel, Notices, Hero, ResultBoxes, Stat, greeting } from '../components/Shell.jsx'
import { Ring, TrendChart } from '../ui.jsx'
import { getSession, findUser, reportsOf, getNotices, getFee, getAssignments, getDone, initials, gradeOf, gradeClass, inr } from '../store.js'

const MENU = [
  { section: 'PARENT MENU' },
  { key: 'home', icon: '🏠', label: 'Dashboard' },
  { key: 'report', icon: '📊', label: 'Student Report' },
  { key: 'fees', icon: '💳', label: 'Fees' },
  { key: 'notices', icon: '📢', label: 'Notices' }
]
const TITLES = { home: 'Parent Dashboard', report: 'Student Report', fees: 'Fee Status', notices: 'Notices' }

export default function Parent() {
  const [page, setPage] = useState('home')
  const u = findUser(getSession().email)
  const student = findUser(u.studentEmail)
  const history = student ? reportsOf(student.email) : []
  const r = history[history.length - 1]
  const notices = getNotices()
  const fee = student ? getFee(student.email) : null
  const done = student ? getDone(student.email) : []
  const pending = student ? getAssignments().filter(a => !done.includes(a.id)).length : 0

  const link = student
    ? <div className="profile-grid">
        <div className="info"><small>Name</small><b>{student.name}</b></div>
        <div className="info"><small>Student ID</small><b>{student.id}</b></div>
        <div className="info"><small>Program</small><b>{student.program || 'B.Tech CSE'}</b></div>
        <div className="info"><small>Year / Section</small><b>{(student.year || '2nd Year') + ' / ' + (student.section || 'A')}</b></div>
      </div>
    : <p>No student is linked yet. Ask the administrator to connect a student email.</p>

  let view
  if (page === 'notices') view = <Panel title="Latest Notices" desc="College announcements" icon="📢"><Notices list={notices} /></Panel>
  else if (page === 'fees') view = (
    <Panel title="Fee Status" desc="Semester fee summary for your child" icon="💳">
      {fee ? <>
        <div className="big-result">
          <div className="result-box"><b>{inr(fee.total)}</b><span>Total Fee</span></div>
          <div className="result-box"><b>{inr(fee.paid)}</b><span>Paid</span></div>
          <div className="result-box"><b>{inr(fee.total - fee.paid)}</b><span>Pending</span></div>
        </div>
        <div className="progress big"><i style={{ width: Math.round((fee.paid / fee.total) * 100) + '%' }}></i></div>
        <p className="muted">{fee.paid >= fee.total ? '✅ All fees are cleared.' : 'The student can pay the pending amount from their Fee Details page.'}</p>
      </> : <p>No student linked.</p>}
    </Panel>
  )
  else if (page === 'report') view = (
    <>
      <Panel title="Latest Report" desc="Most recent information entered by Admin" icon="📊">
        {r ? <ResultBoxes r={r} /> : <p>No report has been published yet.</p>}
      </Panel>
      <Panel title="Report History" desc="All reports for this student" icon="📋" style={{ marginTop: 18 }}>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Date</th><th>Marks</th><th>Attendance</th><th>Grade</th><th>Remarks</th></tr></thead>
          <tbody>{[...history].reverse().map(x => <tr key={x.id}><td>{x.updated}</td><td>{x.marks}%</td><td>{x.attendance}%</td><td><span className={'badge' + gradeClass(gradeOf(x.marks))}>{gradeOf(x.marks)}</span></td><td>{x.remarks}</td></tr>)}
            {!history.length && <tr><td colSpan="5">No reports available.</td></tr>}</tbody>
        </table></div>
      </Panel>
    </>
  )
  else view = (
    <>
      <Hero title={greeting() + ', ' + u.name.split(' ')[0]} text="View your linked student's latest academic performance." icon="👨‍👩‍👧" />
      {r && r.attendance < 75 && <div className="alert-bar">⚠️ {student.name}'s attendance is {r.attendance}% - below the required 75%.</div>}
      {r && <div className="cards">
        <Stat icon="🎯" value={r.marks} suffix="%" label="Latest Marks" />
        <Stat icon="🗓️" value={r.attendance} suffix="%" label="Attendance" />
        <Stat icon="🏅" text={gradeOf(r.marks)} label="Grade" />
        <Stat icon="📝" value={pending} label="Pending Assignments" />
      </div>}
      <div className="grid">
        <Panel title="Linked Student" desc="Student connected to this parent account" icon="🎓">{link}</Panel>
        <Panel title="Attendance" desc="Latest recorded" icon="🗓️">
          <div style={{ display: 'grid', placeItems: 'center' }}><Ring value={r ? r.attendance : 0} label="present" color={r && r.attendance < 75 ? 'var(--orange)' : 'var(--green)'} /></div>
        </Panel>
      </div>
      {history.length > 1 && <Panel title="Marks Trend" desc="Across all published reports" icon="📈"><TrendChart points={history.slice(-6).map((x, i) => ({ label: 'R' + (i + 1), value: x.marks }))} /></Panel>}
    </>
  )

  return (
    <Shell avatar={initials(u.name)} name={u.name} sub="Parent Account" menu={MENU} page={page} setPage={setPage}
      title={TITLES[page]} subtitle="Monitor student academic progress" topName={u.name} notices={notices} noticeId={u.email}>
      {view}
    </Shell>
  )
}
