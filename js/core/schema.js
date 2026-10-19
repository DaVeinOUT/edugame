/* ============================================================
   CORE/SCHEMA.JS — La forme des données sauvegardées
   Fonctions pures : création, vérification, migration depuis
   l'ancienne version (v1), export/import. Aucune donnée ne quitte
   l'appareil : l'export est un fichier que la famille garde.

   Plusieurs enfants peuvent partager une tablette (classe, fratrie) :
   chaque enfant a son profil, choisi en touchant son animal.
   ============================================================ */

import { initialState, prudent, toPoints, ELO } from './elo.js';
import { BOX_MAX } from './srs.js';
import { systemRandom } from './rng.js';

export const SCHEMA_VERSION = 2;

/* Les avatars servent d'« identifiant » à des enfants qui ne lisent pas
   encore leur prénom : chacun reconnaît SON animal. */
export const AVATARS = Object.freeze([
  '🐯', '🦊', '🐼', '🐨', '🐸', '🦁', '🐵', '🐰',
  '🐻', '🐶', '🐱', '🦄', '🐢', '🐬', '🦉', '🐙',
]);

export const AGES = Object.freeze(['4-6', '7-9', '10-12', '13-15']);
export const UNIVERSES = Object.freeze(['jungle', 'space', 'ocean']);

/* Réglages de confort par défaut : pensés pour TOUS les enfants
   (espacement élargi, coloration syllabique, pas de chrono). */
export const DEFAULT_COMFORT = Object.freeze({
  font: 'andika',         // andika | opendyslexic | nunito
  spacing: 'wide',        // normal | wide | xwide (0 / +0,12 em / +0,18 em)
  softBg: false,
  syllableColors: false,  // option : pas de preuve solide (lettres muettes grisées, elles, toujours)
  slowVoice: false,
  reducedMotion: false,
  captions: true,         // sous-titres de ce que dit Kaya
  screenReader: false,    // l'enfant utilise VoiceOver/TalkBack : Kaya se tait
});

const FONTS = ['andika', 'opendyslexic', 'nunito'];

/* Cartes de la v1 → cartes de la v2 (lettre → carte du son correspondant). */
const LEGACY_CARDS = {
  A: 'son-a', I: 'son-i', L: 'son-l', O: 'son-o', R: 'son-r', U: 'son-u', M: 'son-m', E: 'son-e', S: 'son-s',
  F: 'son-f', V: 'son-v', N: 'son-n', J: 'son-j', P: 'son-p', T: 'son-t', C: 'son-c', D: 'son-d', G: 'son-g',
  B: 'son-b', Q: 'son-qu', K: 'son-k', Z: 'son-z', X: 'son-x', H: 'son-h', Y: 'son-y', W: 'son-w',
  r_first: 'r_first', r_streak: 'r_streak', e_perfect: 'e_perfect', e_persist: 'e_persist',
};
const SPACINGS = ['normal', 'wide', 'xwide'];

/** Identifiant court et unique. */
export function newId(rand = systemRandom) {
  return 'p' + Math.floor(rand() * 36 ** 8).toString(36).padStart(8, '0');
}

/** Réglages communs à l'appareil (pas à un enfant). */
export function emptyDevice(now = Date.now()) {
  return {
    schema: SCHEMA_VERSION,
    createdAt: now,
    voice: null,
    muted: false,
    activeId: null,
    order: [],
    classStep: null,      // l'enseignant aligne le parcours sur sa classe
    dailyMinutes: 0,      // 0 = pas de limite (réglage adulte)
    adultPin: null,       // empreinte du code de l'espace des grands (jamais exportée)
    errors: [],
  };
}

/**
 * Nouveau profil d'enfant.
 * @param {{ name?: string, avatar?: string, age?: string, universe?: string }} info
 * @param {number} [now]
 * @param {() => number} [rand]
 */
export function newProfile(info = {}, now = Date.now(), rand = systemRandom) {
  const age = AGES.includes(info.age) ? info.age : '4-6';
  return {
    id: newId(rand),
    createdAt: now,
    name: cleanName(info.name),
    avatar: AVATARS.includes(info.avatar) ? info.avatar : AVATARS[0],
    age,
    universe: UNIVERSES.includes(info.universe) ? info.universe : 'jungle',
    comfort: { ...DEFAULT_COMFORT },
    elo: initialState(age, now),
    mem: {},
    path: { open: 0, stars: {}, placed: false },
    stats: { sessions: 0, answers: 0, correct: 0, seconds: 0, days: {}, confusions: {} },
    cards: [],
    wallet: 0,            // étoiles gagnées par l'effort (jamais retirées)
    firstTimes: {},
  };
}

/** Prénom affiché : facultatif, court, sans caractères de contrôle. */
export function cleanName(name) {
  const s = String(name ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
  return s;
}

const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x, d) => (Number.isFinite(x) ? x : d);
const int = (x, lo, hi, d = lo) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : d);
const count = x => int(x, 0, Number.MAX_SAFE_INTEGER, 0);
const THETA_MAX = 8;                       // au-delà, ce n'est plus un enfant : c'est un fichier abîmé
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_SECONDS = 86400;

/** { clé: nombre } : seules les valeurs numériques sont gardées, bornées. */
function numbers(x, lo, hi, keyOk = () => true) {
  if (!isObj(x)) return {};
  return Object.fromEntries(Object.entries(x)
    .filter(([k, v]) => Number.isFinite(v) && keyOk(k))
    .map(([k, v]) => [k, Math.min(hi, Math.max(lo, v))]));
}

/** { clé: valeur simple } : ni objet ni tableau venus d'un fichier inconnu. */
function primitives(x) {
  if (!isObj(x)) return {};
  return Object.fromEntries(Object.entries(x)
    .filter(([, v]) => typeof v === 'boolean' || typeof v === 'string' || Number.isFinite(v)));
}

function memory(x) {
  if (!isObj(x)) return {};
  return Object.fromEntries(Object.entries(x).filter(([, r]) => isObj(r)).map(([k, r]) => [k, {
    b: int(r.b, 0, BOX_MAX), due: num(r.due, 0), s: count(r.s), k: count(r.k), last: num(r.last, 0),
  }]));
}

function eloState(x, base) {
  if (!isObj(x) || !Number.isFinite(x.theta)) return base;
  const history = Array.isArray(x.history)
    ? x.history.filter(e => Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1]) && Number.isFinite(e[2]))
    : [];
  const state = {
    theta: Math.min(THETA_MAX, Math.max(-THETA_MAX, x.theta)),
    v: Number.isFinite(x.v) && x.v > 0 ? Math.min(ELO.vMax, x.v) : base.v,
    n: count(x.n),
    lastAt: num(x.lastAt, base.lastAt),
    history: history.slice(-ELO.historyMax),
  };
  return { ...state, peak: int(x.peak, 0, toPoints(THETA_MAX), prudent(state)) };
}

function pathState(x, maxStep) {
  const p = isObj(x) ? x : {};
  const out = { open: int(p.open, 0, maxStep, 0), stars: numbers(p.stars, 0, 3), placed: p.placed === true };
  if (isObj(p.tries)) out.tries = numbers(p.tries, 0, Number.MAX_SAFE_INTEGER);
  if (typeof p.lastKind === 'string') out.lastKind = p.lastKind;
  if (p.advanced === true) out.advanced = true;
  if (isObj(p.adv)) {
    const mods = isObj(p.adv.modules) ? p.adv.modules : {};
    out.adv = {
      modules: Object.fromEntries(Object.entries(mods).filter(([, r]) => isObj(r))
        .map(([id, r]) => [id, { stars: int(r.stars, 0, 3), tries: count(r.tries) }])),
      controles: Object.fromEntries(Object.entries(isObj(p.adv.controles) ? p.adv.controles : {})
        .filter(([, v]) => v === true)),
    };
  }
  return out;
}

function statsState(x) {
  const s = isObj(x) ? x : {};
  return {
    sessions: count(s.sessions), answers: count(s.answers), correct: count(s.correct), seconds: count(s.seconds),
    days: numbers(s.days, 0, DAY_SECONDS, k => DAY_KEY.test(k)),
    confusions: numbers(s.confusions, 0, Number.MAX_SAFE_INTEGER),
  };
}

/**
 * Remet d'aplomb un profil venu du disque ou d'un fichier importé :
 * champs manquants complétés, types vérifiés, nombres bornés — un
 * fichier abîmé ne doit jamais empêcher le jeu de démarrer.
 * @param {any} raw
 * @param {number} [now]
 * @param {{ maxStep?: number }} [limits] maxStep : dernière étape du parcours
 */
export function sanitizeProfile(raw, now = Date.now(), { maxStep = Number.MAX_SAFE_INTEGER } = {}) {
  if (!isObj(raw) || typeof raw.id !== 'string') throw new Error('profil invalide');
  const base = newProfile({ name: raw.name, avatar: raw.avatar, age: raw.age, universe: raw.universe }, now);
  const comfort = { ...DEFAULT_COMFORT, ...primitives(raw.comfort) };
  if (!FONTS.includes(comfort.font)) comfort.font = DEFAULT_COMFORT.font;
  if (!SPACINGS.includes(comfort.spacing)) comfort.spacing = DEFAULT_COMFORT.spacing;
  for (const k of Object.keys(DEFAULT_COMFORT)) {
    if (typeof DEFAULT_COMFORT[k] === 'boolean') comfort[k] = comfort[k] === true;
  }
  return {
    ...base,
    id: raw.id,
    createdAt: num(raw.createdAt, now),
    comfort,
    elo: eloState(raw.elo, base.elo),
    mem: memory(raw.mem),
    path: pathState(raw.path, maxStep),
    stats: statsState(raw.stats),
    cards: Array.isArray(raw.cards) ? [...new Set(raw.cards.filter(c => typeof c === 'string'))] : [],
    wallet: count(raw.wallet),
    firstTimes: primitives(raw.firstTimes),
    ...(isObj(raw.legacy) ? { legacy: raw.legacy } : {}),
  };
}

/**
 * Deux copies du même enfant (une sauvegarde restaurée sur une tablette où
 * il a continué de jouer) : on garde celle qui a le plus travaillé, pour ne
 * jamais lui faire perdre ce qu'il a appris.
 */
export function mostAdvanced(a, b) {
  const rank = p => [p.stats.answers, p.path.open, p.elo.peak || 0];
  const [x, y] = [rank(a), rank(b)];
  const i = x.findIndex((v, j) => v !== y[j]);
  return i >= 0 && y[i] > x[i] ? b : a;
}

/**
 * Migration de la v1 (un seul enfant, clés éparpillées) vers la v2.
 * On garde tout ce qui a du sens : prénom, âge, univers, cartes,
 * réglages de confort, voix ; l'ancien XP et les stats de lettres
 * restent consultables par l'adulte.
 * @param {{ educaProfile?: any, educaLetterStats?: any, educaComfort?: any,
 *           educaVoiceName?: string|null, educaMuted?: string|null }} legacy
 * @param {number} [now]
 * @returns {{ device: object, profile: object } | null}
 */
export function migrateLegacy(legacy, now = Date.now()) {
  const old = legacy?.educaProfile;
  if (!isObj(old)) return null;
  const name = old.name === 'Champion' ? '' : old.name;
  const profile = newProfile({ name, age: old.age, universe: old.universe }, now);
  const c = isObj(legacy.educaComfort) ? legacy.educaComfort : {};
  profile.comfort = {
    ...profile.comfort,
    font: c.dyslexicFont ? 'opendyslexic' : profile.comfort.font,
    spacing: c.wideSpacing ? 'xwide' : profile.comfort.spacing,
    softBg: !!c.softBg,
    slowVoice: !!c.slowVoice,
  };
  // Les anciennes cartes-lettres deviennent les cartes-sons correspondantes.
  profile.cards = Array.isArray(old.cards)
    ? [...new Set(old.cards.map(x => LEGACY_CARDS[x]).filter(Boolean))]
    : [];
  profile.legacy = {
    xp: num(old.xp, 0),
    palier: old.palier ?? null,
    letterStats: isObj(legacy.educaLetterStats) ? legacy.educaLetterStats : null,
  };
  const device = {
    ...emptyDevice(now),
    voice: legacy.educaVoiceName || null,
    muted: legacy.educaMuted === '1',
    activeId: profile.id,
    order: [profile.id],
  };
  return { device, profile };
}

/**
 * Fichier de sauvegarde (un enfant, ou toute la classe).
 * @param {object} device
 * @param {object[]} profiles
 * @param {number} [now]
 */
export function exportBundle(device, profiles, now = Date.now()) {
  return {
    educa: SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    device: { voice: device.voice, classStep: device.classStep, dailyMinutes: device.dailyMinutes },
    profiles,
  };
}

/**
 * Lit un fichier de sauvegarde (v2, ou ancien export v1).
 * @param {any} data
 * @param {number} [now]
 * @returns {{ device: object, profiles: object[] }}
 */
export function importBundle(data, now = Date.now(), limits = {}) {
  if (!isObj(data)) throw new Error('fichier illisible');
  if (data.educa === 1 && isObj(data.profile)) {
    const m = migrateLegacy({
      educaProfile: data.profile, educaLetterStats: data.letterStats,
      educaVoiceName: data.voice,
    }, now);
    return { device: { voice: m.device.voice }, profiles: [m.profile] };
  }
  if (data.educa !== SCHEMA_VERSION || !Array.isArray(data.profiles)) {
    throw new Error('ce fichier ne vient pas d\'EDUCA (ou d\'une version plus récente)');
  }
  const profiles = data.profiles.map(p => sanitizeProfile(p, now, limits));
  const device = isObj(data.device) ? data.device : {};
  return { device: { voice: device.voice ?? null, classStep: device.classStep ?? null,
                     dailyMinutes: num(device.dailyMinutes, 0) }, profiles };
}
