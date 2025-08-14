// Fast-update Service Worker for FriendTimeKeeper
const CACHE_VERSION = 'ftk-v4'; // bump this to force update
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for navigations (HTML), fallback to cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_VERSION);
        cache.put('./', fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match('./');
        return cached || Response.error();
      }
    })());
    return;
  }
  // Stale-while-revalidate for others
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(()=>cached);
    return cached || network;
  })());
});

// Allow manual skipWaiting() from the page if ever needed
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
