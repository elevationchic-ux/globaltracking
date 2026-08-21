import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Icon from '../Icon.jsx'

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

const STATUS_COLORS = {
  INFO_RECEIVED: '#3b82f6',
  IN_TRANSIT: '#f59e0b',
  OUT_FOR_DELIVERY: '#eab308',
  DELIVERED: '#16a34a',
  EXCEPTION: '#dc2626',
  RETURNED: '#dc2626',
}

const EMPTY_FORM = {
  trackingNumber: '', carrier: '', status: 'INFO_RECEIVED',
  originCity: '', originLat: '', originLng: '',
  destCity: '', destLat: '', destLng: '',
  departureAt: '',
  senderName: '', senderEmail: '', senderLocation: '',
  receiverName: '', receiverEmail: '', receiverPhone: '', receiverAddress: '',
  product: '', shippingType: 'Priority shipping',
}

export default function TrackingManager({ authFetch }) {
  const { t } = useI18n()
  const [requests, setRequests] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [calculated, setCalculated] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // Detail view state
  const [selected, setSelected] = useState(null)
  const [eventForm, setEventForm] = useState({ status: 'IN_TRANSIT', description: '', location: '', image: null, timestamp: '' })
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef(null)

  const fetchData = async () => {
    try {
      const res = await authFetch('/api/admin/tracking')
      if (res.ok) {
        const data = await res.json().catch(() => null)
        setRequests(data?.trackingRequests || [])
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
    setError('')
    const origin = { city: form.originCity, lat: parseFloat(form.originLat) || null, lng: parseFloat(form.originLng) || null }
    const destination = { city: form.destCity, lat: parseFloat(form.destLat) || null, lng: parseFloat(form.destLng) || null }
    const sender = { name: form.senderName || null, email: form.senderEmail || null, location: form.senderLocation || null }
    const receiver = { name: form.receiverName || null, email: form.receiverEmail || null, phone: form.receiverPhone || null, address: form.receiverAddress || null }
    try {
      const res = await authFetch('/api/admin/tracking', {
        method: 'POST',
        body: JSON.stringify({
          trackingNumber: form.trackingNumber || undefined,
          carrier: form.carrier || undefined,
          status: form.status,
          origin,
          destination,
          departureAt: form.departureAt || undefined,
          sender,
          receiver,
          product: form.product || undefined,
          shippingType: form.shippingType || undefined,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setForm(EMPTY_FORM)
        setCalculated(null)
        setSuccess(t('admin.trackingCreated') || 'Tracking request created successfully')
        setTimeout(() => setSuccess(''), 4000)
        fetchData()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.message || `Error ${res.status}`)
      }
    } catch (err) {
      setError(err?.message || 'Network error')
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('admin.confirmDelete'))) return
    await authFetch(`/api/admin/tracking/${id}`, { method: 'DELETE' })
    if (selected?.id === id) setSelected(null)
    fetchData()
  }

  // Change status directly from the table
  async function handleStatusChange(reqId, newStatus) {
    try {
      const res = await authFetch(`/api/admin/tracking/${reqId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchData()
        if (selected?.id === reqId) {
          setSelected((prev) => prev ? { ...prev, status: newStatus } : prev)
        }
      }
    } catch { /* ignore */ }
  }

  // Add event with photo proof
  function handleEventImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
      setEventForm((f) => ({ ...f, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  async function handleAddEvent(e) {
    e.preventDefault()
    if (!selected) return
    try {
      const res = await authFetch(`/api/admin/tracking/${selected.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          status: eventForm.status,
          description: eventForm.description,
          location: eventForm.location || null,
          image: eventForm.image,
          timestamp: eventForm.timestamp ? new Date(eventForm.timestamp).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.trackingRequest) setSelected(data.trackingRequest)
        setEventForm({ status: 'IN_TRANSIT', description: '', location: '', image: null, timestamp: '' })
        setImagePreview(null)
        fetchData()
      }
    } catch { /* ignore */ }
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.trackingRequests')}</h3>
        <button className="admin-btn admin-btn-primary" onClick={() => { setError(''); setShowModal(true) }}>
          + {t('admin.addTracking')}
        </button>
      </div>

      {success && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={16} /> {success}</div>}

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
              <th>{t('admin.departure')}</th>
              <th>{t('admin.statusCol')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(req)}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{req.trackingNumber}</td>
                <td>{req.carrier}</td>
                <td>{req.origin?.city || '-'}</td>
                <td>{req.destination?.city || '-'}</td>
                <td>{req.distanceKm ? `${req.distanceKm} km` : '-'}</td>
                <td>{req.durationHours || '-'}</td>
                <td>{req.departureAt ? new Date(req.departureAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>
                  <select
                    value={req.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(req.id, e.target.value)}
                    className="admin-form-select"
                    style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.78rem', background: STATUS_COLORS[req.status] + '22', borderColor: STATUS_COLORS[req.status], color: STATUS_COLORS[req.status], fontWeight: 600 }}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(req.id) }}>
                    {t('admin.delete')}
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>{t('admin.noTracking')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Panel ──────────────────────────────────────────────── */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ fontFamily: 'monospace' }}>{selected.trackingNumber}</h3>
              <button className="admin-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected.origin?.city} \u2192 {selected.destination?.city}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected.carrier}</span>
              {selected.distanceKm && <span style={{ fontSize: '0.8rem', color: '#67e8f9' }}>{selected.distanceKm} km \u00b7 {selected.durationHours}</span>}
            </div>

            {/* Sender / Receiver / Product */}
            {(selected.sender || selected.receiver || selected.product) && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {selected.sender && (selected.sender.name || selected.sender.email || selected.sender.location) && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Sender</span>
                    <div style={{ color: '#e2e8f0', marginTop: 2 }}>
                      {selected.sender.name && <strong>{selected.sender.name}</strong>}
                      {selected.sender.location && <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>{selected.sender.location}</span>}
                      {selected.sender.email && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{selected.sender.email}</div>}
                    </div>
                  </div>
                )}
                {selected.receiver && (selected.receiver.name || selected.receiver.email || selected.receiver.phone || selected.receiver.address) && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Receiver</span>
                    <div style={{ color: '#e2e8f0', marginTop: 2 }}>
                      {selected.receiver.name && <strong>{selected.receiver.name}</strong>}
                      {selected.receiver.phone && <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>{selected.receiver.phone}</span>}
                      {selected.receiver.email && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{selected.receiver.email}</div>}
                      {selected.receiver.address && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{selected.receiver.address}</div>}
                    </div>
                  </div>
                )}
                {(selected.product || selected.shippingType) && (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selected.product && <span style={{ color: '#94a3b8' }}>Product: <span style={{ color: '#e2e8f0' }}>{selected.product}</span></span>}
                    {selected.shippingType && <span style={{ color: '#94a3b8' }}>Type: <span style={{ color: '#f59e0b' }}>{selected.shippingType}</span></span>}
                  </div>
                )}
              </div>
            )}

            {/* Add Event Form */}
            <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.addEvent')}</h4>
              <form onSubmit={handleAddEvent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select className="admin-form-select" value={eventForm.status} onChange={(e) => setEventForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className="admin-form-input" type="datetime-local" value={eventForm.timestamp} onChange={(e) => setEventForm((f) => ({ ...f, timestamp: e.target.value }))} />
                </div>
                <input className="admin-form-input" value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} placeholder={t('admin.eventLocation')} style={{ marginBottom: '0.5rem' }} />
                <textarea
                  className="admin-form-input"
                  rows={2}
                  value={eventForm.description}
                  onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t('admin.eventDescription')}
                  style={{ resize: 'vertical', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => fileRef.current?.click()}>
                    <Icon name="camera" size={14} /> {t('admin.addPhoto')}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEventImage} />
                  {imagePreview && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓ {t('admin.photoAttached')}</span>}
                </div>
                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={!eventForm.description.trim()}>
                  {t('admin.addEvent')}
                </button>
              </form>
            </div>

            {/* Events Timeline */}
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {(selected.events || []).length === 0 && (
                <p style={{ color: '#475569', textAlign: 'center', fontSize: '0.85rem', padding: '1rem' }}>{t('admin.noEvents')}</p>
              )}
              {(selected.events || []).map((evt, i) => (
                <div key={evt.id || i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative' }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[evt.status] || '#94a3b8', flexShrink: 0 }} />
                    <div style={{ width: 2, flex: 1, background: '#334155', marginTop: 4 }} />
                  </div>
                  {/* Event content */}
                  <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLORS[evt.status] || '#94a3b8' }}>{evt.status}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(evt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {evt.description && <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '2px 0' }}>{evt.description}</p>}
                    {evt.location && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>📍 {evt.location}</span>}
                    {evt.image && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <img src={evt.image} alt="Proof" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, border: '1px solid #334155', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tracking Request Modal ──────────────────────────────── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{t('admin.createTracking')}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>}
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

              <div className="admin-form-group">
                <label>{t('admin.departureDateTime')}</label>
                <input className="admin-form-input" type="datetime-local" value={form.departureAt} onChange={(e) => updateField('departureAt', e.target.value)} />
              </div>

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>{t('admin.origin')} <span style={{ color: '#ef4444' }}>*</span></h4>
              <div className="admin-form-group">
                <label>{t('admin.city')} <span style={{ color: '#ef4444' }}>*</span></label>
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

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>{t('admin.destination')} <span style={{ color: '#ef4444' }}>*</span></h4>
              <div className="admin-form-group">
                <label>{t('admin.city')} <span style={{ color: '#ef4444' }}>*</span></label>
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
                  <span><Icon name="diamond" size={12} /> {calculated.distance} km</span>
                  <span><Icon name="clock" size={12} /> {calculated.duration}</span>
                </div>
              )}

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>Sender</h4>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Name</label>
                  <input className="admin-form-input" value={form.senderName} onChange={(e) => updateField('senderName', e.target.value)} placeholder="Banks Junior" />
                </div>
                <div className="admin-form-group">
                  <label>Email</label>
                  <input className="admin-form-input" type="email" value={form.senderEmail} onChange={(e) => updateField('senderEmail', e.target.value)} placeholder="sender@email.com" />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Location</label>
                <input className="admin-form-input" value={form.senderLocation} onChange={(e) => updateField('senderLocation', e.target.value)} placeholder="Oklahoma" />
              </div>

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>Receiver</h4>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Name</label>
                  <input className="admin-form-input" value={form.receiverName} onChange={(e) => updateField('receiverName', e.target.value)} placeholder="Wylee Allender" />
                </div>
                <div className="admin-form-group">
                  <label>Phone</label>
                  <input className="admin-form-input" value={form.receiverPhone} onChange={(e) => updateField('receiverPhone', e.target.value)} placeholder="208-739-1957" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Email</label>
                  <input className="admin-form-input" type="email" value={form.receiverEmail} onChange={(e) => updateField('receiverEmail', e.target.value)} placeholder="receiver@email.com" />
                </div>
                <div className="admin-form-group">
                  <label>Address</label>
                  <input className="admin-form-input" value={form.receiverAddress} onChange={(e) => updateField('receiverAddress', e.target.value)} placeholder="30686 Opal Rd, Parma, ID" />
                </div>
              </div>

              <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>Shipment Details</h4>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Product</label>
                  <input className="admin-form-input" value={form.product} onChange={(e) => updateField('product', e.target.value)} placeholder="Brazilian bull rope" />
                </div>
                <div className="admin-form-group">
                  <label>Shipping Type</label>
                  <select className="admin-form-select" value={form.shippingType} onChange={(e) => updateField('shippingType', e.target.value)}>
                    <option value="Priority shipping">Priority shipping</option>
                    <option value="Express shipping">Express shipping</option>
                    <option value="Standard shipping">Standard shipping</option>
                    <option value="Economy shipping">Economy shipping</option>
                  </select>
                </div>
              </div>

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
