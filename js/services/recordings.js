/* ============================================================
   SERVICES/RECORDINGS.JS — Les sons enregistrés par l'adulte
   Une maîtresse sait dire « mmm » sans voyelle : elle peut enregistrer
   les sons purs une fois, au micro, et Kaya les utilisera pour tous
   les enfants de la tablette. Stockés dans le navigateur (IndexedDB),
   jamais envoyés nulle part.
   ============================================================ */

const DB_NAME = 'educa-audio';
const STORE = 'sounds';
const MAX_MS = 2500;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
    t.onerror = () => { db.close(); reject(t.error); };
  }));
}

/** Le navigateur sait-il enregistrer et garder des sons ? */
export function recordingSupported() {
  return typeof indexedDB !== 'undefined' && typeof MediaRecorder !== 'undefined'
    && !!globalThis.navigator?.mediaDevices?.getUserMedia;
}

/** Tous les sons enregistrés : Map phonème → URL lisible par <audio>. */
export async function loadRecordings() {
  if (typeof indexedDB === 'undefined') return new Map();
  const map = new Map();
  await openDb().then(db => new Promise(resolve => {
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (!c) return;
      if (c.value?.blob) map.set(String(c.key), URL.createObjectURL(c.value.blob));
      c.continue();
    };
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); resolve(); };
  }));
  return map;
}

export function saveRecording(ph, blob) {
  return tx('readwrite', store => store.put({ blob, at: Date.now() }, ph));
}

export function deleteRecording(ph) {
  return tx('readwrite', store => store.delete(ph));
}

export function clearRecordings() {
  return tx('readwrite', store => store.clear());
}

/**
 * Enregistre au micro (arrêt automatique après 2,5 s, ou appel de stop()).
 * @returns {Promise<{ stop: () => void, done: Promise<Blob> }>}
 */
export async function startRecording(maxMs = MAX_MS) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
  const done = new Promise(resolve => {
    rec.onstop = () => {
      stream.getTracks().forEach(tr => tr.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }));
    };
  });
  rec.start();
  const timer = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, maxMs);
  return {
    stop() { clearTimeout(timer); if (rec.state === 'recording') rec.stop(); },
    done,
  };
}
