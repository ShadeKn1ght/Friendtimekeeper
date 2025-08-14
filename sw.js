const CACHE = "ftk-cache-v1";
const ASSETS = ["./","./index.html","./manifest.webmanifest","./sw.js","./icon-192.png","./icon-512.png","./favicon.png","./icon-digital-192.png","./icon-digital-512.png"];
self.addEventListener("install", e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting();});
self.addEventListener("activate", e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener("fetch", e=>{const u=new URL(e.request.url); if(u.origin===location.origin){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));}});
