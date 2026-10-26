/* ============================================================
   SERVICES/PHONEMES.JS — Les sons purs des consonnes, synthétisés
   La synthèse vocale du téléphone sait dire « ma », pas « mmm » :
   pour une consonne seule, elle ajoute une voyelle (« me ») — ce que
   les méthodes de lecture demandent justement d'éviter (Dehaene et
   al. 2012). Ici, chaque son est fabriqué comme le fait la bouche :
   • frottement de l'air = bruit filtré (s aigu, ch moyen, f diffus) ;
   • vibration de la voix = son périodique doux (m, n, l, z, v, j) ;
   • petits bruits secs = explosion très brève (p, t, k, b, d, g).
   Zéro fichier, hors-ligne. Un son ENREGISTRÉ par l'adulte (espace
   des grands) est toujours préféré à cette synthèse de secours.
   ============================================================ */

const LONG = 0.8;       // durée d'un son qu'on peut prolonger (secondes)
const PITCH = 170;      // hauteur de la vibration de voix (Hz)

let noiseBuf = null;
function noiseBuffer(ctx) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function noise(ctx, t0, dur) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  src.start(t0);
  src.stop(t0 + dur + 0.05);
  return src;
}

/* Vibration de voix : harmoniques décroissantes (plus douce qu'une dent de scie). */
function voice(ctx, t0, dur, f0 = PITCH) {
  const osc = ctx.createOscillator();
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) imag[i] = 1 / i ** 1.5;
  osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.linearRampToValueAtTime(f0 * 0.94, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  return osc;
}

function filter(ctx, type, freq, q = 0.7, gainDb = 0) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  f.gain.value = gainDb;
  return f;
}

function envelope(ctx, t0, dur, peak, attack = 0.04, release = 0.09) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.setValueAtTime(peak, Math.max(t0 + attack, t0 + dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
}

/* Frottement : bruit filtré autour d'une fréquence caractéristique. */
function hiss(ctx, out, t0, dur, { lo, hi, peak, gain, q = 1 }) {
  chain(noise(ctx, t0, dur), filter(ctx, 'highpass', lo), filter(ctx, 'lowpass', hi),
    filter(ctx, 'peaking', peak, q, 6), envelope(ctx, t0, dur, gain), out);
}

/* Bourdonnement de voix filtré (voisement de z, v, j ; barre de b, d, g). */
function hum(ctx, out, t0, dur, { lp = 450, gain = 0.3 } = {}) {
  chain(voice(ctx, t0, dur), filter(ctx, 'lowpass', lp), envelope(ctx, t0, dur, gain), out);
}

/* Résonances de la bouche (formants) sur la vibration de voix : m, n, l, gn, y… */
function formants(ctx, out, t0, dur, list, gain = 0.5) {
  const src = voice(ctx, t0, dur);
  const env = envelope(ctx, t0, dur, gain, 0.05, 0.1);
  for (const [f, level, q] of list) {
    const bp = filter(ctx, 'bandpass', f, q || 6);
    const g = ctx.createGain();
    g.gain.value = level;
    chain(src, bp, g, env);
  }
  env.connect(out);
}

/* Petit bruit sec : une explosion de quelques millisecondes (répétée deux fois). */
function burst(ctx, out, t0, { type, freq, voiced }) {
  let t = t0;
  if (voiced) {
    hum(ctx, out, t, 0.08, { lp: 260, gain: 0.35 });
    t += 0.07;
  }
  chain(noise(ctx, t, 0.025), filter(ctx, type, freq, 1.2), envelope(ctx, t, 0.025, 0.5, 0.002, 0.015), out);
  chain(noise(ctx, t + 0.02, 0.05), filter(ctx, 'bandpass', freq, 0.8), envelope(ctx, t + 0.02, 0.05, 0.12, 0.005, 0.035), out);
  return t - t0 + 0.08;
}

const S = { lo: 4200, hi: 11000, peak: 7000, gain: 0.2 };
const CH = { lo: 1700, hi: 6500, peak: 3000, gain: 0.24 };
const F = { lo: 1100, hi: 12000, peak: 5000, gain: 0.1, q: 0.3 };
const plosive = opts => (ctx, out, t0) => {
  const d1 = burst(ctx, out, t0, opts);
  const d2 = burst(ctx, out, t0 + d1 + 0.32, opts);
  return d1 + 0.32 + d2;
};

/* Chaque recette dessine le son et renvoie sa durée. */
const RECIPES = {
  s: (c, o, t) => { hiss(c, o, t, LONG, S); return LONG; },
  ch: (c, o, t) => { hiss(c, o, t, LONG, CH); return LONG; },
  f: (c, o, t) => { hiss(c, o, t, LONG, F); return LONG; },
  z: (c, o, t) => { hiss(c, o, t, LONG, { ...S, gain: 0.28 }); hum(c, o, t, LONG, { lp: 380, gain: 0.3 }); return LONG; },
  j: (c, o, t) => { hiss(c, o, t, LONG, { ...CH, gain: 0.3 }); hum(c, o, t, LONG, { lp: 380, gain: 0.3 }); return LONG; },
  v: (c, o, t) => { hiss(c, o, t, LONG, { ...F, gain: 0.12 }); hum(c, o, t, LONG, { lp: 420, gain: 0.38 }); return LONG; },
  m: (c, o, t) => { formants(c, o, t, LONG, [[250, 1, 3], [1000, 0.12], [2200, 0.05]], 0.6); return LONG; },
  n: (c, o, t) => { formants(c, o, t, LONG, [[280, 1, 3], [1500, 0.18], [2500, 0.08]], 0.6); return LONG; },
  gn: (c, o, t) => { formants(c, o, t, LONG, [[280, 1, 3], [2200, 0.3], [3000, 0.1]], 0.55); return LONG; },
  l: (c, o, t) => { formants(c, o, t, LONG, [[360, 1, 4], [1250, 0.35], [2700, 0.15]], 0.55); return LONG; },
  y: (c, o, t) => { formants(c, o, t, 0.45, [[280, 1, 5], [2250, 0.5], [3000, 0.25]], 0.5); return 0.45; },
  r: (c, o, t) => {
    hiss(c, o, t, LONG, { lo: 500, hi: 3000, peak: 1300, gain: 0.25, q: 0.8 });
    hum(c, o, t, LONG, { lp: 900, gain: 0.18 });
    return LONG;
  },
  p: plosive({ type: 'lowpass', freq: 1200 }),
  t: plosive({ type: 'highpass', freq: 3800 }),
  k: plosive({ type: 'bandpass', freq: 2000 }),
  b: plosive({ type: 'lowpass', freq: 1200, voiced: true }),
  d: plosive({ type: 'highpass', freq: 3800, voiced: true }),
  g: plosive({ type: 'bandpass', freq: 2000, voiced: true }),
  // [ks], [gz] (taxi, examen) : un petit bruit sec puis le sifflement — jamais « ka-èss » épelé par la synthèse.
  ks: (c, o, t) => { const d = burst(c, o, t, { type: 'bandpass', freq: 2000 }); hiss(c, o, t + d, 0.5, S); return d + 0.5; },
  gz: (c, o, t) => {
    const d = burst(c, o, t, { type: 'bandpass', freq: 2000, voiced: true });
    hiss(c, o, t + d, 0.5, { ...S, gain: 0.28 });
    hum(c, o, t + d, 0.5, { lp: 380, gain: 0.3 });
    return d + 0.5;
  },
};

/** Ce son peut-il être synthétisé (consonnes) ? Les voyelles passent par la voix. */
export function canSynth(ph) {
  return Object.prototype.hasOwnProperty.call(RECIPES, ph);
}

/**
 * Dessine le son dans un contexte audio (temps réel ou hors-ligne pour les tests).
 * @returns {number} durée en secondes
 */
export function renderPhoneme(ctx, ph, t0 = ctx.currentTime + 0.02, out = ctx.destination) {
  const recipe = RECIPES[ph];
  if (!recipe) return 0;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(out);
  return recipe(ctx, master, t0);
}

/* ---- Le son fabriqué, rendu en petit fichier WAV (une fois, puis gardé) ----
   Joué par le même lecteur audio que la voix humaine, il sonne aussi quand
   l'iPhone est en mode silencieux (le Web Audio, lui, se tait alors) et ne
   dépend pas d'un contexte audio resté « suspendu ». */
const WAV_RATE = 44100;
const wavUrls = new Map();

/** Échantillons (−1…1) → fichier WAV 16 bits mono. */
export function toWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([buf], { type: 'audio/wav' });
}

/** Adresse (blob:) du son fabriqué, rendu hors-ligne ; null si le navigateur ne sait pas. */
export async function phonemeUrl(ph) {
  if (!canSynth(ph)) return null;
  if (wavUrls.has(ph)) return wavUrls.get(ph);
  const Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!Offline || typeof URL === 'undefined' || !URL.createObjectURL) return null;
  const ctx = new Offline(1, Math.round(WAV_RATE * 1.5), WAV_RATE);
  const dur = renderPhoneme(ctx, ph, 0.02, ctx.destination);
  const audio = await new Promise((resolve, reject) => {
    ctx.oncomplete = e => resolve(e.renderedBuffer);          // anciens Safari : événement
    const p = ctx.startRendering();
    if (p && typeof p.then === 'function') p.then(resolve, reject);
  });
  const n = Math.min(audio.length, Math.round(WAV_RATE * (dur + 0.1)));
  const url = URL.createObjectURL(toWav(audio.getChannelData(0).subarray(0, n), WAV_RATE));
  wavUrls.set(ph, url);
  return url;
}

/** Un souffle de silence, pour débloquer le lecteur audio au premier toucher (iPhone). */
export function silenceUrl() {
  return URL.createObjectURL(toWav(new Float32Array(800), 8000));
}

/** Joue le son et attend sa fin (Web Audio direct : dernier recours). */
export function playPhoneme(ctx, ph, { signal } = {}) {
  if (signal?.aborted) return Promise.resolve();
  // Toute la recette passe par cette sortie : la déconnexion coupe aussi les
  // sources déjà programmées, sans fermer le contexte partagé avec les effets.
  const out = ctx.createGain();
  out.connect(ctx.destination);
  return new Promise((resolve, reject) => {
    let timer;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cleanup);
      out.disconnect();
      resolve();
    };
    signal?.addEventListener('abort', cleanup, { once: true });
    if (signal?.aborted) { cleanup(); return; }
    try {
      const dur = renderPhoneme(ctx, ph, ctx.currentTime + 0.02, out);
      timer = setTimeout(cleanup, (dur + 0.12) * 1000);
    } catch (error) {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cleanup);
      out.disconnect();
      finished = true;
      reject(error);
    }
  });
}
