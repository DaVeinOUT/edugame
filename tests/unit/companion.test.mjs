import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanion } from '../../js/core/companion.js';

test('greeting is bounded and does not repeat itself', () => {
  const c = createCompanion();
  assert.equal(c.send('greeting', 10).state, 'greeting');
  assert.equal(c.get(1810).state, 'idle');
  assert.equal(c.get(2000).state, 'idle');
});
test('real playback and gestures remain independent, help takes priority over success', () => {
  const c = createCompanion({ quiet: true });
  c.send('success', 0);
  assert.equal(c.send('speech-start', 20).state, 'celebrating');
  assert.equal(c.get().speaking, true);
  assert.equal(c.send('help', 30).state, 'helping');
  assert.equal(c.send('success', 40).state, 'helping');
  assert.equal(c.send('speech-end', 1500).state, 'helping');
  assert.equal(c.get(4530).state, 'attentive');
});
test('navigation cancels speech and reactions, resume never resurrects them', () => {
  const c = createCompanion();
  c.send('success', 0); c.send('speech-start', 10);
  assert.equal(c.send('navigation', 20).state, 'paused');
  assert.equal(c.send('success', 30).state, 'paused');
  assert.equal(c.send('resume', 40).state, 'idle');
  assert.equal(c.get().speaking, false);
});
test('rest and hiding are optional and carry no negative reaction', () => {
  const c = createCompanion();
  assert.equal(c.get(45000).state, 'resting');
  assert.equal(c.send('speech-start', 45001).speaking, false);
  assert.equal(c.send('help', 45002).state, 'resting');
  assert.equal(c.send('wake', 45003).state, 'idle');
  assert.equal(c.send('hide', 45004).state, 'hidden');
  assert.equal(c.send('greeting', 45005).state, 'hidden');
  assert.equal(c.send('show', 45006).state, 'idle');
});
test('quiet exercise stays attentive during inactivity and ignores stale clocks', () => {
  const c = createCompanion({ quiet: true });
  assert.equal(c.get(90000).state, 'attentive');
  c.send('success', 90010, 400);
  assert.equal(c.get(90410).state, 'attentive');
  assert.equal(c.get(100).state, 'attentive');
});
