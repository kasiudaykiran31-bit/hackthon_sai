import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Student from './pages/Student.jsx'
import Admin from './pages/Admin.jsx'
import Parent from './pages/Parent.jsx'
import { ToastHost, DialogHost } from './ui.jsx'
import { getSession, getUsers } from './store.js'

function Guard({ role, children }) {
  const s = getSession()
  if (!s || s.role !== role || !getUsers().find(u => u.email === s.email)) return <Navigate to="/" replace />
  return children
}

// Already logged in? Skip the login page.
function Home() {
  const s = getSession()
  if (s && getUsers().find(u => u.email === s.email)) return <Navigate to={'/' + s.role} replace />
  return <Login />
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <>
      <div className="route" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student" element={<Guard role="student"><Student /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
          <Route path="/parent" element={<Guard role="parent"><Parent /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ToastHost />
      <DialogHost />
    </>
  )
}
