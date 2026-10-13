/* ============================================================
   UI/ROUTER.JS — Navigation entre écrans
   Application d'une seule page : le bouton « retour » du téléphone
   revient à l'écran précédent au lieu de fermer le jeu. Au bord de
   l'application, un premier appui prévient (à voix haute), le
   second laisse vraiment partir.
   Chaque écran est un objet { mount(root, params, ctx) } qui peut
   renvoyer une fonction de nettoyage (timers, voix, écouteurs).
   ============================================================ */

import { h, clear } from './dom.js';

const EXIT_WINDOW = 3000;

/**
 * @param {{ root: HTMLElement, ctx: object, onExitWarning?: () => void }} opts
 */
export function createRouter({ root, ctx, onExitWarning }) {
  const screens = new Map();
  const stack = [];          // [{ name, params }]
  let cleanup = null;
  let exitArmedAt = 0;
  const overlays = [];       // fonctions de fermeture des fenêtres ouvertes
  let mounts = 0;

  function unmountCurrent() {
    try { cleanup?.(); } catch { /* un écran qui plante en partant ne bloque pas la navigation */ }
    cleanup = null;
  }

  function mount(name, params) {
    const screen = screens.get(name);
    if (!screen) throw new Error(`écran inconnu : ${name}`);
    unmountCurrent();
    clear(root);
    const view = h('main', { class: `screen screen-${name}`, 'data-screen': name, tabindex: '-1' });
    root.append(view);
    root.scrollTop = 0;
    if (typeof scrollTo === 'function') scrollTo(0, 0);
    const id = ++mounts;
    const out = screen.mount(view, params || {}, ctx);
    if (id !== mounts) {
      // L'écran a redirigé ailleurs pendant son montage (profil absent, plafond
      // atteint…) : le nouvel écran est déjà en place, on garde SON nettoyage.
      if (typeof out === 'function') try { out(); } catch { /* idem */ }
      return;
    }
    cleanup = typeof out === 'function' ? out : null;
    // Le focus suit l'écran : utile au clavier, aux contacteurs et aux lecteurs d'écran.
    const target = view.querySelector('[data-autofocus]') || view;
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }

  function onPop() {
    if (overlays.length) {
      const close = overlays.pop();
      close();
      history.pushState({ educa: true }, '');
      return;
    }
    if (stack.length > 1) {
      stack.pop();
      const prev = stack[stack.length - 1];
      exitArmedAt = 0;
      mount(prev.name, prev.params);
      return;
    }
    // Plus rien derrière : premier appui = avertissement, second = sortie.
    if (Date.now() - exitArmedAt < EXIT_WINDOW) return;
    exitArmedAt = Date.now();
    history.pushState({ educa: true }, '');
    onExitWarning?.();
  }

  addEventListener('popstate', onPop);

  return {
    register(name, screen) { screens.set(name, screen); },
    /** Va vers un écran. replace : remplace l'écran courant (pas de retour possible vers lui). */
    go(name, params = {}, { replace = false, reset = false } = {}) {
      exitArmedAt = 0;
      if (reset) stack.length = 0;
      if (replace && stack.length) stack[stack.length - 1] = { name, params };
      else {
        stack.push({ name, params });
        if (stack.length > 1) history.pushState({ educa: true }, '');
      }
      mount(name, params);
    },
    back() {
      if (stack.length > 1) history.back();
    },
    get current() { return stack[stack.length - 1]?.name || null; },
    /** Une fenêtre (carte, promotion…) se ferme d'abord avec « retour ». */
    pushOverlay(close) {
      overlays.push(close);
      return () => {
        const i = overlays.indexOf(close);
        if (i >= 0) overlays.splice(i, 1);
      };
    },
    refresh() {
      const cur = stack[stack.length - 1];
      if (cur) mount(cur.name, cur.params);
    },
  };
}
