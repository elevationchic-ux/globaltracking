import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { Plane, Truck, Ship, TrainFront, X } from 'lucide-react';
import { useGlobalTrack, LOGISTICS_HUBS } from '../context/GlobalTrackContext';

// Theme → globe texture (three-globe example imgs, unpkg CDN).
const THEME_TEXTURES = {
  dark: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
  satellite: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  street: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  light: 'https://unpkg.com/three-globe/example/img/earth-day.jpg',
};

const STATUS_COLORS = {
  DELIVERED: '#10b981',
  'IN TRANSIT': '#3b82f6',
  'OUT FOR DELIVERY': '#f59e0b',
  PENDING: '#ef4444',
  EXCEPTION: '#ef4444',
};

const isActive = (s) => s.status === 'IN TRANSIT' || s.status === 'OUT FOR DELIVERY';

/* ── Great-circle interpolation (slerp between endpoint unit vectors) ── */
const toUnitVec = (lat, lng) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
};

const slerp = (a, b, t) => {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return a;
  const sinOmega = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / sinOmega;
  const wb = Math.sin(t * omega) / sinOmega;
  return [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]];
};

const vecToLatLng = (v) => {
  const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, v[1]))) * 180) / Math.PI;
  let lng = (Math.atan2(v[2], v[0]) * 180) / Math.PI - 180;
  lng = ((lng + 540) % 360) - 180;
  return { lat, lng };
};

/* Module-scope cache keeping marker data object identity stable across
 * renders: three-globe tweens positions in place for known objects instead of
 * recreating DOM nodes on every progress commit. Keyed by shipment + playback
 * state so a play/pause toggle rebuilds elements with the right blink class. */
const markerObjCache = new Map();

/* ── Lucide SVG markup for HTML-layer markers (not React-rendered) ── */
const MARKER_SVGS = {
  air: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
  ground: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  sea: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 12V6l-7-3-7 3v2"/><path d="M12 3v9"/></svg>`,
  rail: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,
};

const GlobeMap = () => {
  const {
    theme,
    shipments,
    aliases,
    selectedShipment,
    selectShipment,
    playback,
    progressById,
  } = useGlobalTrack();

  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [globeSize, setGlobeSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [overlayOpen, setOverlayOpen] = useState(true);

  // ResizeObserver keeps the globe sized to its container, not a one-time read.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setGlobeSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preload all four textures once to avoid flicker on theme switch.
  useEffect(() => {
    Object.values(THEME_TEXTURES).forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Gentle idle rotation. It pauses while the user grabs/scrolls the globe
  // and always resumes a few seconds after the interaction ends, so the
  // planet keeps living even after being touched.
  useEffect(() => {
    const globe = globeRef.current;
    const el = containerRef.current;
    if (!globe || !el) return;
    let resumeTimer = null;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    if (import.meta.env.DEV) window.__globeControls = globe.controls();

    // Tilt camera down slightly so the top of the globe isn't cut off
    globe.pointOfView({ lat: 15, lng: 0, altitude: 2.5 });

    const pause = () => {
      globe.controls().autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const scheduleResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        globe.controls().autoRotate = true;
      }, 3500);
    };
    const onWheel = () => {
      pause();
      scheduleResume();
    };

    el.addEventListener('pointerdown', pause);
    el.addEventListener('pointerup', scheduleResume);
    el.addEventListener('pointerleave', scheduleResume);
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('pointerup', scheduleResume);
      el.removeEventListener('pointerleave', scheduleResume);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Fly the camera to the selected route's midpoint.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedShipment) return;
    const mid = vecToLatLng(
      slerp(
        toUnitVec(selectedShipment.from.lat, selectedShipment.from.lng),
        toUnitVec(selectedShipment.to.lat, selectedShipment.to.lng),
        0.5
      )
    );
    globe.pointOfView({ lat: mid.lat, lng: mid.lng, altitude: 2.1 }, 900);
  }, [selectedShipment]);

  // Arcs built from the shared shipments (single source of truth).
  const arcs = useMemo(
    () =>
      shipments.map((s) => ({
        ...s,
        startLat: s.from.lat,
        startLng: s.from.lng,
        endLat: s.to.lat,
        endLng: s.to.lng,
        color: STATUS_COLORS[s.status] || '#94a3b8',
      })),
    [shipments]
  );

  // City dots (shipment endpoints) + real logistics hubs on one point layer.
  const points = useMemo(() => {
    const seen = new Set();
    const out = [];
    shipments.forEach((s) => {
      [s.from, s.to].forEach((c) => {
        if (!seen.has(c.name)) {
          seen.add(c.name);
          out.push({ lat: c.lat, lng: c.lng, name: c.name, kind: 'city' });
        }
      });
    });
    LOGISTICS_HUBS.forEach((h) => out.push({ ...h, kind: 'hub' }));
    return out;
  }, [shipments]);

  // Pulse rings on origin/destination of live & blocked shipments.
  const rings = useMemo(
    () =>
      shipments
        .filter((s) => isActive(s) || s.status === 'EXCEPTION')
        .flatMap((s) => [
          { lat: s.from.lat, lng: s.from.lng, color: STATUS_COLORS[s.status] },
          { lat: s.to.lat, lng: s.to.lng, color: STATUS_COLORS[s.status] },
        ]),
    [shipments]
  );

  // Moving markers: active shipments positioned along their great-circle
  // route at t = progressById[id]. Driven by the provider's throttled clock.
  const markers = useMemo(
    () =>
      shipments.filter(isActive).map((s) => {
        const t = progressById[s.id] ?? s.progress / 100;
        const pos = vecToLatLng(
          slerp(toUnitVec(s.from.lat, s.from.lng), toUnitVec(s.to.lat, s.to.lng), t)
        );
        const key = `${s.id}:${playback.isPlaying}`;
        let obj = markerObjCache.get(key);
        if (!obj) {
          obj = {
            id: s.id,
            status: s.status,
            carrier: s.finalCarrier,
            mode: s.mode,
            to: s.to,
          };
          markerObjCache.set(key, obj);
        }
        obj.lat = pos.lat;
        obj.lng = pos.lng;
        return obj;
      }),
    [shipments, progressById, playback.isPlaying]
  );

  const handleArcClick = (arc) => {
    selectShipment(arc.id);
    setOverlayOpen(true);
  };

  const handleMarkerClick = (marker) => {
    selectShipment(marker.id);
    setOverlayOpen(true);
  };

  // Stable reference: three-globe clears + rebuilds all html elements whenever
  // the htmlElement accessor identity changes, so only vary it on play toggle.
  const buildMarkerEl = useCallback(
    (d) => {
      const el = document.createElement('div');
      el.className = playback.isPlaying ? 'marker-glow marker-live' : 'marker-glow';
      el.style.cssText = `color: ${STATUS_COLORS[d.status]}; cursor: pointer; pointer-events: auto; line-height: 0;`;
      el.title = `${d.status} · ${d.carrier} → ${d.to.name}`;
      el.innerHTML = MARKER_SVGS[d.mode] || MARKER_SVGS.ground;
      return el;
    },
    [playback.isPlaying]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-900">
      <div className="w-full h-full globe-glow">
        <Globe
          ref={globeRef}
          globeImageUrl={THEME_TEXTURES[theme] || THEME_TEXTURES.dark}
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          width={globeSize.width}
          height={globeSize.height}
          arcsData={arcs}
          arcStartLat={(d) => d.startLat}
          arcStartLng={(d) => d.startLng}
          arcEndLat={(d) => d.endLat}
          arcEndLng={(d) => d.endLng}
          arcColor={(d) => d.color}
          arcAltitude={(d) => (isActive(d) ? 0.28 : 0.08)}
          arcStroke={(d) => (d.id === selectedShipment?.id ? 1.8 : isActive(d) ? 1.4 : 0.45)}
          arcDashLength={(d) => (isActive(d) ? 0.08 : 0)}
          arcDashGap={(d) => (isActive(d) ? 0.04 : 0)}
          arcDashAnimateTime={(d) => (isActive(d) ? 1800 : 0)}
          arcLabel={(d) =>
            `<div style="font-family: ui-monospace, monospace; font-size: 11px; padding: 6px 10px; background: rgba(3,7,18,0.92); border: 1px solid rgba(34,211,238,0.5); border-radius: 6px; color: #e5e7eb; box-shadow: 0 0 12px rgba(34,211,238,0.35);">
              <div style="color: ${STATUS_COLORS[d.status]}; font-weight: 700; letter-spacing: 0.08em;">${d.status}</div>
              <div style="color: #22d3ee;">${d.originCarrier} → ${d.finalCarrier}</div>
              <div>→ ${d.to.name}</div>
            </div>`
          }
          onArcClick={handleArcClick}
          pointsData={points}
          pointLat={(d) => d.lat}
          pointLng={(d) => d.lng}
          pointColor={(d) => (d.kind === 'hub' ? '#f59e0b' : '#06b6d4')}
          pointAltitude={(d) => (d.kind === 'hub' ? 0.03 : 0.05)}
          pointRadius={(d) => (d.kind === 'hub' ? 0.55 : 0.8)}
          pointLabel={(d) =>
            `<div style="font-family: monospace; color: ${d.kind === 'hub' ? '#fbbf24' : '#22d3ee'};">${d.kind === 'hub' ? '⬢ ' : ''}${d.name}</div>`
          }
          ringsData={rings}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={(d) => d.color}
          ringMaxRadius={4}
          ringPropagationSpeed={1.2}
          ringRepeatPeriod={1400}
          htmlElementsData={markers}
          htmlLat={(d) => d.lat}
          htmlLng={(d) => d.lng}
          htmlElement={buildMarkerEl}
          htmlAltitude={0.035}
          htmlTransitionDuration={120}
          onHtmlElementClick={handleMarkerClick}
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.15}
          backgroundColor="#111827"
        />
      </div>

      {/* Selected shipment overlay (synced with sidebar via context) */}
      {selectedShipment && overlayOpen && (
        <div className="globe-route-overlay absolute top-32 left-4 bg-gray-900/90 backdrop-blur-md border border-cyan-500/60 neon-glow rounded-lg p-4 max-w-sm z-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold neon-text-cyan">Route Details</h3>
            <button
              onClick={() => setOverlayOpen(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Close route details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tracking:</span>
              <span className="text-white font-mono">{selectedShipment.trackingNumber}</span>
            </div>
            {aliases[selectedShipment.id] && (
              <div className="flex justify-between">
                <span className="text-gray-400">Alias:</span>
                <span className="text-cyan-300 font-mono">{aliases[selectedShipment.id]}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span>
              <span className="text-white font-mono">{selectedShipment.from.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <span className="text-white font-mono">{selectedShipment.to.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Carriers:</span>
              <span className="text-cyan-400 font-mono">
                {selectedShipment.originCarrier}
                {selectedShipment.finalCarrier !== selectedShipment.originCarrier &&
                  ` → ${selectedShipment.finalCarrier}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className="font-mono"
                style={{ color: STATUS_COLORS[selectedShipment.status] }}
              >
                {selectedShipment.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="text-white font-mono flex items-center">
                {selectedShipment.mode === 'air' ? (
                  <Plane className="w-4 h-4 mr-1" />
                ) : selectedShipment.mode === 'sea' ? (
                  <Ship className="w-4 h-4 mr-1" />
                ) : selectedShipment.mode === 'rail' ? (
                  <TrainFront className="w-4 h-4 mr-1" />
                ) : (
                  <Truck className="w-4 h-4 mr-1" />
                )}
                {selectedShipment.transportMode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="globe-legend absolute bottom-4 left-4 bg-gray-900/85 backdrop-blur-md border border-gray-700 rounded-lg p-3 z-50">
        <h4 className="text-white text-sm font-bold mb-2 tracking-wider">Route Status</h4>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Delivered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">In Transit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-300">Out for Delivery</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Exception / Customs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-300">Logistics Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeMap;
