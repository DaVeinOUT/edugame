/* ============================================================
   CORE/SELECT.JS — Choisir les bons exercices au bon moment
   Trois forces se combinent :
   • la difficulté juste : viser ~80 % de réussite estimée par l'Élo
     (assez de réussite pour rester motivé, assez de défi pour apprendre) ;
   • la mémoire : ce qui est « dû » (répétition espacée) ou fragile passe devant ;
   • la variété : ce qu'on vient de voir attend son tour.
   Le tirage reste pondéré (jamais deux séances identiques).
   ============================================================ */

import { probability } from './elo.js';
import { isDue, overdue } from './srs.js';
import { difficultyOf } from './curriculum.js';
import { systemRandom } from './rng.js';

export const TARGET_P = 0.8;
const WEEK = 7 * 86400000;

/**
 * Poids d'un exercice (plus c'est grand, plus il a de chances d'être choisi).
 * @param {{ key: string, guess?: number }} item
 * @param {{ theta: number, mem: object, now: number, target?: number, recent?: Set<string> }} ctx
 */
export function scoreItem(item, { theta, mem, now, target = TARGET_P, recent = new Set() }) {
  const p = probability(theta, difficultyOf(item), item.guess ?? 1 / 3);
  const closeness = Math.max(0, 1 - Math.abs(p - target) / 0.4);
  const rec = mem[item.key];
  // Jamais vu : intéressant ; dû : prioritaire ; pas encore dû : peut attendre.
  const timing = !rec ? 1.6 : isDue(rec, now) ? 2 + Math.min(1, overdue(rec, now) / WEEK) : 0.6;
  const fragile = rec ? (5 - rec.b) / 5 : 0.5;
  const fresh = recent.has(item.key) ? 0.15 : 1;
  return (0.15 + closeness) * (timing + 0.5 * fragile) * fresh;
}

/**
 * Tire n exercices distincts, pondérés par scoreItem.
 * @template T
 * @param {T[]} pool
 * @param {{ elo: { theta: number }, mem?: object, now?: number, n?: number,
 *           target?: number, rand?: () => number, recent?: string[] }} opts
 * @returns {T[]}
 */
export function selectItems(pool, { elo, mem = {}, now = Date.now(), n = 10, target, rand = systemRandom, recent = [] }) {
  const ctx = { theta: elo.theta, mem, now, target, recent: new Set(recent) };
  const scored = pool.map(item => ({ item, w: scoreItem(item, ctx) }));
  const out = [];
  while (out.length < n && scored.length) {
    const total = scored.reduce((s, x) => s + x.w, 0);
    let r = rand() * total;
    let i = 0;
    for (; i < scored.length - 1; i++) {
      r -= scored[i].w;
      if (r < 0) break;
    }
    out.push(scored[i].item);
    scored.splice(i, 1);
  }
  return out;
}
