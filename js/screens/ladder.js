/* ============================================================
   SCREENS/LADDER.JS — « Ta force de lecture » expliquée à l'enfant
   Comme aux échecs : chaque exercice est un adversaire, réussir fait
   grandir la force. Elle ne baisse JAMAIS. L'échelle montre les
   pièces à conquérir, du pion au roi.
   ============================================================ */

import { h } from '../ui/dom.js';
import { display, titleFor } from '../core/elo.js';
import { ladder as ladderEl, eloSentence, pieceEl } from '../ui/elo.js';

export const ladder = {
  mount(view, params, ctx) {
    const { voice, router } = ctx;
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const pts = display(p.elo);
    const { title, next, progress } = titleFor(pts);
    const fill = h('i');
    fill.style.width = `${Math.round(progress * 100)}%`;
    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Ta force de lecture')),
      h('div', { class: 'panel elo-panel' }, pieceEl(title.icon, 'big'),
        h('div', { class: 'grow stack' }, h('span', { class: 'num' }, String(pts)), h('div', { class: 'bar' }, fill),
          h('span', { class: 'muted' }, next ? `Prochaine pièce : ${next.name} (${next.min})` : 'Tu es tout en haut !'))),
      h('p', { class: 'panel' }, 'Comme aux échecs, chaque exercice est un adversaire. Quand tu réussis, ta force grandit. Elle ne baisse jamais !'),
      ladderEl(pts));
    voice.seq(['Comme aux échecs, chaque exercice est un adversaire. Quand tu réussis, ta force de lecture grandit.',
      'Et elle ne baisse jamais !', eloSentence(pts)]);
    return () => voice.stop();
  },
};
