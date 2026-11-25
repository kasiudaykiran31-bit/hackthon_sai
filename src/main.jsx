import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './style.css'

const saved = localStorage.getItem('sps_dark')
if (saved === 'true' || (saved === null && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
