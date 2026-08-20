import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { I18nProvider } from './i18n/I18nContext.jsx'
import HomePage from './pages/HomePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import { AboutPage, PrivacyPage, TermsPage, LegalNoticePage } from './pages/LegalPages.jsx'
import { CarrierIndexPage, CarrierLandingPage } from './pages/CarrierPages.jsx'
import { HelpIndexPage, HelpArticlePage } from './pages/HelpPages.jsx'
import {
  CorridorIndexPage,
  CorridorPage,
  CarrierStatusPage,
} from './pages/CorridorPages.jsx'

// Heavy routes are code-split so the landing page ships a minimal payload
// (react-globe.gl alone is ~1MB  critical for Core Web Vitals / SEO).
const GlobalTrackPage = lazy(() => import('./pages/GlobalTrackPage.jsx'))
const PricingPlans = lazy(() => import('./components/PricingPlans.jsx'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard.jsx'))
const TrustSignals = lazy(() => import('./components/TrustSignals.jsx'))

function RouteFallback() {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/track/:number" element={<ResultsPage />} />
            <Route path="/global" element={<GlobalTrackPage />} />
            <Route path="/pricing" element={<PricingPlans />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/trust" element={<TrustSignals />} />
            {/* SEO: carrier landing pages (EN + FR paths) */}
            <Route path="/carriers" element={<CarrierIndexPage />} />
            <Route path="/tracking/:slug" element={<CarrierLandingPage />} />
            <Route path="/suivi/:slug" element={<CarrierLandingPage />} />
            {/* pSEO silo: carrier × status pages (12 carriers × 6 statuses) */}
            <Route path="/tracking/:slug/status/:statusSlug" element={<CarrierStatusPage />} />
            <Route path="/suivi/:slug/status/:statusSlug" element={<CarrierStatusPage />} />
            {/* pSEO silo: international corridors (china-to-france, …) */}
            <Route path="/corridors" element={<CorridorIndexPage />} />
            <Route path="/corridors/:slug" element={<CorridorPage />} />
            {/* SEO: status lexicon / help center */}
            <Route path="/help" element={<HelpIndexPage />} />
            <Route path="/help/:slug" element={<HelpArticlePage />} />
            {/* Legal trust signals (EU/US requirement) */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/legal" element={<LegalNoticePage />} />
          </Routes>
        </Suspense>
        {/* GDPR / CCPA consent gate  shown until the visitor chooses */}
        <CookieConsent />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)

// PWA: register the service worker in production only (dev server would cache stale bundles).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
