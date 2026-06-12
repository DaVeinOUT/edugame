/* ============================================================
   SW.JS — Hors-ligne d'abord : crucial pour les zones où la
   connexion est rare ou instable (Guyane, zones isolées).
   Chemins RELATIFS : fonctionne aussi sous /edugame/ (GitHub Pages).
   ============================================================ */

const CACHE_NAME = 'educa-v7';
const FONT_CACHE = 'educa-fonts-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/educa.css',
  './css/game.css',
  './js/audio.js',
  './js/kaya.js',
  './js/card3d.js',
  './js/cards.js',
  './js/educa.js',
  './js/letters.js',
  './js/builder.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Polices Google : cache au premier chargement, puis hors-ligne pour toujours
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  // App : cache d'abord, réseau ensuite, et l'accueil en dernier recours
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached =>
      cached || fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      })
    )
  );
});
