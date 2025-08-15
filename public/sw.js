// Advanced service worker with stale-while-revalidate + versioned cache
const VERSION = 'v2';
const STATIC_CACHE = `mlvs-static-${VERSION}`;
const RUNTIME_CACHE = `mlvs-runtime-${VERSION}`;
const ASSETS = [ '/', '/home', '/dashboard/css/dashboard.css', '/home/css/landing.css', '/public/manifest.webmanifest' ];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c=> c.addAll(ASSETS)).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=> ![STATIC_CACHE,RUNTIME_CACHE].includes(k)).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});

// Message channel for skipWaiting
self.addEventListener('message', e => { if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting(); });

// Strategy: static assets -> cache-first; others -> stale-while-revalidate
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin) {
    if (ASSETS.includes(url.pathname)) {
      e.respondWith(caches.match(req).then(r=> r || fetch(req).then(resp=>{ const copy=resp.clone(); if(resp.ok) caches.open(STATIC_CACHE).then(c=> c.put(req, copy)); return resp; }))); return;
    }
    // stale-while-revalidate for runtime
    e.respondWith((async ()=>{
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(resp=>{ if(resp.ok){ const copy=resp.clone(); cache.put(req, copy); } return resp; }).catch(()=> cached || caches.match('/home'));
      return cached || fetchPromise;
    })());
  }
});
