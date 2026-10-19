/* ============================================================
   CORE/CURRICULUM.JS — Ce que l'enfant peut lire, étape par étape
   À partir des données (js/data/curriculum.js), calcule une fois :
   • l'étape où chaque mot (et mot-outil, et phrase) devient lisible :
     toutes ses correspondances — lettres muettes comprises — apprises ;
   • les mots qui contiennent / commencent par un son (jeux d'écoute) ;
   • les syllabes à lire à chaque étape ;
   • la difficulté a priori de chaque exercice (pour l'Élo).
   Fonctions pures : testées sous Node, sans navigateur.
   ============================================================ */

import { parseSeg } from './seg.js';

/* Sons composés : l'oreille entend aussi leurs parties (« roi » = [r][w][a]).
   « Tu entends [a] dans roi ? » → oui. */
const HEARD_PARTS = Object.freeze({ oi: ['w', 'a'], oin: ['w', 'in'], ui: ['u', 'i'], ien: ['y', 'in'], ks: ['k', 's'], gz: ['g', 'z'] });
/* Syllabes jamais proposées seules : « con » (et « kon », qui se dit pareil) est une insulte. */
const AVOID = new Set(['con', 'kon']);

/* Difficulté a priori (échelle logit de l'Élo) : on avance d'environ
   0,1 par étape ; écouter est plus facile que lire, lire un mot plus
   facile que l'écrire. Réglage initial, recalé par la simulation. */
export const DIFFICULTY = Object.freeze({
  base: -3.4,
  perStep: 0.1,
  kind: { listen: -0.5, sound: 0, syllable: 0.3, hearword: 0.4, read: 0.6, build: 0.9, sentence: 1.3 },
});

const VOWEL_GRAPHEMES = ['a', 'i', 'o', 'u', 'é', 'è', 'e', 'ou', 'on', 'an', 'in', 'oi', 'eu', 'au', 'ai'];
const SIMPLE_CONSONANTS = ['l', 'r', 'm', 's', 'f', 'ch', 'v', 'n', 'j', 'p', 't', 'd', 'z', 'b', 'c', 'g', 'k'];
/* Graphème → correspondance qui permet de le lire dans une syllabe CV. */
const GRAPHEME_GPC = {
  a: 'a>a', i: 'i>i', o: 'o>o', u: 'u>u', 'é': 'é>é', 'è': 'è>è', e: 'e>e', ou: 'ou>ou', on: 'on>on',
  an: 'an>an', in: 'in>in', oi: 'oi>oi', eu: 'eu>eu', au: 'au>o', ai: 'ai>è',
  l: 'l>l', r: 'r>r', m: 'm>m', s: 's>s', f: 'f>f', ch: 'ch>ch', v: 'v>v', n: 'n>n',
  j: 'j>j', p: 'p>p', t: 't>t', d: 'd>d', z: 'z>z', b: 'b>b', c: 'c>k', g: 'g>g', k: 'k>k',
};

/**
 * Découpe un texte de Kaya en morceaux pour voice.seq :
 * « Écoute [a] comme «ananas» » → ['Écoute', {sound:'a'}, 'comme', {word:'ananas'}].
 * @param {string} text
 */
export function parseIntro(text) {
  const parts = [];
  const re = /\[([^\]]+)\]|«([^»]+)»/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index).trim();
    if (before) parts.push(before);
    parts.push(m[1] ? { sound: m[1] } : { word: m[2] });
    last = re.lastIndex;
  }
  const rest = text.slice(last).trim();
  if (rest) parts.push(rest);
  return parts;
}

/** Version lisible (sous-titres) : «mot» → mot, [a] → « a ». */
export function introCaption(text) {
  return text.replace(/«([^»]+)»/g, '$1').replace(/\[([^\]]+)\]/g, '« $1 »');
}

/**
 * Construit le parcours exploitable par le jeu.
 * @param {{ STEPS: any[], LEXICON: any[], TOOL_WORDS: any[], SENTENCES: any[], CONFUSABLE: object, SECTIONS?: any[] }} data
 */
export function buildCurriculum(data) {
  const steps = data.STEPS.map((s, index) => ({
    ...s, index, introParts: parseIntro(s.intro),
    examplesParsed: (s.examples || []).map(seg => parseSeg(seg)),
  }));
  const stepById = new Map(steps.map(s => [s.id, s]));
  const gpcStep = new Map();
  steps.forEach(s => s.gpcs.forEach(g => { if (!gpcStep.has(g)) gpcStep.set(g, s.index); }));
  const stepOfGpcs = gpcs => (gpcs.length ? Math.max(...gpcs.map(g => gpcStep.get(g) ?? Infinity)) : 0);

  const words = data.LEXICON.map(([seg, emoji]) => {
    const parsed = parseSeg(seg);
    const sounded = parsed.graphemes.filter(g => !g.mute);
    return {
      text: parsed.text, seg, emoji, parsed,
      step: stepOfGpcs(parsed.gpcs),
      phonemes: new Set(sounded.flatMap(g => [g.p, ...(HEARD_PARTS[g.p] || [])])),
      initial: sounded[0]?.p ?? null,
      syllables: parsed.syllables.length,
      graphemes: parsed.graphemes.length,
    };
  });
  const wordByText = new Map(words.map(w => [w.text, w]));

  const tools = data.TOOL_WORDS.map(t => {
    const parsed = parseSeg(t.seg);
    return { text: parsed.text, seg: t.seg, parsed, special: !!t.special, step: stepOfGpcs(parsed.gpcs) };
  });

  const sentences = data.SENTENCES.map((s, i) => {
    const parsedWords = s.words.map(seg => parseSeg(seg));
    const text = parsedWords.map(p => p.text).join(' ');
    return {
      id: `s${i}`, text: `${text.charAt(0).toUpperCase()}${text.slice(1)}.`, words: parsedWords,
      pic: s.pic, alt: s.alt, step: Math.max(...parsedWords.map(p => stepOfGpcs(p.gpcs))),
    };
  });

  const knownGrapheme = (g, i) => GRAPHEME_GPC[g] && (gpcStep.get(GRAPHEME_GPC[g]) ?? Infinity) <= i;

  /* Syllabes CV (et quelques VC pour travailler le sens de lecture :
     « ma » n'est pas « am » — une difficulté classique de la dyslexie). */
  function syllablesFor(stepIndex) {
    const step = steps[stepIndex];
    const out = [];
    const add = (c, v, reverse = false) => {
      const text = reverse ? v + c : c + v;
      if (AVOID.has(text) || out.some(x => x.text === text)) return;
      out.push({ text, c, v, reverse, step: stepIndex, gpcs: [GRAPHEME_GPC[c], GRAPHEME_GPC[v]] });
    };
    const vowels = VOWEL_GRAPHEMES.filter(v => knownGrapheme(v, stepIndex));
    if (step.kind === 'contraste') {
      ['b', 'd', 'p'].forEach(c => ['a', 'i', 'o', 'ou'].filter(v => vowels.includes(v)).forEach(v => add(c, v)));
    } else if (SIMPLE_CONSONANTS.includes(step.show)) {
      vowels.forEach(v => {
        // Devant e, é, è, i (in, eu…), c et g changent de son : pas dans cette étape.
        if (['c', 'g'].includes(step.show) && /^[eéèi]/.test(v)) return;
        add(step.show, v);
      });
      if (['l', 'r', 's'].includes(step.show)) ['a', 'i', 'o'].filter(v => vowels.includes(v)).forEach(v => add(step.show, v, true));
    } else if (VOWEL_GRAPHEMES.includes(step.show)) {
      SIMPLE_CONSONANTS.filter(c => knownGrapheme(c, stepIndex))
        .forEach(c => { if (!(['c', 'g'].includes(c) && /^[eéèi]/.test(step.show))) add(c, step.show); });
    }
    return out;
  }

  return {
    steps, words, tools, sentences,
    confusable: data.CONFUSABLE,
    sections: data.SECTIONS || [],
    step: i => steps[i],
    stepById: id => stepById.get(id) || null,
    word: text => wordByText.get(text) || null,
    knownAt: i => new Set(steps.filter(s => s.index <= i).flatMap(s => s.gpcs)),
    stepOfGpc: g => gpcStep.get(g) ?? Infinity,
    /** Mots illustrés lisibles à l'étape i. */
    readableAt: i => words.filter(w => w.step <= i),
    /** Mots illustrés qui deviennent lisibles exactement à l'étape i. */
    newWordsAt: i => words.filter(w => w.step === i),
    /** Mots-outils qui deviennent lisibles exactement à l'étape i. */
    newToolsAt: i => tools.filter(t => t.step === i),
    /** Mots qui contiennent un son (à l'oreille : pas besoin de lire). */
    withSound: ph => words.filter(w => w.phonemes.has(ph)),
    startingWith: ph => words.filter(w => w.initial === ph),
    withoutSound: ph => words.filter(w => !w.phonemes.has(ph)),
    syllablesFor,
    sentencesAt: i => sentences.filter(s => s.step <= i),
  };
}

/**
 * Difficulté a priori d'un exercice (logit).
 * @param {{ kind: string, step: number, word?: { syllables: number, graphemes: number } }} item
 */
export function difficultyOf(item) {
  const D = DIFFICULTY;
  let d = D.base + D.perStep * item.step + (D.kind[item.kind] ?? 0);
  if (item.kind === 'read' && item.word) d += 0.15 * (item.word.syllables - 1);
  if (item.kind === 'build' && item.word) d += 0.1 * (item.word.graphemes - 3);
  return d;
}
