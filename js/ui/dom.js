/* ============================================================
   UI/DOM.JS — Petits outils pour construire l'interface
   h('button', { class: 'btn', onclick }, 'Texte') : crée l'élément,
   les textes passent par des nœuds texte (aucune injection HTML
   possible avec un prénom saisi). Seul le SVG statique du jeu
   passe par `html:`.
   ============================================================ */

/**
 * @param {string} tag
 * @param {Record<string, any> | null} [props]
 * @param {...any} children
 * @returns {HTMLElement}
 */
export function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

/** Ajoute des enfants (textes, éléments, listes imbriquées ; null ignoré). */
export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Vide un élément. */
export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Échappe un texte pour un gabarit HTML (cas rares où h() ne convient pas). */
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Attente (animations, rythme des consignes). */
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Le joueur a-t-il demandé moins d'animations (système ou réglage) ? */
export function reducedMotion() {
  return document.body.classList.contains('reduced-motion')
    || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}
