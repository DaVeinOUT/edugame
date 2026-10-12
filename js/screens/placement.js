/* ============================================================
   SCREENS/PLACEMENT.JS — « Où j'en suis ? » (test de positionnement)
   Proposé à la création d'un enfant de 7 ans et plus (et depuis
   l'espace des grands). Rapide, sans note ni chrono, avec un bouton
   « je ne sais pas » pour ne jamais deviner au hasard. À la fin,
   l'enfant commence à la bonne étape — et un enfant qui lit déjà
   tout le chemin des sons passe aux niveaux des grands.
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { kayaEl } from '../ui/kaya.js';
import { startPlacement, placementItem, recordPlacement, placementResult } from '../core/placement.js';
import { makeQuestion } from '../core/questions.js';
import { applyAnswer, finishSession, startSession } from '../core/session.js';
import { systemRandom } from '../core/rng.js';
import { runChoice } from '../activities/choice.js';
import { burst } from '../ui/fx.js';

const INTRO = 'Je vais te montrer quelques mots. Ce n\'est pas un contrôle : je veux juste savoir ce que tu sais déjà. '
  + 'Si tu ne sais pas, touche le point d\'interrogation. C\'est très bien aussi !';

export const placement = {
  mount(view, params, ctx) {
    const { cur, voice, sfx, router } = ctx;
    if (!ctx.profile()) { ctx.home(); return undefined; }
    const rand = systemRandom;
    let alive = true;
    let state = startPlacement(cur);
    const results = [];
    const t0 = Date.now();
    ctx.update(p => startSession(p, Date.now()));

    const kaya = kayaEl({ size: 'tiny' });
    const count = h('div', { class: 'grow center muted' }, '');
    const quit = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Arrêter', onclick: () => router.go('hub', {}, { reset: true }) }, '✕');
    const stage = h('div', { class: 'stage' });
    const fb = h('div', { class: 'feedback', role: 'status' });
    const replayBtn = h('button', { class: 'icon-btn big', type: 'button', 'aria-label': 'Réécouter', hidden: true }, '🔊');
    const dontKnow = h('button', { class: 'btn btn-soft', type: 'button', hidden: true }, '❓ Je ne sais pas');
    view.append(h('div', { class: 'lesson-top' }, quit, count, kaya), stage, fb, h('div', { class: 'stage-actions' }, replayBtn, dontKnow));
    let replayFn = null;
    replayBtn.addEventListener('click', () => replayFn?.());

    const api = {
      voice, sfx, cur, rand, kaya, stage,
      age: ctx.profile().age, open: 0, quick: true, skipped: null,
      alive: () => alive,
      feedback(type, text) { fb.className = `feedback ${type || ''}`.trim(); fb.textContent = text || ''; },
      setReplay(fn) { replayFn = fn; replayBtn.hidden = !fn; },
      setHelp() { /* pas d'indice pendant le positionnement */ },
      waitContinue: () => sleep(600),
    };

    function intro() {
      const go = h('button', { class: 'btn btn-gold btn-block', type: 'button', 'data-autofocus': true }, '▶ On joue !');
      const zero = h('button', { class: 'btn btn-soft btn-block', type: 'button' }, 'Je commence au début');
      stage.replaceChildren(h('div', { class: 'paper prompt-card' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🧭'),
        h('p', { class: 'h2' }, 'Où j\'en suis ?'), h('p', null, 'Quelques mots pour savoir où commencer. Ce n\'est pas un contrôle !')), go, zero);
      voice.say(INTRO);
      return new Promise(resolve => {
        go.onclick = () => resolve('play');
        zero.onclick = () => resolve('zero');
      });
    }

    async function run() {
      const choice = await intro();
      if (!alive) return;
      if (choice === 'zero') return finish(true);
      dontKnow.hidden = false;
      while (!state.done && alive) {
        const item = placementItem(state, cur, rand);
        const q = makeQuestion(item, cur, { rand, age: api.age, open: state.points[state.i] });
        let skip;
        api.skipped = new Promise(resolve => { skip = resolve; });
        dontKnow.onclick = () => skip();
        count.textContent = `${results.length + 1}`;
        const res = await runChoice(q, api);
        if (!alive) return;
        results.push(res);
        ctx.update(p => applyAnswer(p, q, res, Date.now()));
        state = recordPlacement(state, { ok: res.outcome === 'ok', key: q.key });
      }
      if (alive) finish(false);
    }

    function finish(fromZero) {
      dontKnow.hidden = true;
      api.setReplay(null);
      const res = fromZero ? { open: 0, all: false } : placementResult(state, cur);
      ctx.update(p => {
        const base = results.length >= 3
          ? finishSession(p, { kind: 'practice', results, seconds: (Date.now() - t0) / 1000 }, cur, Date.now()).profile
          : p;
        return { ...base, path: { ...base.path, open: Math.max(base.path.open, res.open), placed: true, advanced: !!(res.all || base.path.advanced) } };
      });
      ctx.store.flush();
      const step = cur.step(ctx.profile().path.open);
      const say = res.all ? 'Bravo ! Tu lis déjà très bien. Tu vas pouvoir passer aux niveaux des grands !'
        : ctx.profile().path.open > 0 ? `Merci ! Tu connais déjà plein de choses. On commence au son « ${step.show} ».`
          : 'Merci ! On va commencer ensemble, tout au début. Tu vas voir, c\'est super !';
      const go = h('button', { class: 'btn btn-gold btn-block', type: 'button', 'data-autofocus': true, onclick: () => router.go('hub', {}, { reset: true }) }, 'C\'est parti ▶');
      const card = h('div', { class: 'paper prompt-card' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, res.all ? '🏆' : '🧭'), h('p', { class: 'h2' }, say));
      stage.replaceChildren(card, go);
      api.feedback('', '');
      if (res.all) burst(card, { count: 14 });
      sfx.star();
      voice.say(say);
      go.focus({ preventScroll: true });
    }

    run().catch(err => { if (alive) throw err; });
    return () => { alive = false; voice.stop(); };
  },
};
