/* ============================================================
   CORE/QUESTIONS.JS — Fabriquer un exercice concret
   Un « élément » du parcours (un son, une syllabe, un mot…) devient
   une question : ce que Kaya dit, les choix proposés, la bonne
   réponse. Les pièges sont choisis pour faire LIRE, pas deviner :
   • les images d'un mot à lire commencent par la même lettre ;
   • les syllabes proposent l'inversion (ma / am) et la lettre jumelle
     (m / n) — les vraies difficultés des lecteurs dyslexiques.
   ============================================================ */

import { shuffle, pick, sample, systemRandom } from './rng.js';
import { difficultyOf } from './curriculum.js';

const LETTER_KINDS = new Set(['voyelle', 'longue', 'courte', 'complexe']);
const isLetterStep = s => LETTER_KINDS.has(s.kind) && !s.show.includes(' ');

/** Combien de réponses proposer : peu au début et pour les plus jeunes. */
export function choiceCount(kind, { age = '4-6', step = 0 } = {}) {
  if (kind === 'sound') {
    if (step < 3) return 2;
    return age === '4-6' && step < 12 ? 3 : 4;
  }
  if (kind === 'syllable') return step < 8 ? 2 : 3;
  return 3;
}

/* Graphèmes pièges : jumeaux connus d'abord, puis autres graphèmes connus,
   et au tout début des lettres à venir (bien différentes). */
function graphemeDistractors(target, cur, upTo, n, rand) {
  // Jamais deux bonnes réponses : on écarte les graphèmes du MÊME son (c/k/qu, o/au…).
  const ph = cur.steps.find(s => s.show === target)?.ph;
  const usable = cur.steps.filter(s => isLetterStep(s) && s.show !== target && s.ph !== ph);
  const letters = usable.map(s => s.show);
  const known = usable.filter(s => s.index <= upTo).map(s => s.show);
  const twins = (cur.confusable[target] || []).filter(g => known.includes(g));
  const others = shuffle(known.filter(g => !twins.includes(g)), rand);
  let out = [...shuffle(twins, rand), ...others];
  if (out.length < n) {
    const upcoming = letters.filter(g => g !== target && !out.includes(g)
      && !(cur.confusable[target] || []).includes(g));
    out = [...out, ...upcoming];
  }
  return [...new Set(out)].slice(0, n);
}

function soundQuestion(item, cur, ctx) {
  // L'étape-contraste (b d p q) interroge chaque lettre de la famille.
  const step = item.target ? cur.stepById(item.target) : cur.step(item.step);
  const target = step.show;
  const n = choiceCount('sound', { age: ctx.age, step: item.step });
  const options = shuffle([target, ...graphemeDistractors(target, cur, ctx.open ?? item.step, n - 1, ctx.rand)], ctx.rand)
    .map(g => ({ id: g, text: g }));
  const what = target.length > 1 ? 'les lettres qui font' : 'la lettre qui fait';
  return {
    prompt: [`Touche ${what} le son`, { sound: step.ph }, '.'],
    caption: `Touche ${what} le son « ${step.ph} ».`,
    options, answer: target, guess: 1 / options.length, ph: step.ph, anchor: step.anchor,
  };
}

function listenQuestion(item, cur, ctx) {
  const { rand } = ctx;
  const ph = item.ph;
  const starters = cur.startingWith(ph);
  const without = cur.withoutSound(ph);
  if (starters.length && without.length >= 2 && item.step >= 2 && rand() < 0.5) {
    const target = pick(starters, rand);
    const others = sample(without.filter(w => w.emoji !== target.emoji), 2, rand);
    return {
      mode: 'initial',
      prompt: ['Quel mot commence par le son', { sound: ph }, '?'],
      caption: `Quel mot commence par le son « ${ph} » ?`,
      options: shuffle([target, ...others], rand).map(w => ({ id: w.text, emoji: w.emoji, say: w.text })),
      answer: target.text, guess: 1 / 3, ph,
    };
  }
  const yes = rand() < 0.5;
  const w = pick(yes ? cur.withSound(ph) : without, rand);
  return {
    mode: 'contains',
    word: { text: w.text, emoji: w.emoji },
    prompt: ['Est-ce que tu entends le son', { sound: ph }, 'dans', { word: w.text }, '?'],
    caption: `Tu entends « ${ph} » dans « ${w.text} » ?`,
    options: [{ id: 'oui', emoji: '👍', say: 'oui' }, { id: 'non', emoji: '👎', say: 'non' }],
    answer: yes ? 'oui' : 'non', guess: 0.5, ph,
  };
}

function syllableDistractors(item, cur, upTo, rand) {
  const { c, v } = item;
  const own = cur.syllablesFor(item.step).map(s => s.text);
  const reversed = c && v && c.length === 1 && v.length === 1 ? [v + c] : [];
  const twinC = (cur.confusable[c] || []).map(x => x + v);
  const sameC = own.filter(t => t !== item.text);
  const knownSyl = new Set(cur.steps.filter(s => s.index <= upTo).flatMap(s => cur.syllablesFor(s.index).map(x => x.text)));
  const pool = [...shuffle(reversed, rand), ...shuffle(twinC.filter(t => knownSyl.has(t) || twinC.length), rand),
                ...shuffle(sameC, rand), ...shuffle([...knownSyl], rand)];
  return [...new Set(pool)].filter(t => t !== item.text);
}

function syllableQuestion(item, cur, ctx) {
  const n = choiceCount('syllable', { age: ctx.age, step: item.step });
  const options = shuffle([item.text, ...syllableDistractors(item, cur, ctx.open ?? item.step, ctx.rand).slice(0, n - 1)], ctx.rand)
    .map(t => ({ id: t, text: t }));
  return {
    prompt: ['Touche la syllabe', { word: item.text }, '.'],
    caption: 'Touche la syllabe que tu entends.',
    options, answer: item.text, guess: 1 / options.length,
  };
}

/* Images pièges : même première lettre d'abord (impossible de deviner
   sur le début du mot), puis un son en commun, puis le reste. */
function wordDistractors(target, words, n, rand) {
  const others = words.filter(w => w.text !== target.text && w.emoji !== target.emoji);
  const sameStart = others.filter(w => w.text[0] === target.text[0]);
  const shareSound = others.filter(w => !sameStart.includes(w) && [...w.phonemes].some(p => target.phonemes.has(p)));
  const rest = others.filter(w => !sameStart.includes(w) && !shareSound.includes(w));
  return [...shuffle(sameStart, rand), ...shuffle(shareSound, rand), ...shuffle(rest, rand)].slice(0, n);
}

function readQuestion(item, cur, ctx) {
  const target = cur.word(item.text);
  const options = shuffle([target, ...wordDistractors(target, cur.words, 2, ctx.rand)], ctx.rand)
    .map(w => ({ id: w.text, emoji: w.emoji, say: w.text }));
  return {
    word: target,
    prompt: ['Lis le mot, puis touche la bonne image.'],
    caption: 'Lis le mot, puis touche la bonne image.',
    options, answer: target.text, guess: 1 / 3,
  };
}

/* Tuiles du Constructeur : une tuile par graphème qui s'entend (les lettres
   muettes sont déjà posées, en gris), plus une ou deux tuiles jumelles. */
function buildQuestion(item, cur, ctx) {
  const target = cur.word(item.text);
  const slots = target.parsed.graphemes.map(g => ({ g: g.g, mute: g.mute }));
  const sounded = slots.filter(s => !s.mute).map(s => s.g);
  const twins = [...new Set(sounded.flatMap(g => cur.confusable[g] || []))]
    .filter(g => !sounded.includes(g));
  const nExtra = sounded.length >= 4 ? 2 : 1;
  const extra = shuffle(twins, ctx.rand).slice(0, nExtra);
  const tiles = shuffle([...sounded, ...extra], ctx.rand);
  return {
    word: target, slots, tiles,
    prompt: ['Écris le mot', { word: target.text }, '.'],
    caption: `Écris le mot « ${target.text} ».`,
    options: tiles.map((t, i) => ({ id: `t${i}`, text: t })),
    answer: sounded.join('|'), guess: 0.1,
  };
}

/* « Touche le mot que tu entends » : trois mots écrits, dont deux qui
   commencent pareil — utile pour les petits mots sans image (les, est…). */
function hearwordQuestion(item, cur, ctx) {
  const target = item.text;
  const upTo = Math.max(ctx.open ?? item.step, item.step);
  const pool = [...cur.tools, ...cur.words].filter(w => w.step <= upTo && w.text !== target);
  const same = pool.filter(w => w.text[0] === target[0]);
  const near = pool.filter(w => !same.includes(w) && Math.abs(w.text.length - target.length) <= 1);
  const others = [...new Set([...shuffle(same, ctx.rand), ...shuffle(near, ctx.rand), ...shuffle(pool, ctx.rand)]
    .map(w => w.text))].slice(0, 2);
  return {
    prompt: ['Touche le mot', { word: target }, '.'],
    caption: 'Touche le mot que tu entends.',
    options: shuffle([target, ...others], ctx.rand).map(t => ({ id: t, text: t })),
    answer: target, guess: 1 / (others.length + 1),
  };
}

function sentenceQuestion(item, cur, ctx) {
  const s = cur.sentences.find(x => x.id === item.id);
  return {
    sentence: s,
    prompt: ['Lis la phrase, puis touche la bonne image.'],
    caption: 'Lis la phrase, puis touche la bonne image.',
    options: shuffle([s.pic, ...s.alt], ctx.rand).map(p => ({ id: p, emoji: p })),
    answer: s.pic, guess: 1 / 3,
  };
}

const BUILDERS = {
  listen: listenQuestion, sound: soundQuestion, syllable: syllableQuestion,
  read: readQuestion, hearword: hearwordQuestion, build: buildQuestion, sentence: sentenceQuestion,
};

/**
 * @param {{ kind: string, key: string, step: number }} item
 * @param {ReturnType<import('./curriculum.js').buildCurriculum>} cur
 * @param {{ rand?: () => number, age?: string, open?: number }} [ctx]
 */
export function makeQuestion(item, cur, ctx = {}) {
  const build = BUILDERS[item.kind];
  if (!build) throw new Error(`type d'exercice inconnu : ${item.kind}`);
  const q = build(item, cur, { rand: systemRandom, ...ctx });
  return { ...q, kind: item.kind, key: item.key, step: item.step, d: difficultyOf(item), item };
}
