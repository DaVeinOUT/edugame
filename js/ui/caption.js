/* ============================================================
   UI/CAPTION.JS — Les sous-titres de Kaya
   Tout ce que dit Kaya s'affiche en bas de l'écran : utile en classe
   en mode silencieux, pour un enfant malentendant, ou sur un téléphone
   sans voix française. Toucher le sous-titre le fait répéter.
   ============================================================ */

import { kayaEl, talk } from './kaya.js';

/**
 * @param {HTMLElement} el conteneur #caption (vide)
 * @param {{ onCaption: Function, say: Function }} voice
 */
export function mountCaption(el, voice) {
  const mini = kayaEl({ size: 'tiny' });
  const text = document.createElement('div');
  text.className = 'caption-text';
  el.replaceChildren(mini, text);
  el.removeAttribute('aria-hidden');
  let timer = null;
  voice.onCaption(t => {
    if (!t) return;
    clearTimeout(timer);
    text.textContent = t;
    el.classList.add('show');
    talk(mini, t);
    timer = setTimeout(() => el.classList.remove('show'), Math.max(2600, t.length * 95));
  });
  el.addEventListener('click', () => {
    if (text.textContent) voice.say(text.textContent);
  });
}
