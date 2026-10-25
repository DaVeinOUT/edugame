/* ============================================================
   SCREENS/PROFILES.JS — « Qui joue ? »
   Sur une tablette partagée (classe, fratrie), chaque enfant
   touche SON animal : aucune lecture, aucun mot de passe.
   ============================================================ */

import { h } from '../ui/dom.js';
import { kayaEl } from '../ui/kaya.js';
import { AVATAR_NAMES } from './welcome.js';
import { profileBadge } from '../ui/profile-badge.js';

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const SAY = 'Qui joue ? Touche ton animal avec ton repère !';

export const profiles = {
  mount(view, params, ctx) {
    const { store, voice, sfx, router } = ctx;
    const grid = h('div', { class: 'who-grid' });
    store.profiles().forEach(p => grid.append(h('button', {
      type: 'button', class: 'who',
      onclick: () => {
        sfx.tap();
        store.setActive(p.id);
        ctx.applyTheme();
        router.go('hub', {}, { reset: true });
      },
    }, h('span', { class: 'avatar', 'aria-hidden': 'true' }, p.avatar), profileBadge(p), p.name || cap(AVATAR_NAMES[p.avatar] || 'Joueur'))));
    grid.append(h('button', { type: 'button', class: 'who', onclick: () => store.device().adultPin
      ? router.go('adult', { createProfile: true }) : router.go('welcome', { adding: true }) },
      h('span', { class: 'avatar', 'aria-hidden': 'true' }, '➕'), 'Nouveau'));
    view.append(
      h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Qui joue ?'),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Espace des grands', onclick: () => router.go('adult') }, '⚙️')),
      h('div', { class: 'kaya-row' }, kayaEl({ size: 'small' }),
        h('button', { class: 'bubble', type: 'button', onclick: () => voice.say(SAY) }, SAY)),
      grid);
    voice.say(SAY);
    ctx.offerUpdate();
    return () => voice.stop();
  },
};
