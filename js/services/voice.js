/* ============================================================
   SERVICES/VOICE.JS — La voix de Kaya
   Le joueur ne sait pas lire : tout ce qui est écrit doit pouvoir
   être entendu. Ce service :
   • choisit la meilleure voix française de l'appareil ;
   • enchaîne des phrases, des sons et des pauses (séquences) ;
   • affiche des SOUS-TITRES de tout ce qu'il dit (classe en mode
     silencieux, enfant malentendant, téléphone sans voix) ;
   • joue les sons isolés des lettres (« mmm ») avec la même vraie voix
     humaine que les mots (audio/sons/) ;
   • dit les MOTS du jeu avec une vraie voix humaine (enregistrements
     libres de Lingua Libre, audio/mots/) ; la synthèse prend le relais
     pour les mots sans enregistrement ;
   • se tait si l'enfant utilise un lecteur d'écran (pas de double voix).
   ============================================================ */

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
  ks: 'x',                       // [ks] : « iks », le nom de la lettre (« ks » serait épelé)
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
  return synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
}

function pickVoice() {
  if (!synth) return;
  const all = synth.getVoices();
  if (!all.length) return;
  const fr = frenchVoices().sort((a, b) => rank(a) - rank(b));
  st.voice = (st.preferred && fr.find(v => v.name === st.preferred)) || fr[0] || null;
  st.localVoice = fr.find(v => v.localService) || st.voice;
  st.status = fr.length ? 'ok' : 'novoice';
}

function caption(text) {
  st.captionFns.forEach(fn => { try { fn(text); } catch { /* ignoré */ } });
  if (st.screenReader && st.live && text) {
    st.live.textContent = '';
    setTimeout(() => { st.live.textContent = text; }, 30);
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));
/* Durée estimée d'une phrase : sert de filet si la synthèse oublie
   de signaler la fin (Android), et de rythme en mode silencieux. */
const estimate = (text, rate) => 900 + (text.length * 75) / rate;

function utter(text, { rate, pitch = 1.05, highlight = null }, retried = false) {
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    const v = st.voice && !st.voice.localService && typeof navigator !== 'undefined' && !navigator.onLine
      ? st.localVoice : st.voice;
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      highlight?.classList.remove('speaking');
      resolve();
    };
    const guard = setTimeout(finish, estimate(text, rate) + 2500);
    u.onstart = () => { st.unlocked = true; st.pending = null; highlight?.classList.add('speaking'); };
    u.onend = finish;
    u.onerror = e => {
      // Chrome avale parfois sa file : on retente une fois, sauf annulation voulue.
      if (!retried && e?.error !== 'canceled' && e?.error !== 'interrupted' && e?.error !== 'not-allowed') {
        done = true;
        clearTimeout(guard);
        setTimeout(() => utter(text, { rate, pitch, highlight }, true).then(resolve), 120);
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
    if (ok !== false || myGen !== st.gen) return;   // fini ou coupé ; seule une vraie erreur passe à la synthèse
  }
  if (!synth) {
    await wait(Math.min(2600, estimate(text, rate) * 0.6));
    return;
  }
  if (!st.unlocked) st.pending = text;
  if (interrupt) await wait(90);   // bug Chrome : speak() juste après cancel() peut disparaître
  if (myGen !== st.gen) return;
  await utter(text, { rate, highlight: opts.highlight || null });
}

/* UN seul lecteur audio pour tous les enregistrements (mots et sons) : débloqué au premier
   toucher, il peut ensuite jouer sans geste — l'iPhone refuse un lecteur neuf lancé hors
   d'un toucher. Un fichier audio sonne aussi en mode silencieux d'iPhone (le Web Audio, non). */
let pendingEnd = null;
function player() {
  if (!st.player) st.player = new Audio();
  return st.player;
}

/** Joue un fichier : true (fini), false (illisible ou refusé), null (coupé : remplacé ou arrêté). */
function playFile(url, { rate = 1 } = {}) {
  return new Promise(resolve => {
    pendingEnd?.(null);   // une nouvelle lecture remplace la précédente
    try {
      const a = player();
      a.src = url;
      a.preservesPitch = true;
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      st.audio = a;
      let done = false;
      let guard = null;
      const finish = result => {   // une seule fin : terminé, erreur, garde, ou coupé
        if (done) return;
        done = true;
        clearTimeout(guard);
        a.onended = null;
        a.onerror = null;
        if (pendingEnd === finish) pendingEnd = null;
        resolve(result);
      };
      guard = setTimeout(() => finish(true), 4000);
      pendingEnd = finish;
      a.onended = () => finish(true);
      a.onerror = () => finish(false);
      a.play().catch(() => finish(false));
    } catch {
      resolve(false);
    }
  });
}

/**
 * Fait entendre un son isolé (phonème) : enregistrement si disponible, sinon appui parlé.
 * Comme say(), il coupe d'abord ce qui se dit (sauf dans une séquence).
 * @param {string} ph identifiant de phonème (« m », « ch », « on »…)
 * @param {{ interrupt?: boolean, noCaption?: boolean, caption?: string }} [opts]
 */
async function sound(ph, { interrupt = true, noCaption = false, caption: shown } = {}) {
  if (interrupt) stop();
  const myGen = st.gen;
  if (!noCaption) caption(shown ?? `« ${ph} »`);
  if (st.muted || st.screenReader) { await wait(500); return; }
  // 1. la voix de l'adulte (enregistrée sur cet appareil) ; 2. le son du jeu (voix humaine)
  const url = st.recordings.get(ph) || (st.soundFiles.has(ph) ? `${st.soundBase}${st.soundFiles.get(ph)}.mp3` : null);
  if (url) {
    const ok = await playFile(url);
    if (ok !== false || myGen !== st.gen) return;   // fini ou coupé ; seule une vraie erreur passe à la synthèse
  }
  // 3. fichier illisible : la synthèse vocale (syllabe d'appui pour une consonne)
  const fallback = SOUND_TTS[ph];
  if (!fallback || !synth) return;
  if (interrupt) await wait(90);   // bug Chrome : speak() juste après cancel() peut disparaître
  if (myGen === st.gen) await utter(fallback, { rate: 0.7 });
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
    else if (part.sound) await sound(part.sound, { interrupt: false, noCaption: true });
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
  try { synth?.cancel(); } catch { /* rien */ }
  try { st.audio?.pause(); } catch { /* rien */ }
  pendingEnd?.(null);
  st.audio = null;
}

/** Un dixième de seconde de silence (WAV 16 bits mono, échantillons à zéro). */
function silenceUrl() {
  const rate = 8000;
  const n = 800;
  const v = new DataView(new ArrayBuffer(44 + n * 2));
  const text = (at, s) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  text(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([v.buffer], { type: 'audio/wav' }));
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
    if (screenReader !== undefined) st.screenReader = !!screenReader;
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
  setRecordings(map) { st.recordings = map instanceof Map ? map : new Map(); },
  hasRecording: ph => st.recordings.has(ph),
  say, seq, sound, stop,
  onCaption(fn) { st.captionFns.add(fn); return () => st.captionFns.delete(fn); },
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
