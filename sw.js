const CACHE_NAME = 'oos-builder-v3';
const ASSETS = [
  './',
  './oos-builder.html',
  './manifest.json',
  './fonts.css',
  './apple-touch-icon.png',
  './icon-512.png',
  './fonts/f1.woff2',
  './fonts/f2.woff2',
  './fonts/f3.woff2',
  './fonts/f4.woff2',
  './fonts/f5.woff2',
  './fonts/f6.woff2',
];

self.addEventListener('install', (event) => {
  // cache.addAll() is all-or-nothing: one flaky download sinks every asset.
  // Caching each file separately means a single failure only costs that file --
  // it'll get picked up by the fetch handler's cache-on-success fallback later.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // The app shell (the page itself) must always prefer a fresh copy when
  // online, or updates would never show up -- a cached copy only exists as
  // the offline fallback. Static assets (fonts, icons) never change, so
  // they stay cache-first below to avoid needless refetching.
  const isAppShell = event.request.mode === 'navigate' || event.request.url.endsWith('/oos-builder.html');

  if (isAppShell){
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);
    })
  );
});
