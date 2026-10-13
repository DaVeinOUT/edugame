/* ============================================================
   SCREENS/GAMES.JS — Les jeux libres
   L'enfant choisit ce qu'il a envie de faire, toujours avec ce
   qu'il a déjà appris : tracer, écouter, lire, écrire, réviser.
   ============================================================ */

import { h } from '../ui/dom.js';

const GAMES = [
  { id: 'trace', ico: '✍️', label: 'Tracer', say: 'Tracer les lettres avec ton doigt', go: r => r.go('trace') },
  { ico: '🔁', label: 'Réviser', say: 'Réviser ce que tu as appris', go: r => r.go('lesson', { mode: 'practice' }) },
  { ico: '👂', label: 'Écouter', say: 'Écouter les sons', go: r => r.go('lesson', { mode: 'practice', kinds: ['listen'] }) },
  { ico: '🔤', label: 'Les sons', say: 'Reconnaître les sons et les syllabes', go: r => r.go('lesson', { mode: 'practice', kinds: ['sound', 'syllable'] }) },
  { ico: '📖', label: 'Lire', say: 'Lire des mots et des phrases', go: r => r.go('lesson', { mode: 'practice', kinds: ['read', 'sentence'] }) },
  { ico: '🧱', label: 'Écrire', say: 'Écrire des mots avec les tuiles', go: r => r.go('lesson', { mode: 'practice', kinds: ['build'] }) },
];

const LEVELS_REVIEW = { id: 'review', ico: '📚', label: 'Niveaux', say: 'Réviser les niveaux des grands', go: r => r.go('lesson', { mode: 'review' }) };

export const games = {
  mount(view, params, ctx) {
    const { voice, sfx, router } = ctx;
    // Avec un lecteur d'écran, tracer au doigt une lettre qu'on ne voit pas n'a pas de sens.
    const screenReader = !!ctx.profile()?.comfort?.screenReader;
    const base = screenReader ? GAMES.filter(g => g.id !== 'trace') : GAMES;
    // Un module des niveaux déjà travaillé : on peut aussi le réviser librement.
    const didModule = Object.keys(ctx.profile()?.path.adv?.modules || {}).length > 0;
    const list = didModule ? [...base, LEVELS_REVIEW] : base;
    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Jeux libres')),
      h('div', { class: 'tiles' }, list.map(g => h('button', {
        type: 'button', class: 'tile', 'aria-label': g.say,
        onclick: () => { sfx.tap(); voice.say(g.say); g.go(router); },
      }, h('span', { class: 'ico', 'aria-hidden': 'true' }, g.ico), g.label))));
    voice.say(screenReader ? 'Choisis ton jeu ! Tu peux écouter, lire, écrire ou réviser.'
      : 'Choisis ton jeu ! Tu peux tracer, écouter, lire, écrire ou réviser.');
    return () => voice.stop();
  },
};
