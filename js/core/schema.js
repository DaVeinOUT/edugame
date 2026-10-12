/* ============================================================
   CORE/SCHEMA.JS — La forme des données sauvegardées
   Fonctions pures : création, vérification, migration depuis
   l'ancienne version (v1), export/import. Aucune donnée ne quitte
   l'appareil : l'export est un fichier que la famille garde.

   Plusieurs enfants peuvent partager une tablette (classe, fratrie) :
   chaque enfant a son profil, choisi en touchant son animal.
   ============================================================ */

import { initialState } from './elo.js';
import { systemRandom } from './rng.js';

export const SCHEMA_VERSION = 2;

/* Les avatars servent d'« identifiant » à des enfants qui ne lisent pas
   encore leur prénom : chacun reconnaît SON animal. */
export const AVATARS = Object.freeze([
  '🐯', '🦊', '🐼', '🐨', '🐸', '🦁', '🐵', '🐰',
  '🐻', '🐶', '🐱', '🦄', '🐢', '🐬', '🦉', '🐙',
]);

export const AGES = Object.freeze(['4-6', '7-9', '10-12']);
export const UNIVERSES = Object.freeze(['jungle', 'space', 'ocean']);

/* Réglages de confort par défaut : pensés pour TOUS les enfants
   (espacement élargi, coloration syllabique, pas de chrono). */
export const DEFAULT_COMFORT = Object.freeze({
  font: 'andika',         // andika | opendyslexic | nunito
  spacing: 'wide',        // normal | wide | xwide
  softBg: false,
  syllableColors: true,
  slowVoice: false,
  reducedMotion: false,
  captions: true,         // sous-titres de ce que dit Kaya
  screenReader: false,    // l'enfant utilise VoiceOver/TalkBack : Kaya se tait
});

const FONTS = ['andika', 'opendyslexic', 'nunito'];
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

/**
 * Remet d'aplomb un profil venu du disque ou d'un fichier importé :
 * champs manquants complétés, valeurs absurdes écartées.
 * @param {any} raw
 * @param {number} [now]
 */
export function sanitizeProfile(raw, now = Date.now()) {
  if (!isObj(raw) || typeof raw.id !== 'string') throw new Error('profil invalide');
  const base = newProfile({ name: raw.name, avatar: raw.avatar, age: raw.age, universe: raw.universe }, now);
  const comfort = { ...DEFAULT_COMFORT, ...(isObj(raw.comfort) ? raw.comfort : {}) };
  if (!FONTS.includes(comfort.font)) comfort.font = DEFAULT_COMFORT.font;
  if (!SPACINGS.includes(comfort.spacing)) comfort.spacing = DEFAULT_COMFORT.spacing;
  const elo = isObj(raw.elo) && Number.isFinite(raw.elo.theta)
    ? { ...base.elo, ...raw.elo, history: Array.isArray(raw.elo.history) ? raw.elo.history : [] }
    : base.elo;
  return {
    ...base,
    id: raw.id,
    createdAt: num(raw.createdAt, now),
    comfort,
    elo,
    mem: isObj(raw.mem) ? raw.mem : {},
    path: { ...base.path, ...(isObj(raw.path) ? raw.path : {}) },
    stats: { ...base.stats, ...(isObj(raw.stats) ? raw.stats : {}) },
    cards: Array.isArray(raw.cards) ? raw.cards.filter(c => typeof c === 'string') : [],
    wallet: Math.max(0, num(raw.wallet, 0)),
    firstTimes: isObj(raw.firstTimes) ? raw.firstTimes : {},
    legacy: isObj(raw.legacy) ? raw.legacy : undefined,
  };
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
  profile.cards = Array.isArray(old.cards) ? old.cards.filter(x => typeof x === 'string') : [];
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
export function importBundle(data, now = Date.now()) {
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
  const profiles = data.profiles.map(p => sanitizeProfile(p, now));
  const device = isObj(data.device) ? data.device : {};
  return { device: { voice: device.voice ?? null, classStep: device.classStep ?? null,
                     dailyMinutes: num(device.dailyMinutes, 0) }, profiles };
}
