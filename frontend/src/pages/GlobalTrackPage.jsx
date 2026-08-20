import React, { Suspense, lazy } from 'react';
import { GlobalTrackProvider, useGlobalTrack } from '../context/GlobalTrackContext';
import Header from '../components/Header';
import ErrorBoundary from '../components/ErrorBoundary';
import './GlobalTrackMobile.css';

// react-globe.gl + three.js is ~1.9 MB  lazy-load so the cockpit shell
// paints in <1 s on mobile and the globe loads in the background.
const GlobeMap = lazy(() => import('../components/GlobeMap'));
const TelemetrySidebar = lazy(() => import('../components/TelemetrySidebar'));
// Leaflet is heavy (~150 KB): load it only when the user opens the real map,
// never on initial cockpit paint (protects LCP / Core Web Vitals).
const LiveMapView = lazy(() => import('../components/LiveMapView'));

const RealMapLayer = () => {
  const { selectedShipment, mapFocus, closeMap } = useGlobalTrack();
  if (!mapFocus || !selectedShipment) return null;
  return (
    <Suspense fallback={null}>
      <LiveMapView
        shipment={selectedShipment}
        focusStep={mapFocus.stepIndex}
        onClose={closeMap}
      />
    </Suspense>
  );
};

const GlobalTrackPage = () => {
  return (
    <GlobalTrackProvider>
      <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
        {/* Full-screen globe background (lazy + error-bounded) */}
        <div className="absolute inset-0">
          <ErrorBoundary section="GlobeMap">
            <Suspense fallback={<div className="w-full h-full bg-gray-900" />}>
              <GlobeMap />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Fixed chrome */}
        <Header />
        <ErrorBoundary section="TelemetrySidebar">
          <Suspense fallback={null}>
            <TelemetrySidebar />
          </Suspense>
        </ErrorBoundary>

        {/* Real geospatial map (Leaflet + OSM / Esri), lazy */}
        <RealMapLayer />
      </div>
    </GlobalTrackProvider>
  );
};

export default GlobalTrackPage;
