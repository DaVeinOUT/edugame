/* ============================================================
   CORE/LEVELS.JS — Les niveaux des grands (CE1 → 3e)
   Après le code (le chemin des 66 sons) : lire et comprendre,
   orthographe, grammaire, conjugaison, vocabulaire.
   « Plus la jauge monte, plus le niveau augmente » :
   • le 1er niveau s'ouvre quand le chemin des sons est fini (ou que le
     positionnement l'a montré), ou quand la force de lecture atteint son
     seuil ET que les sons complexes sont déjà travaillés ;
   • le niveau suivant s'ouvre quand le contrôle est réussi (70 %) ou
     quand la force de lecture atteint son seuil ;
   • dans un niveau, les modules s'ouvrent l'un après l'autre (une étoile,
     ou deux essais : on ne bloque jamais) ; le contrôle peut être tenté
     à tout moment — un grand qui sait déjà peut monter vite.
   Fonctions pures, testées. Données : js/data/levels.js.
   ============================================================ */

import { systemRandom, shuffle } from './rng.js';
import { selectItems } from './select.js';
import { finishSession, starsFor } from './session.js';
import { isDue } from './srs.js';

export const PASS = 0.7;
export const MIN_PHONICS_STEP = 44;
export const PER_SESSION = 12;
/* Difficulté a priori (logit) : au-dessus de tout le chemin des sons. */
export const DIFF = Object.freeze({
  base: 3.2, perLevel: 1.0, perDifficulty: 0.1,
  type: { gap: 0, choice: 0, pick: 0.1, order: 0.2, text: 0.3 },
});

export function buildLevels(data) {
  const levels = (data.LEVELS || []).map((l, index) => ({ ...l, index }));
  const levelIndex = new Map(levels.map(l => [l.id, l.index]));
  const modules = (data.MODULES || [])
    .filter(m => levelIndex.has(m.level))
    .map(m => ({ ...m, levelIndex: levelIndex.get(m.level), isControle: m.skill === 'controle' }))
    .sort((a, b) => a.levelIndex - b.levelIndex || Number(a.isControle) - Number(b.isControle) || a.order - b.order);
  const byId = new Map(modules.map(m => [m.id, m]));
  return {
    levels, modules,
    level: id => levels.find(l => l.id === id) || null,
    module: id => byId.get(id) || null,
    modulesOf: id => modules.filter(m => m.level === id),
  };
}

const adv = profile => profile.path.adv || { modules: {}, controles: {} };
const finished = rec => !!rec && (rec.stars >= 1 || rec.tries >= 2);

/** Le chemin des sons est-il terminé (ou reconnu comme su par le positionnement) ? */
export function phonicsDone(profile, cur) {
  const last = cur.steps.length - 1;
  return !!profile.path.advanced || (profile.path.open >= last && (profile.path.stars[cur.step(last).id] || 0) >= 1);
}

/** Niveaux ouverts pour cet enfant, dans l'ordre. */
export function openLevels(L, profile, cur, points) {
  const out = [];
  const a = adv(profile);
  for (const lv of L.levels) {
    const ok = lv.index === 0
      ? phonicsDone(profile, cur) || (points >= lv.unlockElo && profile.path.open >= MIN_PHONICS_STEP)
      : !!a.controles[L.levels[lv.index - 1].id] || points >= lv.unlockElo;
    if (!ok) break;
    out.push(lv);
  }
  return out;
}

/** Module ouvert ? Le premier d'un niveau, puis en chaîne ; le contrôle toujours ;
    tout le niveau une fois son contrôle réussi (on revoit librement ce qu'on a validé). */
export function moduleOpen(L, profile, m) {
  if (m.isControle || controlePassed(profile, m.level)) return true;
  const list = L.modulesOf(m.level).filter(x => !x.isControle);
  const i = list.findIndex(x => x.id === m.id);
  return i <= 0 || finished(adv(profile).modules[list[i - 1].id]);
}

export function moduleRecord(profile, id) {
  return adv(profile).modules[id] || null;
}

export function controlePassed(profile, levelId) {
  return !!adv(profile).controles[levelId];
}

/* Dès 10 ans, on peut « tester » un niveau : son contrôle est proposé avant les modules. */
export const TEST_OUT_AGES = Object.freeze(['10-12', '13-15']);

/** Ce que propose « Jouer » quand le chemin des sons est fini : on progresse niveau par niveau. */
export function nextModule(L, profile, cur, points) {
  const a = adv(profile);
  const testOut = TEST_OUT_AGES.includes(profile.age);
  for (const lv of openLevels(L, profile, cur, points)) {
    if (a.controles[lv.id]) continue;
    const mods = L.modulesOf(lv.id);
    // Niveau encore jamais commencé par un grand : le contrôle d'abord (réussi = il monte
    // tout de suite ; sinon, les modules lui apprennent ce qui manque).
    const untouched = !mods.some(m => a.modules[m.id]);
    if (testOut && untouched) return mods.find(m => m.isControle) || mods[0] || null;
    const next = mods.find(m => !m.isControle && !finished(a.modules[m.id]) && moduleOpen(L, profile, m));
    return next || mods.find(m => m.isControle) || null;
  }
  return null;
}

export function itemDifficulty(m, type) {
  return DIFF.base + DIFF.perLevel * m.levelIndex + DIFF.perDifficulty * (m.difficulty || 1) + (DIFF.type[type] || 0);
}

/* Prononciation approximative d'une forme écrite : sert seulement à savoir si des réponses
   se PRONONCENT pareil (a/à, et/est, son/sont, mangé/manger, c'est/s'est, leur/leurs…). */
function sayLike(text) {
  let w = String(text).toLowerCase().replace(/[’'\s-]/g, '');
  w = w.replace(/(ées|ée|és|é|ez|er|aient|ait|ais|ai)$/, 'É')   // finale [e] / [ɛ] (é, er, ez, ait…)
    .replace(/(es|ent)$/, 'e');                                  // chantes, chantent = chante
  w = w.normalize('NFD').replace(/\p{M}/gu, '').replace(/c(?=[eiy])/g, 's');
  for (let i = 0; i < 3; i++) w = w.replace(/(?<=.)(s|t|x|z|d)$/, '');   // consonnes finales muettes
  return w;
}

/** Toutes les réponses se prononcent-elles pareil ? (Alors 🔊 n'aiderait pas : on n'entend aucune différence.) */
export function homophones(texts) {
  return texts.length > 1 && new Set(texts.map(sayLike)).size === 1;
}

/** Mots d'une phrase, sans la ponctuation collée (pour « Touche le verbe »). */
export function tokens(text) {
  return text.split(/\s+/)
    .map(w => w.replace(/^[«"“(]+/, '').replace(/[»"”).,!?;:…]+$/, ''))
    .filter(w => w && !/^[«»!?;:…—-]+$/.test(w));
}

function makeQuestion(m, it, idx) {
  const base = { kind: 'adv', type: it.type, key: `adv:${m.id}:${idx}`, module: m.id, step: 0,
                 d: itemDifficulty(m, it.type), explain: it.explain || '', item: it };
  const fromChoices = () => ({ options: it.choices.map(c => ({ id: c, text: c })), answer: it.answer, guess: 1 / it.choices.length });
  switch (it.type) {
    case 'gap':
      return { ...base, ...fromChoices(), text: it.text, prompt: [it.text.replace(/_{2,}/g, '…'), { pause: 200 }, 'Choisis le bon mot.'] };
    case 'choice':
      return { ...base, ...fromChoices(), text: it.text, prompt: [it.text] };
    case 'text':
      return { ...base, ...fromChoices(), text: it.text, passage: it.passage, prompt: [it.text] };
    case 'pick': {
      const words = tokens(it.text);
      const k = words.findIndex(w => w.toLowerCase() === String(it.answer).toLowerCase());
      return { ...base, text: it.text, words, options: words.map((w, i) => ({ id: `w${i}`, text: w })),
               answer: `w${k}`, answerText: it.answer, guess: 1 / Math.max(2, words.length),
               prompt: [it.prompt, { pause: 200 }, { say: it.text }] };
    }
    case 'order':
      return { ...base, words: it.words, answer: it.answer, options: it.words.map((w, i) => ({ id: `w${i}`, text: w })),
               guess: 0.05, prompt: ['Remets les mots dans l\'ordre pour faire une phrase.'] };
    default:
      throw new Error(`type d'exercice inconnu : ${it.type}`);
  }
}

/** Toutes les questions d'un module (un texte donne une question par question posée). */
export function moduleQuestions(m) {
  const out = [];
  m.items.forEach((it, i) => {
    if (it.type === 'text') {
      (it.questions || []).forEach((q, j) => out.push(makeQuestion(m, { ...q, type: 'text', passage: it.passage }, `${i}.${j}`)));
    } else {
      out.push(makeQuestion(m, it, String(i)));
    }
  });
  return out;
}

/* Les réponses dans un ordre neuf à chaque séance : toucher « toujours le premier bouton »
   ne doit jamais suffire. (Mots à toucher : l'ordre de la phrase ; mots à ranger : mélangés à l'écran.) */
function mixAnswers(q, rand) {
  return q.type === 'pick' || q.type === 'order' ? q : { ...q, options: shuffle(q.options, rand) };
}

/** Séance d'un module : 12 questions au plus (révisions dues d'abord), dans l'ordre du cours. */
export function planModule(m, profile, { rand = systemRandom, now = Date.now(), n = PER_SESSION } = {}) {
  const all = moduleQuestions(m);
  if (m.isControle || all.length <= n) return all.map(q => mixAnswers(q, rand));
  const chosen = new Set(selectItems(all, { elo: profile.elo, mem: profile.mem, now, n, rand }).map(q => q.key));
  return all.filter(q => chosen.has(q.key)).map(q => mixAnswers(q, rand));
}

/* Questions des modules déjà travaillés (les contrôles restent une vraie épreuve, jamais révisée). */
function reviewQuestions(L, profile) {
  const a = adv(profile);
  return L.modules.filter(m => !m.isControle && a.modules[m.id]).flatMap(moduleQuestions);
}

/**
 * Révisions des niveaux : ce qui est dû d'abord (répétition espacée), à la bonne difficulté.
 * Ce qui a été appris dans un module revient au bon moment au lieu d'être oublié.
 */
export function planReview(L, profile, { rand = systemRandom, now = Date.now(), n = PER_SESSION } = {}) {
  return selectItems(reviewQuestions(L, profile), { elo: profile.elo, mem: profile.mem, now, n, rand }).map(q => mixAnswers(q, rand));
}

/** Y a-t-il quelque chose à réviser (un module déjà travaillé, hors contrôles) ? */
export function hasReviewable(L, profile) {
  return reviewQuestions(L, profile).length > 0;
}

/** Nombre de questions des niveaux à revoir maintenant. */
export function dueReviews(L, profile, now = Date.now()) {
  return reviewQuestions(L, profile).filter(q => profile.mem[q.key]?.b > 0 && isDue(profile.mem[q.key], now)).length;
}

/**
 * Fin d'un module : force de lecture, étoiles du module, contrôle, diplôme.
 * Les étoiles d'un module ne baissent jamais ; un contrôle se retente à volonté.
 */
export function finishModule(profile, { module, results, seconds = 0 }, cur, now = Date.now()) {
  const { profile: p1, report } = finishSession(profile, { kind: 'practice', results, seconds }, cur, now);
  const a = adv(p1);
  const prev = a.modules[module.id] || { stars: 0, tries: 0 };
  // Juste avec l'aide (texte lu par Kaya : l'aménagement habituel des dyslexiques) = juste.
  // L'Élo, lui, l'a déjà compté comme une demi-information.
  const right = results.filter(r => r.outcome !== 'ko').length;
  const accuracy = results.length ? right / results.length : 0;
  const stars = starsFor(accuracy);
  const modules = { ...a.modules, [module.id]: { stars: Math.max(prev.stars, stars), tries: prev.tries + 1 } };
  const passed = module.isControle && accuracy >= PASS;
  const controles = passed ? { ...a.controles, [module.level]: true } : a.controles;
  const diploma = `diplome-${module.level}`;
  const newCards = passed && !p1.cards.includes(diploma) ? [diploma] : [];
  return {
    profile: { ...p1, cards: [...p1.cards, ...newCards], path: { ...p1.path, adv: { modules, controles } } },
    report: { ...report, ok: right, accuracy, stars, passed, isControle: module.isControle, module: module.id, cards: [...report.cards, ...newCards] },
  };
}
