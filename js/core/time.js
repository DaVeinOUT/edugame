/* ============================================================
   CORE/TIME.JS — Le temps de jeu, compté honnêtement
   • Le jour est celui de l'horloge de la famille (pas l'heure
     universelle) : une séance à 23 h compte pour aujourd'hui.
   • Seul le temps ACTIF compte : une tablette posée une heure au
     milieu d'une leçon n'ajoute qu'une minute (plafond quotidien,
     tableau de l'adulte et pause de Kaya restent justes).
   ============================================================ */

export const IDLE_CAP_MS = 60000;

const pad = n => String(n).padStart(2, '0');

/** « 2026-10-13 », selon l'heure locale de l'appareil. */
export function localDay(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Chronomètre du temps actif : entre deux gestes de l'enfant, on compte
 * au plus `cap` millisecondes.
 * @param {number} [start]
 * @param {number} [cap]
 */
export function activeClock(start = Date.now(), cap = IDLE_CAP_MS) {
  let last = start;
  let total = 0;
  const gap = t => Math.min(cap, Math.max(0, t - last));
  return {
    /** Un geste (toucher, touche du clavier, réponse). */
    tick(t = Date.now()) {
      total += gap(t);
      last = t;
    },
    /** Temps actif depuis le départ, en millisecondes. */
    ms(t = Date.now()) {
      return total + gap(t);
    },
  };
}
