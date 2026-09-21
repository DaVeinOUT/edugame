/* ============================================================
   SW.JS — Hors-ligne d'abord : crucial pour les zones où la
   connexion est rare ou instable (Guyane, zones isolées).
   Chemins RELATIFS : fonctionne aussi sous /edugame/ (GitHub Pages).
   ============================================================ */

const CACHE_NAME = 'educa-v9';
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

  // App : stale-while-revalidate — sert le cache immédiatement (rapide,
  // hors-ligne OK) mais met à jour le cache en arrière-plan, pour que la
  // prochaine visite ait la dernière version sans action de l'utilisateur.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (!cached && e.request.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });
      return cached || fresh;
    })
  );
});
