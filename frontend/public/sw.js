// GlobalTrack service worker  cache-first for static assets, network-first for navigation.
const CACHE = 'globaltrack-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => { /* offline install is fine */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // /api/*  always go to network (tracking data must be fresh)
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return;

  // Navigation (HTML)  network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (icons, logos, hashed JS/CSS)  cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/logos/'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

// Push notifications: show a native notification when the server sends a push event.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'GlobalTrack', {
        body: data.body || 'Tracking update available',
        icon: '/icons/icon.svg',
        badge: '/icons/icon-maskable.svg',
        data: data.url || '/',
        vibrate: [200, 100, 200],
      })
    );
  } catch {
    // Fallback for non-JSON push payloads
    event.waitUntil(
      self.registration.showNotification('GlobalTrack', {
        body: event.data.text(),
        icon: '/icons/icon.svg',
        badge: '/icons/icon-maskable.svg',
      })
    );
  }
});

// Notification click: open the tracking page or focus the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
