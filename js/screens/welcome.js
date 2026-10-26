/* ============================================================
   SCREENS/WELCOME.JS — Faire connaissance (création d'un enfant)
   Quatre questions, toutes parlées, aucune ne demande de lire :
   son animal (qui servira à se reconnaître sur une tablette de
   classe), son âge, son univers, et — facultatif — son prénom,
   qu'un grand peut écrire.
   ============================================================ */

import { h, clear } from '../ui/dom.js';
import { kayaEl, setMood } from '../ui/kaya.js';
import { AVATARS, assignProfileBadges, badgeInfo } from '../core/schema.js';
import { profileBadge } from '../ui/profile-badge.js';
import { adultUnlocked, lockAdult } from './adult.js';

export const AVATAR_NAMES = {
  '🐯': 'le tigre', '🦊': 'le renard', '🐼': 'le panda', '🐨': 'le koala', '🐸': 'la grenouille', '🦁': 'le lion',
  '🐵': 'le singe', '🐰': 'le lapin', '🐻': 'l\'ours', '🐶': 'le chien', '🐱': 'le chat', '🦄': 'la licorne',
  '🐢': 'la tortue', '🐬': 'le dauphin', '🦉': 'le hibou', '🐙': 'la pieuvre',
};

const AGES = [
  { id: '4-6', ico: '🐣', label: '4 à 6 ans' },
  { id: '7-9', ico: '🌱', label: '7 à 9 ans' },
  { id: '10-12', ico: '🌳', label: '10 à 12 ans' },
  { id: '13-15', ico: '🎓', label: '13 ans et plus' },
];
const WORLDS = [
  { id: 'jungle', ico: '🌴', label: 'La jungle' },
  { id: 'ocean', ico: '🌊', label: 'L\'océan' },
  { id: 'space', ico: '🚀', label: 'L\'espace' },
];

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export const welcome = {
  mount(view, params, ctx) {
    const { voice, sfx, store, router } = ctx;
    const needsAdult = () => store.profiles().length > 0 && store.device().adultPin && !adultUnlocked();
    if (needsAdult()) {
      router.go('adult', { createProfile: true }, { replace: true });
      return undefined;
    }
    const pending = { avatar: null, age: null, universe: null };
    let alive = true;
    const kaya = kayaEl({ size: 'small' });
    const bubble = h('button', { class: 'bubble', type: 'button' });
    const body = h('div', { class: 'stack' });
    const foot = h('div', { class: 'row centered wrap' });
    const back = params.adding
      ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←')
      : null;
    view.append(
      h('div', { class: 'topbar' }, back, h('h1', { class: 'title' }, params.adding ? 'Un nouvel ami' : 'Bienvenue !')),
      h('div', { class: 'kaya-row' }, kaya, bubble), body, foot);
    bubble.addEventListener('click', () => voice.say(bubble.textContent));
    const speak = text => { bubble.textContent = text; voice.say(text); };
    const backTo = fn => h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: fn }, '← Retour');

    const choose = (grid, btn, say, next) => {
      sfx.tap();
      grid.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === btn));
      setMood(kaya, 'happy', 900);
      voice.say(say);
      setTimeout(() => { if (alive) next(); }, 900);
    };

    function stepAvatar() {
      clear(body); clear(foot);
      speak(params.adding ? 'Un nouvel ami ! Choisis ton animal.'
        : 'Salut ! Je suis Kaya, un bébé jaguar. Je vais t\'apprendre à lire ! D\'abord, choisis ton animal.');
      const grid = h('div', { class: 'pick-grid' });
      AVATARS.forEach(a => grid.append(h('button', {
        type: 'button', class: 'pick', 'aria-label': AVATAR_NAMES[a] || a,
        onclick: e => { pending.avatar = a; choose(grid, e.currentTarget, `${cap(AVATAR_NAMES[a] || '')} ! Super choix !`, stepAge); },
      }, a)));
      body.append(grid);
    }
    function stepAge() {
      clear(body); clear(foot);
      speak('Quel âge as-tu ?');
      const grid = h('div', { class: 'stack' });
      AGES.forEach(a => grid.append(h('button', {
        type: 'button', class: 'choice-big',
        onclick: e => { pending.age = a.id; choose(grid, e.currentTarget, a.label, stepWorld); },
      }, h('span', { class: 'ico', 'aria-hidden': 'true' }, a.ico), a.label)));
      body.append(grid);
      foot.append(backTo(stepAvatar));
    }
    function stepWorld() {
      clear(body); clear(foot);
      speak('Dans quel monde veux-tu jouer ?');
      const grid = h('div', { class: 'stack' });
      WORLDS.forEach(w => grid.append(h('button', {
        type: 'button', class: 'choice-big',
        onclick: e => {
          pending.universe = w.id;
          document.body.classList.remove('u-jungle', 'u-ocean', 'u-space');
          document.body.classList.add(`u-${w.id}`);
          choose(grid, e.currentTarget, `${w.label} !`, stepName);
        },
      }, h('span', { class: 'ico', 'aria-hidden': 'true' }, w.ico), w.label)));
      body.append(grid);
      foot.append(backTo(stepAge));
    }
    function stepName() {
      clear(body); clear(foot);
      speak('Comment tu t\'appelles ? Un grand peut l\'écrire pour toi. Tu peux aussi passer.');
      const input = h('input', {
        class: 'input', type: 'text', maxlength: '20', autocomplete: 'off', enterkeyhint: 'done',
        'aria-label': 'Prénom (facultatif)', placeholder: 'Prénom (facultatif)',
      });
      const go = h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => finish(input.value) }, 'C\'est parti ! ▶');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(input.value); });
      const preview = assignProfileBadges([...store.profiles(), { badgeId: null }]).at(-1);
      const info = badgeInfo(preview.badgeId);
      body.append(h('div', { class: 'profile-identity-preview' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, pending.avatar), profileBadge(preview),
        h('p', { class: 'note' }, `Ton repère : ${info.label}. Retrouve-le avec ton animal.`)), input, go);
      foot.append(backTo(stepWorld));
    }
    function finish(name) {
      if (!alive) return;
      if (needsAdult()) { router.go('adult', { createProfile: true }, { replace: true }); return; }
      const p = store.addProfile({ ...pending, name });
      if (!p) return;
      alive = false; // empêche une double validation avant le changement d'écran
      store.setActive(p.id);
      try { navigator.storage?.persist?.(); } catch { /* le navigateur décide */ }
      sfx.correct();
      ctx.applyTheme();
      // Dès 7 ans, on propose de situer l'enfant : un grand qui lit déjà ne repart pas de « a ».
      if (pending.age && pending.age !== '4-6') router.go('placement', { first: true }, { reset: true });
      else router.go('hub', { first: true }, { reset: true });
    }
    stepAvatar();
    return () => { alive = false; voice.stop(); if (params.adding && store.device().adultPin) lockAdult(); };
  },
};
