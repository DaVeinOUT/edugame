/* ============================================================
   SERVICES/VOICE.JS — La voix de Kaya
   Le joueur ne sait pas lire : tout ce qui est écrit doit pouvoir
   être entendu. Ce service :
   • choisit la meilleure voix française de l'appareil ;
   • enchaîne des phrases, des sons et des pauses (séquences) ;
   • affiche des SOUS-TITRES de tout ce qu'il dit (classe en mode
     silencieux, enfant malentendant, téléphone sans voix) ;
   • joue les sons isolés des lettres (« mmm ») depuis de petits
     fichiers quand ils existent, sinon s'appuie sur un mot ;
   • dit les MOTS du jeu avec une vraie voix humaine (enregistrements
     libres de Lingua Libre, audio/mots/) ; la synthèse prend le relais
     pour les mots sans enregistrement ;
   • se tait si l'enfant utilise un lecteur d'écran (pas de double voix).
   ============================================================ */

import { canSynth, playPhoneme, phonemeUrl, silenceUrl } from './phonemes.js';
import { audioContext } from './sfx.js';

/* Classement des voix : naturelles d'abord, gadgets jamais. */
const VOICE_PREFS = [
  'google français', 'natural', 'audrey', 'amélie', 'amelie', 'virginie', 'aurélie',
  'chantal', 'marie', 'céline', 'hortense', 'julie', 'paul', 'thomas', 'daniel',
];
const VOICE_AVOID = /\b(eddy|flo|grandma|grandpa|grand-mère|grand-père|rocko|sandy|shelley|reed|jacques|bahh|bells|boing|bubbles|bulles|cellos|wobble|whisper|superstar|trinoids|zarvox|albert|fred|junior|kathy|organ|orgue|murmure|sonnette)\b|nouvelle|news/i;

/* Quand le fichier d'un son manque : ce que la synthèse sait dire
   correctement pour faire entendre ce son (les voyelles se disent
   seules ; les consonnes passent par une syllabe d'appui). */
export const SOUND_TTS = Object.freeze({
  a: 'a', i: 'i', o: 'o', u: 'u', ou: 'ou', e: 'eu', 'é': 'é', 'è': 'è', eu: 'eux',
  on: 'on', an: 'an', in: 'hein', oi: 'oie', oin: 'ouin', ui: 'hui', ien: 'ien',
  m: 'mmmm', n: 'nnnn', l: 'llll', r: 'rrrr', s: 'ssss', z: 'zzzz', f: 'ffff', v: 'vvvv',
  ch: 'chhhh', j: 'jjjj', p: 'pe', b: 'be', t: 'te', d: 'de', k: 'ke', g: 'gue',
  gn: 'gne', y: 'ye', w: 'ou',   // [w] : un [u] bref (« oua » ferait entendre [wa], absent de « kiwi »)
});

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
const DEFAULT_RATE = 0.9;
const SLOW_RATE = 0.75;
/* Mots enregistrés : un peu ralentis pour l'apprenti lecteur (hauteur de voix conservée). */
const WORD_RATE = 0.85;
const WORD_SLOW_RATE = 0.75;

const st = {
  voice: null, localVoice: null, preferred: null,
  unlocked: false, pending: null,
  muted: false, screenReader: false, slow: false,
  status: synth ? 'unknown' : 'unsupported',   // ok | novoice | unknown | unsupported
  gen: 0,                                        // génération : une nouvelle phrase coupe les séquences en cours
  soundFiles: new Map(), soundBase: 'audio/sons/', recordings: new Map(),
  wordFiles: new Map(), wordBase: 'audio/mots/',
  captionFns: new Set(), live: null, audio: null,
  playbackFns: new Set(), speaking: false, cancelUtterance: null,
  phonemeController: null,
};

/* Confidentialité : une voix « en ligne » (ex. Google français sur
   ordinateur) envoie le texte — prénom de l'enfant compris — au serveur
   de l'éditeur. Les voix locales passent donc TOUJOURS devant. */
function rank(v) {
  const n = v.name.toLowerCase();
  const online = v.localService ? 0 : 1000;
  const i = VOICE_PREFS.findIndex(p => n.includes(p));
  if (i >= 0) return online + i;
  if (VOICE_AVOID.test(n)) return online + 900;
  return online + 100;
}

function frenchVoices() {
  if (!synth) return [];
  return synth.getVoices().filter(v => v.localService === true && v.lang && v.lang.toLowerCase().startsWith('fr'));
}

function pickVoice() {
  if (!synth) return;
  const fr = frenchVoices().sort((a, b) => rank(a) - rank(b));
  st.voice = (st.preferred && fr.find(v => v.name === st.preferred)) || fr[0] || null;
  st.localVoice = st.voice;
  st.status = fr.length ? 'ok' : 'novoice';
}

function playback(speaking) {
  if (st.speaking === speaking) return;
  st.speaking = speaking;
  st.playbackFns.forEach(fn => { try { fn(speaking); } catch { /* rendu facultatif */ } });
}

function caption(text) {
  st.captionFns.forEach(fn => { try { fn(text); } catch { /* ignoré */ } });
  if (st.screenReader && st.live && text) {
    const generation = st.gen;
    st.live.textContent = '';
    setTimeout(() => { if (generation === st.gen) st.live.textContent = text; }, 30);
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));
/* Durée estimée d'une phrase : sert de filet si la synthèse oublie
   de signaler la fin (Android), et de rythme en mode silencieux. */
const estimate = (text, rate) => 900 + (text.length * 75) / rate;

function utter(text, { rate, pitch = 1.05, highlight = null }, retried = false) {
  if (!synth || !st.voice || st.muted || st.screenReader) return Promise.resolve();
  const generation = st.gen;
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.voice = st.voice;
    u.rate = rate;
    u.pitch = pitch;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      highlight?.classList.remove('speaking');
      if (st.cancelUtterance === finish) { st.cancelUtterance = null; playback(false); }
      resolve();
    };
    const guard = setTimeout(finish, estimate(text, rate) + 2500);
    st.cancelUtterance = finish;
    u.onstart = () => { if (done || generation !== st.gen) return; st.unlocked = true; st.pending = null; playback(true); highlight?.classList.add('speaking'); };
    u.onend = finish;
    u.onerror = e => {
      if (done || generation !== st.gen) return;
      // Chrome avale parfois sa file : on retente une fois, sauf annulation voulue.
      if (!retried && e?.error !== 'canceled' && e?.error !== 'interrupted' && e?.error !== 'not-allowed') {
        done = true;
        clearTimeout(guard);
        playback(false);
        if (st.cancelUtterance === finish) st.cancelUtterance = null;
        setTimeout(() => generation === st.gen ? utter(text, { rate, pitch, highlight }, true).then(resolve) : resolve(), 120);
        return;
      }
      if (e?.error === 'not-allowed') st.pending = text;   // pas encore de geste : rejoué au 1er toucher
      finish();
    };
    synth.speak(u);
  });
}

/**
 * Dit une phrase. Renvoie une promesse résolue à la fin (ou à l'annulation).
 * @param {string} text
 * @param {{ interrupt?: boolean, rate?: number, highlight?: Element | null, slowWord?: boolean }} [opts]
 */
async function say(text, opts = {}) {
  if (!text) return;
  const { interrupt = true } = opts;
  if (interrupt) stop();
  const myGen = st.gen;
  const rate = opts.rate ?? (st.slow ? SLOW_RATE : DEFAULT_RATE) * (opts.slowWord ? 0.85 : 1);
  if (!opts.noCaption) caption(opts.caption ?? text);   // caption : sous-titre imposé (jamais la réponse)
  if (st.muted || st.screenReader) {
    await wait(Math.min(2600, estimate(text, rate) * 0.6));
    return;
  }
  // Un mot du jeu : la voix humaine enregistrée, si on l'a (marche aussi sans synthèse vocale).
  const file = opts.slowWord ? st.wordFiles.get(text.trim().toLowerCase()) : null;
  if (file) {
    opts.highlight?.classList.add('speaking');
    const ok = await playFile(`${st.wordBase}${file}.mp3`, { rate: st.slow ? WORD_SLOW_RATE : WORD_RATE });
    opts.highlight?.classList.remove('speaking');
    if (ok || myGen !== st.gen) return;
  }
  if (!synth || !st.voice) {
    await wait(Math.min(2600, estimate(text, rate) * 0.6));
    return;
  }
  if (!st.unlocked) st.pending = text;
  if (interrupt) await wait(90);   // bug Chrome : speak() juste après cancel() peut disparaître
  if (myGen !== st.gen) return;
  await utter(text, { rate, highlight: opts.highlight || null });
}

/* UN seul lecteur audio pour tout (voix humaine, voyelles, sons fabriqués) : débloqué au
   premier toucher, il peut ensuite jouer sans geste — l'iPhone refuse un lecteur neuf
   lancé hors d'un toucher. */
let pendingEnd = null;
function player() {
  if (!st.player) st.player = new Audio();
  return st.player;
}

function playFile(url, { rate = 1 } = {}) {
  return new Promise(resolve => {
    pendingEnd?.(false);   // une nouvelle lecture remplace la précédente
    try {
      const a = player();
      a.src = url;
      a.preservesPitch = true;
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      st.audio = a;
      let done = false;
      let guard = null;
      const finish = ok => {   // une seule fin : terminé, erreur, garde, ou remplacé / arrêté
        if (done) return;
        done = true;
        clearTimeout(guard);
        a.onended = null;
        a.onerror = null;
        a.onplaying = null;
        playback(false);
        if (pendingEnd === finish) pendingEnd = null;
        resolve(ok);
      };
      guard = setTimeout(() => finish(true), 4000);
      pendingEnd = finish;
      a.onended = () => finish(true);
      a.onerror = () => finish(false);
      a.onplaying = () => { if (!done) playback(true); };
      a.play().catch(() => finish(false));
    } catch {
      resolve(false);
    }
  });
}

/**
 * Fait entendre un son isolé (phonème) : fichier si disponible, sinon appui parlé.
 * @param {string} ph identifiant de phonème (« m », « ch », « on »…)
 */
async function sound(ph, { noCaption = false, caption: shown } = {}) {
  const myGen = st.gen;
  if (!noCaption) caption(shown ?? `« ${ph} »`);
  if (st.muted || st.screenReader) { await wait(500); return; }
  // 1. la voix de l'adulte (enregistrée sur cet appareil) ; 2. un fichier du jeu
  const url = st.recordings.get(ph) || (st.soundFiles.has(ph) ? `${st.soundBase}${st.soundFiles.get(ph)}.mp3` : null);
  if (url) {
    const ok = await playFile(url);
    if (ok || myGen !== st.gen) return;
  }
  // 3. consonne : son pur fabriqué (jamais « me » pour [m]), joué comme un fichier par le lecteur
  //    commun (sonne aussi en mode silencieux d'iPhone) ; sinon Web Audio direct.
  if (canSynth(ph)) {
    const synthUrl = await phonemeUrl(ph).catch(() => null);
    if (myGen !== st.gen) return;
    if (synthUrl && (await playFile(synthUrl) || myGen !== st.gen)) return;
    const ctx = audioContext();
    if (ctx) {
      const controller = new AbortController();
      st.phonemeController?.abort();
      st.phonemeController = controller;
      playback(true);
      try { await playPhoneme(ctx, ph, { signal: controller.signal }); }
      finally { if (st.phonemeController === controller) { st.phonemeController = null; playback(false); } }
      return;
    }
  }
  // 4. voyelles : la synthèse vocale les dit correctement
  const fallback = SOUND_TTS[ph];
  if (fallback && synth) await utter(fallback, { rate: 0.7 });
}

/**
 * Enchaîne des éléments : texte, { sound }, { pause }, { word }, { say, ... }.
 * Une nouvelle phrase (interrupt) arrête la séquence en cours.
 * @param {Array<string | object>} parts
 * @param {{ interrupt?: boolean }} [opts]
 */
async function seq(parts, { interrupt = true, caption: shown } = {}) {
  if (interrupt) stop();
  const myGen = st.gen;
  // Un seul sous-titre, la phrase entière — ou celui imposé pendant une question (sans la réponse).
  caption(shown ?? captionOf(parts));
  for (const part of parts) {
    if (myGen !== st.gen) return;
    if (typeof part === 'string') await say(part, { interrupt: false, noCaption: true });
    else if (part.pause) await wait(part.pause);
    else if (part.sound) await sound(part.sound, { noCaption: true });
    else if (part.word) await say(part.word, { interrupt: false, slowWord: true, highlight: part.highlight, noCaption: true });
    else if (part.say) await say(part.say, { ...part, interrupt: false, noCaption: true });
  }
}

/**
 * Texte lisible d'une séquence (sous-titres, bulles de Kaya).
 * @param {Array<string | object>} parts
 */
export function captionOf(parts) {
  return parts
    .map(p => (typeof p === 'string' ? p : p.word || (p.sound ? `« ${p.sound} »` : p.say || '')))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([.,…])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Coupe tout : synthèse, fichier en cours, séquences. */
function stop() {
  st.gen++;
  st.pending = null;
  st.cancelUtterance?.();
  st.phonemeController?.abort();
  st.phonemeController = null;
  playback(false);
  try { synth?.cancel(); } catch { /* rien */ }
  try { st.audio?.pause(); } catch { /* rien */ }
  pendingEnd?.(false);
  st.audio = null;
}

/** Les mobiles bloquent le son avant le premier geste : on rejoue alors la dernière phrase. */
/* Débloque le lecteur commun pendant un vrai geste (iPhone : toucher, ou clic) en lui faisant
   jouer un souffle de silence ; ensuite il joue sans geste. Rien en mode silencieux ni lecteur d'écran. */
function unlockPlayer() {
  if (st.playerUnlocked || st.muted || st.screenReader) return;
  try {
    const a = player();
    if (!a.src) {
      a.src = silenceUrl();
      a.play().then(() => { st.playerUnlocked = true; }).catch(() => {});
    }
  } catch { /* pas de lecteur audio : la synthèse prend le relais */ }
}

function unlockOnFirstTouch() {
  if (typeof document === 'undefined') return;
  for (const type of ['touchend', 'pointerup', 'click']) document.addEventListener(type, unlockPlayer, { capture: true });
  document.addEventListener('pointerdown', () => {
    setTimeout(() => {
      if (!st.unlocked && st.pending && synth && !st.muted && !st.screenReader) {
        const text = st.pending;
        st.pending = null;
        utter(text, { rate: st.slow ? SLOW_RATE : DEFAULT_RATE });
      }
    }, 150);
  }, { once: true, capture: true });
}

export const voice = {
  /** Prépare la voix ; la promesse se résout quand on sait si une voix française existe. */
  init({ preferred = null, liveRegion = null } = {}) {
    st.preferred = preferred;
    st.live = liveRegion;
    unlockOnFirstTouch();
    if (!synth) return Promise.resolve(st.status);
    pickVoice();
    synth.onvoiceschanged = pickVoice;
    // Chrome fige parfois la file (pending sans parler) : réveil discret.
    setInterval(() => {
      try { if (synth.pending && !synth.speaking) synth.resume(); } catch { /* rien */ }
    }, 4000);
    return new Promise(resolve => {
      const t0 = Date.now();
      const check = () => {
        if (st.status !== 'unknown' || Date.now() - t0 > 2500) resolve(st.status);
        else setTimeout(check, 150);
      };
      check();
    });
  },
  configure({ muted, screenReader, slow, preferred } = {}) {
    if (muted !== undefined) { st.muted = !!muted; if (st.muted) stop(); }
    if (screenReader !== undefined) { st.screenReader = !!screenReader; if (st.screenReader) stop(); }
    if (slow !== undefined) st.slow = !!slow;
    if (preferred !== undefined) { st.preferred = preferred; pickVoice(); }
  },
  /** Sons enregistrés disponibles (audio/sons/) : { phonème: fichier } (ou une liste de phonèmes). */
  setSoundFiles(files, base) {
    st.soundFiles = new Map(Array.isArray(files) ? files.map(ph => [ph, encodeURIComponent(ph)]) : Object.entries(files || {}));
    if (base) st.soundBase = base;
  },
  /** Mots enregistrés (voix humaine) : { mot en minuscules: nom du fichier sans .mp3 }. */
  setWordFiles(map, base) {
    st.wordFiles = new Map(Object.entries(map || {}));
    if (base) st.wordBase = base;
  },
  hasWord: text => st.wordFiles.has(String(text).trim().toLowerCase()),
  /** Sons purs enregistrés par l'adulte (Map phonème → URL). */
  setRecordings(map) {
    const next = map instanceof Map ? map : new Map();
    for (const url of st.recordings.values()) if (![...next.values()].includes(url)) URL.revokeObjectURL(url);
    st.recordings = next;
  },
  hasRecording: ph => st.recordings.has(ph),
  say, seq, sound, stop,
  onCaption(fn) { st.captionFns.add(fn); return () => st.captionFns.delete(fn); },
  onPlayback(fn) { st.playbackFns.add(fn); fn(st.speaking); return () => st.playbackFns.delete(fn); },
  get status() { return st.status; },
  get muted() { return st.muted; },
  /** Voix proposées à l'adulte (sans les voix gadgets). */
  choices() {
    return frenchVoices()
      .filter(v => !VOICE_AVOID.test(v.name.toLowerCase()))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 8);
  },
  current() { return st.voice ? st.voice.name : null; },
};
