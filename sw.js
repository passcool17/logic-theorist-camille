/* Service worker versionné — change CACHE (et les ?v=) pour invalider l’ancien cache. */
const CACHE = 'lt-camille-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=lt-camille-v9',
  './js/main.js?v=lt-camille-v9',
  './js/save.js?v=lt-camille-v9',
  './js/quiz.js?v=lt-camille-v9',
  './js/audio.js?v=lt-camille-v9',
  './js/chapters.js?v=lt-camille-v9',
  './js/chapters/content.js?v=lt-camille-v9',
  './js/logic/formula.js?v=lt-camille-v9',
  './js/logic/engine.js?v=lt-camille-v9',
  './js/logic/proofs.js?v=lt-camille-v9',
  './js/proofplay.js?v=lt-camille-v9',
  './js/ui/art.js?v=lt-camille-v9',
  './js/ui/assets.js?v=lt-camille-v9',
  './js/ui/motion.js?v=lt-camille-v9',
  './js/ui/treeview.js?v=lt-camille-v9',
  './assets/audio/music-loop.mp3',
  './simple/index.html',
  './favicon.svg',
  './manifest.webmanifest',
  // Illustrations peintes (partie A) : ajouter ici chaque ./assets/art/*.webp livré.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // cache: 'reload' → on contourne le cache HTTP pour ne pas précacher un vieux module.
      await Promise.all(
        ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)),
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
  // Les requêtes partielles (Range, ex. audio) passent directement au réseau.
  if (req.headers.has('range')) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && res.status === 200) {
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
