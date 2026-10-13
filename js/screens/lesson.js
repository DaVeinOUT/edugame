/* ============================================================
   SCREENS/LESSON.JS — Une leçon (ou une séance de révision)
   Déroulé : présentation du son → exercices de l'oreille vers
   l'écrit → bilan (étoiles, force de lecture, cartes méritées).
   Chaque réponse est enregistrée tout de suite : si l'enfant quitte
   en route, ce qu'il a appris compte quand même.
   Au bout de 12 minutes, Kaya propose une pause (le cerveau apprend
   mieux en séances courtes).
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { kayaEl, setMood } from '../ui/kaya.js';
import {
  planLesson, planPractice, applyAnswer, finishSession, startSession, reviewPool,
} from '../core/session.js';
import { selectItems } from '../core/select.js';
import { makeQuestion } from '../core/questions.js';
import { systemRandom } from '../core/rng.js';
import { activeClock } from '../core/time.js';
import { runChoice } from '../activities/choice.js';
import { runBuild } from '../activities/build.js';
import { runIntro } from '../activities/intro.js';
import { eloPanel, eloSentence, promotion } from '../ui/elo.js';
import { catalogue, revealCard } from '../ui/cards.js';
import { burst } from '../ui/fx.js';

const BREAK_AFTER_MS = 12 * 60 * 1000;

const STARS_SAY = {
  3: 'Trois étoiles ! Tu es un champion de la lecture !',
  2: 'Deux étoiles ! Très bien joué !',
  1: 'Une étoile ! Tu progresses, bravo !',
  0: 'Ce son est encore un peu difficile. Ce n\'est pas grave : on le revoit ensemble bientôt, et tu vas y arriver !',
};

export const lesson = {
  mount(view, params, ctx) {
    const { cur, voice, sfx, router } = ctx;
    if (!ctx.profile()) { ctx.home(); return undefined; }
    if (ctx.rested()) { ctx.restHome(); return undefined; }   // plafond quotidien (chemin, jeux libres…)
    const rand = systemRandom;
    const mode = params.mode === 'practice' ? 'practice' : 'lesson';
    const last = cur.steps.length - 1;
    const stepIndex = mode === 'lesson' ? Math.max(0, Math.min(last, params.step ?? ctx.profile().path.open)) : null;
    ctx.update(p => startSession(p, Date.now()));
    const p0 = ctx.profile();

    let items;
    if (mode === 'lesson') items = planLesson(cur, p0, stepIndex, { rand });
    else if (params.kinds) {
      const pools = reviewPool(cur, p0.path.open);
      items = selectItems(params.kinds.flatMap(k => pools[k]), { elo: p0.elo, mem: p0.mem, n: 10, rand });
    } else items = planPractice(cur, p0, { rand, n: 12 });

    let alive = true;
    let finished = false;
    let breakOffered = false;
    let recorded = -1;          // dernière question déjà enregistrée
    const results = [];
    const clock = activeClock();   // temps actif : une tablette posée ne compte pas
    const seconds = () => clock.ms() / 1000;
    view.addEventListener('pointerdown', () => clock.tick());
    view.addEventListener('keydown', () => clock.tick());

    /* --- mise en page --- */
    const kaya = kayaEl({ size: 'tiny' });
    const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, items.map(() => h('i')));
    const quitBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Arrêter', onclick: () => quit() }, '✕');
    const stage = h('div', { class: 'stage', 'aria-live': 'off' });
    const fb = h('div', { class: 'feedback', role: 'status' });
    const replayBtn = h('button', { class: 'icon-btn big', type: 'button', 'aria-label': 'Réécouter la consigne', hidden: true }, '🔊');
    const helpBtn = h('button', { class: 'btn btn-soft help-btn', type: 'button', 'aria-label': 'Aide de Kaya', hidden: true }, '💡 Aide');
    const contBtn = h('button', { class: 'btn btn-primary', type: 'button', 'aria-label': 'Continuer', hidden: true }, 'Continuer ▶');
    const actions = h('div', { class: 'stage-actions' }, replayBtn, helpBtn, contBtn);
    view.append(h('div', { class: 'lesson-top' }, quitBtn, dots, kaya), stage, fb, actions);

    let replayFn = null;
    let helpFn = null;
    let contResolve = null;
    replayBtn.addEventListener('click', () => replayFn?.());
    helpBtn.addEventListener('click', () => helpFn?.());
    contBtn.addEventListener('click', () => {
      contBtn.hidden = true;
      const r = contResolve;
      contResolve = null;
      r?.();
    });

    const api = {
      voice, sfx, cur, rand, kaya, stage,
      age: p0.age, open: p0.path.open,
      alive: () => alive,
      feedback(type, text) { fb.className = `feedback ${type || ''}`.trim(); fb.textContent = text || ''; },
      setReplay(fn) { replayFn = fn; replayBtn.hidden = !fn; },
      setHelp(fn) { helpFn = fn; helpBtn.hidden = !fn; },
      waitContinue() {
        return new Promise(res => {
          contResolve = res;
          contBtn.hidden = false;
          contBtn.focus({ preventScroll: true });
        });
      },
    };
    const setDot = (i, cls) => { const d = dots.children[i]; if (d) d.className = cls; };

    /* Enregistrée dès que l'enfant a répondu (avant le bravo ou la correction) :
       s'il quitte pendant l'explication, sa réponse compte quand même. */
    function commit(i, q, res) {
      if (recorded >= i) return;
      recorded = i;
      clock.tick();
      results.push(res);
      ctx.update(p => applyAnswer(p, q, res, Date.now()));
      setDot(i, res.outcome === 'ok' ? 'ok' : 'ko');
    }

    async function askBreak() {
      api.setReplay(null); api.setHelp(null); api.feedback('', '');
      setMood(kaya, 'think');
      const stop = h('button', { class: 'btn btn-gold', type: 'button' }, '😴 Pause');
      const go = h('button', { class: 'btn btn-primary', type: 'button' }, 'Continuer ▶');
      stage.replaceChildren(h('div', { class: 'paper prompt-card' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🧃'),
        h('p', { class: 'h2' }, 'On fait une pause ?')), h('div', { class: 'row centered wrap' }, stop, go));
      voice.say('Tu travailles depuis longtemps, bravo ! Ton cerveau apprend mieux avec des pauses. On fait une pause ?');
      return new Promise(res => { stop.onclick = () => res(true); go.onclick = () => res(false); });
    }

    async function run() {
      if (!items.length) {
        stage.replaceChildren(h('div', { class: 'paper prompt-card' }, h('p', { class: 'h2' }, 'Pas encore d\'exercice ici !')));
        voice.say('Il n\'y a pas encore d\'exercice ici. Avance sur le chemin, et reviens plus tard !');
        await sleep(2500);
        if (alive) router.back();
        return;
      }
      if (mode === 'lesson') {
        await runIntro(cur.step(stepIndex), api);
        if (!alive) return;
      }
      for (let i = 0; i < items.length; i++) {
        if (!alive) return;
        setDot(i, 'now');
        api.feedback('', '');
        const q = makeQuestion(items[i], cur, { rand, age: api.age, open: api.open });
        api.onAnswer = res => { if (alive) commit(i, q, res); };
        const res = q.kind === 'build' ? await runBuild(q, api) : await runChoice(q, api);
        if (!alive) return;
        commit(i, q, res);
        if (!breakOffered && clock.ms() > BREAK_AFTER_MS && i < items.length - 2) {
          breakOffered = true;   // proposée une seule fois par leçon
          if (await askBreak()) break;
          if (!alive) return;
        }
      }
      await finish();
    }

    async function finish() {
      if (finished) return;
      finished = true;
      let report;
      ctx.update(p => {
        const out = finishSession(p, { kind: mode, step: stepIndex, results, seconds: seconds() }, cur, Date.now());
        report = out.report;
        return { ...out.profile, path: { ...out.profile.path, lastKind: mode } };
      });
      ctx.store.flush();
      await showResults(report);
    }

    async function showResults(report) {
      api.setReplay(null); api.setHelp(null); api.feedback('', '');
      quitBtn.hidden = true;
      const p = ctx.profile();
      const name = p.name ? `, ${p.name}` : '';
      const good = mode === 'practice' || report.stars >= 1;
      const starRow = mode === 'lesson'
        ? h('div', { class: 'result-stars', 'aria-label': `${report.stars} étoiles sur 3` }, [0, 1, 2].map(() => h('span', null, '⭐')))
        : null;
      const elo = eloPanel(report.elo);
      const nextBtn = mode === 'lesson' && report.unlocked
        ? h('button', { class: 'btn btn-gold btn-block', type: 'button', onclick: () => router.go('lesson', { mode: 'lesson', step: stepIndex + 1 }, { replace: true }) }, 'Son suivant ▶')
        : h('button', { class: 'btn btn-gold btn-block', type: 'button', onclick: () => router.go('lesson', { ...params }, { replace: true }) }, 'Rejouer 🔁');
      const homeBtn = h('button', { class: 'btn btn-soft btn-block', type: 'button', onclick: () => router.go('hub', {}, { reset: true }) }, '🏠 Accueil');
      setMood(kaya, good ? 'happy' : 'oops', 2000);
      stage.replaceChildren(
        h('h1', { class: 'center' }, mode === 'practice' ? `Belle séance${name} !` : good ? `Bravo${name} !` : `Bien essayé${name} !`),
        starRow,
        h('p', { class: 'center h2' }, `${report.ok} bonnes réponses sur ${report.total}`),
        elo.el,
        h('div', { class: 'stack' }, nextBtn, homeBtn));
      // L'enfant peut quitter à tout moment : après chaque attente, plus rien
      // (son, voix, fenêtre de carte) ne se déclenche s'il est parti.
      if (starRow) {
        for (let i = 0; i < report.stars; i++) {
          await sleep(350);
          if (!alive) return;
          starRow.children[i].classList.add('on');
          sfx.star();
        }
        if (report.stars === 3) burst(starRow, { count: 14 });
      }
      setTimeout(() => { if (alive) elo.play(); }, 300);
      const say = mode === 'practice' ? 'Belle séance de révision ! Ta mémoire devient plus solide.'
        : STARS_SAY[report.stars] + (report.stars === 0 && report.unlocked ? ' On continue le chemin, et on reviendra sur ce son en révision.' : '');
      await voice.say(say);
      if (!alive) return;
      if (report.elo.promoted) await promotion(ctx, report.elo.promoted);
      else await voice.say(eloSentence(report.elo.after), { interrupt: false });
      const all = catalogue(cur);
      for (const id of report.cards) {
        if (!alive) return;
        const card = all.find(c => c.id === id);
        if (card) await revealCard(ctx, card, all.length, { isNew: true });
      }
      if (alive) nextBtn.focus({ preventScroll: true });
    }

    function commitPartial() {
      if (finished || results.length < 3) return;
      finished = true;
      ctx.update(p => finishSession(p, { kind: 'practice', results, seconds: seconds() }, cur, Date.now()).profile);
      ctx.store.flush();
    }

    function quit() {
      commitPartial();
      alive = false;
      router.go('hub', {}, { reset: true });
      // Après le changement d'écran : sinon le nettoyage de la leçon couperait l'au revoir.
      voice.say('On s\'arrête là. Bravo pour tout ce que tu as fait !');
    }

    run().catch(err => { if (alive) throw err; });
    return () => {
      if (alive) commitPartial();
      alive = false;
      voice.stop();
    };
  },
};
