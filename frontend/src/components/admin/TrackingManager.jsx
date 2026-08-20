import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'

const EARTH_RADIUS_KM = 6371

function toRad(deg) { return (deg * Math.PI) / 180 }

function haversineDistance(from, to) {
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function estimateDuration(km) {
  return Math.round(km / 200 + 6)
}

function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  const days = Math.floor(hours / 24)
  const h = Math.round(hours % 24)
  return days > 0 ? `${days}d ${h}h` : `${h}h`
}

const STATUS_OPTIONS = ['INFO_RECEIVED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RETURNED']

const EMPTY_FORM = {
  trackingNumber: '', carrier: '', status: 'INFO_RECEIVED',
  originCity: '', originLat: '', originLng: '',
  destCity: '', destLat: '', destLng: '',
}

export default function TrackingManager({ authFetch }) {
  const { t } = useI18n()
  const [requests, setRequests] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [calculated, setCalculated] = useState(null)

  const fetchData = async () => {
    try {
      const res = await authFetch('/api/admin/tracking')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.trackingRequests || [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchData() }, [authFetch])

  // Auto-calculate distance when coordinates change
  useEffect(() => {
    const oLat = parseFloat(form.originLat)
    const oLng = parseFloat(form.originLng)
    const dLat = parseFloat(form.destLat)
    const dLng = parseFloat(form.destLng)
    if (!isNaN(oLat) && !isNaN(oLng) && !isNaN(dLat) && !isNaN(dLng)) {
      const dist = haversineDistance({ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng })
      const dur = estimateDuration(dist)
      setCalculated({ distance: dist, duration: formatDuration(dur) })
    } else {
      setCalculated(null)
    }
  }, [form.originLat, form.originLng, form.destLat, form.destLng])

  async function handleCreate(e) {
    e.preventDefault()
    const origin = { city: form.originCity, lat: parseFloat(form.originLat) || null, lng: parseFloat(form.originLng) || null }
    const destination = { city: form.destCity, lat: parseFloat(form.destLat) || null, lng: parseFloat(form.destLng) || null }
    try {
      const res = await authFetch('/api/admin/tracking', {
        method: 'POST',
        body: JSON.stringify({
          trackingNumber: form.trackingNumber || undefined,
          carrier: form.carrier || undefined,
          status: form.status,
          origin,
          destination,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setForm(EMPTY_FORM)
        setCalculated(null)
        fetchData()
      }
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    if (!confirm(t('admin.confirmDelete'))) return
    await authFetch(`/api/admin/tracking/${id}`, { method: 'DELETE' })
    fetchData()
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.trackingRequests')}</h3>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          + {t('admin.addTracking')}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.trackingNumber')}</th>
              <th>{t('admin.carrier')}</th>
              <th>{t('admin.origin')}</th>
              <th>{t('admin.destination')}</th>
              <th>{t('admin.distance')}</th>
              <th>{t('admin.duration')}</th>
              <th>{t('admin.statusCol')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{req.trackingNumber}</td>
                <td>{req.carrier}</td>
                <td>{req.origin?.city || '-'}</td>
                <td>{req.destination?.city || '-'}</td>
                <td>{req.distanceKm ? `${req.distanceKm} km` : '-'}</td>
                <td>{req.durationHours || '-'}</td>
                <td>
                  <span className={`admin-status ${req.status === 'DELIVERED' ? 'admin-status-online' : 'admin-status-offline'}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(req.id)}>
                    {t('admin.delete')}
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>{t('admin.noTracking')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Tracking Request Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{t('admin.createTracking')}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>{t('admin.trackingNumber')}</label>
                  <input className="admin-form-input" value={form.trackingNumber} onChange={(e) => updateField('trackingNumber', e.target.value)} placeholder="Auto-generated if empty" />
                </div>
                <div className="admin-form-group">
                  <label>{t('admin.carrier')}</label>
                  <input className="admin-form-input" value={form.carrier} onChange={(e) => updateField('carrier', e.target.value)} placeholder="DHL, FedEx, etc." />
                </div>
              </div>

              <div className="admin-form-group">
                <label>{t('admin.statusCol')}</label>
                <select className="admin-form-select" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>{t('admin.origin')}</h4>
              <div className="admin-form-group">
                <label>{t('admin.city')}</label>
                <input className="admin-form-input" value={form.originCity} onChange={(e) => updateField('originCity', e.target.value)} placeholder="Paris" required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>{t('admin.latitude')}</label>
                  <input className="admin-form-input" type="number" step="any" value={form.originLat} onChange={(e) => updateField('originLat', e.target.value)} placeholder="48.8566" />
                </div>
                <div className="admin-form-group">
                  <label>{t('admin.longitude')}</label>
                  <input className="admin-form-input" type="number" step="any" value={form.originLng} onChange={(e) => updateField('originLng', e.target.value)} placeholder="2.3522" />
                </div>
              </div>

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>{t('admin.destination')}</h4>
              <div className="admin-form-group">
                <label>{t('admin.city')}</label>
                <input className="admin-form-input" value={form.destCity} onChange={(e) => updateField('destCity', e.target.value)} placeholder="Cotonou" required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>{t('admin.latitude')}</label>
                  <input className="admin-form-input" type="number" step="any" value={form.destLat} onChange={(e) => updateField('destLat', e.target.value)} placeholder="6.3703" />
                </div>
                <div className="admin-form-group">
                  <label>{t('admin.longitude')}</label>
                  <input className="admin-form-input" type="number" step="any" value={form.destLng} onChange={(e) => updateField('destLng', e.target.value)} placeholder="2.3912" />
                </div>
              </div>

              {calculated && (
                <div className="admin-distance-badge">
                  <span>📏 {calculated.distance} km</span>
                  <span>⏱ {calculated.duration}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowModal(false)}>
                  {t('admin.cancel')}
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
