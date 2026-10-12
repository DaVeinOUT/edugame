/* ============================================================
   SW.JS — Hors-ligne d'abord, mises à jour sous contrôle
   • Tous les fichiers du jeu sont mis en cache dès l'installation
     (liste générée par scripts/release.mjs : rien n'est oublié).
   • Une nouvelle version s'installe EN ATTENTE : elle ne prend la
     main que lorsqu'on touche « Mettre à jour » depuis l'accueil —
     jamais au milieu d'une leçon.
   • Aucun appel à un site tiers : seules les ressources du jeu passent.
   • Chemins relatifs : fonctionne aussi sous /edugame/ (GitHub Pages).
   ============================================================ */

/* <release> — généré par scripts/release.mjs, ne pas éditer à la main */
const CACHE_NAME = 'educa-26fc5c2bcc';
const ASSETS = [
  './',
  './css/app.css',
  './css/cards.css',
  './css/fonts.css',
  './fonts/OpenDyslexic-Bold.woff',
  './fonts/OpenDyslexic-Regular.woff',
  './fonts/andika-400.woff2',
  './fonts/andika-700.woff2',
  './fonts/nunito-400-900.woff2',
  './fonts/orbitron-700.woff2',
  './fonts/rajdhani-500.woff2',
  './fonts/rajdhani-700.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './index.html',
  './js/activities/build.js',
  './js/activities/choice.js',
  './js/activities/common.js',
  './js/activities/intro.js',
  './js/activities/trace.js',
  './js/core/curriculum.js',
  './js/core/elo.js',
  './js/core/placement.js',
  './js/core/questions.js',
  './js/core/rng.js',
  './js/core/schema.js',
  './js/core/seg.js',
  './js/core/select.js',
  './js/core/session.js',
  './js/core/srs.js',
  './js/data/curriculum.js',
  './js/data/sounds.js',
  './js/main.js',
  './js/nomodule.js',
  './js/screens/adult.js',
  './js/screens/collection.js',
  './js/screens/games.js',
  './js/screens/hub.js',
  './js/screens/index.js',
  './js/screens/ladder.js',
  './js/screens/lesson.js',
  './js/screens/path.js',
  './js/screens/placement.js',
  './js/screens/profiles.js',
  './js/screens/trace.js',
  './js/screens/welcome.js',
  './js/services/errors.js',
  './js/services/phonemes.js',
  './js/services/recordings.js',
  './js/services/sfx.js',
  './js/services/store.js',
  './js/services/voice.js',
  './js/ui/caption.js',
  './js/ui/cards.js',
  './js/ui/dom.js',
  './js/ui/elo.js',
  './js/ui/fx.js',
  './js/ui/kaya.js',
  './js/ui/overlay.js',
  './js/ui/router.js',
  './js/ui/theme.js',
  './js/ui/word.js',
  './manifest.json',
];
/* </release> */

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Anciennes versions (dont la v1 : educa-v12, educa-fonts-v2) : on fait le ménage.
    await Promise.all(keys.filter(k => k.startsWith('educa') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      // Fichier pas encore en cache (ex. un son ajouté) : gardé pour la prochaine fois.
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
