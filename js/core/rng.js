/* ============================================================
   CORE/RNG.JS — Le hasard, équitable et testable
   Fisher-Yates (permutations uniformes) + crypto quand il existe.
   Un générateur à graine (mulberry32) permet aux tests de rejouer
   exactement la même partie.
   ============================================================ */

/** Hasard du navigateur : crypto si disponible, sinon Math.random. */
export function systemRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  }
  return Math.random();
}

/**
 * Générateur déterministe à graine (tests, démonstrations).
 * @param {number} seed
 * @returns {() => number} nombre dans [0, 1)
 */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mélange sans biais — renvoie une NOUVELLE liste.
 * @template T
 * @param {readonly T[]} list
 * @param {() => number} [rand]
 * @returns {T[]}
 */
export function shuffle(list, rand = systemRandom) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Un élément au hasard (undefined si la liste est vide).
 * @template T
 * @param {readonly T[]} list
 * @param {() => number} [rand]
 * @returns {T | undefined}
 */
export function pick(list, rand = systemRandom) {
  return list.length ? list[Math.floor(rand() * list.length)] : undefined;
}

/**
 * n éléments distincts au hasard.
 * @template T
 * @param {readonly T[]} list
 * @param {number} n
 * @param {() => number} [rand]
 * @returns {T[]}
 */
export function sample(list, n, rand = systemRandom) {
  return shuffle(list, rand).slice(0, Math.max(0, n));
}

/**
 * Tirage pondéré : chaque élément a une chance proportionnelle à son poids.
 * @template T
 * @param {readonly T[]} list
 * @param {(item: T) => number} weight poids ≥ 0
 * @param {() => number} [rand]
 * @returns {T | undefined}
 */
export function weightedPick(list, weight, rand = systemRandom) {
  const weights = list.map(x => Math.max(0, weight(x)));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return pick(list, rand);
  let r = rand() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r < 0) return list[i];
  }
  return list[list.length - 1];
}
