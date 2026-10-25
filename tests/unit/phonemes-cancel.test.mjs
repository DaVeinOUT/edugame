import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { playPhoneme } from '../../js/services/phonemes.js';

function context() {
  const gains = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const node = () => ({ connected: false, connect() { this.connected = true; }, disconnect() { this.connected = false; } });
  return {
    gains, currentTime: 0, destination: {},
    createGain() { const value = { ...node(), gain: param() }; gains.push(value); return value; },
    createOscillator() { return { ...node(), frequency: param(), setPeriodicWave() {}, start() {}, stop() {} }; },
    createPeriodicWave() { return {}; },
    createBiquadFilter() { return { ...node(), frequency: param(), Q: param(), gain: param() }; },
  };
}

test('quitter pendant un phonème coupe la sortie et résout aussitôt l’attente', async () => {
  const ctx = context();
  const controller = new AbortController();
  let settled = false;
  const done = playPhoneme(ctx, 'm', { signal: controller.signal }).then(() => { settled = true; });
  assert.equal(ctx.gains[0].connected, true);
  controller.abort();
  await new Promise(setImmediate);
  assert.equal(ctx.gains[0].connected, false, 'aucun son ne reste connecté à la sortie');
  assert.equal(settled, true, 'une séquence annulée ne doit pas attendre sa durée audio');
  await done;
});

test('un signal déjà annulé ne crée aucun graphe audio', async () => {
  const ctx = context();
  const controller = new AbortController();
  controller.abort();
  await playPhoneme(ctx, 'm', { signal: controller.signal });
  assert.equal(ctx.gains.length, 0);
});


test('la fin naturelle nettoie la sortie et son écouteur d’annulation', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const ctx = context();
  const controller = new AbortController();
  const done = playPhoneme(ctx, 'm', { signal: controller.signal });
  assert.equal(getEventListeners(controller.signal, 'abort').length, 1);
  t.mock.timers.tick(1000);
  await done;
  assert.equal(ctx.gains[0].connected, false);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  controller.abort();
});

test('une erreur de synthèse libère aussi la sortie et son écouteur', async () => {
  const ctx = context();
  ctx.createPeriodicWave = () => { throw new Error('audio indisponible'); };
  const controller = new AbortController();
  await assert.rejects(playPhoneme(ctx, 'm', { signal: controller.signal }), /indisponible/);
  assert.equal(ctx.gains[0].connected, false);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});
