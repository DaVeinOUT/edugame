/* ============================================================
   UI/ELO.JS — L'Élo vu par l'enfant
   Une pièce d'échecs, un nombre qui ne fait que monter, une barre
   vers la pièce suivante. À chaque promotion, une cérémonie :
   « Comme aux échecs, ton pion avance sur l'échiquier de la lecture ! »
   Jamais de classement entre enfants : on se compare à soi-même.
   ============================================================ */

import { h, reducedMotion } from './dom.js';
import { titleFor, TITLES } from '../core/elo.js';
import { openOverlay } from './overlay.js';
import { burst } from './fx.js';

const piece = (icon, size = '') => h('span', { class: `piece ${size}`.trim(), 'aria-hidden': 'true' }, `${icon}︎`);

/** Ce que Kaya dit du niveau (jamais de « tu as perdu »). */
export function eloSentence(points) {
  const { title, next } = titleFor(points);
  if (!next) return `Ta force de lecture : ${points}. Tu es ${article(title)} ${title.name}, la pièce la plus forte !`;
  return `Ta force de lecture : ${points}. Encore ${next.min - points} points pour devenir ${next.name} !`;
}
const article = t => (t.id === 'dame' ? 'la' : 'le');

/** Badge de l'accueil : pièce + nombre + titre. */
export function eloBadge(points, onClick) {
  const { title } = titleFor(points);
  return h('button', { class: 'elo-badge', type: 'button', onclick: onClick, 'aria-label': `Force de lecture ${points}, ${title.name}` },
    piece(title.icon),
    h('span', null, h('span', { class: 'elo-num' }, String(points)), h('span', { class: 'elo-title' }, title.name)));
}

/** Panneau du bilan : le nombre grimpe de « avant » à « après ». */
export function eloPanel({ before, after, gained }) {
  const { title, next, progress } = titleFor(before);
  const num = h('span', { class: 'num' }, String(before));
  const fill = h('i');
  const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' }, fill);
  const gain = h('span', { class: 'gain' }, gained > 0 ? `+${gained}` : '');
  const el = h('div', { class: 'panel elo-panel' }, piece(title.icon, 'big'),
    h('div', { class: 'grow stack' },
      h('div', { class: 'row' }, num, gain),
      bar,
      h('span', { class: 'muted' }, next ? `Prochaine pièce : ${next.name} (${next.min})` : 'Tu as atteint le Roi !')));
  fill.style.width = `${Math.round(progress * 100)}%`;
  /** Lance l'animation (après l'affichage). */
  const play = () => {
    const end = titleFor(after);
    const endPct = end.title.id === title.id ? end.progress : 1;
    requestAnimationFrame(() => { fill.style.width = `${Math.round(endPct * 100)}%`; });
    bar.setAttribute('aria-valuenow', String(Math.round(endPct * 100)));
    if (reducedMotion() || gained <= 0) { num.textContent = String(after); return; }
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 1200);
      num.textContent = String(Math.round(before + (after - before) * (1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  return { el, play };
}

/** L'échelle des pièces (écran d'explication pour l'enfant). */
export function ladder(points) {
  const { rank } = titleFor(points);
  return h('ul', { class: 'ladder' }, TITLES.map((t, i) => h('li', {
    class: [i <= rank ? 'reached' : '', i === rank ? 'current' : ''].join(' ').trim(),
  }, piece(t.icon, 'big'), h('div', null, h('div', { class: 'ladder-name' }, t.name), h('div', { class: 'muted' }, i ? `à partir de ${t.min}` : 'le départ')))));
}

/**
 * Cérémonie de promotion (nouveau titre).
 * @returns {Promise<void>}
 */
export function promotion({ router, voice, sfx }, title) {
  const big = piece(title.icon, 'huge');
  const btn = h('button', { class: 'btn btn-gold', type: 'button', 'data-autofocus': true }, 'Super !');
  const content = [h('div', { class: 'rays' }), big, h('h2', null, `Promotion : ${title.name} !`),
    h('p', null, 'Comme aux échecs, ton pion avance sur l\'échiquier de la lecture.'), btn];
  const ov = openOverlay(router, { content, className: 'promo', label: `Promotion ${title.name}` });
  sfx.promote();
  setTimeout(() => burst(big, { count: 16 }), 900);
  voice.say(`Incroyable ! Tu deviens ${title.id === 'dame' ? 'la' : 'le'} ${title.name} ! Comme aux échecs, tu avances sur l'échiquier de la lecture !`);
  btn.addEventListener('click', () => ov.close());
  return ov.closed;
}

export { piece as pieceEl };
