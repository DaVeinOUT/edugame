/* ============================================================
   MAIN.JS — Démarrage d'EDUCA v2
   Charge la mémoire (et migre la v1), prépare la voix, le parcours,
   les écrans, le filet de sécurité et les mises à jour sous contrôle.
   ============================================================ */

import { createStore } from './services/store.js';
import { voice } from './services/voice.js';
import { sfx } from './services/sfx.js';
import { installSafetyNet } from './services/errors.js';
import { createRouter } from './ui/router.js';
import { mountCaption } from './ui/caption.js';
import { applyTheme } from './ui/theme.js';
import { toast } from './ui/fx.js';
import * as DATA from './data/curriculum.js';
import { SOUND_FILES } from './data/sounds.js';
import { buildCurriculum } from './core/curriculum.js';
import { screens } from './screens/index.js';

const store = createStore();
const boot = store.load();
const cur = buildCurriculum(DATA);

const ctx = {
  store, voice, sfx, cur,
  router: null,
  pendingUpdate: null,
  /** Profil de l'enfant qui joue. */
  profile: () => store.active(),
  /** Remplace le profil actif par fn(profil) (jamais modifié en place). */
  update(fn) {
    const p = store.active();
    return p ? store.updateProfile(p.id, fn) : null;
  },
  applyTheme() { applyTheme(store.active(), store.device(), voice); },
  /** Retour à l'accueil, quel que soit l'état (utilisé aussi par le filet). */
  home() {
    const list = store.profiles();
    if (!list.length) ctx.router.go('welcome', {}, { reset: true });
    else if (!store.active()) ctx.router.go('profiles', {}, { reset: true });
    else ctx.router.go('hub', {}, { reset: true });
  },
  /** Propose la mise à jour seulement hors partie (jamais au milieu d'une leçon). */
  offerUpdate() {
    const w = ctx.pendingUpdate;
    if (!w || !['hub', 'profiles'].includes(ctx.router.current)) return;
    toast('Une nouvelle version de Kaya est prête', {
      action: 'Mettre à jour', ms: 12000,
      onAction: () => w.postMessage({ type: 'SKIP_WAITING' }),
    });
  },
};

const router = createRouter({
  root: document.getElementById('app'),
  ctx,
  onExitWarning: () => {
    voice.say('Tu veux partir ? Appuie encore une fois sur retour pour quitter.');
    toast('Appuie encore sur retour pour quitter');
  },
});
ctx.router = router;
for (const [name, screen] of Object.entries(screens)) router.register(name, screen);

installSafetyNet({
  log: entry => store.logError({ ...entry, where: `${router.current || '?'} · ${entry.where}` }),
  onError: () => {
    voice.say('Oups ! Kaya a trébuché. On retourne à l\'accueil.');
    try { ctx.home(); } catch { /* le filet ne doit jamais lui-même casser */ }
  },
});

document.addEventListener('pointerdown', () => sfx.unlock(), { once: true, capture: true });
sfx.muted = store.device().muted;
voice.setSoundFiles(SOUND_FILES);
voice.configure({ muted: store.device().muted });
voice.init({ preferred: store.device().voice, liveRegion: document.getElementById('sr-live') })
  .then(() => ctx.applyTheme());
mountCaption(document.getElementById('caption'), voice);
ctx.applyTheme();

const profiles = store.profiles();
if (!profiles.length) router.go('welcome', {}, { reset: true });
else if (profiles.length > 1) router.go('profiles', {}, { reset: true });
else {
  store.setActive(profiles[0].id);
  ctx.applyTheme();
  router.go('hub', { migrated: boot.migrated }, { reset: true });
}
document.getElementById('boot')?.remove();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => { ctx.pendingUpdate = w; ctx.offerUpdate(); };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
  }).catch(() => { /* hors-ligne impossible : le jeu marche quand même en ligne */ });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    store.flush();
    location.reload();
  });
}

addEventListener('offline', () => toast('Pas d\'internet ? Pas grave, tout fonctionne !'));
