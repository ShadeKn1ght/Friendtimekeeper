// Fast-update Service Worker for FriendTimeKeeper (combined build)
const CACHE_VERSION = 'ftk-v5';
const CORE = ['.', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon.png'];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.addAll(CORE).catch(()=>{})));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
// Network-first for navigations; stale-while-revalidate for others
self.addEventListener('fetch',(e)=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        const cache=await caches.open(CACHE_VERSION); cache.put('./', fresh.clone());
        return fresh;
      }catch{
        const cache=await caches.open(CACHE_VERSION);
        return (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    const cached=await cache.match(req);
    const network=fetch(req).then(res=>{cache.put(req,res.clone());return res;}).catch(()=>cached);
    return cached || network;
  })());
});
