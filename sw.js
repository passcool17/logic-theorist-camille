/* Service worker versionné — change CACHE pour invalider l’ancien cache. */
const CACHE = 'lt-camille-v2';
const ASSETS = [
  './index.html',
  './style.css?v=lt-camille-v2',
  './js/main.js?v=lt-camille-v2',
  './js/save.js',
  './js/quiz.js',
  './js/chapters.js',
  './js/chapters/content.js',
  './js/logic/formula.js',
  './js/logic/engine.js',
  './js/logic/proofs.js',
  './favicon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => undefined)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
