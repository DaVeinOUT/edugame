/* ============================================================
   SCREENS/PATH.JS — Le chemin de lecture
   Chaque rond est un son. On voit d'où on vient (étoiles), où on
   est (Kaya), et la route devant (cadenas) : la progression se voit
   sans savoir lire. L'enseignant peut ouvrir le chemin jusqu'au son
   travaillé en classe (réglage « étape de la classe »).
   ============================================================ */

import { h } from '../ui/dom.js';
import { kayaEl } from '../ui/kaya.js';

export const path = {
  mount(view, params, ctx) {
    const { cur, voice, sfx, router, store } = ctx;
    const SECTIONS = new Map(cur.sections);
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const classStep = store.device().classStep;
    const reachable = Math.max(p.path.open, Number.isInteger(classStep) ? classStep : -1);
    const list = h('div', { class: 'path' });
    let currentNode = null;

    cur.steps.forEach((s, i) => {
      if (SECTIONS.has(i)) list.append(h('div', { class: 'path-label' }, SECTIONS.get(i)));
      const stars = p.path.stars[s.id] || 0;
      const state = i > reachable ? 'locked' : i === p.path.open ? 'current' : stars > 0 ? 'done' : 'open';
      const btn = h('button', {
        type: 'button', class: `node-btn${s.show.length > 2 ? ' long' : ''} read`,
        'aria-label': `Étape ${i + 1} : ${s.show}${state === 'locked' ? ' (pas encore ouverte)' : ''}`,
      }, s.show);
      btn.addEventListener('click', () => {
        if (state === 'locked') {
          sfx.wrong();
          voice.say('Ce son t\'attend plus loin sur le chemin. Continue, tu vas y arriver !');
          return;
        }
        sfx.tap();
        router.go('lesson', { mode: 'lesson', step: i });
      });
      const node = h('div', { class: `path-node ${state}` }, btn,
        h('div', { class: 'stars', 'aria-hidden': 'true' }, stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : ''),
        state === 'locked' ? h('span', { class: 'lock', 'aria-hidden': 'true' }, '🔒') : null);
      node.style.setProperty('--x', `${Math.round(Math.sin(i * 0.9) * 80)}px`);
      if (state === 'current') { node.append(kayaEl({ size: 'small' })); currentNode = node; }
      list.append(node);
    });

    // Au bout du chemin : les niveaux des grands (CE1 → 3e).
    if (ctx.levels.levels.length) {
      list.append(h('div', { class: 'path-label' }, 'Après le chemin'),
        h('button', { type: 'button', class: 'btn btn-gold', onclick: () => { sfx.tap(); router.go('levels'); } }, '📚 Les niveaux des grands'));
    }
    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Le chemin')),
      list);
    voice.say('Voici ton chemin de lecture ! Chaque rond est un son. Touche le son qui brille !');
    requestAnimationFrame(() => currentNode?.scrollIntoView({ block: 'center' }));
    return () => voice.stop();
  },
};
