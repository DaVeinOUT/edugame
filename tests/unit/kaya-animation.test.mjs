import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../js/vendor/three/three.module.js';
import { createKayaAnimator } from '../../js/ui/kaya-animation.js';
function rig() {
  const root = new T.Object3D();
  const clips = [0, 1].map((value, i) => new T.AnimationClip(i ? 'resting' : 'idle', 2,
    [new T.NumberKeyframeTrack('.position[x]', [0, 2], [value, value])]));
  return { root, animator: createKayaAnimator(root, clips) };
}
test('réduire les mouvements pendant un fondu affiche la nouvelle pose fixe', () => {
  const { root, animator } = rig();
  animator.update({ state: 'idle' }, 0, true);
  animator.update({ state: 'resting' }, .01, true);
  animator.update({ state: 'resting' }, .08, true);
  assert.ok(root.position.x > 0 && root.position.x < 1);
  animator.update({ state: 'resting' }, .09, false);
  assert.equal(root.position.x, 1);
  assert.equal(animator.inspect().weights.resting, 1);
  animator.destroy();
});
test('une reprise tardive avance seulement un petit intervalle et les ressources de lecture sont libérées', () => {
  const root = new T.Object3D();
  const animator = createKayaAnimator(root, [new T.AnimationClip('idle', 10,
    [new T.NumberKeyframeTrack('.position[x]', [0, 10], [0, 10])])]);
  animator.update({ state: 'idle' }, 0, true);
  animator.update({ state: 'idle' }, 100, true);
  assert.ok(root.position.x <= .081);
  animator.destroy();
  assert.equal(root.position.x, 0);
});
