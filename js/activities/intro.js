/* ============================================================
   ACTIVITIES/INTRO.JS — Kaya présente le nouveau son
   La lettre en grand (minuscule, et la majuscule à côté), le mot
   d'appui avec son image, et quelques syllabes à toucher pour
   les entendre : « ma », « mi », « mo ».
   ============================================================ */

import { h } from '../ui/dom.js';
import { wordEl } from '../ui/word.js';

export function runIntro(step, api) {
  const { voice, cur, sfx } = api;
  const anchor = cur.word(step.anchor);
  const single = /^[a-zéè]{1,3}$/.test(step.show);
  const syls = cur.syllablesFor(step.index).slice(0, 4).map(s => h('button', {
    type: 'button', class: 'btn btn-soft btn-sm read', onclick: () => voice.say(s.text, { slowWord: true }),
  }, s.text));
  const card = h('div', { class: 'paper intro-card' },
    h('div', { class: `grapheme read${step.show.length > 3 ? ' long' : ''}`, lang: 'fr' }, step.show),
    single ? h('div', { class: 'upper read', 'aria-hidden': 'true' }, `${step.show.toUpperCase()}`) : null,
    anchor ? h('div', { class: 'anchor', 'aria-hidden': 'true' }, anchor.emoji) : null,
    anchor ? wordEl(anchor.parsed, { className: 'h2' }) : null,
    syls.length ? h('div', { class: 'row wrap centered' }, syls) : null);
  const go = h('button', { class: 'btn btn-primary btn-block', type: 'button', 'data-autofocus': true }, 'C\'est parti ! ▶');
  api.stage.replaceChildren(card, go);
  api.setReplay(() => voice.seq(step.introParts));
  api.setHelp(null);
  voice.seq(step.introParts);
  return new Promise(resolve => go.addEventListener('click', () => {
    sfx.tap();
    voice.stop();
    api.setReplay(null);
    resolve();
  }));
}
