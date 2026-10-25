/* Deterministic companion behaviour. Rendering and speech never decide progress. */
export const COMPANION_STATES = Object.freeze(['idle', 'greeting', 'attentive', 'speaking', 'helping', 'celebrating', 'resting', 'paused', 'hidden']);
const DURATIONS = { greeting: 1800, helping: 4500, celebrating: 1400, encourage: 1400 };

export function createCompanion({ quiet = false, now = 0 } = {}) {
  let base = quiet ? 'attentive' : 'idle';
  let reaction = null;
  let until = 0;
  let speaking = false;
  let paused = false;
  let hidden = false;
  let last = now;
  let activeAt = now;
  let revision = 0;
  const snapshot = () => ({
    state: hidden ? 'hidden' : paused ? 'paused' : reaction || (speaking ? 'speaking' : base),
    speaking: speaking && !paused && !hidden, quiet, hidden, paused, until, revision,
  });
  const expire = at => {
    if (reaction && at >= until) { reaction = null; until = 0; revision++; }
    if (!quiet && !speaking && !reaction && base === 'idle' && at - activeAt >= 45000) { base = 'resting'; revision++; }
  };
  return {
    get(at = last) { last = Math.max(last, at); expire(last); return snapshot(); },
    send(event, at = last, duration) {
      last = Math.max(last, at);
      expire(last);
      revision++;
      if (event === 'navigation') { speaking = false; reaction = null; until = 0; paused = true; return snapshot(); }
      if (event === 'hide') { hidden = true; speaking = false; reaction = null; until = 0; return snapshot(); }
      if (event === 'show') { hidden = false; base = quiet ? 'attentive' : 'idle'; activeAt = last; }
      if (event === 'pause') { paused = true; speaking = false; reaction = null; until = 0; return snapshot(); }
      if (event === 'resume') { paused = false; return snapshot(); }
      if (event === 'speech-end') { speaking = false; return snapshot(); }
      if (paused || hidden) return snapshot();
      if (event === 'speech-start') { speaking = base !== 'resting'; return snapshot(); }
      if (event === 'rest') { base = 'resting'; speaking = false; reaction = null; until = 0; return snapshot(); }
      if (event === 'wake' || event === 'attentive') { base = event === 'attentive' || quiet ? 'attentive' : 'idle'; activeAt = last; reaction = null; until = 0; }
      const next = { greeting: 'greeting', help: 'helping', success: 'celebrating', encourage: 'attentive' }[event];
      if (next && base !== 'resting') {
        activeAt = last;
        // An evaluated answer cannot interrupt help, nor queue a delayed celebration.
        if (reaction === 'helping' && next === 'celebrating') return snapshot();
        reaction = next;
        until = last + Math.min(6000, Math.max(100, duration ?? DURATIONS[next] ?? DURATIONS[event]));
      }
      return snapshot();
    },
  };
}
