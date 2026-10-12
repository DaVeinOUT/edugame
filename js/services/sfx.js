/* ============================================================
   SERVICES/SFX.JS — Effets sonores (WebAudio, zéro fichier)
   Doux et jamais punitifs : une erreur sonne bas et court,
   une réussite chante. Tout est généré : rien à télécharger.
   ============================================================ */

let ctx = null;
let muted = false;

function audio() {
  if (muted) return null;
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.16) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  set muted(v) { muted = !!v; },
  get muted() { return muted; },
  /** À appeler lors d'un geste : débloque l'audio sur mobile. */
  unlock() { audio(); },
  /** Petite mélodie montante — réussite */
  correct() { tone(523.25, 0, 0.14); tone(659.25, 0.1, 0.14); tone(783.99, 0.2, 0.26); },
  /** Ton doux et bas — erreur, jamais punitif */
  wrong() { tone(260, 0, 0.22, 'triangle', 0.08); },
  /** Clic léger — sélection */
  tap() { tone(440, 0, 0.07, 'sine', 0.07); },
  /** Petit « pop » — une tuile qui se pose */
  pop() { tone(660, 0, 0.06, 'triangle', 0.08); tone(990, 0.04, 0.06, 'sine', 0.05); },
  /** Scintillement — étoiles */
  star() { tone(880, 0, 0.12); tone(1174.66, 0.12, 0.22); },
  /** Fanfare — carte gagnée */
  card() { tone(392, 0, 0.12); tone(523.25, 0.12, 0.12); tone(659.25, 0.24, 0.12); tone(1046.5, 0.36, 0.32); },
  /** Grande fanfare — promotion d'échecs (nouveau titre) */
  promote() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.13, 0.18, 'triangle', 0.12));
    tone(1318.5, 0.6, 0.5, 'sine', 0.14);
    tone(783.99, 0.6, 0.5, 'sine', 0.08);
  },
};
