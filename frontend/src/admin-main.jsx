import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AdminPanel from './pages/AdminPanel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)

// PWA: register the service worker in production only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
