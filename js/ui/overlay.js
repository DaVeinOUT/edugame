/* Fenêtres modales : inertie, clavier, fermeture et retour au déclencheur. */
import { h, append } from './dom.js';

const stack = [];
const originalInert = new Map();
function updateBackground() {
  // Restaurer les états initiaux avant de désactiver les frères de la modale active.
  for (const [node, inert] of originalInert) node.inert = inert || node.hasAttribute('data-write-blocked');
  const active = stack.at(-1);
  if (!active) { originalInert.clear(); return; }
  for (const node of document.body.children) {
    if (node === active || node.id === 'sr-live') continue;
    if (!originalInert.has(node)) originalInert.set(node, node.inert);
    node.inert = true;
  }
}
const controls = el => [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
  .filter(node => !node.disabled && !node.closest('[hidden], [inert]') && node.getClientRects().length);

/** Le dialogue natif fournit aussi le confinement au lecteur d'écran. */
export function openOverlay(router, { content, className = '', label = '', dismissible = true, onClose } = {}) {
  const trigger = document.activeElement;
  const el = h('dialog', { class: `overlay ${className}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': label || 'Fenêtre', tabindex: '-1' });
  append(el, [content]);
  if (dismissible) el.append(h('button', {
    class: 'icon-btn overlay-close', type: 'button', 'aria-label': 'Fermer la fenêtre', onclick: () => close(),
  }, '×'));
  document.body.append(el);
  stack.push(el);
  updateBackground();
  let done = false;
  let resolveClosed;
  const closed = new Promise(r => { resolveClosed = r; });
  const close = () => {
    if (done) return;
    done = true;
    unregister();
    if (el.open && typeof el.close === 'function') el.close();
    stack.splice(stack.indexOf(el), 1);
    el.remove();
    updateBackground();
    const active = stack.at(-1);
    const target = trigger?.isConnected && !trigger.closest('[inert]') ? trigger
      : active ? controls(active)[0] || active : document.querySelector('#app main');
    target?.focus({ preventScroll: true });
    try { onClose?.(); } catch { /* fermeture garantie */ }
    resolveClosed();
  };
  const unregister = router.pushOverlay(close);
  el.addEventListener('cancel', e => { e.preventDefault(); if (dismissible) close(); });
  el.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (dismissible) close(); }
    if (e.key !== 'Tab') return;
    const list = controls(el);
    const first = list[0]; const last = list.at(-1);
    if (!first) { e.preventDefault(); el.focus(); return; }
    if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || document.activeElement === el)) { e.preventDefault(); first.focus(); }
  });
  if (typeof el.showModal === 'function') el.showModal();
  else el.setAttribute('open', '');
  // showModal a déjà rendu la fenêtre focalisable : ne pas reposer le focus
  // au frame suivant après une première tabulation rapide de l’enfant.
  (el.querySelector('[data-autofocus]') || controls(el)[0] || el).focus({ preventScroll: true });
  return { el, close, closed };
}
