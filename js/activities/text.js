/* ============================================================
   ACTIVITIES/TEXT.JS — Les exercices des grands (CE1 → 3e)
   • gap    : une phrase à trou, choisir le bon mot (a / à, et / est…)
   • choice : une question, des réponses
   • text   : un petit texte à lire, puis une question
   • pick   : toucher LE mot demandé dans la phrase (le verbe, le sujet…)
   • order  : remettre les mots dans l'ordre
   Kaya lit la consigne (l'aménagement habituel des élèves dyslexiques) ;
   le texte, c'est l'enfant qui le lit — « 💡 Aide » peut le lire à voix
   haute ou rappeler la règle : ça compte « avec aide », jamais une punition.
   Après une erreur, la bonne réponse est montrée ET expliquée.
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { setMood } from '../ui/kaya.js';
import { shuffle } from '../core/rng.js';
import { PASS } from '../core/levels.js';
import { choiceGrid, lock, mark, cheer, comfort, praise } from './common.js';

const SKILL_ICON = {
  lecture: '📖', comprehension: '🧠', orthographe: '✏️', grammaire: '🧩',
  conjugaison: '⏰', vocabulaire: '💬', controle: '🏁', revision: '🔁',
};

export const skillIcon = skill => SKILL_ICON[skill] || '📘';

/* Typographie française à l'écran : jamais « ! », « ? » ou « » » seuls en début de ligne. */
export const typo = text => String(text).replace(/ ([!?;:»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

/** Phrase à trou : le trou se voit (et se remplit après la réponse). */
function gapSentence(text) {
  const [before, after = ''] = typo(text).split(/_{2,}/);
  const hole = h('span', { class: 'gap-hole' }, h('span', { class: 'sr-only' }, 'mot manquant'), '  ');
  return { el: h('p', { class: 'read adv-question', lang: 'fr' }, before, hole, after), hole };
}

/* Les mots de la phrase, chacun est un bouton (« Touche le verbe »). */
function wordPicker(options) {
  let done = false;
  let resolve;
  const chosen = new Promise(r => { resolve = r; });
  const buttons = options.map(o => {
    const b = h('button', { type: 'button', class: 'wpick read', 'data-id': o.id },
      h('span', { class: 'mark', 'aria-hidden': 'true' }), o.text);
    b.addEventListener('click', () => {
      if (done) return;
      done = true;
      resolve(o);
    });
    return b;
  });
  return { el: h('div', { class: 'wpick-row', lang: 'fr' }, buttons), buttons, chosen };
}

/** Ce que dit l'aide : lire le texte, rappeler la règle du module, ou lire les réponses. */
function helpFor(q, api) {
  if (q.type === 'text') return () => api.voice.seq(['Écoute le texte.', { pause: 250 }, { say: q.passage }]);
  if ((q.type === 'gap' || q.type === 'pick') && api.module?.intro) return () => api.voice.seq([api.module.intro]);
  return () => api.voice.seq(q.options.flatMap(o => [{ say: o.text }, { pause: 300 }]));
}

/**
 * Exercice à choix (gap, choice, text, pick).
 * @returns {Promise<{ outcome: 'ok'|'ko'|'help' }>}
 */
async function runChoose(q, api) {
  const { voice } = api;
  const card = h('div', { class: 'paper prompt-card adv-card' });
  let hole = null;
  if (q.type === 'text') card.append(h('div', { class: 'read adv-passage', lang: 'fr' }, typo(q.passage)));
  if (q.type === 'gap') {
    const g = gapSentence(q.text);
    hole = g.hole;
    card.append(g.el);
  } else if (q.type === 'pick') {
    card.append(h('p', { class: 'adv-consigne' }, typo(q.item.prompt)));
  } else {
    card.append(h('p', { class: 'read adv-question', lang: 'fr' }, typo(q.text)));
  }
  let grid;
  if (q.type === 'pick') grid = wordPicker(q.options);
  else {
    // Une réponse par ligne, pleine largeur : grandes cibles, texte aligné à gauche, 🔊 à droite.
    grid = choiceGrid(q.options.map(o => ({ ...o, text: typo(o.text), say: o.text })), { kind: 'textopt', onHear: o => voice.say(o.say) });
    grid.el.classList.add('one-col');
  }
  api.stage.replaceChildren(card, grid.el);

  let helped = false;
  api.setReplay(() => voice.seq(q.prompt));
  const help = helpFor(q, api);
  api.setHelp(() => { helped = true; help(); });
  voice.seq(q.prompt);

  const chosen = await grid.chosen;
  api.setReplay(null);
  api.setHelp(null);
  voice.stop();
  lock(grid.buttons);
  mark(grid.buttons, chosen.id, q.answer);
  const answerText = q.answerText ?? q.answer;
  if (hole) {
    hole.textContent = answerText;
    hole.classList.add('filled');
  }
  const okBtn = grid.buttons.find(b => b.dataset.id === q.answer);
  if (chosen.id === q.answer) {
    const result = { outcome: helped ? 'help' : 'ok' };
    api.onAnswer?.(result);
    const text = praise(api.rand);
    cheer(api, okBtn, text);
    await Promise.race([voice.seq([text]), sleep(1800)]);
    return result;
  }
  const result = { outcome: 'ko' };
  api.onAnswer?.(result);
  const explain = q.explain || `La bonne réponse, c'est : ${answerText}.`;
  await comfort(api, [explain], explain);
  return result;
}

/* Mots à remettre dans l'ordre : on pose les mots un à un, comme les tuiles du Constructeur. */
function runOrder(q, api) {
  const { voice, sfx } = api;
  const target = q.words;
  let tiles;
  // Mélange différent de la bonne réponse (sinon il n'y a rien à faire).
  for (let tries = 0; tries < 6; tries++) {
    tiles = shuffle(target.map((w, i) => ({ w, i })), api.rand);
    if (tiles.some((t, j) => t.w !== target[j])) break;
  }
  const line = h('p', { class: 'read order-line', lang: 'fr', 'aria-live': 'polite' });
  const btns = tiles.map(t => h('button', { type: 'button', class: 'gtile wtile', 'data-w': t.w }, t.w));
  api.stage.replaceChildren(h('div', { class: 'paper prompt-card adv-card' }, h('p', { class: 'adv-consigne' }, 'Remets les mots dans l\'ordre.'), line),
    h('div', { class: 'tiles-bank' }, btns));

  let pos = 0;
  let errors = 0;
  let here = 0;
  let helped = false;
  const hint = () => {
    if (pos >= target.length) return;
    btns.find(b => !b.classList.contains('used') && b.dataset.w === target[pos])?.classList.add('hint');
    voice.seq(['Le mot qui vient, c\'est', { say: target[pos] }, '.']);
  };
  api.setReplay(() => voice.seq(q.prompt));
  api.setHelp(() => { helped = true; hint(); });
  voice.seq(q.prompt);

  return new Promise(resolve => {
    btns.forEach(b => b.addEventListener('click', async () => {
      if (!api.alive() || b.classList.contains('used') || pos >= target.length) return;
      if (b.dataset.w !== target[pos]) {
        errors += 1;
        here += 1;
        sfx.wrong();
        setMood(api.kaya, 'think', 1200);
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 450);
        if (here >= 2) hint();
        else voice.say(pos === 0 ? 'Quel mot vient en premier ?' : 'Quel mot vient ensuite ?');
        return;
      }
      b.classList.add('used');
      btns.forEach(x => x.classList.remove('hint'));
      line.append(h('span', { class: 'order-word' }, b.dataset.w));
      sfx.pop();
      pos += 1;
      here = 0;
      if (pos < target.length) return;
      api.setReplay(null);
      api.setHelp(null);
      line.replaceChildren(typo(q.answer));
      const result = { outcome: errors === 0 && !helped ? 'ok' : errors <= 1 ? 'help' : 'ko' };
      api.onAnswer?.(result);
      const text = praise(api.rand);
      cheer(api, line, text);
      await Promise.race([voice.seq([text, { say: q.answer }]), sleep(3200)]);
      resolve(result);
    }));
  });
}

/**
 * Un exercice des niveaux des grands (question de kind 'adv', voir core/levels.js).
 * @returns {Promise<{ outcome: 'ok'|'ko'|'help' }>}
 */
export function runText(q, api) {
  return q.type === 'order' ? runOrder(q, api) : runChoose(q, api);
}

/** Bonnes réponses qu'il faut au contrôle (70 %), sans piège d'arrondi. */
export const needed = total => Math.ceil(PASS * total - 1e-9);

/** Présentation d'un module (la règle, avec un exemple) ou d'un contrôle. */
export function runModuleIntro(m, level, api, { total = 10 } = {}) {
  const { voice, sfx } = api;
  const say = m.isControle
    ? `C'est le contrôle du niveau ${level?.grade || ''}. Prends ton temps : il faut ${needed(total)} bonnes réponses sur ${total} pour ouvrir le niveau suivant. Tu peux le retenter quand tu veux !`
    : m.intro;
  const card = h('div', { class: 'paper prompt-card adv-card' },
    h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, skillIcon(m.skill)),
    h('h2', { class: 'adv-title' }, m.isControle ? `Contrôle ${level?.grade || ''}`.trim() : m.title),
    h('p', { class: 'read adv-intro', lang: 'fr' }, typo(say)));
  const go = h('button', { class: 'btn btn-primary btn-block', type: 'button', 'data-autofocus': true }, 'C\'est parti ! ▶');
  api.stage.replaceChildren(card, go);
  api.setReplay(() => voice.seq([say]));
  api.setHelp(null);
  voice.seq([say]);
  return new Promise(resolve => go.addEventListener('click', () => {
    sfx.tap();
    voice.stop();
    api.setReplay(null);
    resolve();
  }));
}
