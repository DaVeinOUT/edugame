/* ============================================================
   CORE/PLACEMENT.JS — Le test de positionnement (« Où j'en suis ? »)
   Pour un enfant qui sait déjà un peu lire (souvent les plus grands),
   refaire tout le chemin depuis « a » serait long et démotivant.
   Un petit jeu de quelques minutes sonde le chemin par paliers
   (toutes les 6 étapes) : deux questions par palier — lire un mot et
   toucher son image, ou au tout début reconnaître un son —, arrêt
   après deux paliers manqués de suite. L'enfant commence alors juste
   avant le dernier palier réussi (un peu de révision ne fait pas de mal).
   Pas de chrono, pas de note : « je veux juste savoir ce que tu sais ».
   ============================================================ */

import { pick, systemRandom } from './rng.js';

export const STRIDE = 6;        // un palier toutes les 6 étapes
export const PER_POINT = 2;     // questions par palier (les deux doivent être justes)
export const STOP_AFTER = 2;    // paliers manqués d'affilée avant d'arrêter
export const BACK = 2;          // on recommence un peu avant le palier réussi

const LETTER_KINDS = new Set(['voyelle', 'longue', 'courte', 'complexe']);
const isLetter = s => LETTER_KINDS.has(s.kind) && !s.show.includes(' ');

/** Étapes sondées : 0, 6, 12… et toujours la dernière. */
export function checkpoints(cur) {
  const last = cur.steps.length - 1;
  const out = [];
  for (let s = 0; s <= last; s += STRIDE) out.push(s);
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function startPlacement(cur) {
  return { points: checkpoints(cur), i: 0, asked: 0, good: 0, misses: 0, passed: -1, done: false, log: [] };
}

/**
 * Exercice du palier courant : lire un mot devenu lisible autour de ce palier
 * (la vraie compétence) ; au tout début, reconnaître le son d'une lettre.
 */
export function placementItem(state, cur, rand = systemRandom) {
  const s = state.points[state.i];
  const lo = Math.max(0, s - STRIDE + 1);
  const used = new Set(state.log.map(e => e.key));
  const fresh = w => w.step <= s && !used.has(`rd:${w.text}`);
  /* Des mots du HAUT du palier : un mot de la première étape du palier ne prouve pas qu'on lit les suivantes. */
  const top = cur.words.filter(w => fresh(w) && w.step > s - 3);
  const words = top.length ? top : cur.words.filter(w => fresh(w) && w.step >= lo);
  if (words.length) {
    const w = pick(words, rand);
    return { kind: 'read', key: `rd:${w.text}`, step: w.step, text: w.text, word: w, guess: 1 / 3 };
  }
  const near = cur.steps.filter(x => x.index >= lo && x.index <= s && isLetter(x));
  const pool = near.length ? near : cur.steps.filter(x => x.index <= s && isLetter(x));
  const st = pick(pool.filter(x => !used.has(`snd:${x.id}`)), rand) || pick(pool, rand);
  return { kind: 'sound', key: `snd:${st.id}`, step: st.index, guess: 1 / 3 };
}

/**
 * Enregistre une réponse ; renvoie un NOUVEL état.
 * @param {object} state
 * @param {{ ok: boolean, key: string }} answer
 */
export function recordPlacement(state, { ok, key }) {
  const asked = state.asked + 1;
  const good = state.good + (ok ? 1 : 0);
  const log = [...state.log, { key, ok, point: state.points[state.i] }];
  if (asked < PER_POINT) return { ...state, asked, good, log };
  const pass = good === PER_POINT;
  const misses = pass ? 0 : state.misses + 1;
  const i = state.i + 1;
  return {
    ...state, i, asked: 0, good: 0, misses, log,
    passed: pass ? state.i : state.passed,
    done: misses >= STOP_AFTER || i >= state.points.length,
  };
}

/**
 * Où commencer. all = tout le chemin des sons est déjà su (→ niveaux des grands).
 * @returns {{ open: number, all: boolean, passedStep: number }}
 */
export function placementResult(state, cur) {
  const last = cur.steps.length - 1;
  if (state.passed < 0) return { open: 0, all: false, passedStep: -1 };
  const passedStep = state.points[state.passed];
  const all = state.passed === state.points.length - 1;
  const open = all ? last : Math.max(0, Math.min(last, passedStep + 1 - BACK));
  return { open, all, passedStep };
}
