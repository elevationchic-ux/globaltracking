const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchTracking(trackingNumber) {
  const response = await fetch(`${API_BASE}/api/track/${encodeURIComponent(trackingNumber)}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.message || 'Une erreur est survenue.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}
