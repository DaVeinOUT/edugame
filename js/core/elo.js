/* ============================================================
   CORE/ELO.JS — L'Élo bienveillant
   Comme aux échecs, chaque exercice est un « adversaire » qui a sa
   propre force (sa difficulté). Réussir contre un adversaire fort
   fait beaucoup progresser ; contre un adversaire facile, un peu.

   Deux nombres, deux usages :
   • θ (theta) : le niveau ESTIMÉ, honnête, qui monte et descend.
     Il sert seulement à proposer des exercices à la bonne
     difficulté. Seul l'adulte voit sa courbe (espace parents).
   • L'Élo AFFICHÉ : ce que voit l'enfant. Il ne baisse JAMAIS.
     C'est le record de l'estimation prudente θ − σ : un coup de
     chance au début ne le gonfle pas (σ est encore grand), un jour
     difficile ne le fait pas reculer, et chaque séance régulière
     le fait grimper (σ se resserre, θ monte).

   Modèle : logistique avec chance de deviner (QCM à k réponses),
   mise à jour bayésienne approchée (type Glicko) en échelle logit.
   ============================================================ */

/* Paramètres réglés par simulation (rapports/2026-10-12-recherche-elo.md). */
export const ELO = Object.freeze({
  scale: 400 / Math.LN10,   // ≈ 174 points affichés par logit (convention des échecs)
  offset: 1000,             // θ = 0  ↔  1000 points
  start: { '4-6': -3.0, '7-9': -2.2, '10-12': -1.4 },
  v0: 1.0,                  // incertitude de départ (variance, en logit²)
  vMax: 1.0,                // l'incertitude ne dépasse jamais celle du départ
  q: 0.004,                 // l'enfant APPREND : θ doit pouvoir bouger longtemps
  drift: 0.015,             // incertitude ajoutée par jour d'absence
  kSigma: 1,                // affichage prudent = θ − 1·σ
  helpWeight: 0.5,          // « je ne sais pas » : une demi-information, sans drame
  historyMax: 180,
});

/* Titres d'échecs, du pion au roi. Le pion qui traverse l'échiquier
   et devient une pièce forte : c'est l'enfant qui devient lecteur. */
export const TITLES = Object.freeze([
  { id: 'pion',     min: 0,    icon: '♟', name: 'Pion' },
  { id: 'cavalier', min: 600,  icon: '♞', name: 'Cavalier' },
  { id: 'fou',      min: 800,  icon: '♝', name: 'Fou' },
  { id: 'tour',     min: 1000, icon: '♜', name: 'Tour' },
  { id: 'dame',     min: 1200, icon: '♛', name: 'Dame' },
  { id: 'roi',      min: 1400, icon: '♚', name: 'Roi' },
]);

const DAY = 86400000;
const sigmoid = x => 1 / (1 + Math.exp(-x));
const clampV = v => Math.min(ELO.vMax, Math.max(1e-4, v));

/**
 * @typedef {{ theta: number, v: number, n: number, peak: number,
 *             lastAt: number, history: Array<[string, number, number]> }} EloState
 */

/**
 * Point de départ selon l'âge (le test de positionnement l'affine ensuite).
 * @param {string} [age] '4-6' | '7-9' | '10-12'
 * @param {number} [now]
 * @returns {EloState}
 */
export function initialState(age = '4-6', now = Date.now()) {
  const theta = ELO.start[age] ?? ELO.start['4-6'];
  const base = { theta, v: ELO.v0, n: 0, peak: 0, lastAt: now, history: [] };
  return { ...base, peak: prudent(base) };
}

/**
 * Probabilité de réussir un exercice de difficulté d.
 * @param {number} theta niveau de l'enfant (logit)
 * @param {number} d difficulté de l'exercice (logit)
 * @param {number} [guess] chance de répondre juste au hasard (1/k)
 */
export function probability(theta, d, guess = 0) {
  return guess + (1 - guess) * sigmoid(theta - d);
}

/**
 * Prend en compte UNE réponse. Renvoie un nouvel état (rien n'est modifié).
 * @param {EloState} state
 * @param {{ d: number, correct: boolean, guess?: number, help?: boolean }} answer
 * @returns {EloState}
 */
export function update(state, { d, correct, guess = 0, help = false }) {
  const weight = help ? ELO.helpWeight : 1;
  const y = correct && !help ? 1 : 0;
  const v = clampV(state.v + ELO.q);
  const s = sigmoid(state.theta - d);
  const p = Math.min(0.999, Math.max(0.001, guess + (1 - guess) * s));
  const dp = (1 - guess) * s * (1 - s);
  const info = weight * (dp * dp) / (p * (1 - p));
  const vNew = clampV(1 / (1 / v + info));
  const theta = state.theta + weight * vNew * dp * (y - p) / (p * (1 - p));
  return { ...state, theta, v: vNew, n: state.n + 1 };
}

/**
 * Une absence rend l'estimation moins sûre (vacances, maladie…).
 * L'affichage, lui, ne bouge pas : c'est un record.
 * @param {EloState} state
 * @param {number} now
 * @returns {EloState}
 */
export function decay(state, now = Date.now()) {
  const days = Math.max(0, (now - (state.lastAt || now)) / DAY);
  if (days < 0.5) return state;
  return { ...state, v: clampV(state.v + ELO.drift * days), lastAt: now };
}

/** Points affichés correspondant à un θ. */
export function toPoints(theta) {
  return Math.max(0, Math.round(ELO.offset + ELO.scale * theta));
}

/** Estimation prudente θ − kσ, en points. */
export function prudent(state) {
  return toPoints(state.theta - ELO.kSigma * Math.sqrt(state.v));
}

/** Ce que voit l'enfant : son record, jamais en baisse. */
export function display(state) {
  return Math.max(state.peak || 0, 0);
}

/**
 * Titre d'échecs pour un nombre de points, et progression vers le suivant.
 * @param {number} points
 */
export function titleFor(points) {
  let i = 0;
  while (i + 1 < TITLES.length && points >= TITLES[i + 1].min) i++;
  const title = TITLES[i];
  const next = TITLES[i + 1] || null;
  const progress = next ? (points - title.min) / (next.min - title.min) : 1;
  return { title, next, progress: Math.min(1, Math.max(0, progress)), rank: i };
}

const dayKey = t => new Date(t).toISOString().slice(0, 10);

/**
 * Fin de séance : le record peut monter (jamais descendre), on garde
 * une trace pour la courbe de l'adulte et on détecte la promotion.
 * @param {EloState} state
 * @param {number} [now]
 */
export function commitSession(state, now = Date.now()) {
  const before = display(state);
  const after = Math.max(before, prudent(state));
  const entry = [dayKey(now), after, Math.round(state.theta * 100) / 100];
  const hist = state.history || [];
  const sameDay = hist.length && hist[hist.length - 1][0] === entry[0];
  const history = [...(sameDay ? hist.slice(0, -1) : hist), entry].slice(-ELO.historyMax);
  const t0 = titleFor(before).title;
  const t1 = titleFor(after).title;
  return {
    state: { ...state, peak: after, lastAt: now, history },
    before,
    after,
    gained: after - before,
    promoted: t1.id !== t0.id ? t1 : null,
  };
}
