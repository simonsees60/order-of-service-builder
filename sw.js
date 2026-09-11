const CACHE_NAME = 'oos-builder-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
