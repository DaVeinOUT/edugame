/* ============================================================
   CORE/SEG.JS — Découpage des mots en graphèmes et syllabes
   Le français ne se lit pas lettre par lettre : « ch », « ou »,
   « eau » sont UN son. Chaque mot du jeu est donc décrit par une
   notation compacte, écrite à la main et vérifiée par les tests :

     "m-o|t-o"      graphèmes séparés par « - », syllabes par « | »
     "ch-a-t°"      « ° » = lettre muette (affichée en gris)
     "m-ai|s:z-on"  « :z » = le graphème se lit ici /z/ (et pas /s/)

   De cette notation on tire : la coloration syllabique, les tuiles
   du Constructeur (une tuile par graphème) et la liste des
   correspondances graphème→phonème (CGP) qu'il faut connaître
   pour décoder le mot — donc l'étape du parcours où il devient lisible.
   ============================================================ */

/* Lecture par défaut de chaque graphème (phonème noté « à la française »,
   comme en classe : ou = [u], u = [y], on = [ɔ̃], ch = [ʃ]…).
   Toute autre lecture doit être écrite explicitement avec « : ». */
export const DEFAULT_PHONEME = Object.freeze({
  // voyelles simples
  a: 'a', 'à': 'a', 'â': 'a', i: 'i', 'î': 'i', 'ï': 'i', y: 'i',
  o: 'o', 'ô': 'o', u: 'u', 'û': 'u', 'ù': 'u',
  e: 'e', 'é': 'é', 'è': 'è', 'ê': 'è', 'ë': 'è',
  // voyelles écrites avec plusieurs lettres
  ou: 'ou', 'où': 'ou', 'oû': 'ou', on: 'on', om: 'on',
  an: 'an', am: 'an', en: 'an', em: 'an',
  in: 'in', im: 'in', ain: 'in', aim: 'in', ein: 'in', un: 'in', um: 'in', yn: 'in', ym: 'in',
  oi: 'oi', 'oî': 'oi', oin: 'oin', eu: 'eu', 'œu': 'eu', au: 'o', eau: 'o',
  ai: 'è', 'aî': 'è', ei: 'è', er: 'é', ez: 'é', es: 'é', et: 'é', est: 'è', ui: 'ui', ien: 'ien',
  // consonnes
  p: 'p', b: 'b', t: 't', d: 'd', k: 'k', c: 'k', q: 'k', qu: 'k', g: 'g', gu: 'g',
  f: 'f', ph: 'f', v: 'v', w: 'w', s: 's', 'ç': 's', z: 'z', j: 'j', ch: 'ch',
  m: 'm', n: 'n', gn: 'gn', l: 'l', r: 'r', x: 'ks', ill: 'y', il: 'y',
  // consonnes doubles : un seul son
  pp: 'p', bb: 'b', tt: 't', dd: 'd', cc: 'k', ff: 'f', ss: 's', mm: 'm', nn: 'n',
  ll: 'l', rr: 'r',
});

/** Phonèmes reconnus (ce que l'oreille entend). */
export const PHONEMES = Object.freeze([
  'a', 'i', 'o', 'u', 'ou', 'e', 'é', 'è', 'eu', 'on', 'an', 'in', 'oi', 'oin', 'ui', 'ien',
  'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ch', 'j',
  'm', 'n', 'gn', 'l', 'r', 'y', 'w', 'ks', 'gz',
]);

const MUTE = '°';

/* Les lettres muettes s'apprennent aussi (Dehaene et al. 2012 ; Kalulu) :
   lire « lit » suppose de savoir qu'une lettre grise ne se dit pas.
   Pseudo-correspondances : « ° » (lettres muettes en général), « h>° »
   (h muet, enseigné à part) et « ent>° » (terminaison des verbes). */
export const MUTE_GPC = '°';
function muteGpc(g) {
  const x = g.toLowerCase();
  if (x === 'h') return 'h>°';
  if (x === 'ent') return 'ent>°';
  return MUTE_GPC;
}

/**
 * Identifiant d'une correspondance graphème→phonème : « s>z », « ch>ch ».
 * @param {string} grapheme
 * @param {string} phoneme
 */
export function gpcId(grapheme, phoneme) {
  return `${grapheme.toLowerCase()}>${phoneme}`;
}

/**
 * @typedef {{ g: string, p: string, mute: boolean }} Grapheme
 * @typedef {{ graphemes: Grapheme[], text: string }} Syllable
 * @typedef {{ seg: string, text: string, syllables: Syllable[],
 *             graphemes: Grapheme[], gpcs: string[] }} Parsed
 */

/**
 * Analyse un graphème de la notation (« t° », « s:z », « ch »).
 * @param {string} raw
 * @returns {Grapheme}
 */
function parseGrapheme(raw) {
  const mute = raw.endsWith(MUTE);
  const body = mute ? raw.slice(0, -1) : raw;
  const [g, explicit] = body.split(':');
  if (!g) throw new Error(`graphème vide dans « ${raw} »`);
  if (mute) return { g, p: '', mute: true };
  const p = explicit ?? DEFAULT_PHONEME[g.toLowerCase()];
  if (p === undefined) throw new Error(`lecture inconnue pour le graphème « ${g} »`);
  if (!PHONEMES.includes(p)) throw new Error(`phonème inconnu « ${p} » dans « ${raw} »`);
  return { g, p, mute: false };
}

/**
 * Analyse une notation complète.
 * @param {string} seg ex. "l-a|p-in"
 * @returns {Parsed}
 */
export function parseSeg(seg) {
  if (typeof seg !== 'string' || !seg.trim()) throw new Error('notation vide');
  const syllables = seg.trim().split('|').map(part => {
    const graphemes = part.split('-').map(parseGrapheme);
    return { graphemes, text: graphemes.map(x => x.g).join('') };
  });
  const graphemes = syllables.flatMap(s => s.graphemes);
  const gpcs = [...new Set(graphemes.map(x => (x.mute ? muteGpc(x.g) : gpcId(x.g, x.p))))];
  return { seg, text: syllables.map(s => s.text).join(''), syllables, graphemes, gpcs };
}

/**
 * Vérifie qu'une notation décrit bien le mot écrit (garde-fou des données).
 * @param {string} seg
 * @param {string} word
 * @returns {string[]} liste d'erreurs (vide = OK)
 */
export function checkSeg(seg, word) {
  try {
    const parsed = parseSeg(seg);
    return parsed.text === word ? [] : [`« ${seg} » donne « ${parsed.text} », attendu « ${word} »`];
  } catch (err) {
    return [`« ${seg} » : ${err.message}`];
  }
}

/**
 * Le mot est-il lisible avec les seules correspondances déjà apprises ?
 * (Les lettres muettes comptent : l'étape « lettres muettes » doit être vue.)
 * @param {Parsed} parsed
 * @param {ReadonlySet<string>} known identifiants de CGP connues
 */
export function isDecodable(parsed, known) {
  return parsed.gpcs.every(id => known.has(id));
}

/**
 * Découpage oral « lent » pour l'aide à la lecture : « mo… to ».
 * Les syllabes écrites finissant par un e muet restent lisibles telles
 * quelles (« lu… ne ») — c'est ainsi qu'on syllabe en classe.
 * @param {Parsed} parsed
 * @returns {string[]}
 */
/* Ce que la voix doit DIRE pour un graphème lu autrement que d'habitude
   (s:z, e:è, g:j, ll:y…) : on écrit le son, pas les lettres. */
const SAY_SOUND = Object.freeze({ z: 'z', 'è': 'è', 'é': 'é', j: 'j', s: 's', k: 'k', y: 'y', ou: 'ou', i: 'i', f: 'f' });
/* Nasales que la synthèse lirait de travers hors du mot (« lam » [lam], « pen » [pɛn]). */
const SAY_LETTERS = Object.freeze({ en: 'an', em: 'an', am: 'an', om: 'on', im: 'in', ym: 'in', um: 'in', aim: 'in' });

function sayGrapheme(x) {
  if (x.mute) return x.g;                                         // e muet gardé : « lu… ne »
  const g = x.g.toLowerCase();
  if (x.p !== DEFAULT_PHONEME[g]) return SAY_SOUND[x.p] ?? x.g;   // « mai… zon », « lu… nè… te »
  if (/^(.)\1$/.test(g)) return g[0];                             // tt → t : « ca… ro… te »
  return SAY_LETTERS[g] ?? x.g;                                   // « lan… pe », « ser… pan »
}

export function spokenSyllables(parsed) {
  const unusual = parsed.graphemes.some(x => !x.mute && x.p !== DEFAULT_PHONEME[x.g.toLowerCase()]);
  if (parsed.syllables.length === 1 && unusual) return [parsed.text];   // « six », « mer » : le mot entier, voix humaine
  return parsed.syllables
    .map(s => s.graphemes.filter(x => !x.mute || x.g === 'e').map(sayGrapheme).join(''))
    .filter(Boolean);
}
