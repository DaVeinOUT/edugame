/* ============================================================
   CORE/SRS.JS — La répétition espacée (boîtes de Leitner)
   Ce qu'on vient d'apprendre s'oublie vite ; ce qu'on revoit au
   bon moment reste. Chaque élément (un son, une syllabe, un mot)
   vit dans une boîte de 1 à 5 :
     réussi    → boîte suivante, revu plus tard (10 min, 1 j, 3 j, 7 j, 21 j)
     raté      → boîte 1, revu dans la séance même (jamais une sanction :
                 c'est juste « on le revoit bientôt »)
     aide      → une boîte en arrière
   Un élément est « maîtrisé » à partir de la boîte 4.
   ============================================================ */

const MIN = 60000;
const DAY = 86400000;

export const BOX_MAX = 5;
export const MASTERED_BOX = 4;

/* Délai avant la prochaine révision, selon la boîte atteinte. */
export const INTERVAL = Object.freeze({ 1: 0, 2: 10 * MIN, 3: DAY, 4: 3 * DAY, 5: 7 * DAY });
const LONG_INTERVAL = 21 * DAY;   // boîte 5 confirmée : revu dans 3 semaines

/**
 * @typedef {{ b: number, due: number, s: number, k: number, last: number }} MemRecord
 * b = boîte (0 = jamais vu), due = prochaine révision (ms),
 * s = fois vu, k = fois réussi, last = dernière fois (ms)
 */

/** @returns {MemRecord} */
export function emptyRecord() {
  return { b: 0, due: 0, s: 0, k: 0, last: 0 };
}

/**
 * Enregistre une réponse. Renvoie un NOUVEL enregistrement.
 * @param {MemRecord | undefined} rec
 * @param {'ok' | 'ko' | 'help'} outcome
 * @param {number} [now]
 * @returns {MemRecord}
 */
export function review(rec, outcome, now = Date.now()) {
  const r = rec || emptyRecord();
  let b;
  if (outcome === 'ok') {
    // Une première réponse juste peut être un coup de chance (QCM) :
    // on saute l'étape « apprentissage », pas plus.
    b = r.b === 0 ? 2 : Math.min(BOX_MAX, r.b + 1);
  } else if (outcome === 'help') {
    b = Math.max(1, r.b - 1);
  } else {
    b = 1;
  }
  const wait = outcome === 'ok' && r.b === BOX_MAX ? LONG_INTERVAL : INTERVAL[b];
  return {
    b,
    due: now + wait,
    s: r.s + 1,
    k: r.k + (outcome === 'ok' ? 1 : 0),
    last: now,
  };
}

/** À revoir maintenant ? (jamais vu = oui) */
export function isDue(rec, now = Date.now()) {
  return !rec || rec.b === 0 || rec.due <= now;
}

/** Maîtrisé : réussi plusieurs fois, à des jours différents. */
export function isMastered(rec) {
  return !!rec && rec.b >= MASTERED_BOX;
}

/** Force de mémoire entre 0 et 1 (pour les tableaux de l'adulte). */
export function strength(rec) {
  return rec ? rec.b / BOX_MAX : 0;
}

/** Combien de temps de retard (ms, ≥ 0) : plus c'est en retard, plus c'est urgent. */
export function overdue(rec, now = Date.now()) {
  if (!rec || rec.b === 0) return 0;
  return Math.max(0, now - rec.due);
}
