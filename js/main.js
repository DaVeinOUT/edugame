/* ============================================================
   MAIN.JS — Démarrage d'EDUCA v2
   Charge la mémoire (et migre la v1), prépare la voix, le parcours,
   les écrans, le filet de sécurité et les mises à jour sous contrôle.
   ============================================================ */

import { createStore } from './services/store.js';
import { voice } from './services/voice.js';
import { sfx } from './services/sfx.js';
import { installSafetyNet } from './services/errors.js';
import { loadRecordings } from './services/recordings.js';
import { createOfflineStatus } from './services/offline.js';
import { h } from './ui/dom.js';
import { observeCompanions } from './ui/kaya.js';
import { createRouter } from './ui/router.js';
import { mountCaption } from './ui/caption.js';
import { applyTheme } from './ui/theme.js';
import { toast } from './ui/fx.js';
import * as DATA from './data/curriculum.js';
import { SOUND_FILES } from './data/sounds.js';
import { WORD_FILES } from './data/wordaudio.js';
import * as LEVEL_DATA from './data/levels.js';
import { buildCurriculum } from './core/curriculum.js';
import { restedToday } from './core/session.js';
import { buildLevels } from './core/levels.js';
import { screens } from './screens/index.js';

const cur = buildCurriculum(DATA);
const levels = buildLevels(LEVEL_DATA);   // les niveaux des grands, CE1 → 3e
const store = createStore({ maxStep: cur.steps.length - 1 });
function backup() {
  const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
  const link = h('a', { href: URL.createObjectURL(blob), download: 'educa-secours.json' });
  document.body.append(link);
  link.click();
  setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
}

function blocked() {
  store.load(); // lecture seule, notamment pour exporter les données existantes
  const unsupported = store.status.sessionReason !== 'busy';
  const panel = h('main', { class: 'screen stack', tabindex: '-1' },
    h('h1', null, 'Sauvegarde protégée'),
    h('p', null, unsupported
      ? 'Ce navigateur ne permet pas de protéger les sauvegardes entre plusieurs ouvertures. Utilise une version récente de Safari, Firefox ou Chromium, sur localhost ou en HTTPS. Tes données restent disponibles à l’export.'
      : 'EDUCA est déjà ouvert dans un autre onglet ou une fenêtre d’application. Ferme cette autre ouverture, puis reprends ici pour garder tous les progrès.'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, 'Reprendre ici'),
    h('button', { type: 'button', class: 'btn btn-soft', onclick: backup }, 'Exporter une sauvegarde'));
  document.getElementById('app').replaceChildren(panel);
  document.getElementById('boot')?.remove();
  panel.focus();
}

function startApp() {
const boot = store.load();
const offline = createOfflineStatus();
const pagehideTasks = new Set();

const ctx = {
  store, voice, sfx, cur, levels, offline,
  onPageHide(fn) { pagehideTasks.add(fn); return () => pagehideTasks.delete(fn); },
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
  /** Plafond quotidien (réglage de l'adulte) atteint pour l'enfant qui joue ? */
  rested() {
    const p = store.active();
    return !!p && restedToday(p, store.device().dailyMinutes || 0);
  },
  /** Un jeu refusé par le plafond : retour à l'accueil, où Kaya explique qu'elle se repose. */
  restHome() {
    ctx.router.go('hub', { rest: true }, { reset: true });
  },
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
      onAction: () => {
        if (store.flush()) w.postMessage({ type: 'SKIP_WAITING' });
        else toast('La sauvegarde doit réussir avant la mise à jour. Réessaie ou exporte les progrès.');
      },
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
voice.setWordFiles(WORD_FILES);   // voix humaine (Lingua Libre, CC0) pour les mots du jeu
loadRecordings().then(map => voice.setRecordings(map)).catch(() => { /* pas d'IndexedDB : synthèse */ });
voice.configure({ muted: store.device().muted });
voice.init({ preferred: store.device().voice, liveRegion: document.getElementById('sr-live') })
  .then(() => ctx.applyTheme());
mountCaption(document.getElementById('caption'), voice);
ctx.applyTheme();

const app = document.getElementById('app');
observeCompanions(app, voice);
const saveText = h('p', { role: 'status' });
const saveBanner = h('aside', { class: 'panel save-status', hidden: true }, saveText,
  h('button', { type: 'button', class: 'btn btn-soft btn-sm', onclick: () => store.flush() }, 'Réessayer la sauvegarde'),
  h('button', { type: 'button', class: 'btn btn-soft btn-sm', onclick: backup }, 'Exporter une sauvegarde'),
  h('button', { type: 'button', class: 'btn btn-soft btn-sm', onclick: () => location.reload() }, 'Recharger'));
app.before(saveBanner);
function showSaveStatus() {
  const status = store.status;
  saveBanner.hidden = !(status.failed || !status.persistent || status.conflict);
  const text = status.conflict ? 'Les données ont changé dans une autre ouverture. Le jeu est en pause : exporte les progrès en mémoire avant de recharger.'
    : 'Les progrès en mémoire ne sont pas encore sauvegardés sur cet appareil. Réessaie ou exporte une sauvegarde avant de fermer.';
  if (!saveBanner.hidden && saveText.textContent !== text) saveText.textContent = text;
  if (status.conflict) { app.dataset.writeBlocked = ''; app.inert = true; voice.stop(); }
}
store.onChange(showSaveStatus);
showSaveStatus();
const profiles = store.profiles();
try {
  if (!profiles.length) router.go('welcome', {}, { reset: true });
  else if (profiles.length > 1) router.go('profiles', {}, { reset: true });
  else {
    store.setActive(profiles[0].id);
    ctx.applyTheme();
    router.go('hub', { migrated: boot.migrated }, { reset: true });
  }
} catch (err) {
  // Un profil inattendu ne doit jamais empêcher le jeu de démarrer :
  // on note l'erreur pour l'adulte et on ouvre le choix des enfants.
  store.logError({ t: Date.now(), msg: String(err?.message || err).slice(0, 200), where: 'démarrage' });
  router.go(profiles.length ? 'profiles' : 'welcome', {}, { reset: true });
}
document.getElementById('boot')?.remove();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Première installation : le SW prend la main sans qu'il faille recharger
  // (sinon la page se rechargerait toute seule pendant la création du profil).
  const hadController = !!navigator.serviceWorker.controller;
  offline.downloading();
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.active) offline.check(reg.active);
    const watch = w => w?.addEventListener('statechange', () => {
      if (w.state === 'activated') offline.check(w);
      if (w.state === 'redundant') offline.failed();
    });
    watch(reg.installing);
    const offer = w => { ctx.pendingUpdate = w; ctx.offerUpdate(); };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      watch(w);
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
  }).catch(() => { offline.failed(); toast('Téléchargement hors ligne indisponible. Vérifie internet dans l’espace des grands.'); });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    offline.check();
    if (reloading || !hadController) return;
    if (!store.flush()) {
      toast('La mise à jour attend : les progrès en mémoire doivent être sauvegardés ou exportés.');
      return;
    }
    reloading = true;
    location.reload();
  });
}

addEventListener('offline', () => toast(offline.status === 'ready'
  ? 'Jeu téléchargé : tu peux continuer sans internet.'
  : 'Internet est coupé. Le téléchargement du jeu n’est pas encore vérifié.'));

/* Installation comme une application (Android/Chrome) : l'invite est gardée pour l'espace des grands. */
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  ctx.installPrompt = e;
});
addEventListener('appinstalled', () => { ctx.installPrompt = null; });
return () => {
  try { for (const save of pagehideTasks) save(); }
  finally { voice.stop(); store.releaseSession(); }
};
}

if (await store.claimSession()) {
  const leave = startApp();
  addEventListener('pagehide', leave);
  addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { voice.stop(); store.flush(); } });
} else blocked();
