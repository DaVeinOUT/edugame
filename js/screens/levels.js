/* ============================================================
   SCREENS/LEVELS.JS — Les niveaux des grands (CE1 → 3e)
   Après le chemin des sons : un niveau par cycle, des modules
   (comprendre, orthographe, grammaire, conjugaison, vocabulaire)
   et un contrôle qui ouvre le niveau suivant. « Plus la jauge monte,
   plus le niveau augmente » : la force de lecture ouvre aussi les
   niveaux. Un niveau fermé dit toujours COMMENT l'ouvrir.
   ============================================================ */

import { h } from '../ui/dom.js';
import { eloBadge } from '../ui/elo.js';
import { display } from '../core/elo.js';
import {
  openLevels, moduleOpen, moduleRecord, controlePassed, nextModule, MIN_PHONICS_STEP,
} from '../core/levels.js';
import { skillIcon } from '../activities/text.js';

const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

/** Comment s'ouvre un niveau encore fermé (dit simplement). */
function howToOpen(lv) {
  return lv.index === 0
    ? `S'ouvre à la fin du chemin des sons, ou à ${lv.unlockElo} points (après le son n° ${MIN_PHONICS_STEP + 1}).`
    : `S'ouvre en réussissant le contrôle du niveau d'avant, ou à ${lv.unlockElo} points.`;
}

export const levels = {
  mount(view, params, ctx) {
    const { cur, voice, sfx, router } = ctx;
    const L = ctx.levels;
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const points = display(p.elo);
    const open = new Set(openLevels(L, p, cur, points).map(l => l.id));
    const next = nextModule(L, p, cur, points);

    function moduleButton(m, levelOpen) {
      const ok = levelOpen && moduleOpen(L, p, m);
      const rec = moduleRecord(p, m.id);
      const passed = m.isControle && controlePassed(p, m.level);
      const right = m.isControle ? (passed ? '✅' : '') : rec ? starsText(rec.stars) : '';
      const label = m.isControle ? 'Contrôle du niveau' : m.title;
      const cls = ['module-btn', m.isControle && 'controle', !ok && 'locked', next?.id === m.id && 'next'].filter(Boolean).join(' ');
      return h('button', {
        type: 'button', class: cls,
        'aria-label': `${label}${ok ? '' : ' (pas encore ouvert)'}${rec && !m.isControle ? `, ${rec.stars} étoiles sur 3` : ''}${passed ? ', réussi' : ''}`,
        onclick: () => {
          if (!ok) {
            sfx.wrong();
            voice.say(levelOpen ? 'Finis d\'abord le module d\'avant : une étoile suffit !' : 'Ce niveau s\'ouvrira bientôt. Continue, tu vas y arriver !');
            return;
          }
          sfx.tap();
          router.go('lesson', { mode: 'module', module: m.id });
        },
      }, h('span', { class: 'ico', 'aria-hidden': 'true' }, ok ? skillIcon(m.skill) : '🔒'),
        h('span', { class: 'grow' }, label),
        h('span', { class: 'stars', 'aria-hidden': 'true' }, right));
    }

    const cards = L.levels.map(lv => {
      const isOpen = open.has(lv.id);
      return h('section', { class: `panel level-card${isOpen ? '' : ' locked'}` },
        h('div', { class: 'level-head' },
          h('span', { class: 'h2', 'aria-hidden': 'true' }, isOpen ? (controlePassed(p, lv.id) ? '🎓' : '📘') : '🔒'),
          h('h2', { class: 'grow' }, lv.name),
          h('span', { class: 'grade' }, lv.grade),
          lv.intro ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Écouter : ${lv.name}`, onclick: () => voice.say(lv.intro) }, '🔊') : null),
        isOpen ? null : h('p', { class: 'level-note' }, howToOpen(lv)),
        L.modulesOf(lv.id).map(m => moduleButton(m, isOpen)));
    });

    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Les niveaux')),
      h('div', { class: 'row centered' }, eloBadge(points, () => router.go('ladder'))),
      L.levels.length
        ? h('div', { class: 'levels' }, cards)
        : h('p', { class: 'panel center' }, 'Les niveaux des grands arrivent bientôt !'));

    if (!L.levels.length) voice.say('Les niveaux des grands arrivent bientôt !');
    else if (open.size) voice.say('Voici les niveaux des grands ! Touche le module qui brille. Tu peux aussi tenter le contrôle quand tu veux.');
    else voice.say('Les niveaux des grands s\'ouvrent à la fin du chemin des sons. Continue : chaque son te rapproche !');
    requestAnimationFrame(() => view.querySelector('.module-btn.next')?.scrollIntoView({ block: 'center' }));
    return () => voice.stop();
  },
};
