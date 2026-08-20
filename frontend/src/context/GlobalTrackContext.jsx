import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';

/**
 * City coordinates + IANA timezones (single source of truth).
 * Timezones drive the "event local time vs your time" conversion.
 */
const CITIES = {
  Paris: { name: 'Paris', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  'New York': { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  Tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
  London: { name: 'London', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  Singapore: { name: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
  Dubai: { name: 'Dubai', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  Sydney: { name: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
  'Los Angeles': { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles' },
  Shanghai: { name: 'Shanghai', lat: 31.2304, lng: 121.4737, tz: 'Asia/Shanghai' },
  Frankfurt: { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, tz: 'Europe/Berlin' },
  Toronto: { name: 'Toronto', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' },
  Berlin: { name: 'Berlin', lat: 52.52, lng: 13.405, tz: 'Europe/Berlin' },
  Lyon: { name: 'Lyon', lat: 45.764, lng: 4.8357, tz: 'Europe/Paris' },
  Amsterdam: { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, tz: 'Europe/Amsterdam' },
  Antwerp: { name: 'Antwerp', lat: 51.2194, lng: 4.4025, tz: 'Europe/Brussels' },
  Atlanta: { name: 'Atlanta', lat: 33.749, lng: -84.388, tz: 'America/New_York' },
  Chicago: { name: 'Chicago', lat: 41.8781, lng: -87.6298, tz: 'America/Chicago' },
  Miami: { name: 'Miami', lat: 25.7617, lng: -80.1918, tz: 'America/New_York' },
};

const city = (n) => ({ ...CITIES[n] });

/**
 * Major logistics hubs rendered on the globe (real network anchors).
 */
export const LOGISTICS_HUBS = [
  { name: 'Memphis · FedEx SuperHub', lat: 35.1495, lng: -90.049 },
  { name: 'Louisville · UPS Worldport', lat: 38.2527, lng: -85.7585 },
  { name: 'Leipzig · DHL EME Hub', lat: 51.3397, lng: 12.3731 },
  { name: 'Singapore · APAC Gateway', lat: 1.3521, lng: 103.8198 },
  { name: 'Dubai · MEA Gateway', lat: 25.2048, lng: 55.2708 },
  { name: 'Paris CDG · EU Sort Center', lat: 49.0097, lng: 2.5479 },
];

/**
 * All shipment data lives here  single source of truth consumed by GlobeMap,
 * TelemetrySidebar and the Header search. Tracking numbers use real carrier
 * formats so the universal detection engine recognizes them.
 *
 * Shipment shape:
 * {
 *   id, trackingNumber, status,
 *   originCarrier, finalCarrier,        // multi-leg handover chain
 *   service, weight, pieces,            // shipment facts
 *   from / to: { name, lat, lng, tz },
 *   mode, transportMode, elapsedTime, distanceKm,
 *   estimatedArrival (destination local wall-clock) | etaStatus,
 *   progress (0..100), timeline: [{ label, completed, time, tz }],
 *   agent, deliveryWindow?, courier?, pod?, pickupPoint?, customs?, exception?
 * }
 */
export const SHIPMENTS = [
  {
    id: 'shp-dhl-9941-de',
    trackingNumber: '7321845960',
    status: 'IN TRANSIT',
    originCarrier: 'DHL Express',
    finalCarrier: 'DHL Express',
    service: 'Express Worldwide',
    weight: '2.4 kg',
    pieces: 1,
    from: city('Paris'),
    to: city('New York'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '2d 03h 10m',
    distanceKm: 5837,
    estimatedArrival: '2026-08-19 14:30',
    progress: 65,
    stageStats: { label: 'US import clearance  JFK', avgHours: 36, elapsedHours: 22 },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-15 09:00', tz: 'Europe/Paris' },
      { label: 'Picked up  Paris 11e', completed: true, time: '2026-08-15 14:30', tz: 'Europe/Paris' },
      { label: 'Departed facility  Paris CDG Hub', completed: true, time: '2026-08-16 08:00', tz: 'Europe/Paris' },
      { label: 'Customs clearance completed  JFK', completed: true, time: '2026-08-17 06:00', tz: 'America/New_York' },
      { label: 'Out for delivery', completed: false, time: 'Pending', tz: 'America/New_York' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'America/New_York' },
    ],
    agent: {
      name: 'Hans Weber',
      role: 'International Logistics Support',
      status: 'Online',
    },
  },
  {
    id: 'shp-fedex-4417-jp',
    trackingNumber: '794644790136',
    status: 'OUT FOR DELIVERY',
    originCarrier: 'FedEx',
    finalCarrier: 'FedEx',
    service: 'International Priority',
    weight: '1.1 kg',
    pieces: 1,
    from: city('Tokyo'),
    to: city('London'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '3d 11h 42m',
    distanceKm: 9560,
    estimatedArrival: '2026-08-18 18:00',
    progress: 88,
    deliveryWindow: '14:00 – 15:00',
    courier: { name: 'D. Mitchell', vehicle: 'Van FD-2187', stopsAway: 6 },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-14 07:15', tz: 'Asia/Tokyo' },
      { label: 'Picked up  Tokyo Narita Gateway', completed: true, time: '2026-08-14 12:00', tz: 'Asia/Tokyo' },
      { label: 'In transit  Anchorage transfer', completed: true, time: '2026-08-15 03:30', tz: 'America/Anchorage' },
      { label: 'Customs clearance completed  London', completed: true, time: '2026-08-17 09:45', tz: 'Europe/London' },
      { label: 'Out for delivery  Camden depot', completed: true, time: '2026-08-18 06:20', tz: 'Europe/London' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'Europe/London' },
    ],
    agent: {
      name: 'Yuki Tanaka',
      role: 'Pacific Rim Operations',
      status: 'Online',
    },
  },
  {
    id: 'shp-ups-7723-us',
    trackingNumber: '1Z2F65E90394751284',
    status: 'DELIVERED',
    originCarrier: 'UPS',
    finalCarrier: 'UPS',
    service: 'Ground',
    weight: '6.8 kg',
    pieces: 2,
    from: city('Atlanta'),
    to: city('Los Angeles'),
    mode: 'ground',
    transportMode: 'Ground Express',
    elapsedTime: '3d 06h 05m',
    distanceKm: 3146,
    estimatedArrival: '2026-08-16 10:15',
    progress: 100,
    pod: {
      time: '2026-08-16 10:15',
      signedBy: 'M. Alvarez',
      gps: '34.0522° N, 118.2437° W',
      photo: true,
    },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-13 08:00', tz: 'America/New_York' },
      { label: 'Picked up  Atlanta, GA', completed: true, time: '2026-08-13 11:30', tz: 'America/New_York' },
      { label: 'Departed facility  Louisville Worldport', completed: true, time: '2026-08-14 02:10', tz: 'America/New_York' },
      { label: 'Arrived facility  Los Angeles, CA', completed: true, time: '2026-08-15 21:40', tz: 'America/Los_Angeles' },
      { label: 'Out for delivery', completed: true, time: '2026-08-16 06:40', tz: 'America/Los_Angeles' },
      { label: 'Delivered  signed by M. Alvarez', completed: true, time: '2026-08-16 10:15', tz: 'America/Los_Angeles' },
    ],
    agent: {
      name: 'Sarah Collins',
      role: 'US Domestic Support',
      status: 'Away',
    },
  },
  {
    id: 'shp-chinapost-8830-cn',
    trackingNumber: 'RR458231096CN',
    status: 'IN TRANSIT',
    originCarrier: 'China Post',
    finalCarrier: 'La Poste / Colissimo',
    service: 'Registered Airmail → Colissimo Domicile',
    weight: '0.6 kg',
    pieces: 1,
    from: city('Shanghai'),
    to: city('Paris'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '5d 14h 20m',
    distanceKm: 9273,
    estimatedArrival: '2026-08-22 12:00',
    progress: 58,
    stageStats: { label: 'Handover  Paris CDG Sort Center', avgHours: 30, elapsedHours: 12 },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-12 21:00', tz: 'Asia/Shanghai' },
      { label: 'Picked up  Shanghai EMS Center', completed: true, time: '2026-08-13 04:10', tz: 'Asia/Shanghai' },
      { label: 'Export customs cleared  Shanghai PVG', completed: true, time: '2026-08-14 09:00', tz: 'Asia/Shanghai' },
      { label: 'Arrived hub  Paris CDG Sort Center', completed: true, time: '2026-08-18 05:35', tz: 'Europe/Paris' },
      { label: 'Handover to La Poste / Colissimo', completed: false, time: 'Pending', tz: 'Europe/Paris' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'Europe/Paris' },
    ],
    agent: {
      name: 'Li Wei',
      role: 'Cross-Border Desk',
      status: 'Online',
    },
  },
  {
    id: 'shp-royalmail-5521-gb',
    trackingNumber: 'LN883452190GB',
    status: 'OUT FOR DELIVERY',
    originCarrier: 'Royal Mail',
    finalCarrier: 'Canada Post',
    service: 'International Tracked → Xpresspost',
    weight: '1.9 kg',
    pieces: 1,
    from: city('London'),
    to: city('Toronto'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '4d 01h 15m',
    distanceKm: 5712,
    estimatedArrival: '2026-08-18 21:00',
    progress: 92,
    stageStats: { label: 'Handover  Toronto Gateway', avgHours: 24, elapsedHours: 19 },
    deliveryWindow: '17:00 – 18:00',
    courier: { name: 'P. Tremblay', vehicle: 'Van CP-0453', stopsAway: 3 },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-13 10:00', tz: 'Europe/London' },
      { label: 'Picked up  London Heathrow WSC', completed: true, time: '2026-08-13 16:45', tz: 'Europe/London' },
      { label: 'Departed UK  Heathrow', completed: true, time: '2026-08-14 08:20', tz: 'Europe/London' },
      { label: 'Handover to Canada Post  Toronto Gateway', completed: true, time: '2026-08-17 03:10', tz: 'America/Toronto' },
      { label: 'Out for delivery  Toronto depot', completed: true, time: '2026-08-18 07:55', tz: 'America/Toronto' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'America/Toronto' },
    ],
    agent: {
      name: 'Camille Dubois',
      role: 'Atlantic Corridor Support',
      status: 'Online',
    },
  },
  {
    id: 'shp-dpd-1524-de',
    trackingNumber: '01524873690142',
    status: 'IN TRANSIT',
    originCarrier: 'DPD',
    finalCarrier: 'DPD',
    service: 'Classic (Predict)',
    weight: '3.2 kg',
    pieces: 1,
    from: city('Berlin'),
    to: city('Lyon'),
    mode: 'ground',
    transportMode: 'Road Network',
    elapsedTime: '1d 02h 40m',
    distanceKm: 1041,
    estimatedArrival: '2026-08-19 11:30',
    progress: 47,
    deliveryWindow: '10:30 – 11:30 (predicted)',
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-16 14:00', tz: 'Europe/Berlin' },
      { label: 'Picked up  Berlin depot 0152', completed: true, time: '2026-08-16 17:20', tz: 'Europe/Berlin' },
      { label: 'At hub  Berlin sort center', completed: true, time: '2026-08-17 01:05', tz: 'Europe/Berlin' },
      { label: 'In transit  via Frankfurt depot', completed: true, time: '2026-08-17 22:40', tz: 'Europe/Berlin' },
      { label: 'Out for delivery', completed: false, time: 'Pending', tz: 'Europe/Paris' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'Europe/Paris' },
    ],
    agent: {
      name: 'Mia Nguyen',
      role: 'European Ground Network',
      status: 'Online',
    },
  },
  {
    id: 'shp-usps-9400-us',
    trackingNumber: '9400111899223197428490',
    status: 'EXCEPTION',
    originCarrier: 'USPS',
    finalCarrier: 'USPS',
    service: 'Priority Mail International',
    weight: '1.4 kg',
    pieces: 1,
    from: city('Frankfurt'),
    to: city('New York'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '6d 08h 55m',
    distanceKm: 6204,
    estimatedArrival: null,
    etaStatus: 'ON_HOLD',
    progress: 74,
    stageStats: { label: 'Customs hold  JFK International', avgHours: 48, elapsedHours: 27 },
    customs: { status: 'HELD', amount: '$38.50', reason: 'Import duty & handling fee due' },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-11 09:30', tz: 'Europe/Berlin' },
      { label: 'Picked up  Frankfurt/Main', completed: true, time: '2026-08-11 15:00', tz: 'Europe/Berlin' },
      { label: 'Arrived US  JFK International', completed: true, time: '2026-08-16 04:20', tz: 'America/New_York' },
      { label: 'Held in customs  payment required', completed: true, time: '2026-08-17 11:25', tz: 'America/New_York' },
      { label: 'Out for delivery', completed: false, time: 'Pending', tz: 'America/New_York' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'America/New_York' },
    ],
    agent: {
      name: 'Rashid Al-Farsi',
      role: 'Customs Liaison',
      status: 'Online',
    },
  },
  {
    id: 'shp-postnl-3s41-nl',
    trackingNumber: '3SAB41C56D78E9',
    status: 'DELIVERED',
    originCarrier: 'PostNL',
    finalCarrier: 'PostNL',
    service: 'Pakket met bezorging aan punt',
    weight: '0.9 kg',
    pieces: 1,
    from: city('Amsterdam'),
    to: city('Antwerp'),
    mode: 'ground',
    transportMode: 'Road Network',
    elapsedTime: '1d 04h 10m',
    distanceKm: 136,
    estimatedArrival: '2026-08-17 18:00',
    progress: 100,
    pickupPoint: {
      name: 'PostNL-punt  Night&Day Station',
      address: 'Koningin Astridplein 27, 2018 Antwerpen',
      pin: '4 8 2 9 1 3',
      hours: 'Mon–Sat 06:00–22:00 · Sun 08:00–20:00',
      collected: false,
    },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-15 12:00', tz: 'Europe/Amsterdam' },
      { label: 'Picked up  Amsterdam sort center', completed: true, time: '2026-08-15 16:30', tz: 'Europe/Amsterdam' },
      { label: 'In transit  cross-border Breda scan', completed: true, time: '2026-08-16 06:15', tz: 'Europe/Amsterdam' },
      { label: 'Delivered to pickup point', completed: true, time: '2026-08-16 16:10', tz: 'Europe/Brussels' },
      { label: 'Ready for collection (PIN required)', completed: true, time: '2026-08-16 16:10', tz: 'Europe/Brussels' },
      { label: 'Collected by recipient', completed: false, time: 'Pending', tz: 'Europe/Brussels' },
    ],
    agent: {
      name: 'Kenji Sato',
      role: 'Benelux Support',
      status: 'Away',
    },
  },
  {
    id: 'shp-ups-8r74-us',
    trackingNumber: '1Z8R74Y20492583611',
    status: 'EXCEPTION',
    originCarrier: 'UPS',
    finalCarrier: 'UPS',
    service: 'Next Day Air',
    weight: '0.4 kg',
    pieces: 1,
    from: city('Chicago'),
    to: city('Miami'),
    mode: 'air',
    transportMode: 'Air Freight',
    elapsedTime: '1d 09h 30m',
    distanceKm: 1912,
    estimatedArrival: null,
    etaStatus: 'RESCHEDULING',
    progress: 86,
    exception: {
      reason: 'Delivery attempt failed  apartment number missing',
      attempt: '2026-08-17 13:42',
    },
    timeline: [
      { label: 'Shipment information received', completed: true, time: '2026-08-15 20:00', tz: 'America/Chicago' },
      { label: 'Picked up  Chicago, IL', completed: true, time: '2026-08-16 07:15', tz: 'America/Chicago' },
      { label: 'Departed facility  Chicago Hub', completed: true, time: '2026-08-16 14:00', tz: 'America/Chicago' },
      { label: 'Arrived facility  Miami, FL', completed: true, time: '2026-08-17 05:30', tz: 'America/New_York' },
      { label: 'Delivery attempt failed', completed: true, time: '2026-08-17 13:42', tz: 'America/New_York' },
      { label: 'Delivered', completed: false, time: 'Pending', tz: 'America/New_York' },
    ],
    agent: {
      name: 'Alex Ramirez',
      role: 'US Domestic Support',
      status: 'Online',
    },
  },
];

const ACTIVE_STATUSES = ['IN TRANSIT', 'OUT FOR DELIVERY'];
const isActive = (s) => ACTIVE_STATUSES.includes(s.status);

const ALIASES_KEY = 'globaltrack:aliases';
const THEME_KEY = 'globaltrack:theme';

const GlobalTrackContext = createContext(null);

export const GlobalTrackProvider = ({ children }) => {
  // Light is the reassuring public default; dark = opt-in for power users.
  // The choice is persisted so returning visitors keep their theme.
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });
  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const shipments = SHIPMENTS;

  // User-defined aliases ("Nike shoes  birthday") persisted locally.
  const [aliases, setAliases] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ALIASES_KEY)) || {};
    } catch {
      return {};
    }
  });
  const setAlias = useCallback((id, name) => {
    setAliases((prev) => {
      const next = { ...prev };
      if (name && name.trim()) next[id] = name.trim();
      else delete next[id];
      try {
        localStorage.setItem(ALIASES_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable  keep in-memory only */
      }
      return next;
    });
  }, []);

  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

  // Real-map overlay (Leaflet). null = closed; { stepIndex } = open with focus
  // (stepIndex null → whole route, number → flyTo that facility).
  const [mapFocus, setMapFocus] = useState(null);
  const openMap = useCallback((stepIndex = null) => setMapFocus({ stepIndex }), []);
  const closeMap = useCallback(() => setMapFocus(null), []);
  // Changing shipment also closes the overlay (step indexes are per-shipment).
  const selectShipment = useCallback((id) => {
    setSelectedShipmentId(id);
    setMapFocus(null);
  }, []);

  const selectedShipment = useMemo(() => {
    if (!selectedShipmentId) return shipments[0] || null;
    return shipments.find((s) => s.id === selectedShipmentId) || shipments[0] || null;
  }, [selectedShipmentId, shipments]);

  const [playback, setPlayback] = useState({ isPlaying: false, speed: 1 });
  const togglePlay = useCallback(
    () => setPlayback((p) => ({ ...p, isPlaying: !p.isPlaying })),
    []
  );
  const setSpeed = useCallback((n) => setPlayback((p) => ({ ...p, speed: n })), []);

  // Live progress per shipment (0..1), initialized from static progress.
  const initialProgress = useMemo(() => {
    const map = {};
    shipments.forEach((s) => {
      map[s.id] = Math.max(0, Math.min(1, (s.progress ?? 0) / 100));
    });
    return map;
  }, [shipments]);

  const [progressById, setProgressById] = useState(initialProgress);

  // rAF animation clock. Per-frame values held in a ref, committed to state
  // on a ~20fps throttle to avoid re-render storms.
  const progressRef = useRef({ ...initialProgress });
  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    let rafId = null;
    let lastTs = null;
    let lastCommit = 0;
    let paused = document.hidden;

    // Base rate: full 0..1 traversal in ~120s at 1x.
    const BASE_RATE = 1 / 120;

    const tick = (ts) => {
      if (lastTs == null) lastTs = ts;
      const dt = (ts - lastTs) / 1000; // seconds
      lastTs = ts;

      const { isPlaying, speed } = playbackRef.current;
      if (isPlaying && !paused && dt > 0) {
        const delta = BASE_RATE * speed * dt;
        const next = progressRef.current;
        for (const s of shipments) {
          if (!isActive(s)) continue;
          let v = (next[s.id] ?? 0) + delta;
          if (v >= 1) v -= 1; // wrap 1 -> 0
          next[s.id] = v;
        }

        // Throttle state commits to ~20fps (~50ms).
        if (ts - lastCommit >= 50) {
          lastCommit = ts;
          setProgressById({ ...progressRef.current });
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      paused = document.hidden;
      // Reset frame timing so a resumed tab doesn't jump.
      lastTs = null;
    };

    document.addEventListener('visibilitychange', handleVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [shipments]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      shipments,
      aliases,
      setAlias,
      selectedShipmentId,
      selectShipment,
      selectedShipment,
      mapFocus,
      openMap,
      closeMap,
      playback,
      togglePlay,
      setSpeed,
      progressById,
    }),
    [
      theme,
      setTheme,
      shipments,
      aliases,
      setAlias,
      selectedShipmentId,
      selectShipment,
      selectedShipment,
      mapFocus,
      openMap,
      closeMap,
      playback,
      togglePlay,
      setSpeed,
      progressById,
    ]
  );

  return (
    <GlobalTrackContext.Provider value={value}>
      {children}
    </GlobalTrackContext.Provider>
  );
};

export const useGlobalTrack = () => {
  const ctx = useContext(GlobalTrackContext);
  if (!ctx) {
    throw new Error('useGlobalTrack must be used within a GlobalTrackProvider');
  }
  return ctx;
};

export default GlobalTrackContext;
