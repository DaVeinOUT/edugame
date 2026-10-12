/* ============================================================
   UI/THEME.JS — L'univers et le confort de l'enfant qui joue
   Chaque enfant a ses réglages (police, espacement, fond doux,
   coloration syllabique, voix lente…) : quand on change d'enfant
   sur une tablette de classe, tout suit.
   ============================================================ */

import { DEFAULT_COMFORT } from '../core/schema.js';

const MANAGED = /^(u-|font-|spacing-)|^(soft-bg|no-syl|reduced-motion|no-captions)$/;
const THEME_COLOR = { jungle: '#15803d', ocean: '#0369a1', space: '#1e1b4b' };

/**
 * @param {object | null} profile
 * @param {{ muted?: boolean }} device
 * @param {{ configure: Function, status: string }} voice
 */
export function applyTheme(profile, device, voice) {
  const body = document.body;
  [...body.classList].filter(c => MANAGED.test(c)).forEach(c => body.classList.remove(c));
  const c = { ...DEFAULT_COMFORT, ...(profile?.comfort || {}) };
  const universe = profile?.universe || 'jungle';
  body.classList.add(`u-${universe}`, `font-${c.font}`, `spacing-${c.spacing}`);
  if (c.softBg) body.classList.add('soft-bg');
  if (!c.syllableColors) body.classList.add('no-syl');
  if (c.reducedMotion) body.classList.add('reduced-motion');
  // Sans voix (mode silencieux, téléphone sans voix française), les
  // sous-titres deviennent obligatoires : c'est le seul canal qui reste.
  const forced = device?.muted || voice.status === 'novoice' || voice.status === 'unsupported';
  if (!c.captions && !forced) body.classList.add('no-captions');
  voice.configure({ slow: c.slowVoice, screenReader: c.screenReader });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[universe] || '#7c3aed');
}
