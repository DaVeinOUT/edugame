/* ============================================================
   UI/OVERLAY.JS — Fenêtres par-dessus l'écran (carte, promotion…)
   Le bouton « retour » du téléphone ferme d'abord la fenêtre,
   Échap aussi ; le focus va au premier bouton (clavier, contacteur).
   ============================================================ */

import { h, append } from './dom.js';

/**
 * @param {{ pushOverlay: Function }} router
 * @param {{ content: any, className?: string, label?: string, dismissible?: boolean, onClose?: Function }} opts
 * @returns {{ el: HTMLElement, close: () => void, closed: Promise<void> }}
 */
export function openOverlay(router, { content, className = '', label = '', dismissible = true, onClose } = {}) {
  const el = h('div', { class: `overlay ${className}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': label || null });
  append(el, [content]);
  document.body.append(el);
  let done = false;
  let resolveClosed;
  const closed = new Promise(r => { resolveClosed = r; });
  const close = () => {
    if (done) return;
    done = true;
    unregister();
    el.remove();
    try { onClose?.(); } catch { /* fermeture garantie */ }
    resolveClosed();
  };
  const unregister = router.pushOverlay(close);
  if (dismissible) el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  requestAnimationFrame(() => (el.querySelector('[data-autofocus]') || el.querySelector('button'))?.focus());
  return { el, close, closed };
}
