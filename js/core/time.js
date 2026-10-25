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
  let cursor = start;
  let gesture = start;
  let total = 0;
  let paused = false;
  let intervals = [];

  const advance = t => {
    if (!Number.isFinite(t) || t <= cursor) return;
    if (!paused) {
      const end = Math.min(t, gesture + cap);
      if (end > cursor) {
        total += end - cursor;
        intervals.push([cursor, end]);
      }
    }
    cursor = t;
  };

  return {
    /** Un geste réel ; un relevé périodique ne doit jamais appeler tick(). */
    tick(t = Date.now()) {
      advance(t);
      if (!paused) gesture = cursor;
    },
    ms(t = Date.now()) {
      advance(t);
      return total;
    },
    pause(t = Date.now()) {
      advance(t);
      paused = true;
    },
    resume(t = Date.now()) {
      advance(t);
      if (!paused) return;
      paused = false;
      gesture = cursor;
    },
    /** Intervalles actifs depuis le dernier relevé, pour une attribution par jour. */
    takeIntervals(t = Date.now()) {
      advance(t);
      const out = intervals;
      intervals = [];
      return out;
    },
  };
}
