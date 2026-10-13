/* ============================================================
   CORE/SESSION.JS — Une leçon, une séance, un bilan
   Une leçon suit toujours le même chemin, de l'oreille à l'écrit :
     écouter le son → le reconnaître → lire des syllabes →
     lire des mots → écrire un mot → lire une phrase.
   Chaque réponse met à jour l'Élo (niveau), la mémoire (révisions)
   et les statistiques ; le bilan donne les étoiles, débloque la
   suite et attribue les cartes MÉRITÉES (jamais au hasard).
   Tout est pur : un profil entre, un NOUVEAU profil sort.
   ============================================================ */

import { update as eloUpdate, commitSession, decay } from './elo.js';
import { review } from './srs.js';
import { selectItems } from './select.js';
import { shuffle, systemRandom } from './rng.js';
import { localDay } from './time.js';

export const LESSON_PLAN = Object.freeze([
  ['listen', 3], ['sound', 4], ['syllable', 3], ['read', 3], ['hearword', 2], ['build', 2], ['sentence', 1],
]);
export const KIND_ORDER = Object.freeze(['listen', 'sound', 'syllable', 'read', 'hearword', 'build', 'sentence']);
export const MIN_ITEMS = 10;
const REVIEW_SPAN = 8;        // les révisions viennent surtout des 8 dernières étapes
const MAX_DAYS = 120;
const CONTRAST_MEMBERS = ['b', 'd', 'p', 'qu'];

const LETTER_KINDS = new Set(['voyelle', 'longue', 'courte', 'complexe']);
const isLetterStep = s => LETTER_KINDS.has(s.kind) && !s.show.includes(' ');
const buildable = w => w.parsed.graphemes.filter(g => !g.mute).length <= 6;

function wordItem(kind, w) {
  return { kind, key: `${kind === 'read' ? 'rd' : 'bd'}:${w.text}`, step: w.step, text: w.text, word: w,
           guess: kind === 'read' ? 1 / 3 : 0.1 };
}

/** Exercices propres à une étape. */
export function itemsForStep(cur, s) {
  const step = cur.step(s);
  const words = cur.newWordsAt(s);
  let sound = [];
  if (isLetterStep(step)) sound = [{ kind: 'sound', key: `snd:${step.id}`, step: s, guess: 1 / 3 }];
  else if (step.kind === 'contraste') {
    sound = CONTRAST_MEMBERS.filter(id => cur.stepById(id))
      .map(id => ({ kind: 'sound', key: `snd:${id}`, step: s, target: id, guess: 1 / 3 }));
  }
  // « Touche le mot que tu entends » : les mots-outils de l'étape, puis quelques mots nouveaux.
  const heard = [...cur.newToolsAt(s), ...words.slice(0, 3)]
    .map(w => ({ kind: 'hearword', key: `hw:${w.text}`, step: s, text: w.text, guess: 1 / 3 }));
  return {
    listen: step.ph && cur.withSound(step.ph).length ? [{ kind: 'listen', key: `pa:${step.ph}`, step: s, ph: step.ph, guess: 0.45 }] : [],
    sound,
    syllable: cur.syllablesFor(s).map(x => ({ kind: 'syllable', key: `syl:${x.text}`, step: s, text: x.text, c: x.c, v: x.v, guess: 1 / 3 })),
    read: words.map(w => wordItem('read', w)),
    hearword: heard,
    build: words.filter(buildable).map(w => wordItem('build', w)),
    sentence: cur.sentences.filter(x => x.step === s).map(x => ({ kind: 'sentence', key: `ph:${x.id}`, step: s, id: x.id, guess: 1 / 3 })),
  };
}

/** Tout ce qui peut être révisé jusqu'à l'étape upTo (incluse). */
export function reviewPool(cur, upTo) {
  const pools = { listen: [], sound: [], syllable: [], read: [], hearword: [], build: [], sentence: [] };
  if (upTo < 0) return pools;
  const seen = new Set();
  for (let s = 0; s <= upTo; s++) {
    const recent = s >= upTo - REVIEW_SPAN;
    const here = itemsForStep(cur, s);
    for (const kind of KIND_ORDER) {
      if (!recent && (kind === 'syllable')) continue;   // les vieilles syllabes ne servent plus
      for (const it of here[kind]) {
        if (seen.has(it.key)) continue;
        seen.add(it.key);
        pools[kind].push(it);
      }
    }
  }
  return pools;
}

/* Répète un petit ensemble pour atteindre n (écouter 3 fois LE son du jour). */
function repeatTo(list, n, rand) {
  const out = [];
  while (out.length < n && list.length) out.push(...shuffle(list, rand));
  return out.slice(0, n);
}

/**
 * Plan d'une leçon pour l'étape s.
 * @returns {object[]} éléments dans l'ordre pédagogique
 */
export function planLesson(cur, profile, s, { rand = systemRandom, now = Date.now() } = {}) {
  const here = itemsForStep(cur, s);
  const before = reviewPool(cur, s - 1);
  // Les jumeaux déjà connus (m pour n, b pour d…) reviennent en priorité.
  const twins = new Set((cur.confusable[cur.step(s).show] || []).map(g => `snd:${cur.steps.find(x => x.show === g)?.id}`));
  const blocks = [];
  let carry = 0;
  for (const [kind, count] of LESSON_PLAN) {
    const want = count + carry;
    const fresh = here[kind];
    let picked = [];
    if (fresh.length) {
      const nFresh = kind === 'listen' || kind === 'sound' ? Math.max(1, want - 1) : Math.min(fresh.length, Math.ceil(want * 0.75));
      picked = kind === 'listen' || kind === 'sound' ? repeatTo(fresh, nFresh, rand) : shuffle(fresh, rand).slice(0, nFresh);
    }
    const old = before[kind];
    const priority = old.filter(it => twins.has(it.key));
    const others = old.filter(it => !twins.has(it.key));
    const rest = want - picked.length;
    if (rest > 0) picked = [...picked, ...priority.slice(0, rest)];
    if (want - picked.length > 0 && others.length) {
      picked = [...picked, ...selectItems(others, { elo: profile.elo, mem: profile.mem, now, n: want - picked.length, rand })];
    }
    carry = want - picked.length;
    blocks.push(shuffle(picked, rand));
  }
  let plan = blocks.flat();
  // Tout début de parcours : pas encore de mots à lire, on écoute davantage.
  const fresh = [...here.listen, ...here.sound];
  while (plan.length < MIN_ITEMS && fresh.length && plan.length < MIN_ITEMS + 2) {
    plan = [...plan, fresh[plan.length % fresh.length]];
  }
  // Étape sans grand contenu propre (règle, mot spécial) : on complète par des révisions.
  if (plan.length < MIN_ITEMS) {
    const used = new Set(plan.map(it => it.key));
    const rest = KIND_ORDER.flatMap(k => before[k]).filter(it => !used.has(it.key));
    plan = [...plan, ...selectItems(rest, { elo: profile.elo, mem: profile.mem, now, n: MIN_ITEMS - plan.length, rand })];
  }
  return [...plan].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/**
 * Séance d'entraînement : révisions dues + exercices à la bonne difficulté.
 */
export function planPractice(cur, profile, { rand = systemRandom, now = Date.now(), n = 12 } = {}) {
  const pools = reviewPool(cur, profile.path.open);
  const all = KIND_ORDER.flatMap(k => pools[k]);
  const picked = selectItems(all, { elo: profile.elo, mem: profile.mem, now, n, rand });
  return [...picked].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/** Début de séance : une longue absence rend l'estimation moins sûre. */
export function startSession(profile, now = Date.now()) {
  return { ...profile, elo: decay(profile.elo, now) };
}

/**
 * Une réponse. outcome : 'ok' | 'ko' | 'help' (« je ne sais pas » ou indice).
 * @param {object} profile
 * @param {{ key: string, d: number, guess: number }} question
 * @param {{ outcome: 'ok'|'ko'|'help', confusion?: string }} result
 */
export function applyAnswer(profile, question, { outcome, confusion }, now = Date.now()) {
  const ok = outcome === 'ok';
  const elo = eloUpdate(profile.elo, { d: question.d, correct: ok, guess: question.guess ?? 1 / 3, help: outcome === 'help' });
  const mem = { ...profile.mem, [question.key]: review(profile.mem[question.key], outcome, now) };
  const confusions = confusion
    ? { ...profile.stats.confusions, [confusion]: (profile.stats.confusions[confusion] || 0) + 1 }
    : profile.stats.confusions;
  const stats = { ...profile.stats, answers: profile.stats.answers + 1, correct: profile.stats.correct + (ok ? 1 : 0), confusions };
  return { ...profile, elo, mem, stats, wallet: profile.wallet + (ok ? 1 : 0) };
}

export function starsFor(accuracy) {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.8) return 2;
  if (accuracy >= 0.6) return 1;
  return 0;
}

function bestStreak(results) {
  let best = 0;
  let cur = 0;
  for (const r of results) {
    cur = r.outcome === 'ok' ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}

function trimDays(days) {
  const keys = Object.keys(days).sort();
  if (keys.length <= MAX_DAYS) return days;
  return Object.fromEntries(keys.slice(-MAX_DAYS).map(k => [k, days[k]]));
}

/** Temps de jeu actif du jour (secondes). */
export function playedToday(profile, now = Date.now()) {
  return profile.stats.days?.[localDay(now)] || 0;
}

/** Le plafond quotidien fixé par l'adulte (minutes, 0 = aucun) est-il atteint ? */
export function restedToday(profile, dailyMinutes, now = Date.now()) {
  return dailyMinutes > 0 && playedToday(profile, now) >= dailyMinutes * 60;
}

/** Ajoute du temps de jeu (leçon, jeu libre) au compteur du jour. */
export function addPlayTime(profile, seconds, now = Date.now()) {
  const s = Math.max(0, Math.round(seconds));
  const day = localDay(now);
  const days = trimDays({ ...profile.stats.days, [day]: (profile.stats.days[day] || 0) + s });
  return { ...profile, stats: { ...profile.stats, seconds: profile.stats.seconds + s, days } };
}

/* Les cartes se MÉRITENT : chaque carte correspond à un exploit réel. */
function earnedCards(before, after, ctx) {
  const ids = [];
  if (before.stats.sessions === 0) ids.push('r_first');
  if (ctx.kind === 'lesson' && ctx.stars >= 1 && ctx.stepId) ids.push(`son-${ctx.stepId}`);
  if (ctx.total >= 8 && ctx.accuracy === 1) ids.push('e_perfect');
  if (ctx.bestStreak >= 5) ids.push('r_streak');
  if (Object.keys(after.stats.days).length >= 3) ids.push('e_regular');
  if (ctx.kind === 'lesson' && ctx.prevStars === 0 && ctx.prevTries >= 1 && ctx.stars >= 1) ids.push('e_persist');
  if (ctx.promoted) ids.push(`titre-${ctx.promoted.id}`);
  if (ctx.kind === 'lesson' && ctx.step === ctx.lastStep && ctx.stars >= 1) ids.push('l_educa');
  return [...new Set(ids)].filter(id => !before.cards.includes(id));
}

/**
 * Fin de séance : étoiles, déblocage, record d'Élo, cartes.
 * @param {object} profile
 * @param {{ kind: 'lesson'|'practice', step?: number|null, results: {outcome: string}[], seconds?: number }} summary
 * @param {object} cur
 */
export function finishSession(profile, { kind, step = null, results, seconds = 0 }, cur, now = Date.now()) {
  const total = results.length;
  const ok = results.filter(r => r.outcome === 'ok').length;
  const accuracy = total ? ok / total : 0;
  let path = profile.path;
  let stars = 0;
  let unlocked = false;
  let stepId = null;
  let prevStars = 0;
  let prevTries = 0;
  if (kind === 'lesson' && step !== null) {
    stepId = cur.step(step).id;
    stars = starsFor(accuracy);
    prevStars = path.stars[stepId] || 0;
    prevTries = path.tries?.[stepId] || 0;
    const tries = { ...(path.tries || {}), [stepId]: prevTries + 1 };
    let open = path.open;
    // On avance avec au moins une étoile… ou après deux essais : on ne
    // bloque jamais un enfant (la révision reprendra ce qui est fragile).
    if (step === open && open < cur.steps.length - 1 && (stars >= 1 || tries[stepId] >= 2)) {
      open += 1;
      unlocked = true;
    }
    path = { ...path, open, tries, stars: { ...path.stars, [stepId]: Math.max(prevStars, stars) } };
  }
  const committed = commitSession(profile.elo, now);
  const timed = addPlayTime(profile, seconds, now).stats;
  const stats = { ...timed, sessions: profile.stats.sessions + 1 };
  const next = { ...profile, elo: committed.state, path, stats };
  const cards = earnedCards(profile, next, {
    kind, step, stepId, stars, accuracy, total, prevStars, prevTries,
    bestStreak: bestStreak(results), promoted: committed.promoted, lastStep: cur.steps.length - 1,
  });
  return {
    profile: { ...next, cards: [...next.cards, ...cards] },
    report: {
      kind, step, total, ok, accuracy, stars, unlocked,
      elo: { before: committed.before, after: committed.after, gained: committed.gained, promoted: committed.promoted },
      cards,
    },
  };
}
