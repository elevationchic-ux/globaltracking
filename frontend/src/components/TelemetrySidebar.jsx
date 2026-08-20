import React, { useState } from 'react';
import {
  Play,
  Pause,
  Save,
  FileText,
  Clock,
  MapPin,
  Truck,
  Plane,
  CheckCircle,
  CalendarClock,
  Pencil,
  Bell,
  AlertTriangle,
  CreditCard,
  Store,
  Camera,
  Scale,
  PackageCheck,
  Map as MapIcon,
  ExternalLink,
} from 'lucide-react';
import { useGlobalTrack } from '../context/GlobalTrackContext';
import { useI18n } from '../i18n/I18nContext';
import { formatDistance, formatEventTime, formatInVisitorTz, tzLabel } from '../utils/format';
import { claimUrlFor, trackingUrlFor } from '../utils/carrierHelp';

const isLiveStatus = (status) => status === 'IN TRANSIT' || status === 'OUT FOR DELIVERY';

const ALERTS_KEY = 'globaltrack:alerts';
const SAVED_KEY = 'globaltrack:saved';

const loadJson = (key, fallback) => {
  try {
    if (typeof window === 'undefined') return fallback;
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const TelemetrySidebar = () => {
  const { selectedShipment } = useGlobalTrack();
  if (!selectedShipment) return null;
  // Keyed remount resets all per-shipment transient state (alias editing,
  // customs payment, action confirmations, manifest panel) on selection change.
  return <SidebarBody key={selectedShipment.id} />;
};

const SidebarBody = () => {
  const {
    selectedShipment,
    aliases,
    setAlias,
    playback,
    togglePlay,
    setSpeed,
    progressById,
    openMap,
  } = useGlobalTrack();
  const { t, locale } = useI18n();
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState('');
  const [alerts, setAlerts] = useState(() =>
    loadJson(ALERTS_KEY, { email: true, sms: false, push: true })
  );
  const [savedIds, setSavedIds] = useState(() => loadJson(SAVED_KEY, []));
  const [customsPaid, setCustomsPaid] = useState(false);
  const [actionDone, setActionDone] = useState(null);
  const [manifestOpen, setManifestOpen] = useState(false);

  const speeds = [1, 5, 20];

  if (!selectedShipment) return null;

  const s = selectedShipment;
  const alias = aliases[s.id];
  const isSaved = savedIds.includes(s.id);

  // Live progress from the provider clock when playing, static value otherwise.
  const liveProgress = progressById[s.id];
  const progress = playback.isPlaying
    ? Math.round((liveProgress ?? s.progress / 100) * 100)
    : s.progress;

  const toggleAlert = (channel) => {
    setAlerts((prev) => {
      const next = { ...prev, [channel]: !prev[channel] };
      try {
        localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleSaved = () => {
    setSavedIds((prev) => {
      const next = isSaved ? prev.filter((id) => id !== s.id) : [...prev, s.id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const commitAlias = () => {
    setAlias(s.id, aliasDraft);
    setEditingAlias(false);
  };

  const statusBadgeClass = isLiveStatus(s.status)
    ? 'bg-blue-500/20 border border-cyan-400 text-cyan-300 neon-glow animate-pulse-glow'
    : s.status === 'DELIVERED'
    ? 'bg-green-500 text-white'
    : s.status === 'EXCEPTION'
    ? 'bg-red-500/20 border border-red-400 text-red-300'
    : 'bg-yellow-500 text-white';

  const hasHandover = s.originCarrier !== s.finalCarrier;

  // Answer-first: the two questions every anxious visitor has.
  // "Where?" = last confirmed scan (or destination once delivered).
  const lastCompleted = [...s.timeline].reverse().find((step) => step.completed);
  const whereAnswer =
    s.status === 'DELIVERED' ? `${t('status.DELIVERED')}  ${s.to.name}` : lastCompleted?.label ?? s.status;
  // "When?" = ETA in destination-local time, or the honest hold state.
  const etaText = s.estimatedArrival
    ? formatEventTime(s.estimatedArrival, locale, s.to.tz)
    : t(`eta.${s.etaStatus}`);
  const etaVisitorTime = s.estimatedArrival
    ? formatInVisitorTz(s.estimatedArrival, locale, s.to.tz)
    : null;
  const etaTooltip = etaVisitorTime ? `${t('timeline.yourTime')}: ${etaVisitorTime}` : undefined;

  return (
    <div className="telemetry-sidebar fixed right-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 z-40 overflow-y-auto">
      <div className="p-6 space-y-6 pt-36">
        {/* Shipment Header  alias + carrier handover chain */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 neon-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              {editingAlias ? (
                <input
                  type="text"
                  value={aliasDraft}
                  onChange={(e) => setAliasDraft(e.target.value)}
                  onBlur={commitAlias}
                  onKeyDown={(e) => e.key === 'Enter' && commitAlias()}
                  placeholder='Alias, e.g. "Nike shoes  birthday"'
                  autoFocus
                  className="bg-gray-900 border border-cyan-500 rounded px-2 py-1 text-white text-sm font-bold w-full focus:outline-none"
                />
              ) : (
                <h2 className="text-white font-bold text-lg font-mono neon-text-cyan truncate">
                  {alias || s.trackingNumber}
                </h2>
              )}
              <p className="text-gray-400 text-sm">
                {hasHandover ? (
                  <>
                    {s.originCarrier} <span className="text-cyan-400">→</span> {s.finalCarrier}
                  </>
                ) : (
                  s.originCarrier
                )}
              </p>
              {alias && !editingAlias && (
                <p className="text-gray-500 text-xs font-mono">{s.trackingNumber}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <button
                onClick={() => {
                  setAliasDraft(alias || '');
                  setEditingAlias(true);
                }}
                className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                aria-label="Rename shipment"
                title="Rename shipment"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${statusBadgeClass}`}
              >
                {isLiveStatus(s.status) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-blink"></span>
                )}
                <span>{isLiveStatus(s.status) ? 'LIVE' : s.status}</span>
              </div>
            </div>
          </div>
          {hasHandover && (
            <p className="text-[11px] text-cyan-400/80 font-mono mb-3">
              Multi-leg · handover to {s.finalCarrier}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-400">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{s.from.name}</span>
            </div>
            <div className="text-cyan-400">→</div>
            <div className="flex items-center text-gray-400">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{s.to.name}</span>
            </div>
          </div>
          {/* Real geospatial map  Leaflet + OSM / Esri satellite */}
          <button
            onClick={() => openMap()}
            className="mt-3 w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/50 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <MapIcon className="w-4 h-4" />
            <span>{t('map.openRealMap')}</span>
          </button>
        </div>

        {/* Answer-first: binary answers above any telemetry noise */}
        <div className="bg-gray-800/70 rounded-lg p-4 border border-cyan-500/40 neon-glow">
          <div className="mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">
              {t('answer.where')}
            </p>
            <p className="text-white text-sm font-bold leading-snug">{whereAnswer}</p>
          </div>
          <div className="pt-3 border-t border-gray-700">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">
              {t('answer.when')}
            </p>
            <p className="text-blue-300 font-mono text-sm font-bold neon-text-blue" title={etaTooltip}>
              {etaText}
              {s.estimatedArrival && (
                <span className="text-gray-500 text-xs"> · {tzLabel(s.to.tz)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Stage benchmark  real transparency: avg duration vs elapsed here.
            Customs stages can take 50% of total time while adding 0 km. */}
        {s.stageStats && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">
              {s.stageStats.label}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('stage.avg')}</span>
              <span className="text-white font-mono font-bold">~{s.stageStats.avgHours}h</span>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  s.stageStats.elapsedHours / s.stageStats.avgHours > 1
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((s.stageStats.elapsedHours / s.stageStats.avgHours) * 100))}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {s.stageStats.elapsedHours}h {t('stage.elapsed')}
            </p>
          </div>
        )}

        {/* Status alerts (Email / SMS / Push) */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center">
              <Bell className="w-4 h-4 mr-2 text-cyan-400" />
              Status Alerts
            </h3>
          </div>
          <div className="flex space-x-2">
            {['email', 'sms', 'push'].map((channel) => (
              <button
                key={channel}
                onClick={() => toggleAlert(channel)}
                className={`flex-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all border ${
                  alerts[channel]
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 neon-glow'
                    : 'bg-gray-900/50 border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
                aria-pressed={!!alerts[channel]}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-4">Shipment Progress</h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700"></div>
            {s.timeline.map((step, index) => {
              const visitorTime = formatInVisitorTz(step.time, locale, step.tz);
              const timeLabel =
                step.time === 'Pending'
                  ? t('timeline.pending')
                  : formatEventTime(step.time, locale, step.tz);
              return (
                <div key={index} className="relative flex items-start mb-4 last:mb-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      step.completed ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium ${
                          step.completed ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.completed && (
                        <button
                          onClick={() => openMap(index)}
                          className="shrink-0 p-1 rounded text-gray-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                          title={`${t('map.openRealMap')}  ${step.label}`}
                          aria-label={`${t('map.openRealMap')}  ${step.label}`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p
                      className="text-xs text-gray-500 font-mono"
                      title={visitorTime ? `${t('timeline.yourTime')}: ${visitorTime}` : undefined}
                    >
                      {timeLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exception / customs handling */}
        {s.customs && (
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/60">
            <h3 className="text-red-300 font-bold mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Held in Customs
            </h3>
            <p className="text-sm text-gray-300 mb-1">{s.customs.reason}</p>
            <p className="text-xs text-gray-400 mb-3 font-mono">
              Amount due: <span className="text-red-300 font-bold">{s.customs.amount}</span>
            </p>
            {customsPaid ? (
              <p className="text-green-400 text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Payment submitted  release requested
              </p>
            ) : (
              <button
                onClick={() => setCustomsPaid(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay {s.customs.amount} online</span>
              </button>
            )}
            {/* Escalation: official resolution channel for the final carrier */}
            <a
              href={claimUrlFor(s.finalCarrier)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-600 text-gray-300 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('escalation.stuck')}</span>
            </a>
            {/* Verify directly on the carrier's official website */}
            <a
              href={trackingUrlFor(s.finalCarrier, s.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('carrier.verify')}</span>
            </a>
          </div>
        )}

        {s.exception && (
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/60">
            <h3 className="text-red-300 font-bold mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Delivery Exception
            </h3>
            <p className="text-sm text-gray-300">{s.exception.reason}</p>
            <p className="text-xs text-gray-500 font-mono mb-3">
              Attempt: {formatEventTime(s.exception.attempt, locale, s.to.tz)}
            </p>
            {actionDone ? (
              <p className="text-green-400 text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {actionDone}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActionDone('New delivery date requested')}
                  className="py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setActionDone('Address update sent to carrier')}
                  className="py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Fix address
                </button>
              </div>
            )}
            {/* Escalation: official resolution channel for the final carrier */}
            <a
              href={claimUrlFor(s.finalCarrier)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-600 text-gray-300 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('escalation.stuck')}</span>
            </a>
            {/* Verify directly on the carrier's official website */}
            <a
              href={trackingUrlFor(s.finalCarrier, s.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('carrier.verify')}</span>
            </a>
          </div>
        )}

        {/* Last-mile: time slot + courier position (DPD/UPS style) */}
        {s.status === 'OUT FOR DELIVERY' && s.deliveryWindow && (
          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/50">
            <h3 className="text-amber-300 font-bold mb-3 flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Last Mile · Live
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Time slot</p>
                <p className="text-amber-300 font-mono font-bold">{s.deliveryWindow}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stops away</p>
                <p className="text-white font-mono font-bold">{s.courier.stopsAway}</p>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Courier</p>
                  <p className="text-white text-sm">{s.courier.name}</p>
                </div>
                <p className="text-xs text-gray-400 font-mono">{s.courier.vehicle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Proof of delivery (photo / signature / GPS) */}
        {s.pod && (
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/50">
            <h3 className="text-green-300 font-bold mb-3 flex items-center">
              <PackageCheck className="w-4 h-4 mr-2" />
              Proof of Delivery
            </h3>
            <div className="flex space-x-3 mb-3">
              <div className="w-20 h-20 rounded-lg bg-gray-900 border border-gray-700 flex flex-col items-center justify-center text-gray-500">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-mono">PHOTO</span>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                <p className="text-gray-300">
                  Signed by: <span className="text-white font-bold">{s.pod.signedBy}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {formatEventTime(s.pod.time, locale, s.to.tz)}
                </p>
                <p className="text-xs text-gray-500 font-mono">{s.pod.gps}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pickup point / locker (PostNL style) */}
        {s.pickupPoint && (
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/50">
            <h3 className="text-blue-300 font-bold mb-3 flex items-center">
              <Store className="w-4 h-4 mr-2" />
              Ready for Collection
            </h3>
            <p className="text-sm text-white font-medium">{s.pickupPoint.name}</p>
            <p className="text-xs text-gray-400 mb-3">{s.pickupPoint.address}</p>
            <div className="bg-gray-900 rounded-lg p-3 mb-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                Pickup code
              </p>
              <p className="text-cyan-300 font-mono text-xl font-bold tracking-[0.3em] neon-text-cyan">
                {s.pickupPoint.pin}
              </p>
            </div>
            <p className="text-xs text-gray-500">{s.pickupPoint.hours}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-4">Telemetry Data</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded p-3">
              <div className="flex items-center text-gray-400 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-xs">Elapsed Time</span>
              </div>
              <p className="text-cyan-400 font-mono text-sm neon-text-cyan">{s.elapsedTime}</p>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="flex items-center text-gray-400 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-xs">Distance</span>
              </div>
              <p className="text-cyan-400 font-mono text-sm neon-text-cyan">
                {formatDistance(s.distanceKm, locale)}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded p-3 col-span-2">
              <div className="flex items-center text-gray-400 mb-1">
                {s.mode === 'air' ? (
                  <Plane className="w-4 h-4 mr-1" />
                ) : (
                  <Truck className="w-4 h-4 mr-1" />
                )}
                <span className="text-xs">Transport Mode · {s.service}</span>
              </div>
              <p className="text-white font-mono text-sm">{s.transportMode}</p>
            </div>
            <div className="bg-gray-900/50 rounded p-3 col-span-2">
              <div className="flex items-center text-gray-400 mb-1">
                <CalendarClock className="w-4 h-4 mr-1" />
                <span className="text-xs">Estimated Arrival</span>
              </div>
              <p className="text-blue-400 font-mono text-sm neon-text-blue" title={etaTooltip}>
                {etaText}
                {s.estimatedArrival && (
                  <span className="text-gray-500 text-xs"> · {tzLabel(s.to.tz)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span className="text-cyan-400 font-mono neon-text-cyan">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Simulation Controls  wired to the provider playback clock */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-bold mb-4">Simulation Controls</h3>
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={togglePlay}
              className="p-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition-colors neon-glow"
              aria-label={playback.isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {playback.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs text-gray-400">Speed:</span>
            {speeds.map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeed(sp)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                  playback.speed === sp
                    ? 'bg-cyan-500 text-white neon-glow'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Assigned support agent */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {s.agent.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{s.agent.name}</h4>
                <p className="text-xs text-gray-400">{s.agent.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  s.agent.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}
              ></div>
              <span
                className={`text-xs ${
                  s.agent.status === 'Online' ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {s.agent.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons  Save & Manifest are functional */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleSaved}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
            }`}
            aria-pressed={isSaved}
          >
            <Save className={`w-5 h-5 mb-1 ${isSaved ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span className="text-xs text-gray-300">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={() => setManifestOpen((o) => !o)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
              manifestOpen
                ? 'bg-cyan-500/15 border-cyan-500'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
            }`}
            aria-expanded={manifestOpen}
          >
            <FileText className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-xs text-gray-300">Manifest</span>
          </button>
        </div>

        {manifestOpen && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/40 text-sm space-y-2">
            <h3 className="text-white font-bold flex items-center mb-2">
              <FileText className="w-4 h-4 mr-2 text-cyan-400" />
              Shipment Manifest
            </h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Service</span>
              <span className="text-white font-mono">{s.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Weight</span>
              <span className="text-white font-mono flex items-center">
                <Scale className="w-3.5 h-3.5 mr-1" />
                {s.weight}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pieces</span>
              <span className="text-white font-mono">{s.pieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Route</span>
              <span className="text-white font-mono">
                {s.from.name} → {s.to.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Chain</span>
              <span className="text-cyan-400 font-mono">
                {s.originCarrier}
                {hasHandover && ` → ${s.finalCarrier}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetrySidebar;
