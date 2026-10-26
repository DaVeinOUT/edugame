/* Rig playback adapts controller states to authored clips, independently of WebGL. */
import * as T from '../vendor/three/three.module.js';
const ONCE = new Set(['greeting', 'celebrating', 'encouraging']);
export function createKayaAnimator(root, clips) {
  const mixer = new T.AnimationMixer(root);
  const actions = new Map(clips.map(clip => [clip.name, mixer.clipAction(clip)]));
  const mouths = []; root.traverse(obj => {
    const index = obj.morphTargetDictionary?.Talk;
    if (index !== undefined) mouths.push([obj, index]);
  });
  let active = null, name = '', lastTime = null, transition = null;
  const weightOf = action => action.enabled && action.isScheduled() ? action.getEffectiveWeight() : 0;
  return {
    update(snapshot, seconds, motion) {
      const wanted = actions.has(snapshot.state) ? snapshot.state : 'idle';
      const next = actions.get(wanted);
      if (!next) throw new Error('Kaya idle clip missing');
      if (next !== active) {
        const previous = active;
        const from = new Map([...actions.values()].map(action => [action, weightOf(action)]));
        // Keep the time of a clip already contributing to an interrupted blend.
        if (!from.get(next)) next.reset();
        next.enabled = true; next.setEffectiveTimeScale(1);
        next.setLoop(ONCE.has(wanted) ? T.LoopOnce : T.LoopRepeat, Infinity);
        next.clampWhenFinished = ONCE.has(wanted); next.play();
        for (const action of actions.values()) { action.stopFading(); action.stopWarping(); }
        if (previous && motion) transition = { from, elapsed: 0 };
        else {
          transition = null;
          for (const action of actions.values()) if (action !== next) action.stop();
          next.setEffectiveWeight(1);
        }
        active = next; name = wanted;
      }
      const dt = lastTime === null ? 0 : Math.max(0, Math.min(.08, seconds - lastTime));
      lastTime = seconds;
      if (motion) {
        if (transition) {
          transition.elapsed += dt;
          const t = Math.min(1, transition.elapsed / .28);
          const eased = t * t * (3 - 2 * t);
          for (const action of actions.values()) {
            action.setEffectiveWeight((transition.from.get(action) || 0) * (1 - eased) + (action === active ? eased : 0));
            if (t === 1 && action !== active) action.stop();
          }
          if (t === 1) transition = null;
        }
        active.paused = false; mixer.update(dt);
      }
      else {
        transition = null;
        for (const action of actions.values()) if (action !== active) action.stop();
        active.stopFading(); active.stopWarping(); active.enabled = true;
        active.setEffectiveWeight(1); active.paused = false; active.time = 0;
        mixer.update(0);
      }
      if (motion && snapshot.speaking) {
        for (const [mesh, index] of mouths) mesh.morphTargetInfluences[index] = .2 + .18 * Math.sin(seconds * 19);
      }
      return name;
    },
    inspect() {
      const bones = {}, morphs = {};
      root.traverse(obj => {
        if (obj.isBone) bones[obj.name] = obj.quaternion.toArray();
        if (obj.morphTargetDictionary) morphs[obj.name] = Object.fromEntries(Object.entries(obj.morphTargetDictionary)
          .map(([key, index]) => [key, obj.morphTargetInfluences[index]]));
      });
      return { clip: name, weights: Object.fromEntries([...actions].map(([key, action]) =>
        [key, action.enabled && action.isScheduled() ? action.getEffectiveWeight() : 0])), bones, morphs };
    },
    destroy() { mixer.stopAllAction(); mixer.uncacheRoot(root); },
  };
}
