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
  emptyDevice, sanitizeProfile, migrateLegacy, newProfile, exportBundle, importBundle, mostAdvanced,
  SCHEMA_VERSION,
} from '../core/schema.js';

const KEY_DEVICE = 'educa2:device';
const PREFIX = 'educa2:';
const profileKey = id => `${PREFIX}p:${id}`;
const LEGACY_KEYS = ['educaProfile', 'educaLetterStats', 'educaComfort', 'educaVoiceName', 'educaMuted'];
const SAVE_DELAY = 400;
const MAX_ERRORS = 20;

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
  try {
    const ls = win.localStorage;
    const k = '__educa_probe__';
    ls.setItem(k, '1');
    ls.removeItem(k);
    return { storage: ls, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
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
  let timer = null;
  const listeners = new Set();

  function write(key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      degraded = true;   // quota plein / navigation privée : on garde en mémoire
      return false;
    }
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    for (const key of dirty) {
      if (key === KEY_DEVICE) write(KEY_DEVICE, device);
      else {
        const id = key.slice(profileKey('').length);
        const p = profiles.get(id);
        if (p) write(key, p);
      }
    }
    dirty.clear();
  }

  function schedule(key) {
    dirty.add(key);
    if (!timer) timer = setTimeout(flush, SAVE_DELAY);
    listeners.forEach(fn => { try { fn(); } catch { /* un écouteur ne bloque pas les autres */ } });
  }

  function load() {
    const saved = readJSON(storage, KEY_DEVICE);
    if (saved && saved.schema === SCHEMA_VERSION) {
      device = { ...emptyDevice(now()), ...saved };
      profiles = new Map();
      for (const id of Array.isArray(device.order) ? device.order : []) {
        const raw = readJSON(storage, profileKey(id));
        if (!raw) continue;
        try { profiles.set(id, sanitizeProfile(raw, now(), limits)); } catch { /* profil illisible : ignoré */ }
      }
      device = { ...device, order: [...profiles.keys()] };
      if (!profiles.has(device.activeId)) device = { ...device, activeId: device.order[0] ?? null };
      return { migrated: false };
    }
    // Première ouverture de la v2 : on récupère la progression de la v1.
    const legacy = Object.fromEntries(LEGACY_KEYS.map(k => {
      const raw = storage.getItem(k);
      if (k === 'educaVoiceName' || k === 'educaMuted') return [k, raw];
      try { return [k, raw ? JSON.parse(raw) : null]; } catch { return [k, null]; }
    }));
    const m = migrateLegacy(legacy, now());
    if (m) {
      device = m.device;
      profiles = new Map([[m.profile.id, m.profile]]);
      schedule(KEY_DEVICE);
      schedule(profileKey(m.profile.id));
      flush();
      return { migrated: true };
    }
    device = emptyDevice(now());
    profiles = new Map();
    return { migrated: false };
  }

  if (typeof addEventListener === 'function') {
    addEventListener('pagehide', flush);
    addEventListener('visibilitychange', () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush();
    });
  }

  return {
    load,
    flush,
    get degraded() { return degraded; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    device: () => device,
    updateDevice(fn) {
      device = { ...fn(device), schema: SCHEMA_VERSION };
      schedule(KEY_DEVICE);
      return device;
    },

    profiles: () => device.order.map(id => profiles.get(id)).filter(Boolean),
    profile: id => profiles.get(id) || null,
    active: () => profiles.get(device.activeId) || null,

    setActive(id) {
      if (!profiles.has(id)) return null;
      device = { ...device, activeId: id };
      schedule(KEY_DEVICE);
      return profiles.get(id);
    },

    addProfile(info) {
      const p = newProfile(info, now());
      profiles.set(p.id, p);
      device = { ...device, order: [...device.order, p.id], activeId: p.id };
      schedule(KEY_DEVICE);
      schedule(profileKey(p.id));
      flush();
      return p;
    },

    removeProfile(id) {
      if (!profiles.has(id)) return;
      profiles.delete(id);
      const order = device.order.filter(x => x !== id);
      device = { ...device, order, activeId: device.activeId === id ? (order[0] ?? null) : device.activeId };
      try { storage.removeItem(profileKey(id)); } catch { /* rien à faire */ }
      schedule(KEY_DEVICE);
      flush();
    },

    /** Le profil est remplacé par ce que renvoie fn (jamais modifié en place). */
    updateProfile(id, fn) {
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

    /** Ajoute les profils d'un fichier ; pour un enfant déjà là, garde la copie la plus avancée. */
    importAll(data) {
      const { device: d, profiles: list } = importBundle(data, now(), limits);
      for (const p of list) {
        const had = profiles.get(p.id);
        profiles.set(p.id, had ? mostAdvanced(had, p) : p);
        if (!device.order.includes(p.id)) device = { ...device, order: [...device.order, p.id] };
        schedule(profileKey(p.id));
      }
      device = {
        ...device,
        voice: device.voice ?? d.voice ?? null,
        classStep: device.classStep ?? d.classStep ?? null,
        activeId: device.activeId ?? list[0]?.id ?? null,
      };
      schedule(KEY_DEVICE);
      flush();
      return list;
    },

    /** Efface TOUT ce que le jeu a enregistré sur cet appareil. */
    wipe() {
      clearTimeout(timer);
      dirty.clear();
      const keys = [];
      try {
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && (k.startsWith(PREFIX) || LEGACY_KEYS.includes(k))) keys.push(k);
        }
        keys.forEach(k => storage.removeItem(k));
      } catch { /* stockage indisponible : la mémoire est remise à zéro quand même */ }
      device = emptyDevice(now());
      profiles = new Map();
    },

    logError(entry) {
      device = { ...device, errors: [...(device.errors || []), entry].slice(-MAX_ERRORS) };
      schedule(KEY_DEVICE);
    },
  };
}
