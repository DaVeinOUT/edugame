/* Observations d’aides, indépendantes des scores et des acquis.
   Seules les réponses instrumentées sont décrites. Le journal est borné ;
   l’absence d’un ancien relevé ne prouve jamais une lecture autonome. */
export const SUPPORT_VERSION = 1;
export const SUPPORT_LIMIT = 128;
export const SUPPORT_TYPES = Object.freeze([
  'instruction-replay', 'option-audio', 'explicit-help',
  'construction-hint', 'text-audio', 'screen-reader',
]);
const typeSet = new Set(SUPPORT_TYPES);
const outcomes = new Set(['ok', 'ko', 'help']);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const clean = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').slice(0, max) : '';
const amount = value => Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : 0;

export function supportMethods(raw) {
  if (!object(raw)) return {};
  return Object.fromEntries(SUPPORT_TYPES.map(type => [type, amount(raw[type])]).filter(([, count]) => count > 0));
}

/** Un relevé par question ; close ignore les clics tardifs et reset recommence. */
export function createSupportTrace() {
  let eventId = '', methods = {}, closed = false;
  const snapshot = () => ({ version: SUPPORT_VERSION, eventId, methods: { ...methods } });
  return {
    reset({ eventId: id = '', screenReader = false } = {}) {
      eventId = clean(id, 200); methods = screenReader ? { 'screen-reader': 1 } : {}; closed = false;
      return snapshot();
    },
    note(type) {
      if (closed || !typeSet.has(type)) return false;
      methods[type] = Math.min(100, (methods[type] || 0) + 1);
      return true;
    },
    snapshot,
    close() { closed = true; return snapshot(); },
  };
}

function observation(raw) {
  if (!object(raw) || !outcomes.has(raw.outcome)) return null;
  const id = clean(raw.id, 200), key = clean(raw.key, 200);
  if (!id || !key || !Number.isFinite(raw.t) || raw.t < 0 || raw.t > 8.64e15 || !object(raw.methods)) return null;
  return { id, t: Math.floor(raw.t), key, kind: clean(raw.kind, 60), outcome: raw.outcome, methods: supportMethods(raw.methods) };
}

export function sanitizeSupport(raw) {
  const recent = object(raw) && raw.version === SUPPORT_VERSION && Array.isArray(raw.recent)
    ? raw.recent.slice(-SUPPORT_LIMIT * 4).map(observation).filter(Boolean) : [];
  const unique = new Map();
  for (const entry of recent) if (!unique.has(entry.id) || unique.get(entry.id).t <= entry.t) unique.set(entry.id, entry);
  return { version: SUPPORT_VERSION, recent: [...unique.values()].sort((a, b) => a.t - b.t || a.id.localeCompare(b.id)).slice(-SUPPORT_LIMIT) };
}

/** Une copie partagée d’une réponse ne compte qu’une fois à l’import. */
export function mergeSupport(a, b) {
  return sanitizeSupport({ version: SUPPORT_VERSION, recent: [...sanitizeSupport(a).recent, ...sanitizeSupport(b).recent] });
}

/** N’ajoute rien pour un ancien appelant sans métadonnées explicites. */
export function recordSupport(profile, question, result, now) {
  const trace = result?.support;
  if (!object(trace) || trace.version !== SUPPORT_VERSION || !object(trace.methods) || !outcomes.has(result.outcome)) return sanitizeSupport(profile.support);
  const key = clean(question.key, 200);
  if (!key) return sanitizeSupport(profile.support);
  const entry = {
    id: clean(trace.eventId, 200) || `${profile.id}:${now}:${profile.stats.answers + 1}`,
    t: now, key, kind: question.kind === 'adv' ? `adv:${question.type || ''}` : question.kind || '',
    outcome: result.outcome, methods: supportMethods(trace.methods),
  };
  return mergeSupport(profile.support, { version: SUPPORT_VERSION, recent: [entry] });
}

/** Les catégories décrivent uniquement les dernières réponses documentées. */
export function supportSummary(profile) {
  const recent = sanitizeSupport(profile?.support).recent;
  const total = Number.isFinite(profile?.stats?.answers) ? Math.max(0, Math.floor(profile.stats.answers)) : 0;
  const summary = { documented: recent.length, total, notDetailed: Math.max(0, total - recent.length),
    counterMismatch: recent.length > total, limit: SUPPORT_LIMIT, withoutSupport: 0, replayOnly: 0, audio: 0, guided: 0, incorrect: 0,
    methods: Object.fromEntries(SUPPORT_TYPES.map(type => [type, 0])) };
  for (const entry of recent) {
    const used = entry.methods;
    for (const type of SUPPORT_TYPES) summary.methods[type] += used[type] || 0;
    if (entry.outcome === 'ko') summary.incorrect++;
    else if (entry.outcome === 'help' || used['explicit-help'] || used['construction-hint']) summary.guided++;
    else if (used['option-audio'] || used['text-audio'] || used['screen-reader']) summary.audio++;
    else if (used['instruction-replay']) summary.replayOnly++;
    else summary.withoutSupport++;
  }
  return summary;
}
