// Offline-first service worker: the plan, the Trip Pass and the shell all keep
// working with no network — the W3C Service Workers behaviour the deck claims.

const CACHE = 'viatica-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/theme.css', './css/atlas.css', './css/app.css',
  './js/app.js',
  './js/core/store.js', './js/core/scheduler.js', './js/core/ticket.js', './js/core/qr.js',
  './js/data/india-geo.js', './js/data/geography.js', './js/data/places.js',
  './js/data/transport.js', './js/data/seed.js',
  './js/ui/atlas.js', './js/ui/glyphs.js', './js/ui/util.js',
  './js/ui/views-plan.js', './js/ui/views-ops.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network-first, cache-fallback. Online, you always get the current file — which
// matters while the prototype is being edited. Offline, every shell asset, the
// plan and the Trip Pass come straight out of the cache, which is the behaviour
// the deck actually claims.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request)
        .then(hit => hit || caches.match('./index.html')))
  );
});
