/* ============================================================
   CORE/REPORT.JS — Le tableau de la classe (espace des grands)
   Une ligne par enfant : force de lecture, chemin des sons, niveau,
   contrôles réussis, temps de la semaine, dernière séance, confusion
   la plus fréquente. Export en tableur (CSV) : le fichier est créé
   sur l'appareil et donné à l'adulte — rien n'est envoyé.
   ============================================================ */

import { display, titleFor } from './elo.js';
import { localDay } from './time.js';
import { openLevels, phonicsDone } from './levels.js';
import { supportSummary } from './support.js';

const WEEK_DAYS = 7;

export const CLASS_COLUMNS = Object.freeze([
  ['name', 'Enfant'], ['points', 'Force de lecture'], ['title', 'Titre'], ['step', 'Chemin des sons'],
  ['level', 'Niveau'], ['controles', 'Contrôles réussis'], ['weekMinutes', 'Minutes (7 jours)'],
  ['lastDay', 'Dernière séance'], ['watch', 'À surveiller'],
  ['supportCoverage', 'Réponses détaillées'], ['supportSuccess', 'Réussites détaillées'],
]);

/** Les intitulés restent prudents : aucune maîtrise n’est déduite du journal. */
export function supportReport(profile) {
  const summary = supportSummary(profile);
  return {
    ...summary,
    scope: `${summary.documented} dernières réponses documentées (maximum ${summary.limit})`,
    history: summary.counterMismatch ? 'Compteurs importés non additionnés ; les journaux peuvent diverger.'
      : summary.notDetailed ? `${summary.notDetailed} autres réponses sans détail conservé.` : 'Aucun autre résultat dans le compteur.',
    coverageLabel: !summary.documented ? 'Historique non détaillé'
      : summary.counterMismatch ? `${summary.documented} détaillées (compteurs importés)` : `${summary.documented} / ${summary.total}`,
    successLabel: !summary.documented ? 'Non documentées'
      : `${summary.withoutSupport} sans aide enregistrée ; ${summary.replayOnly} avec réécoute demandée ; ${summary.audio} avec support audio demandé ; ${summary.guided} guidées`,
  };
}

/** Les 7 derniers jours du calendrier local (changement d'heure compris). */
function lastDays(now, n = WEEK_DAYS) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return localDay(d.getTime());
  });
}

/** « 2026-10-13 » → « 13/10 ». */
const shortDate = key => (key ? `${key.slice(8, 10)}/${key.slice(5, 7)}` : '—');

/**
 * Une ligne par enfant, dans l'ordre de la tablette.
 * @param {object[]} profiles
 * @param {object} cur parcours des sons
 * @param {object} L niveaux des grands (buildLevels)
 * @param {number} [now]
 */
export function classRows(profiles, cur, L, now = Date.now()) {
  const week = lastDays(now);
  return profiles.map(p => {
    const points = display(p.elo);
    const days = p.stats.days || {};
    const lastKey = Object.keys(days).filter(k => days[k] > 0).sort().at(-1);
    const [topConfusion] = Object.entries(p.stats.confusions || {}).sort((a, b) => b[1] - a[1]);
    const reached = openLevels(L, p, cur, points);
    const support = supportReport(p);
    return {
      id: p.id,
      avatar: p.avatar,
      name: p.name || 'Sans prénom',
      points,
      title: titleFor(points).title.name,
      step: phonicsDone(p, cur) ? 'acquis' : `${p.path.open + 1} / ${cur.steps.length}`,
      level: reached.at(-1)?.grade || '—',
      controles: Object.values(p.path.adv?.controles || {}).filter(Boolean).length,
      weekMinutes: Math.round(week.reduce((sum, k) => sum + (days[k] || 0), 0) / 60),
      lastDay: shortDate(lastKey),
      watch: topConfusion ? topConfusion[0].replace('/', ' ↔ ') : '—',
      supportCoverage: support.coverageLabel,
      supportSuccess: support.successLabel,
    };
  });
}

/* Une cellule de tableur : guillemets si besoin, et jamais de formule
   (un prénom « =HYPERLINK(…) » ne doit pas s'exécuter à l'ouverture). */
function cell(value) {
  let v = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Le tableau en CSV « à la française » (séparateur ;, BOM pour les accents dans Excel). */
export function toCSV(rows) {
  const lines = [CLASS_COLUMNS.map(([, label]) => cell(label)).join(';'),
    ...rows.map(r => CLASS_COLUMNS.map(([key]) => cell(r[key])).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}
