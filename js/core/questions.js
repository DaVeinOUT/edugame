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
import { DEFAULT_PHONEME } from './seg.js';
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

/* Sons que la voix du jeu rend identiques : jamais ensemble dans les choix. */
const SAME_TO_EAR = Object.freeze({ e: ['eu'], eu: ['e'], w: ['oi', 'oin', 'ou'] });

/* Graphèmes pièges : UNE jumelle connue (b avec d, pas b avec d et p ; toutes à
   l'étape-contraste), puis d'autres graphèmes connus, et au tout début des lettres
   à venir (bien différentes). */
function graphemeDistractors(target, cur, upTo, n, rand, maxTwins = 1) {
  // Jamais deux bonnes réponses : on écarte les graphèmes du MÊME son (c/k/qu, o/au…).
  const ph = cur.steps.find(s => s.show === target)?.ph;
  const alike = SAME_TO_EAR[ph] || [];
  const usable = cur.steps.filter(s => isLetterStep(s) && s.show !== target && s.ph !== ph && !alike.includes(s.ph));
  const letters = usable.map(s => s.show);
  const known = usable.filter(s => s.index <= upTo).map(s => s.show);
  const family = cur.confusable[target] || [];
  const twins = shuffle(family.filter(g => known.includes(g)), rand).slice(0, maxTwins);
  const others = shuffle(known.filter(g => !family.includes(g)), rand);
  let out = [...twins, ...others];
  if (out.length < n) out = [...out, ...letters.filter(g => g !== target && !out.includes(g) && !family.includes(g))];
  return [...new Set(out)].slice(0, n);
}

function soundQuestion(item, cur, ctx) {
  // L'étape-contraste (b d p q) interroge chaque lettre de la famille.
  const step = item.target ? cur.stepById(item.target) : cur.step(item.step);
  const target = step.show;
  const n = choiceCount('sound', { age: ctx.age, step: item.step });
  const options = shuffle([target, ...graphemeDistractors(target, cur, ctx.open ?? item.step, n - 1, ctx.rand, item.target ? 3 : 1)], ctx.rand)
    .map(g => ({ id: g, text: g }));
  const what = target.length > 1 ? 'les lettres qui font' : 'la lettre qui fait';
  return {
    prompt: [`Touche ${what} le son`, { sound: step.ph }, '.'],
    caption: `Touche ${what} ce son.`,   // le sous-titre ne donne jamais la réponse
    options, answer: target, guess: 1 / options.length, ph: step.ph, anchor: step.anchor,
  };
}

/* Sons qu'on ne peut pas trancher à l'oreille : é/è et e/eu changent selon les régions
   (et Kaya dit [e] comme [eu]) ; [y] s'entend dans « lion ». Un mot qui contient le
   voisin ne sert jamais de « non ». */
const BLURRY = Object.freeze({ 'é': ['è'], 'è': ['é'], e: ['eu'], eu: ['e'], i: ['y'], y: ['i'] });

function listenQuestion(item, cur, ctx) {
  const { rand } = ctx;
  const ph = item.ph;
  const blurry = BLURRY[ph] || [];
  const starters = cur.startingWith(ph);
  const without = cur.withoutSound(ph).filter(w => !blurry.some(n => w.phonemes.has(n)));
  if (starters.length && without.length >= 2 && item.step >= 2 && rand() < 0.5) {
    const target = pick(starters, rand);
    const others = sample(without.filter(w => w.emoji !== target.emoji), 2, rand);
    return {
      mode: 'initial',
      prompt: ['Quel mot commence par le son', { sound: ph }, '?'],
      caption: 'Quel mot commence par ce son ?',
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
    caption: 'Tu entends ce son dans ce mot ?',
    options: [{ id: 'oui', emoji: '👍', say: 'oui' }, { id: 'non', emoji: '👎', say: 'non' }],
    answer: yes ? 'oui' : 'non', guess: 0.5, ph,
  };
}

/* Son d'une syllabe du parcours : « ka » et « ca » → « k.a ». */
const sylSound = x => (x.reverse ? [...x.gpcs].reverse() : x.gpcs).map(g => g.split('>')[1]).join('.');

/* Pièges : l'inversion (ma / am), la consonne jumelle (ma / na), puis d'autres syllabes
   DÉJÀ lues. Jamais une lettre pas encore vue, jamais une syllabe qui se dit pareil
   (ca / ka, mo / mau), jamais un son nasal pris pour une inversion (no / on). */
function syllableDistractors(item, cur, upTo, rand) {
  const { c, v } = item;
  const last = Math.max(upTo, item.step);
  const known = new Map(cur.steps.filter(s => s.index <= last)
    .flatMap(s => cur.syllablesFor(s.index)).map(x => [x.text, sylSound(x)]));
  const target = known.get(item.text);
  const graphemes = new Set(cur.steps.filter(s => s.index <= last).flatMap(s => s.gpcs.map(g => g.split('>')[0])));
  const flip = c && v && c.length === 1 && v.length === 1 ? (item.text === c + v ? v + c : c + v) : null;
  const flips = flip && !graphemes.has(flip) ? [flip] : [];
  const twins = (cur.confusable[c] || []).map(x => x + v);
  const own = cur.syllablesFor(item.step).map(x => x.text);
  const pool = [...flips, ...shuffle(twins, rand), ...shuffle(own, rand), ...shuffle([...known.keys()], rand)];
  return [...new Set(pool)].filter(t => t !== item.text
    && (flips.includes(t) || (known.has(t) && known.get(t) !== target)));
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
   muettes sont déjà posées, en gris), plus une ou deux tuiles jumelles —
   des graphèmes DÉJÀ appris qui font un AUTRE son : « z » pour « maison »,
   « in » pour « pain » seraient justes à l'oreille, l'enfant qui écrit ce
   qu'il entend ne doit pas être compté faux. */
function buildQuestion(item, cur, ctx) {
  const target = cur.word(item.text);
  const slots = target.parsed.graphemes.map(g => ({ g: g.g, mute: g.mute }));
  const soundedG = target.parsed.graphemes.filter(g => !g.mute);
  const sounded = soundedG.map(g => g.g);
  const heard = new Set(soundedG.map(g => g.p));
  const last = Math.max(ctx.open ?? item.step, item.step);
  const learned = new Set(cur.steps.filter(s => s.index <= last).map(s => s.show));
  const twins = [...new Set(sounded.flatMap(g => cur.confusable[g] || []))]
    .filter(g => !sounded.includes(g) && learned.has(g) && !heard.has(DEFAULT_PHONEME[g]));
  const extra = shuffle(twins, ctx.rand).slice(0, sounded.length >= 4 ? 2 : 1);
  const tiles = shuffle([...sounded, ...extra], ctx.rand);
  return {
    word: target, slots, tiles,
    prompt: ['Écris le mot', { word: target.text }, '.'],
    caption: 'Écris le mot que tu entends.',
    options: tiles.map((t, i) => ({ id: `t${i}`, text: t })),
    answer: sounded.join('|'), guess: 0.1,
  };
}

/* Deux mots qui se disent pareil (a / à, des / dé, dans / dent) ou presque
   (et / est, les / lait, je / jeu) ne vont jamais ensemble : l'oreille ne peut pas choisir. */
const earKey = parsed => parsed.graphemes.filter(g => !g.mute).map(g => g.p).join('.')
  .replace(/è/g, 'é').replace(/eu/g, 'e');

/* « Touche le mot que tu entends » : trois mots écrits, dont deux qui
   commencent pareil — utile pour les petits mots sans image (les, est…). */
function hearwordQuestion(item, cur, ctx) {
  const target = item.text;
  const upTo = Math.max(ctx.open ?? item.step, item.step);
  const all = [...cur.tools, ...cur.words];
  const key = earKey(all.find(w => w.text === target).parsed);
  const pool = all.filter(w => w.step <= upTo && w.text !== target && earKey(w.parsed) !== key);
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
