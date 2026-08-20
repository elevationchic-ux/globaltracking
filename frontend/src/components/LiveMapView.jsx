import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Layers, Satellite, Map as StreetMap } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOGISTICS_HUBS } from '../context/GlobalTrackContext';
import { haversineKm, formatDistance, estimateTransitHours, formatDuration } from '../utils/geo';

/**
 * Real geospatial map (Leaflet + OpenStreetMap / Esri World Imagery).
 * Loaded lazily only when the user asks for it, so it never hurts LCP.
 *
 * Features:
 *  - Street (OSM) ↔ Satellite (Esri World Imagery, sub-meter at high zoom)
 *  - map.flyTo() cinematic zoom on each tracking step (zoom 16 on satellite)
 *  - Real facility coordinates (airports, sort hubs, depots)
 *  - Privacy radius around the delivery address (neighborhood, not door)
 *  - scrollWheelZoom off until the user clicks the map
 */

// Real facility anchors (airports / sort centers referenced in timelines).
const FACILITIES = {
  jfk: { name: 'JFK International  US Customs', lat: 40.6413, lng: -73.7781 },
  cdg: { name: 'Paris CDG  EU Sort Center', lat: 49.0097, lng: 2.5479 },
  heathrow: { name: 'London Heathrow WSC', lat: 51.47, lng: -0.4543 },
  narita: { name: 'Tokyo Narita Gateway', lat: 35.772, lng: 140.3929 },
  anchorage: { name: 'Anchorage Transfer Hub', lat: 61.2181, lng: -149.8997 },
  pvg: { name: 'Shanghai PVG  Export Customs', lat: 31.1443, lng: 121.8083 },
  camden: { name: 'Camden Delivery Depot', lat: 51.5391, lng: -0.1426 },
  memphis: { name: 'Memphis FedEx SuperHub', lat: 35.1495, lng: -90.049 },
  louisville: { name: 'Louisville UPS Worldport', lat: 38.2527, lng: -85.7585 },
  leipzig: { name: 'Leipzig DHL EME Hub', lat: 51.3397, lng: 12.3731 },
};

const CITY_POINTS = {
  Paris: [48.8566, 2.3522], 'New York': [40.7128, -74.006], Tokyo: [35.6762, 139.6503],
  London: [51.5074, -0.1278], Singapore: [1.3521, 103.8198], Dubai: [25.2048, 55.2708],
  Sydney: [-33.8688, 151.2093], 'Los Angeles': [34.0522, -118.2437],
  Shanghai: [31.2304, 121.4737], Frankfurt: [50.1109, 8.6821], Toronto: [43.6532, -79.3832],
  Berlin: [52.52, 13.405], Lyon: [45.764, 4.8357], Amsterdam: [52.3676, 4.9041],
  Antwerp: [51.2194, 4.4025], Atlanta: [33.749, -84.388], Chicago: [41.8781, -87.6298],
  Miami: [25.7617, -80.1918], Breda: [51.5719, 4.7683],
};

/** Resolve a timeline step label to real coordinates (facility > city). */
export const resolveStepCoords = (label) => {
  const low = (label || '').toLowerCase();
  for (const [key, fac] of Object.entries(FACILITIES)) {
    if (low.includes(key)) return { ...fac };
  }
  for (const [name, coords] of Object.entries(CITY_POINTS)) {
    if (low.includes(name.toLowerCase())) return { name, lat: coords[0], lng: coords[1] };
  }
  return null;
};

/** Quadratic-bezier arc between two points (looks like a real flight path). */
const arcBetween = ([aLat, aLng], [bLat, bLng], points = 64) => {
  const mx = (aLng + bLng) / 2;
  const my = (aLat + bLat) / 2;
  const dist = Math.hypot(bLng - aLng, bLat - aLat);
  // Control point pushed perpendicular to the segment.
  const cx = mx - ((bLat - aLat) / dist) * dist * 0.18;
  const cy = my + ((bLng - aLng) / dist) * dist * 0.18;
  const pts = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const lat = (1 - t) ** 2 * aLat + 2 * (1 - t) * t * cy + t ** 2 * bLat;
    const lng = (1 - t) ** 2 * aLng + 2 * (1 - t) * t * cx + t ** 2 * bLng;
    pts.push([lat, lng]);
  }
  return pts;
};

const divIcon = (html, size = 18, cls = '') =>
  L.divIcon({ className: `lm-divicon ${cls}`, html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const LiveMapView = ({ shipment, focusStep, onClose }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ osm: null, esri: null });
  const [baseLayer, setBaseLayer] = useState('satellite');
  const focusKey = focusStep == null ? 'route' : focusStep;

  // Real route figures  computed, never hardcoded.
  const routeStats = useMemo(() => {
    const distanceKm = haversineKm(shipment.from, shipment.to);
    const hours = estimateTransitHours(distanceKm, shipment.mode === 'air' ? 'air' : 'ground');
    return { distanceKm, hours };
  }, [shipment]);

  // Init map once.
  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false, // enable only after click (page-scroll friendly)
      worldCopyJump: true,
      maxZoom: 19,
      attributionControl: true,
    }).setView([shipment.from.lat, shipment.from.lng], 3);

    map.on('click', () => map.scrollWheelZoom.enable());

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    const esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Imagery &copy; Esri  Source: Esri, Maxar, Earthstar Geographics',
      }
    );

    layersRef.current = { osm, esri };
    mapRef.current = map;

    // Route + markers layer group.
    const from = [shipment.from.lat, shipment.from.lng];
    const to = [shipment.to.lat, shipment.to.lng];
    const arc = arcBetween(from, to);

    L.polyline(arc, { color: '#06b6d4', weight: 2.5, opacity: 0.85, dashArray: '6 8' }).addTo(map);

    // Origin / destination markers.
    L.marker(from, {
      icon: divIcon('<div class="lm-dot lm-dot-origin"></div>', 18),
      title: `Origin  ${shipment.from.name}`,
    }).addTo(map).bindPopup(`<b>Origin</b><br/>${shipment.from.name}`);

    L.marker(to, {
      icon: divIcon('<div class="lm-dot lm-dot-dest"></div>', 18),
      title: `Delivery area  ${shipment.to.name}`,
    }).addTo(map).bindPopup(`<b>Delivery area</b><br/>${shipment.to.name}`);

    // Privacy radius: we show the neighborhood, never the exact door.
    L.circle(to, {
      radius: 2500,
      color: '#22c55e',
      weight: 1.5,
      fillColor: '#22c55e',
      fillOpacity: 0.08,
    }).addTo(map).bindPopup('Delivery neighborhood  exact address kept private');

    // Real facility markers on the route steps.
    shipment.timeline.forEach((step) => {
      if (!step.completed) return;
      const loc = resolveStepCoords(step.label);
      if (!loc) return;
      L.marker([loc.lat, loc.lng], {
        icon: divIcon('<div class="lm-dot lm-dot-step"></div>', 14),
        title: step.label,
      }).addTo(map).bindPopup(`<b>${step.label}</b><br/>${loc.name || ''}`);
    });

    // Current estimated position along the arc.
    const p = Math.max(0, Math.min(1, (shipment.progress ?? 0) / 100));
    const cur = arc[Math.min(arc.length - 1, Math.round(p * (arc.length - 1)))];
    if (shipment.status !== 'DELIVERED') {
      L.marker(cur, {
        icon: divIcon('<div class="lm-dot lm-dot-live"></div>', 22),
        title: 'Estimated current position',
      }).addTo(map).bindPopup('<b>Estimated current position</b><br/>Interpolated from last scan');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment.id]);

  // Base layer switching.
  useEffect(() => {
    const map = mapRef.current;
    const { osm, esri } = layersRef.current;
    if (!map || !osm || !esri) return;
    if (baseLayer === 'satellite') {
      if (map.hasLayer(osm)) map.removeLayer(osm);
      esri.addTo(map);
    } else {
      if (map.hasLayer(esri)) map.removeLayer(esri);
      osm.addTo(map);
    }
  }, [baseLayer]);

  // Cinematic focus: fly to the step facility, or fit the whole route.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focusStep == null) {
      const bounds = L.latLngBounds([
        [shipment.from.lat, shipment.from.lng],
        [shipment.to.lat, shipment.to.lng],
      ]).pad(0.25);
      map.flyToBounds(bounds, { duration: 1.4 });
    } else {
      const step = shipment.timeline[focusStep];
      const loc = step ? resolveStepCoords(step.label) : null;
      if (loc) {
        map.flyTo([loc.lat, loc.lng], 16, { duration: 1.6 });
      } else {
        const fallback = [shipment.to.lat, shipment.to.lng];
        map.flyTo(fallback, 11, { duration: 1.6 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return (
    <div className="live-map-overlay">
      <div ref={containerRef} className="live-map-canvas" />

      {/* Controls */}
      <div className="live-map-controls">
        <div className="live-map-layers" role="group" aria-label="Base layer">
          <button
            onClick={() => setBaseLayer('street')}
            className={baseLayer === 'street' ? 'active' : ''}
            title="Street  OpenStreetMap"
          >
            <StreetMap size={14} /> Street
          </button>
          <button
            onClick={() => setBaseLayer('satellite')}
            className={baseLayer === 'satellite' ? 'active' : ''}
            title="Satellite  Esri World Imagery"
          >
            <Satellite size={14} /> Satellite
          </button>
        </div>
        <button onClick={onClose} className="live-map-close" aria-label="Close map">
          <X size={18} />
        </button>
      </div>

      <p className="live-map-hint">
        <Layers size={12} /> Click the map to enable wheel zoom · markers = real facilities
      </p>

      {/* Real great-circle figures for this route */}
      <div className="live-map-stats" aria-label="Route figures">
        <span>
          {shipment.from.name} → {shipment.to.name}
        </span>
        <span>
          {formatDistance(routeStats.distanceKm)} · {formatDuration(routeStats.hours)}{' '}
          {shipment.mode === 'air' ? '✈' : '🚚'}
        </span>
      </div>
    </div>
  );
};

export default LiveMapView;
