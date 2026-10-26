/* Kaya behaviour is independent of its local 3D / SVG renderers. */
import { h } from './dom.js';
import { createCompanion } from '../core/companion.js';
import { KAYA_FALLBACK } from './kaya-fallback.js';

let visualHidden = false;
let motionLimited = false;
const now = () => performance.now();

function paint(el) {
  const state = el._kayaController.get(now());
  el.dataset.state = state.state;
  el.classList.toggle('is-talking', state.speaking);
  const rest = el.querySelector('.kaya-rest');
  if (rest) rest.textContent = state.state === 'resting' ? 'Réveiller Kaya' : 'Repos';
  el._renderKaya?.(state);
  return state;
}

/** Whole-body SVG is immediate; at most one eligible companion receives a 3D scene. */
export function kayaEl({ size = '', mood = '', companion = size === '' || size === 'large', quiet = false } = {}) {
  const visual = companion
    ? h('button', { class: 'kaya-visual', type: 'button', 'aria-label': quiet ? 'Kaya écoute' : 'Saluer Kaya', html: KAYA_FALLBACK })
    : h('div', { class: 'kaya-visual', 'aria-hidden': 'true', html: KAYA_FALLBACK });
  const el = h('div', { class: `kaya ${size} ${companion ? 'kaya-companion' : 'kaya-portrait'} ${quiet ? 'kaya-quiet' : ''}`.trim(), role: companion ? 'group' : 'img', 'aria-label': 'Kaya, bébé jaguar' }, visual);
  el._kayaController = createCompanion({ quiet, now: now() });
  el.dataset.state = quiet ? 'attentive' : 'idle';
  el.dataset.renderer = 'fallback';
  if (companion) {
    el.dataset.kayaCompanion = '';
    const toggle = h('button', { type: 'button', class: 'kaya-toggle', 'aria-expanded': String(!visualHidden) }, visualHidden ? 'Afficher Kaya' : 'Masquer Kaya');
    const motion = h('button', { type: 'button', class: 'kaya-motion', 'aria-pressed': String(motionLimited) }, 'Calmer les gestes');
    const rest = h('button', { type: 'button', class: 'kaya-rest', onclick: () => {
      companionEvent(el, el._kayaController.get(now()).state === 'resting' ? 'wake' : 'rest');
    } }, 'Repos');
    visual.addEventListener('click', () => {
      if (el._kayaController.get(now()).state === 'resting') companionEvent(el, 'wake');
      companionEvent(el, quiet ? 'attentive' : 'greeting');
    });
    toggle.addEventListener('click', () => {
      visualHidden = !visualHidden;
      toggle.textContent = visualHidden ? 'Afficher Kaya' : 'Masquer Kaya';
      toggle.setAttribute('aria-expanded', String(!visualHidden));
      companionEvent(el, visualHidden ? 'hide' : 'show');
    });
    motion.addEventListener('click', () => {
      motionLimited = !motionLimited;
      motion.setAttribute('aria-pressed', String(motionLimited));
      el.classList.toggle('kaya-still', motionLimited); paint(el);
    });
    el.append(h('div', { class: 'kaya-controls' }, toggle, quiet ? null : motion, quiet ? null : rest));
    if (visualHidden) el._kayaController.send('hide', now());
    el.classList.toggle('kaya-still', motionLimited);
  }
  if (mood) setMood(el, mood);
  paint(el);
  return el;
}

export function companionEvent(el, event, duration) {
  if (!el?._kayaController) return;
  el._kayaController.send(event, now(), duration);
  paint(el);
  clearTimeout(el._moodTimer);
  const until = el._kayaController.get(now()).until;
  if (until) el._moodTimer = setTimeout(() => paint(el), Math.max(0, until - now()) + 10);
}

/** Existing evaluated feedback API: no changes to scoring or hints. */
export function setMood(el, mood, ms = 0) {
  if (!el) return;
  el.classList.remove('is-happy', 'is-think', 'is-oops');
  if (mood) el.classList.add(`is-${mood}`);
  companionEvent(el, { happy: 'success', think: 'help', oops: 'encourage' }[mood] || 'attentive', ms || undefined);
}

/** Compatibility for tiny caption portraits only. Companion speech uses onPlayback. */
export function talk(el, text) {
  if (!el || el.hasAttribute('data-kaya-companion')) return;
  companionEvent(el, 'speech-start');
  clearTimeout(el._talkTimer);
  el._talkTimer = setTimeout(() => companionEvent(el, 'speech-end'), Math.min(7000, 500 + String(text).length * 62));
}

/** Mount one companion; background/offscreen/reduced-motion paths have no render loop. */
function mountCompanion(el) {
  let alive = true, webgl = null, failed = false, loading = false, frame = 0, restTimer = null, loadAbort = null;
  let visible = true, previousFrame = -Infinity;
  const visual = el.querySelector('.kaya-visual');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => !media.matches && !motionLimited && !document.body.classList.contains('reduced-motion');
  const model = el._kayaController;
  const cancel = () => { cancelAnimationFrame(frame); frame = 0; };
  const staticDraw = state => {
    if (!webgl || state.hidden || state.paused || !visible) return;
    try { webgl.update(state, now() / 1000, motion()); }
    catch { fallback(); }
  };
  const loop = time => {
    frame = 0;
    if (!alive) return;
    const state = model.get(time);
    el.dataset.state = state.state;
    if (state.hidden || state.paused || !visible || !motion() || !webgl) return;
    if (time - previousFrame >= 32) { previousFrame = time; staticDraw(state); }
    frame = requestAnimationFrame(loop);
  };
  function fallback() {
    failed = true; cancel();
    webgl?.destroy(); webgl = null;
    if (alive) el.dataset.renderer = 'fallback';
  }
  async function load() {
    if (loading || failed || webgl || !alive || !visible || document.hidden || model.get(now()).hidden) return;
    loading = true;
    const abort = new AbortController(); loadAbort = abort;
    try {
      const { createKaya3D } = await import('./kaya-3d.js');
      if (!alive || failed || !visible || document.hidden || model.get(now()).hidden || !el.isConnected) return;
      const instance = await createKaya3D(visual, fallback, { signal: abort.signal });
      if (!alive || failed || !visible || document.hidden || model.get(now()).hidden || !el.isConnected) { instance.destroy(); return; }
      webgl = instance;
      webgl.update(model.get(now()), now() / 1000, motion());
      el.dataset.renderer = '3d';
    } catch { if (!abort.signal.aborted) fallback(); }
    finally { loading = false; if (loadAbort === abort) loadAbort = null; if (alive) refresh(); }
  }
  function refresh() {
    if (!alive) return;
    cancel();
    const state = model.get(now());
    el.dataset.state = state.state;
    el.classList.toggle('kaya-still', !motion());
    if (state.hidden || state.paused || !visible || document.hidden) loadAbort?.abort();
    if (!state.hidden && !state.paused && visible && !document.hidden) {
      if (!webgl) load();
      else { staticDraw(state); if (motion()) frame = requestAnimationFrame(loop); }
    }
  }
  const onVisibility = () => { model.send(document.hidden ? 'pause' : 'resume', now()); refresh(); };
  const onMotion = () => refresh();
  const preferences = new MutationObserver(onMotion);
  preferences.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    model.send(visible && !document.hidden ? 'resume' : 'pause', now()); refresh();
  }) : null;
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { webgl?.resize(); refresh(); }) : null;
  el._renderKaya = refresh;
  document.addEventListener('visibilitychange', onVisibility);
  media.addEventListener('change', onMotion);
  intersection?.observe(el); resize?.observe(visual);
  restTimer = setInterval(() => { if (!document.hidden && visible) { paint(el); } }, 15000);
  if (document.hidden) model.send('pause', now());
  refresh();
  return () => {
    alive = false; loadAbort?.abort(); model.send('navigation', now()); cancel();
    clearInterval(restTimer); clearTimeout(el._moodTimer); clearTimeout(el._talkTimer);
    document.removeEventListener('visibilitychange', onVisibility);
    media.removeEventListener('change', onMotion);
    intersection?.disconnect(); resize?.disconnect(); preferences.disconnect();
    delete el._renderKaya; webgl?.destroy(); webgl = null;
    el.dataset.renderer = 'fallback';
  };
}

/** Called once by main. Child replacements dispose the preceding scene before mounting. */
export function observeCompanions(root, voice) {
  let current = null, destroy = null;
  const scan = () => {
    const next = root.querySelector('[data-kaya-companion]');
    if (current === next) return;
    destroy?.(); current = next; destroy = next ? mountCompanion(next) : null;
  };
  const observer = new MutationObserver(scan);
  observer.observe(root, { childList: true, subtree: true }); scan();
  const offPlayback = voice.onPlayback?.(speaking => { if (current) companionEvent(current, speaking ? 'speech-start' : 'speech-end'); });
  return () => { observer.disconnect(); offPlayback?.(); destroy?.(); current = null; };
}
