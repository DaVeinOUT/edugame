/* ============================================================
   SCREENS/TRACE.JS — Tracer les lettres au doigt
   Multisensoriel : l'enfant voit la lettre, entend son son et la
   trace avec le doigt — l'équivalent numérique de la lettre en
   relief. On vérifie qu'il a vraiment suivi la forme (couverture),
   avec beaucoup de tolérance : c'est un jeu, pas un examen.
   ============================================================ */

import { h, sleep } from '../ui/dom.js';
import { shuffle } from '../core/rng.js';
import { traceBoard } from '../activities/trace.js';
import { setMood, kayaEl } from '../ui/kaya.js';
import { burst } from '../ui/fx.js';

const PER_SESSION = 6;

export const trace = {
  mount(view, params, ctx) {
    const { cur, voice, sfx, router } = ctx;
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const pool = cur.steps.filter(s => s.index <= Math.max(2, p.path.open) && s.show.length === 1);
    const letters = shuffle(pool).slice(0, PER_SESSION);
    let i = 0;
    let alive = true;
    let board = null;
    const kaya = kayaEl({ size: 'tiny' });
    const holder = h('div', { class: 'stack' });
    const fb = h('div', { class: 'feedback', role: 'status' });
    const clearBtn = h('button', { class: 'btn btn-soft', type: 'button', onclick: () => { board?.clear(); sfx.tap(); } }, '🧽 Effacer');
    const doneBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: () => check() }, 'J\'ai fini ✓');
    const hearBtn = h('button', { class: 'icon-btn big', type: 'button', 'aria-label': 'Réécouter', onclick: () => sayLetter() }, '🔊');
    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Tracer'), kaya),
      holder, fb, h('div', { class: 'stage-actions' }, hearBtn, clearBtn, doneBtn));

    const font = () => getComputedStyle(document.body).getPropertyValue('--read-font').trim() || 'Andika, sans-serif';
    const sayLetter = () => {
      const s = letters[i];
      voice.seq(['Trace la lettre', { word: s.show }, '. Elle fait le son', { sound: s.ph }, '.']);
    };

    function show() {
      const s = letters[i];
      board = traceBoard(s.show, { font: font() });
      holder.replaceChildren(h('p', { class: 'center muted' }, `${i + 1} / ${letters.length}`), board.el);
      fb.textContent = '';
      sayLetter();
    }

    async function check() {
      if (!board || !alive) return;
      const { cover, outside } = board.coverage();
      if (cover >= 0.5 && outside < 0.65) {
        sfx.correct();
        setMood(kaya, 'happy', 1200);
        burst(board.el, { count: 10 });
        fb.className = 'feedback ok';
        fb.textContent = 'Bravo !';
        ctx.update(prof => ({ ...prof, wallet: prof.wallet + 1 }));
        await voice.say('Bravo ! Très belle lettre !');
        if (!alive) return;
        i += 1;
        if (i >= letters.length) return end();
        show();
        return;
      }
      sfx.tap();
      setMood(kaya, 'think', 1200);
      fb.className = 'feedback ko';
      fb.textContent = cover < 0.15 ? 'Pose ton doigt sur la lettre grise' : 'Continue de suivre la lettre';
      voice.say(cover < 0.15 ? 'Pose ton doigt sur la lettre grise, et suis-la tout doucement !' : 'Presque ! Continue de suivre la lettre grise avec ton doigt.');
    }

    async function end() {
      holder.replaceChildren(h('div', { class: 'paper prompt-card' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '✍️'), h('p', { class: 'h2' }, 'Bravo !')));
      fb.textContent = '';
      await voice.say(`Bravo ! Tu as écrit ${letters.length} lettres avec ton doigt !`);
      await sleep(600);
      if (alive) router.back();
    }

    show();
    return () => { alive = false; voice.stop(); };
  },
};
