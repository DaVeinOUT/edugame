/* ============================================================
   ACTIVITIES/COMMON.JS — Briques communes des exercices
   Boutons de réponse, marquage (✓ ✗ ★ : jamais la couleur seule),
   joie quand c'est juste, et correction bienveillante quand c'est
   faux : la bonne réponse est toujours montrée ET expliquée, puis
   l'enfant continue à SON rythme (bouton « Continuer »).
   ============================================================ */

import { h } from '../ui/dom.js';
import { setMood } from '../ui/kaya.js';
import { burst, plusOne } from '../ui/fx.js';

export const PRAISE = ['Bravo !', 'Super !', 'Génial !', 'Parfait !', 'Bien joué !', 'Excellent !', 'Oui !'];
export const praise = rand => PRAISE[Math.floor(rand() * PRAISE.length)];

/**
 * Grille de réponses. La promesse `chosen` se résout au premier choix.
 * @param {{ id: string, text?: string, emoji?: string, say?: string }[]} options
 * @param {{ kind?: string, onHear?: ((o: object) => void) | null }} [opts]
 */
export function choiceGrid(options, { kind = 'emoji', onHear = null } = {}) {
  let done = false;
  let resolve;
  const chosen = new Promise(r => { resolve = r; });
  const buttons = [];
  const cells = options.map(o => {
    const b = h('button', {
      type: 'button', class: `choice ${kind}`, 'data-id': o.id, 'data-say': o.say || '',
      'aria-label': o.say || o.text || o.id,
    }, h('span', { class: 'mark', 'aria-hidden': 'true' }), h('span', { class: kind === 'letter' || kind === 'syllable' ? 'read' : '' }, o.text ?? o.emoji));
    b.addEventListener('click', () => {
      if (done) return;
      done = true;
      resolve(o);
    });
    buttons.push(b);
    const cell = h('div', { class: 'choice-wrap' }, b);
    if (onHear && o.say) {
      cell.append(h('button', { type: 'button', class: 'hear', 'aria-label': `Écouter : ${o.say}`, onclick: () => onHear(o) }, '🔊'));
    }
    return cell;
  });
  const el = h('div', { class: 'choices' }, cells);
  el.style.setProperty('--cols', String(options.length === 4 ? 2 : options.length));
  return { el, buttons, chosen, isDone: () => done };
}

export function lock(buttons) {
  buttons.forEach(b => { b.disabled = true; });
}

/** ✓ sur le bon choix, ✗ sur l'erreur, ★ sur la bonne réponse montrée. */
export function mark(buttons, chosenId, answerId) {
  buttons.forEach(b => {
    const id = b.dataset.id;
    const m = b.querySelector('.mark');
    if (id === chosenId) {
      b.classList.add(id === answerId ? 'is-ok' : 'is-wrong');
      m.textContent = id === answerId ? '✓' : '✗';
    } else if (id === answerId) {
      b.classList.add('is-answer');
      m.textContent = '★';
    }
  });
}

export function listenButton(onClick, label = 'Écouter') {
  return h('button', { class: 'listen-btn', type: 'button', 'aria-label': label, onclick: onClick }, '🔊');
}

/** Réussite : son joyeux, Kaya content, étoiles, « +1 ⭐ ». */
export function cheer(api, anchor, text) {
  api.sfx.correct();
  setMood(api.kaya, 'happy', 1400);
  burst(anchor, { count: 8 });
  plusOne(anchor);
  api.feedback('ok', text);
}

/** Erreur : son doux, explication parlée, puis l'enfant continue quand il veut. */
export async function comfort(api, parts, caption) {
  api.sfx.wrong();
  setMood(api.kaya, 'oops', 1200);
  api.feedback('ko', caption);
  api.voice.seq(parts);
  await api.waitContinue();
  api.voice.stop();
}
