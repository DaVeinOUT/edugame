/* ============================================================
   AUDIO.JS — La voix de Kaya + effets sonores
   Pensé pour les enfants qui ne savent pas encore lire :
   tout ce qui est écrit doit pouvoir être entendu.
   Tout est généré localement — zéro fichier audio, 100% hors-ligne.
   ============================================================ */

/* Les systèmes proposent des voix très inégales : certaines sont
   naturelles, d'autres robotiques ou fantaisistes. On classe pour
   toujours choisir la meilleure voix française disponible. */
const VOICE_PREFS = [
  'google français',            // Chrome / Android — très naturelle
  'natural',                    // Edge — voix neurales Microsoft (Denise, Vivienne…)
  'audrey',                     // macOS / iOS premium
  'amélie', 'amelie',           // macOS / iOS — douce et naturelle
  'virginie', 'aurélie', 'chantal',
  'marie', 'céline', 'hortense', 'julie', 'paul',
  'thomas', 'daniel',           // voix compactes correctes, en dernier recours
];

/* Voix gadgets ou volontairement bizarres : jamais pour un enfant */
const VOICE_AVOID = /\b(eddy|flo|grandma|grandpa|grand-mère|grand-père|rocko|sandy|shelley|reed|jacques|bahh|bells|boing|bubbles|bulles|cellos|wobble|whisper|superstar|trinoids|zarvox|albert|fred|junior|kathy|organ|orgue|murmure|sonnette)\b|nouvelle|news/i;

/* ---------- VOIX (synthèse vocale française) ---------- */
const Voice = {
  _voice: null,        // meilleure voix (peut être une voix réseau)
  _localVoice: null,   // meilleure voix locale (pour le hors-ligne)
  _unlocked: false,    // les mobiles bloquent la voix avant le premier geste
  _pending: null,      // dernier message à rejouer dès que la voix est débloquée

  init() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return;
      const fr = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
      const sorted = [...fr].sort((a, b) => this._rank(a) - this._rank(b));
      const stored = localStorage.getItem('educaVoiceName');
      this._voice = (stored && fr.find(v => v.name === stored)) || sorted[0] || null;
      this._localVoice = sorted.find(v => v.localService) || this._voice;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  },

  _rank(v) {
    const n = v.name.toLowerCase();
    const i = VOICE_PREFS.findIndex(p => n.includes(p));
    if (i >= 0) return i;
    if (VOICE_AVOID.test(n)) return 900 + (v.localService ? 0 : 1);
    return v.localService ? 100 : 200;
  },

  /* Voix proposées dans le sélecteur (sans les voix gadgets) */
  choices() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices()
      .filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'))
      .filter(v => !VOICE_AVOID.test(v.name.toLowerCase()))
      .sort((a, b) => this._rank(a) - this._rank(b))
      .slice(0, 8);
  },

  current() { return this._voice ? this._voice.name : null; },

  /* Choix mémorisé (sélecteur de l'écran Stats) */
  use(name) {
    localStorage.setItem('educaVoiceName', name);
    this.init();
    this.speak('Salut ! Je suis Kaya ! On apprend ensemble ?');
  },

  speak(text, { rate = 0.9, pitch = 1.05, interrupt = true } = {}) {
    if (!('speechSynthesis' in window) || !text) return;
    if (!this._unlocked) this._pending = text;
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    // Hors-ligne, une voix réseau resterait muette : on bascule sur la locale
    const v = (this._voice && !this._voice.localService && !navigator.onLine)
      ? this._localVoice : this._voice;
    if (v) u.voice = v;
    u.rate   = rate;
    u.pitch  = pitch;
    u.volume = 1;
    u.onstart = () => { this._unlocked = true; this._pending = null; };
    speechSynthesis.speak(u);
  },

  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  },
};

/* ---------- EFFETS SONORES (WebAudio, zéro asset) ---------- */
const Sfx = {
  _ctx: null,

  ctx() {
    if (!this._ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this._ctx = new AC();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  _tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const ctx = this.ctx();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  /* Petite mélodie montante — réussite */
  correct() { this._tone(523.25, 0, 0.15); this._tone(659.25, 0.10, 0.15); this._tone(783.99, 0.20, 0.28); },
  /* Ton doux et bas — erreur, jamais punitif */
  wrong()   { this._tone(220, 0, 0.25, 'triangle', 0.10); },
  /* Clic léger — tuile / sélection */
  tap()     { this._tone(440, 0, 0.08, 'sine', 0.08); },
  /* Scintillement — étoiles de fin */
  star()    { this._tone(880, 0, 0.12); this._tone(1174.66, 0.12, 0.22); },
  /* Fanfare — révélation de carte */
  card()    { this._tone(392, 0, 0.12); this._tone(523.25, 0.12, 0.12); this._tone(659.25, 0.24, 0.12); this._tone(1046.5, 0.36, 0.32); },
};

/* Les navigateurs mobiles exigent un geste avant de jouer du son :
   on débloque l'audio au tout premier toucher, et si le tout premier
   message de Kaya a été bloqué, on le rejoue à ce moment-là. */
document.addEventListener('pointerdown', () => {
  Sfx.ctx();
  setTimeout(() => {
    if (!Voice._unlocked && Voice._pending) Voice.speak(Voice._pending);
  }, 150);
}, { once: true });

Voice.init();
