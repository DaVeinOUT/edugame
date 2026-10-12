/* ============================================================
   UI/KAYA.JS — Kaya, le bébé jaguar
   Un SVG léger (zéro image à télécharger) qui a des humeurs :
   content, en train de parler, qui réfléchit, qui encourage.
   Kaya réagit à l'enfant : c'est un compagnon, pas un décor.
   ============================================================ */

import { h } from './dom.js';

const SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
 <g class="k-body">
  <circle cx="48" cy="55" r="26" fill="#F6AD37"/><circle cx="152" cy="55" r="26" fill="#F6AD37"/>
  <circle cx="48" cy="55" r="13" fill="#B45309"/><circle cx="152" cy="55" r="13" fill="#B45309"/>
  <ellipse cx="100" cy="110" rx="74" ry="68" fill="#F6AD37"/>
  <g fill="#8A5306">
   <circle cx="62" cy="62" r="6"/><circle cx="62" cy="62" r="2.6" fill="#F6AD37"/>
   <circle cx="100" cy="50" r="6.5"/><circle cx="100" cy="50" r="2.8" fill="#F6AD37"/>
   <circle cx="138" cy="62" r="6"/><circle cx="138" cy="62" r="2.6" fill="#F6AD37"/>
   <circle cx="36" cy="105" r="5"/><circle cx="36" cy="105" r="2" fill="#F6AD37"/>
   <circle cx="164" cy="105" r="5"/><circle cx="164" cy="105" r="2" fill="#F6AD37"/>
   <circle cx="46" cy="138" r="4.4"/><circle cx="154" cy="138" r="4.4"/>
  </g>
  <ellipse cx="100" cy="142" rx="34" ry="25" fill="#FDE7B0"/>
  <ellipse class="k-cheeks" cx="62" cy="132" rx="9" ry="6" fill="#fb7185" opacity=".45"/>
  <ellipse class="k-cheeks" cx="138" cy="132" rx="9" ry="6" fill="#fb7185" opacity=".45"/>
  <path class="k-brows" d="M58 80 q12 -9 24 -3 M118 77 q12 -6 24 3" stroke="#6B3305" stroke-width="4" stroke-linecap="round" fill="none"/>
  <g transform="translate(70,103)"><g>
   <ellipse rx="15" ry="17" fill="#fff"/><circle r="8" fill="#3B2204"/><circle cx="-3" cy="-4" r="3" fill="#fff"/>
   <animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1 1;1 0.06;1 1;1 1" keyTimes="0;0.9;0.94;0.98;1" dur="4.6s" repeatCount="indefinite"/>
  </g></g>
  <g transform="translate(130,103)"><g>
   <ellipse rx="15" ry="17" fill="#fff"/><circle r="8" fill="#3B2204"/><circle cx="-3" cy="-4" r="3" fill="#fff"/>
   <animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1 1;1 0.06;1 1;1 1" keyTimes="0;0.9;0.94;0.98;1" dur="4.6s" repeatCount="indefinite"/>
  </g></g>
  <path d="M90,128 h20 q5,0 2.6,4.6 l-9,10 q-3.6,4 -7.2,0 l-9,-10 q-2.4,-4.6 2.6,-4.6 z" fill="#6B3305"/>
  <path class="k-smile" d="M100,141 v5 M100,146 q-6,8 -16,4 M100,146 q6,8 16,4" stroke="#6B3305" stroke-width="3.6" stroke-linecap="round" fill="none"/>
  <path class="k-open" d="M86,146 q14,18 28,0 q-14,5 -28,0z" fill="#6B3305"/>
  <ellipse class="k-o" cx="100" cy="151" rx="5" ry="6" fill="#6B3305"/>
  <g stroke="#D97706" stroke-width="2" stroke-linecap="round" opacity=".55" fill="none">
   <path d="M64,138 q-14,-2 -26,-7"/><path d="M64,146 q-14,2 -26,6"/><path d="M136,138 q14,-2 26,-7"/><path d="M136,146 q14,2 26,6"/>
  </g>
 </g>
</svg>`;

const MOODS = ['is-happy', 'is-think', 'is-oops', 'is-talking'];

/**
 * @param {{ size?: 'tiny'|'small'|'large'|'', mood?: string }} [opts]
 */
export function kayaEl({ size = '', mood = '' } = {}) {
  const el = h('div', { class: `kaya ${size}`.trim(), html: SVG });
  if (mood) setMood(el, mood);
  return el;
}

/** Change l'humeur de Kaya (« happy », « think », « oops »), pour ms millisecondes si donné. */
export function setMood(el, mood, ms = 0) {
  if (!el) return;
  MOODS.filter(m => m !== 'is-talking').forEach(m => el.classList.remove(m));
  if (mood) el.classList.add(`is-${mood}`);
  clearTimeout(el._moodTimer);
  if (ms) el._moodTimer = setTimeout(() => el.classList.remove(`is-${mood}`), ms);
}

/** La bouche de Kaya bouge le temps (estimé) de la phrase. */
export function talk(el, text) {
  if (!el) return;
  el.classList.add('is-talking');
  clearTimeout(el._talkTimer);
  el._talkTimer = setTimeout(() => el.classList.remove('is-talking'), Math.min(7000, 500 + String(text).length * 62));
}
