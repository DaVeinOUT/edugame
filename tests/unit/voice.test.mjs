import { test } from 'node:test';
import assert from 'node:assert/strict';

test('une ancienne préférence distante ne contourne jamais la voix locale', async () => {
  const remote = { name: 'Google français', lang: 'fr-FR', localService: false };
  const local = { name: 'Audrey', lang: 'fr-FR', localService: true };
  let voices = [remote, local];
  globalThis.speechSynthesis = { getVoices: () => voices, cancel() {} };
  const { voice } = await import('../../js/services/voice.js?local-policy');
  voice.configure({ preferred: remote.name });
  assert.equal(voice.current(), local.name);
  assert.deepEqual(voice.choices(), [local]);
  voices = [remote];
  voice.configure({ preferred: remote.name });
  assert.equal(voice.current(), null);
  assert.equal(voice.status, 'novoice');
  voices = [];
  voice.configure({ preferred: null });
  assert.equal(voice.current(), null, 'aucune ancienne voix ne subsiste');
  delete globalThis.speechSynthesis;
});

test('la bouche suit la lecture effective et s’arrête avec la voix', async () => {
  const local = { name: 'Audrey', lang: 'fr-FR', localService: true };
  let utterance;
  globalThis.speechSynthesis = { getVoices: () => [local], cancel() {}, speak(u) { utterance = u; } };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const { voice } = await import('../../js/services/voice.js?playback');
  voice.configure({ preferred: local.name });
  const states = [];
  const off = voice.onPlayback(v => states.push(v));
  const pending = voice.say('Bonjour', { interrupt: false });
  assert.ok(!states.includes(true), 'un sous-titre seul ne fait pas parler Kaya');
  utterance.onstart();
  assert.equal(states.at(-1), true);
  voice.stop();
  await pending;
  assert.equal(states.at(-1), false);
  utterance.onstart();
  assert.equal(states.at(-1), false, 'un démarrage tardif est ignoré');
  off();
  delete globalThis.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
});
