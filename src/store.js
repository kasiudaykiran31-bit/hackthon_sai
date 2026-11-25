// All data is stored in the browser's localStorage.
export const KEY_USERS = 'sps_users', KEY_REPORTS = 'sps_reports', KEY_SESSION = 'sps_session', KEY_NOTICE = 'sps_notices'
export const KEY_ADMIN = 'sps_admin_override', KEY_LOCK = 'sps_lock', KEY_ACT = 'sps_activity'

// ===== DEFAULT ADMIN LOGIN (change here, or in Admin > Settings) =====
export const ADMIN_EMAIL = 'admin@studentprogram.com'
export const ADMIN_PASSWORD = 'Mna6HCpD4d@97#'

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
export const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const demoReports = [
  { email: 'student@gmail.com', marks: 86, attendance: 91, format: 'percentage', remarks: 'Good performance. Keep improving in problem solving.', updated: '24 Sep 2026' },
  { email: 'rahul@gmail.com', marks: 78, attendance: 84, format: 'percentage', remarks: 'Good progress. Focus more on attendance and revision.', updated: '23 Sep 2026' }
]
const demoNotices = [
  { title: 'Mid-Term Examination', text: 'Mid-term examinations begin from 10 October 2026.', type: 'urgent' },
  { title: 'Fee Payment', text: 'Pay pending semester fees before the due date.', type: 'important' },
  { title: 'Academic Registration', text: 'Course registration window is open.', type: 'info' }
]

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// ---------- users ----------
export function adminCreds() {
  const o = read(KEY_ADMIN, null)
  return o && o.email && o.password ? o : { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
}
export function getUsers() {
  let x = read(KEY_USERS, [])
  if (!Array.isArray(x)) x = []
  const a = adminCreds()
  const adm = { id: 'ADM001', name: 'Administrator', email: a.email, password: a.password, role: 'admin' }
  const i = x.findIndex(u => u.role === 'admin')
  if (i >= 0 && x[i].email === adm.email && x[i].password === adm.password) return x
  if (i >= 0) x[i] = adm; else x.unshift(adm)
  write(KEY_USERS, x)
  return x
}
export const saveUsers = u => write(KEY_USERS, u)
export const findUser = email => getUsers().find(u => u.email === email)

// ---------- reports (history: many per student, newest is last) ----------
export function getReports() {
  let x = read(KEY_REPORTS, null)
  if (!Array.isArray(x)) { x = demoReports.map(r => ({ ...r })); x.forEach(r => (r.id = uid())); write(KEY_REPORTS, x); return x }
  if (x.some(r => !r.id)) { x.forEach(r => { if (!r.id) r.id = uid() }); write(KEY_REPORTS, x) }
  return x
}
export const saveReports = r => write(KEY_REPORTS, r)
export const reportsOf = email => getReports().filter(r => r.email === email)
export const latestOf = email => { const l = reportsOf(email); return l[l.length - 1] }
export const newId = uid

// ---------- notices ----------
export function getNotices() {
  let x = read(KEY_NOTICE, null)
  if (!Array.isArray(x)) { x = demoNotices.map(n => ({ ...n, id: uid() })); write(KEY_NOTICE, x); return x }
  if (x.some(n => !n.id)) { x.forEach(n => { if (!n.id) n.id = uid() }); write(KEY_NOTICE, x) }
  return x
}
export const saveNotices = n => write(KEY_NOTICE, n)
export const getSeen = id => read('sps_seen_' + id, [])
export const setSeen = (id, ids) => write('sps_seen_' + id, ids)

// ---------- session ----------
export const getSession = () => read(KEY_SESSION, null)
export const setSession = s => write(KEY_SESSION, s)
export const clearSession = () => localStorage.removeItem(KEY_SESSION)

// ---------- student extras: assignments & fees ----------
const addDays = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d }
export const getAssignments = () => [
  ['a1', 'Java OOP Program', 'Java Programming', -1], ['a2', 'Binary Search Tree', 'Data Structures', 3],
  ['a3', 'SQL Queries', 'Database Systems', 5], ['a4', 'Matrix Operations Worksheet', 'Engineering Mathematics', 9],
  ['a5', 'Process Scheduling Report', 'Operating Systems', 12]
].map(([id, title, subject, off]) => ({ id, title, subject, due: addDays(off) }))
export const getDone = email => read('sps_done_' + email, ['a2'])
export const setDone = (email, d) => write('sps_done_' + email, d)
export const getFee = email => read('sps_fee_' + email, { total: 85000, paid: 70000, receipts: [] })
export const setFee = (email, f) => write('sps_fee_' + email, f)

// ---------- activity log (admin dashboard) ----------
export const getActivity = () => read(KEY_ACT, [])
export function logActivity(text) { write(KEY_ACT, [{ text, ts: Date.now() }, ...getActivity()].slice(0, 20)) }
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago'
  return Math.floor(s / 86400) + ' d ago'
}

// ---------- helpers ----------
export const initials = n => (n || '?').split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase()
export const gradeOf = m => (m >= 90 ? 'A+' : m >= 80 ? 'A' : m >= 70 ? 'B' : m >= 60 ? 'C' : 'D')
export const gradeClass = g => (g === 'A+' || g === 'A' ? '' : g === 'B' || g === 'C' ? ' warn' : ' red')
export const inr = n => '₹' + Number(n).toLocaleString('en-IN')
export const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

export const toast = (t, kind = 'ok') => window.dispatchEvent(new CustomEvent('sps-toast', { detail: { t, kind } }))
export const isDark = () => document.body.classList.contains('dark')
export function toggleDark() {
  document.body.classList.toggle('dark')
  localStorage.setItem('sps_dark', isDark())
  return isDark()
}
export function resetAll() {
  Object.keys(localStorage).filter(k => k.startsWith('sps_') && k !== 'sps_dark').forEach(k => localStorage.removeItem(k))
}

// ---- login lockout (5 wrong attempts = 30 seconds) ----
export const getLock = () => read(KEY_LOCK, {})
export const setLock = l => write(KEY_LOCK, l)
export const clearLock = () => localStorage.removeItem(KEY_LOCK)

// ---- CSV / download helpers ----
export function download(name, text, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }))
  a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 500)
}
const csvCell = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }
export const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n')
