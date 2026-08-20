import { useEffect } from 'react'

/**
 * SPA SEO helpers.
 * Crawlers that execute JS see per-page titles, meta descriptions, canonical
 * links and JSON-LD blocks even though GlobalTrack is a single-page app.
 */

/**
 * Production origin: set VITE_SITE_ORIGIN for a custom domain; otherwise the
 * current origin is used, so canonicals stay correct on *.vercel.app too.
 */
export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://globaltrack.app')

/** Set document title, meta description and canonical link for a route. */
export function setMeta({ title, description, path }) {
  if (title) document.title = title
  if (description) {
    let el = document.querySelector('meta[name="description"]')
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', 'description')
      document.head.appendChild(el)
    }
    el.setAttribute('content', description)
  }
  if (path) {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', `${SITE_ORIGIN}${path}`)
  }
}

/** Mount a JSON-LD structured-data block; removed automatically on unmount. */
export function useJsonLd(data) {
  useEffect(() => {
    if (!data) return undefined
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.gtJsonld = 'true'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => script.remove()
  }, [data])
}
