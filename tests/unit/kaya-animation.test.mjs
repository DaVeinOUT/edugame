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

test('une transition interrompue conserve la pose et des poids normalisés, même au retour vers un clip en cours', () => {
  const root = new T.Object3D();
  const animator = createKayaAnimator(root, ['idle', 'greeting', 'resting'].map((name, i) => new T.AnimationClip(name, 2,
    [new T.NumberKeyframeTrack('.position[x]', [0, 2], [i, i])])));
  const step = (state, time) => {
    animator.update({ state }, time, true);
    const total = Object.values(animator.inspect().weights).reduce((sum, weight) => sum + weight, 0);
    assert.ok(Math.abs(total - 1) < .00001, 'la somme des contributions reste égale à un');
  };
  step('idle', 0); step('greeting', .08); step('greeting', .16);
  const before = root.position.x;
  step('resting', .16);
  assert.ok(Math.abs(root.position.x - before) < .00001, 'changer de cible ne saute pas à une autre pose');
  step('resting', .24);
  const interrupted = root.position.x;
  step('greeting', .24);
  assert.ok(Math.abs(root.position.x - interrupted) < .00001);
  for (const time of [.32, .40, .48, .56]) step('greeting', time);
  assert.equal(root.position.x, 1); animator.destroy();
});
