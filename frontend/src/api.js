const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchTracking(trackingNumber) {
  const response = await fetch(`${API_BASE}/api/track/${encodeURIComponent(trackingNumber)}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const isFr =
      typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr')
    const message = data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.')
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}
