/* ============================================================
   ACTIVITIES/BUILD.JS — Écrire le mot entendu (le Constructeur v2)
   L'enfant entend le mot et voit son image ; il pose les tuiles dans
   l'ordre. Une tuile = un SON (« ch », « ou » sont une seule tuile),
   et les lettres muettes sont déjà posées, en gris : on écrit ce
   qu'on entend. Une tuile fausse tremble doucement ; à la deuxième
   erreur, Kaya fait entendre le son attendu et montre la tuile.
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { setMood } from '../ui/kaya.js';
import { listenButton, cheer, praise, noteSupport } from './common.js';

/**
 * @returns {Promise<{ outcome: 'ok'|'ko'|'help' }>}
 */
export function runBuild(q, api) {
  const { voice, sfx } = api;
  const word = q.word;
  const card = h('div', { class: 'paper prompt-card' },
    h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, word.emoji),
    listenButton(() => { noteSupport(api, 'instruction-replay'); voice.say(word.text, { slowWord: true, caption: '🔊' }); }, 'Réécouter le mot'));
  const slotEls = q.slots.map(s => h('div', { class: `slot${s.mute ? ' mute' : ''}`, 'aria-hidden': 'true' }, s.mute ? s.g : ''));
  const order = q.slots.map((s, i) => (s.mute ? -1 : i)).filter(i => i >= 0);
  const tiles = q.tiles.map(t => h('button', { type: 'button', class: 'gtile', 'data-g': t, 'aria-label': t }, t));
  api.stage.replaceChildren(card, h('div', { class: 'slots' }, slotEls), h('div', { class: 'tiles-bank' }, tiles));

  let pos = 0;
  let errors = 0;
  let here = 0;
  let helped = false;
  const need = () => q.slots[order[pos]].g;
  const showNext = () => slotEls.forEach((el, i) => el.classList.toggle('next', i === order[pos]));
  function hint() {
    if (pos >= order.length) return;
    noteSupport(api, 'construction-hint');
    tiles.find(b => !b.classList.contains('used') && b.dataset.g === need())?.classList.add('hint');
    voice.seq(['Le son qui vient, c\'est', { sound: word.parsed.graphemes[order[pos]].p }, '.']);
  }
  showNext();
  // Écrire le mot entendu : le sous-titre ne l'écrit pas (sinon c'est de la copie).
  api.setReplay(() => { noteSupport(api, 'instruction-replay'); voice.seq(q.prompt, { caption: q.caption }); });
  api.setHelp(() => { noteSupport(api, 'explicit-help'); helped = true; hint(); });
  voice.seq(q.prompt, { caption: q.caption });

  return new Promise(resolve => {
    tiles.forEach(t => t.addEventListener('click', async () => {
      if (!api.alive() || t.classList.contains('used') || pos >= order.length) return;
      if (t.dataset.g !== need()) {
        errors += 1;
        here += 1;
        sfx.wrong();
        setMood(api.kaya, 'think', 1200);
        t.classList.add('shake');
        setTimeout(() => t.classList.remove('shake'), 450);
        if (here >= 2) hint();
        else voice.seq(['Écoute bien :', { word: word.text }, '.'], { caption: 'Écoute bien.' });
        return;
      }
      t.classList.add('used');
      tiles.forEach(x => x.classList.remove('hint'));
      const slot = slotEls[order[pos]];
      slot.textContent = t.dataset.g;
      slot.classList.add('filled');
      sfx.pop();
      pos += 1;
      here = 0;
      showNext();
      if (pos < order.length) return;
      api.setReplay(null);
      api.setHelp(null);
      const result = { outcome: errors === 0 && !helped ? 'ok' : errors <= 1 ? 'help' : 'ko' };
      api.onAnswer?.(result);   // enregistrée avant le bravo
      const text = praise(api.rand);
      cheer(api, slotEls[slotEls.length - 1], text);
      await Promise.race([voice.seq([text, { word: word.text }]), sleep(2400)]);
      resolve(result);
    }));
  });
}
