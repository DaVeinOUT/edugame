/* Temps actif partagé par les leçons et le tracé : relevés idempotents,
   attribution au profil de départ et au jour local de chaque intervalle. */
import { activeClock, localDay } from '../core/time.js';

export function createPlayTime({ view, ctx, profileId, now = () => Date.now(),
  document: doc = globalThis.document, schedule = setInterval, cancel = clearInterval,
  intervalMs = 5000 }) {
  const clock = activeClock(now());
  const elapsedByDay = new Map();
  const committedByDay = new Map();
  let finished = false;

  function collect() {
    for (const [start, end] of clock.takeIntervals(now())) {
      let cursor = start;
      while (cursor < end) {
        const date = new Date(cursor);
        const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
        const stop = Math.min(end, midnight);
        const day = localDay(cursor);
        elapsedByDay.set(day, (elapsedByDay.get(day) || 0) + stop - cursor);
        cursor = stop;
      }
    }
  }

  function checkpoint() {
    if (finished) return 0;
    collect();
    const deltas = [...elapsedByDay].map(([day, ms]) =>
      [day, Math.max(0, Math.floor(ms / 1000) - (committedByDay.get(day) || 0))]).filter(([, s]) => s > 0);
    if (!deltas.length) return 0;
    const seconds = deltas.reduce((sum, [, value]) => sum + value, 0);
    const updated = ctx.store.updateProfile(profileId, p => {
      const days = { ...p.stats.days };
      for (const [day, value] of deltas) days[day] = (days[day] || 0) + value;
      return { ...p, stats: { ...p.stats, seconds: p.stats.seconds + seconds, days } };
    });
    if (!updated) return 0;
    for (const [day, value] of deltas) committedByDay.set(day, (committedByDay.get(day) || 0) + value);
    ctx.store.flush?.();
    return seconds;
  }

  const gesture = () => { if (!finished) clock.tick(now()); };
  const drag = event => { if (event.buttons) gesture(); };
  const visibility = () => {
    if (doc.visibilityState === 'hidden') {
      clock.pause(now());
      checkpoint();
    } else clock.resume(now());
  };
  const leave = () => { clock.pause(now()); checkpoint(); };
  for (const type of ['pointerdown', 'keydown', 'click']) view.addEventListener(type, gesture);
  view.addEventListener('pointermove', drag);
  doc?.addEventListener('visibilitychange', visibility);
  // Main appelle ce relevé AVANT de rendre le verrou d’écriture.
  const offPageHide = ctx.onPageHide ? ctx.onPageHide(leave) : (() => {
    doc?.defaultView?.addEventListener('pagehide', leave);
    return () => doc?.defaultView?.removeEventListener('pagehide', leave);
  })();
  if (doc?.visibilityState === 'hidden') clock.pause(now());
  const timer = schedule(checkpoint, intervalMs);
  timer?.unref?.();

  return {
    clock,
    checkpoint,
    get seconds() { return clock.ms(now()) / 1000; },
    finish() {
      if (finished) return 0;
      clock.pause(now());
      const added = checkpoint();
      finished = true;
      cancel(timer);
      for (const type of ['pointerdown', 'keydown', 'click']) view.removeEventListener(type, gesture);
      view.removeEventListener('pointermove', drag);
      doc?.removeEventListener('visibilitychange', visibility);
      offPageHide();
      return added;
    },
  };
}
