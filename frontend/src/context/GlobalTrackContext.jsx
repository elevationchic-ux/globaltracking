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
 * All shipment data is now fetched from the admin API - no hardcoded demo data.
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
export const SHIPMENTS = [];

const ACTIVE_STATUSES = ['IN TRANSIT', 'OUT FOR DELIVERY'];
const isActive = (s) => ACTIVE_STATUSES.includes(s.status);

const ALIASES_KEY = 'globaltrack:aliases';
const THEME_KEY = 'globaltrack:theme';

/**
 * Convert admin API shipment data to the globe SHIPMENTS shape.
 * The backend /api/shipments endpoint already returns data in this format,
 * so this is mostly a pass-through with timezone enrichment.
 */
function adminToShipment(a) {
  return {
    ...a,
    from: a.from || { name: 'Unknown', lat: 0, lng: 0, tz: 'UTC' },
    to: a.to || { name: 'Unknown', lat: 0, lng: 0, tz: 'UTC' },
  };
}

/**
 * Compute real-time interpolated progress (0..1) for admin shipments.
 * Uses the timeline events to find the last completed and next pending step,
 * then linearly interpolates based on elapsed wall-clock time.
 */
function computeInterpolatedProgress(shipment) {
  const timeline = shipment.timeline || [];
  if (timeline.length === 0) return shipment.progress / 100 || 0;

  const now = Date.now();
  let lastCompletedIdx = -1;
  let nextPendingIdx = -1;

  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].completed) {
      lastCompletedIdx = i;
    } else if (nextPendingIdx === -1) {
      nextPendingIdx = i;
    }
  }

  // All completed = 100%
  if (nextPendingIdx === -1) return 1;
  // None completed = start
  if (lastCompletedIdx === -1) return 0;

  const lastTime = timeline[lastCompletedIdx].time;
  const nextTime = timeline[nextPendingIdx].time;

  // If either time is 'Pending' or unparseable, fall back to simple ratio
  const lastMs = new Date(lastTime).getTime();
  const nextMs = new Date(nextTime).getTime();

  if (isNaN(lastMs) || isNaN(nextMs) || nextMs <= lastMs) {
    // Simple fallback: completed steps / total steps
    return (lastCompletedIdx + 1) / timeline.length;
  }

  // Linear interpolation based on wall-clock time
  const elapsed = now - lastMs;
  const total = nextMs - lastMs;
  const ratio = Math.min(1, Math.max(0, elapsed / total));

  // Map back to overall progress (0..1)
  const stepSize = 1 / timeline.length;
  const baseProgress = (lastCompletedIdx + 1) / timeline.length;
  const interpolated = baseProgress - stepSize + stepSize * ratio;
  return Math.min(1, Math.max(0, interpolated));
}

const GlobalTrackContext = createContext(null);

export const GlobalTrackProvider = ({ children }) => {
  // Light is the reassuring public default; dark = opt-in for power users.
  // The choice is persisted so returning visitors keep their theme.
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof window === 'undefined') return 'light';
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

  // ── Fetch shipments from public API (includes demo packages) ──
  const [adminShipments, setAdminShipments] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [packageLimit, setPackageLimit] = useState(2);
  const [packageCount, setPackageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments');
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (!cancelled && data?.shipments) {
            setAdminShipments(data.shipments.map(adminToShipment));
          }
        }
      } catch {
        /* API not available */
      }
    }
    fetchShipments();
    // Refresh every 30 seconds to pick up admin changes
    const interval = setInterval(fetchShipments, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Fetch user subscription info
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/user/subscription');
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            setUserSubscription(data.subscription);
            setPackageLimit(data.packageLimit);
            setPackageCount(data.packageCount);
          }
        }
      } catch {
        // If API fails, default to free tier
        setUserSubscription({ tier: 'free', expiresAt: null });
        setPackageLimit(2);
        setPackageCount(0);
      }
    }
    fetchSubscription();
  }, []);

  // Use shipments from API (includes demo packages + admin packages)
  const shipments = useMemo(() => {
    return adminShipments;
  }, [adminShipments]);

  // Subscription context
  const subscriptionValue = {
    subscription: userSubscription,
    packageLimit,
    packageCount,
    canCreateMore: packageCount < packageLimit,
  };

  // User-defined aliases ("Nike shoes  birthday") persisted locally.
  const [aliases, setAliases] = useState(() => {
    try {
      if (typeof window === 'undefined') return {};
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
  // Admin shipments use real-time interpolation between events.
  const initialProgress = useMemo(() => {
    const map = {};
    shipments.forEach((s) => {
      // Admin shipments (id starts with 'tr-') use interpolated progress
      if (s.id?.startsWith('tr-')) {
        map[s.id] = computeInterpolatedProgress(s);
      } else {
        map[s.id] = Math.max(0, Math.min(1, (s.progress ?? 0) / 100));
      }
    });
    return map;
  }, [shipments]);

  const [progressById, setProgressById] = useState(initialProgress);

  // rAF animation clock. Per-frame values held in a ref, committed to state
  // on a ~20fps throttle to avoid re-render storms.
  const progressRef = useRef({ ...initialProgress });
  // Keep ref in sync when shipments change (new admin data fetched)
  useEffect(() => {
    progressRef.current = { ...progressRef.current, ...initialProgress };
    setProgressById((prev) => ({ ...prev, ...initialProgress }));
  }, [initialProgress]);
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
          // Admin shipments use real-time interpolation, not playback animation
          if (s.id?.startsWith('tr-')) continue;
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
      subscription: userSubscription,
      packageLimit,
      packageCount,
      canCreateMore: packageCount < packageLimit,
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
      userSubscription,
      packageLimit,
      packageCount,
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
