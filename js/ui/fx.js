/* ============================================================
   UI/FX.JS — Petits effets de joie (et messages discrets)
   Étoiles qui jaillissent, « +1 ⭐ », bandeau d'information.
   Tous respectent le réglage « moins d'animations ».
   ============================================================ */

import { h, reducedMotion } from './dom.js';

/** Étoiles qui jaillissent autour d'un élément. */
export function burst(anchor, { count = 10, glyph = '⭐' } = {}) {
  if (!anchor || reducedMotion()) return;
  const r = anchor.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const d = 60 + Math.random() * 50;
    const s = h('span', { class: 'fx-star', 'aria-hidden': 'true' }, glyph);
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    document.body.append(s);
    setTimeout(() => s.remove(), 950);
  }
}

/** « +1 ⭐ » qui s'envole au-dessus d'un élément. */
export function plusOne(anchor, text = '+1 ⭐') {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const s = h('span', { class: 'plus-one', 'aria-hidden': 'true' }, text);
  s.style.left = `${r.left + r.width / 2}px`;
  s.style.top = `${r.top}px`;
  document.body.append(s);
  setTimeout(() => s.remove(), 1050);
}

let current = null;
/**
 * Bandeau en haut de l'écran (une seule à la fois).
 * @param {string} message
 * @param {{ action?: string, onAction?: Function, ms?: number }} [opts]
 */
export function toast(message, { action, onAction, ms = 3500 } = {}) {
  current?.remove();
  const el = h('div', { class: 'toast', role: 'status' }, h('span', null, message));
  if (action) {
    el.append(h('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: () => { el.remove(); onAction?.(); } }, action));
  }
  document.body.append(el);
  current = el;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
  return el;
}
