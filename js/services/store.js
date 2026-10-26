/* ============================================================
   SERVICES/STORE.JS — La mémoire du jeu, sur l'appareil seulement
   • Un seul endroit lit et écrit le stockage (fini les écrasements
     croisés entre fichiers de la v1).
   • Écritures protégées : navigation privée, quota plein… le jeu
     continue en mémoire et prévient l'adulte — il ne se fige jamais.
   • Un profil par enfant, sous sa propre clé : enregistrer une
     réponse ne réécrit pas toute la classe.
   ============================================================ */

import {
  emptyDevice, sanitizeDevice, sanitizeProfile, migrateLegacy, newProfile, exportBundle, importBundle, mergeProfiles, assignProfileBadges,
  SCHEMA_VERSION,
} from '../core/schema.js';

const KEY_DEVICE = 'educa2:device';
const KEY_REVISION = 'educa2:revision';
const KEY_JOURNAL = 'educa2:pending';
const PREFIX = 'educa2:';
const profileKey = id => `${PREFIX}p:${id}`;
const LEGACY_KEYS = ['educaProfile', 'educaLetterStats', 'educaComfort', 'educaVoiceName', 'educaMuted'];
const SAVE_DELAY = 400;
const MAX_ERRORS = 20;
const MAX_RETRIES = 3;

/** Stockage de secours, en mémoire (perdu à la fermeture). */
export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

/** Le localStorage fonctionne-t-il VRAIMENT (écriture comprise) ? */
export function probeStorage(win = globalThis) {
  let ls;
  try {
    ls = win.localStorage;
    const k = '__educa_probe__';
    ls.setItem(k, '1');
    ls.removeItem(k);
    return { storage: ls, persistent: true };
  } catch {
    return { storage: ls || memoryStorage(), persistent: false };
  }
}

function readJSON(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ storage?: Storage, persistent?: boolean, now?: () => number, maxStep?: number }} [opts]
 *   maxStep : dernière étape du parcours (un profil ne peut pas être plus loin)
 */
export function createStore(opts = {}) {
  const probe = opts.storage ? { storage: opts.storage, persistent: opts.persistent ?? true } : probeStorage();
  const storage = probe.storage;
  const now = opts.now || (() => Date.now());
  const limits = Number.isFinite(opts.maxStep) ? { maxStep: opts.maxStep } : {};
  let device = emptyDevice(now());
  let profiles = new Map();
  let degraded = !probe.persistent;
  const dirty = new Set();
  const removed = new Set();
  let timer = null;
  let retries = 0;
  let failed = false;
  let conflict = false;
  let writable = true; // Les stores purs restent utilisables sans navigateur.
  let sessionReason = null;
  let releaseLock = null;
  let lockTask = null;
  let claiming = null;
  let revision = null;
  let pendingRevision = null;
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => { try { fn(); } catch { /* écouteur isolé */ } });
  const status = () => ({ pending: dirty.size > 0 || removed.size > 0, failed, conflict,
    persistent: probe.persistent, writable, sessionReason });

  function readRevision() {
    try { return storage.getItem(KEY_REVISION); } catch { return revision; }
  }

  function canWrite() {
    if (!writable || conflict) return false;
    const journal = readJSON(storage, KEY_JOURNAL);
    if (readRevision() !== revision || (journal && journal.revision !== pendingRevision)) {
      conflict = true;
      writable = false;
      sessionReason = 'changed';
      notify();
      return false;
    }
    return true;
  }

  function retryLater() {
    if (timer || retries >= MAX_RETRIES || conflict || !writable) return;
    timer = setTimeout(() => { timer = null; flush(); }, 1000 * 2 ** retries++);
    timer.unref?.();
  }

  // Un journal précède les écritures par profil. S'il reste sur disque après
  // une panne, load() relit son état complet, même si la liste n'a pas été écrite.
  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!dirty.size && !removed.size) return !failed && !conflict;
    if (!canWrite()) return false;
    const nextRevision = `${now()}:${Math.random().toString(36).slice(2)}`;
    const journal = {
      version: 1, revision: nextRevision, device,
      profiles: [...dirty].filter(k => k !== KEY_DEVICE).map(k => profiles.get(k.slice(profileKey('').length))).filter(Boolean),
      removed: [...removed],
    };
    try {
      storage.setItem(KEY_JOURNAL, JSON.stringify(journal));
      pendingRevision = nextRevision;
      for (const p of journal.profiles) storage.setItem(profileKey(p.id), JSON.stringify(p));
      for (const id of removed) storage.removeItem(profileKey(id));
      storage.setItem(KEY_DEVICE, JSON.stringify(device));
      storage.setItem(KEY_REVISION, nextRevision);
      revision = nextRevision;
      storage.removeItem(KEY_JOURNAL);
      pendingRevision = null;
      dirty.clear();
      removed.clear();
      failed = false;
      degraded = !probe.persistent;
      retries = 0;
    } catch {
      failed = true;
      degraded = true;
      retryLater();
    }
    notify();
    return !failed;
  }

  function schedule(key) {
    dirty.add(key);
    if (!timer) {
      timer = setTimeout(flush, SAVE_DELAY);
      timer.unref?.();
    }
    notify();
  }

  /** Un seul onglet/PWA peut modifier les données persistantes à la fois.
   * Sans Web Locks, le client affiche un mode de récupération explicite.
   * Aucun verrou check/set localStorage n'est présenté comme atomique. */
  async function claimSession(locks = globalThis.navigator?.locks) {
    if (releaseLock) return !conflict;
    if (claiming) return claiming;
    writable = false;
    if (!locks?.request) { sessionReason = 'unsupported'; notify(); return false; }
    let answer;
    const ready = new Promise(resolve => { answer = resolve; });
    claiming = ready.finally(() => { claiming = null; });
    lockTask = Promise.resolve().then(() => locks.request('educa-local-writer', { mode: 'exclusive', ifAvailable: true }, async lock => {
      if (!lock) { sessionReason = 'busy'; answer(false); notify(); return; }
      let release;
      const held = new Promise(resolve => { release = resolve; });
      releaseLock = release;
      writable = true;
      conflict = false;
      sessionReason = null;
      answer(true);
      notify();
      await held;
    })).catch(() => { releaseLock = null; writable = false; sessionReason = 'unavailable'; answer(false); notify(); });
    return claiming;
  }

  function releaseSession() {
    flush();
    writable = false;
    releaseLock?.();
    releaseLock = null;
    notify();
    return lockTask;
  }

  function migrateProfileBadges() {
    let changed = device.profileBadgesVersion !== 1;
    for (const p of assignProfileBadges(device.order.map(id => profiles.get(id)).filter(Boolean))) {
      if (profiles.get(p.id) !== p) {
        profiles.set(p.id, p);
        dirty.add(profileKey(p.id));
        changed = true;
      }
    }
    if (changed) {
      device = { ...device, profileBadgesVersion: 1 };
      dirty.add(KEY_DEVICE);
    }
    return changed;
  }

  function load() {
    clearTimeout(timer);
    timer = null;
    dirty.clear();
    removed.clear();
    revision = readRevision();
    const recovery = readJSON(storage, KEY_JOURNAL);
    const journal = recovery?.version === 1 && typeof recovery.revision === 'string'
      && recovery.device?.schema === SCHEMA_VERSION && Array.isArray(recovery.profiles)
      && recovery.profiles.every(p => p && typeof p.id === 'string')
      && Array.isArray(recovery.removed) && recovery.removed.every(id => typeof id === 'string') ? recovery : null;
    pendingRevision = journal?.revision ?? null;
    const saved = journal?.device || readJSON(storage, KEY_DEVICE);
    if (saved && saved.schema === SCHEMA_VERSION) {
      device = sanitizeDevice(saved, now(), limits);
      if (JSON.stringify(device) !== JSON.stringify(saved)) dirty.add(KEY_DEVICE);
      profiles = new Map();
      for (const id of Array.isArray(device.order) ? device.order : []) {
        const raw = journal?.profiles.find(p => p.id === id) || readJSON(storage, profileKey(id));
        if (!raw) continue;
        try { profiles.set(id, sanitizeProfile(raw, now(), limits)); } catch { /* profil illisible : ignoré */ }
      }
      device = { ...device, order: [...profiles.keys()] };
      if (!profiles.has(device.activeId)) device = { ...device, activeId: device.order[0] ?? null };
      const profileBadgesMigrated = migrateProfileBadges();
      if (journal) {
        for (const p of journal.profiles) dirty.add(profileKey(p.id));
        for (const id of journal.removed) removed.add(id);
        dirty.add(KEY_DEVICE);
        failed = true;
        degraded = true;
      }
      if (writable && dirty.size) flush();
      return { migrated: false, recovered: !!journal, profileBadgesMigrated };
    }
    // Première ouverture de la v2 : on récupère la progression de la v1.
    const legacy = Object.fromEntries(LEGACY_KEYS.map(k => {
      let raw;
      try { raw = storage.getItem(k); } catch { raw = null; }
      if (k === 'educaVoiceName' || k === 'educaMuted') return [k, raw];
      try { return [k, raw ? JSON.parse(raw) : null]; } catch { return [k, null]; }
    }));
    const m = migrateLegacy(legacy, now());
    if (m) {
      device = m.device;
      profiles = new Map([[m.profile.id, m.profile]]);
      migrateProfileBadges();
      schedule(profileKey(m.profile.id));
      schedule(KEY_DEVICE);
      if (writable) flush();
      return { migrated: true };
    }
    device = emptyDevice(now());
    profiles = new Map();
    return { migrated: false };
  }


  return {
    load,
    flush,
    claimSession, releaseSession,
    get status() { return status(); },
    get degraded() { return degraded; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    device: () => device,
    updateDevice(fn) {
      if (!canWrite()) return device;
      device = sanitizeDevice(fn(device), now(), limits);
      schedule(KEY_DEVICE);
      return device;
    },

    profiles: () => device.order.map(id => profiles.get(id)).filter(Boolean),
    profile: id => profiles.get(id) || null,
    active: () => profiles.get(device.activeId) || null,

    setActive(id) {
      if (!canWrite()) return null;
      if (!profiles.has(id)) return null;
      device = { ...device, activeId: id };
      schedule(KEY_DEVICE);
      return profiles.get(id);
    },

    addProfile(info) {
      if (!canWrite()) return null;
      const created = newProfile(info, now());
      const p = assignProfileBadges([...profiles.values(), created]).at(-1);
      profiles.set(p.id, p);
      device = { ...device, order: [...device.order, p.id], activeId: p.id };
      schedule(profileKey(p.id));
      schedule(KEY_DEVICE);
      flush();
      return p;
    },

    removeProfile(id) {
      if (!canWrite()) return false;
      if (!profiles.has(id)) return;
      profiles.delete(id);
      const order = device.order.filter(x => x !== id);
      device = { ...device, order, activeId: device.activeId === id ? (order[0] ?? null) : device.activeId };
      dirty.delete(profileKey(id));
      removed.add(id);
      schedule(KEY_DEVICE);
      flush();
    },

    /** Le profil est remplacé par ce que renvoie fn (jamais modifié en place). */
    updateProfile(id, fn) {
      if (!canWrite()) return null;
      const p = profiles.get(id);
      if (!p) return null;
      const next = fn(p);
      profiles.set(id, next);
      schedule(profileKey(id));
      return next;
    },

    exportAll(ids = device.order) {
      flush();
      return exportBundle(device, ids.map(id => profiles.get(id)).filter(Boolean), now());
    },

    /** Ajoute les profils et réunit les acquis sans additionner des historiques communs. */
    importAll(data) {
      if (!canWrite()) throw new Error('Une autre ouverture EDUCA détient la sauvegarde.');
      const wasEmpty = profiles.size === 0;
      const { device: d, profiles: list } = importBundle(data, now(), limits);
      for (const p of list) {
        const had = profiles.get(p.id);
        profiles.set(p.id, had ? mergeProfiles(had, p) : p);
        if (!device.order.includes(p.id)) device = { ...device, order: [...device.order, p.id] };
        schedule(profileKey(p.id));
      }
      device = {
        ...device,
        voice: wasEmpty ? d.voice : device.voice,
        classStep: wasEmpty ? d.classStep : device.classStep,
        dailyMinutes: wasEmpty ? d.dailyMinutes : device.dailyMinutes,
        activeId: device.activeId ?? list[0]?.id ?? null,
      };
      migrateProfileBadges();
      schedule(KEY_DEVICE);
      flush();
      return list.map(p => profiles.get(p.id));
    },

    /** Efface TOUT ce que le jeu a enregistré sur cet appareil. */
    wipe() {
      if (!canWrite()) return false;
      clearTimeout(timer);
      dirty.clear();
      removed.clear();
      const keys = [];
      try {
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && (k.startsWith(PREFIX) || LEGACY_KEYS.includes(k))) keys.push(k);
        }
        keys.forEach(k => storage.removeItem(k));
      } catch { failed = true; degraded = true; notify(); return false; }
      device = emptyDevice(now());
      profiles = new Map();
      revision = null;
      pendingRevision = null;
      failed = false;
      notify();
      return true;
    },

    logError(entry) {
      if (!canWrite()) return;
      device = sanitizeDevice({ ...device, errors: [...device.errors, entry].slice(-MAX_ERRORS) }, now(), limits);
      schedule(KEY_DEVICE);
    },
  };
}
