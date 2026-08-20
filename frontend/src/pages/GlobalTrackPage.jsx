import React, { Suspense, lazy } from 'react';
import { GlobalTrackProvider, useGlobalTrack } from '../context/GlobalTrackContext';
import Header from '../components/Header';
import GlobeMap from '../components/GlobeMap';
import TelemetrySidebar from '../components/TelemetrySidebar';
import './GlobalTrackMobile.css';

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
        {/* Full-screen globe background */}
        <div className="absolute inset-0">
          <GlobeMap />
        </div>

        {/* Fixed chrome */}
        <Header />
        <TelemetrySidebar />

        {/* Real geospatial map (Leaflet + OSM / Esri), lazy */}
        <RealMapLayer />
      </div>
    </GlobalTrackProvider>
  );
};

export default GlobalTrackPage;
