/* ============================================================
   SCREENS/COLLECTION.JS — Mes cartes
   Les sons gagnés sur le chemin, les exploits, les titres d'échecs.
   Toucher une carte gagnée la montre en grand (3D) ; une carte
   mystère encourage à continuer.
   ============================================================ */

import { h, append } from '../ui/dom.js';
import { catalogue, cardThumb, revealCard } from '../ui/cards.js';

const SECTIONS = [['son', 'Les sons'], ['exploit', 'Les exploits'], ['titre', 'Les titres d\'échecs']];

export const collection = {
  mount(view, params, ctx) {
    const { cur, voice, router } = ctx;
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const all = catalogue(cur, ctx.levels.levels);
    const owned = new Set(p.cards);
    const count = all.filter(c => owned.has(c.id)).length;
    const open = (card, has) => {
      if (has) revealCard(ctx, card, all.length, { isNew: false });
      else voice.say('Carte mystère ! Continue le chemin pour la gagner !');
    };
    append(view, [
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, `Mes cartes · ${count}/${all.length}`)),
      SECTIONS.map(([kind, label]) => h('section', { class: 'stack' }, h('h2', null, label),
        h('div', { class: 'collection' }, all.filter(c => c.kind === kind).map(c => cardThumb(c, owned.has(c.id), open))))),
    ]);
    voice.say(`Ta collection : ${count} cartes sur ${all.length} ! Touche une carte pour la voir en grand.`);
    return () => voice.stop();
  },
};
