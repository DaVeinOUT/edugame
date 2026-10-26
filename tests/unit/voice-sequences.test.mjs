import { test } from 'node:test';
import assert from 'node:assert/strict';

let serial = 0;
async function harness(t, { failFiles = false, remoteOnly = false } = {}) {
  const spoken = [], played = [], playback = [];
  const local = { name: 'Audrey', lang: 'fr-FR', localService: true };
  const remote = { name: 'Google français', lang: 'fr-FR', localService: false };
  let player;
  globalThis.speechSynthesis = {
    getVoices: () => remoteOnly ? [remote] : [remote, local], cancel() {},
    speak(utterance) {
      spoken.push({ text: utterance.text, voice: utterance.voice });
      queueMicrotask(() => { utterance.onstart?.(); utterance.onend?.(); });
    },
  };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.Audio = class {
    constructor() { this.src = ''; player = this; }
    play() {
      played.push(this.src);
      if (failFiles) return Promise.reject(new Error('fichier indisponible'));
      queueMicrotask(() => this.onplaying?.());
      return Promise.resolve();
    }
    pause() {}
  };
  const { voice } = await import(`../../js/services/voice.js?sequences-${serial++}`);
  voice.configure({ preferred: remote.name }); // préférence distante ancienne
  voice.setSoundFiles({ m: 'm', s: 's', a: 'a' });
  voice.setWordFiles({ moto: 'moto' });
  const off = voice.onPlayback(value => playback.push(value));
  t.after(() => {
    voice.stop(); off();
    delete globalThis.Audio; delete globalThis.speechSynthesis; delete globalThis.SpeechSynthesisUtterance;
  });
  return { voice, spoken, played, playback, local, get player() { return player; } };
}
const settle = () => new Promise(setImmediate);

test('remplacer un fichier sans nouvelle génération est une annulation, jamais une erreur de synthèse', async t => {
  const h = await harness(t);
  const first = h.voice.say('moto', { interrupt: false, slowWord: true });
  await settle();
  const second = h.voice.say('moto', { interrupt: false, slowWord: true });
  await settle();
  assert.deepEqual(h.spoken, [], 'aucune synthèse par-dessus le fichier qui le remplace');
  assert.equal(h.played.length, 2);
  h.player.onended();
  await Promise.all([first, second]);
  assert.equal(h.playback.at(-1), false);
});

test('un son demandé pendant une séquence coupe ses mots suivants et la précédente bouche', async t => {
  const h = await harness(t);
  const sequence = h.voice.seq([{ sound: 'm' }, { word: 'moto' }, 'Fin.']);
  await settle();
  const firstPlaying = h.player.onplaying;
  const replacement = h.voice.sound('s');
  await settle();
  firstPlaying(); // événement tardif de la lecture annulée
  assert.deepEqual(h.played, ['audio/sons/m.mp3', 'audio/sons/s.mp3']);
  assert.deepEqual(h.spoken, [], 'ni ancien secours ni fin de consigne après interruption');
  assert.equal(h.playback.at(-1), true);
  h.player.onended();
  await Promise.all([sequence, replacement]);
  assert.equal(h.playback.at(-1), false);
});

test('un MP3 absent utilise seulement la voix locale de secours et synchronise la bouche', async t => {
  const h = await harness(t, { failFiles: true });
  await h.voice.sound('a');
  assert.deepEqual(h.played, ['audio/sons/a.mp3']);
  assert.deepEqual(h.spoken, [{ text: 'a', voice: h.local }]);
  assert.ok(h.playback.includes(true));
  assert.equal(h.playback.at(-1), false);
});

test('un fichier absent et une préférence distante ne déclenchent jamais de voix distante', async t => {
  const h = await harness(t, { failFiles: true, remoteOnly: true });
  await h.voice.sound('a');
  assert.equal(h.voice.current(), null);
  assert.deepEqual(h.spoken, []);
  assert.ok(!h.playback.includes(true), 'pas de mouvement de bouche sans lecture');
});

test('le mode silencieux et le lecteur d’écran ne lancent aucun MP3 ni synthèse', async t => {
  const h = await harness(t);
  h.voice.configure({ muted: true });
  await h.voice.sound('m');
  h.voice.configure({ muted: false, screenReader: true });
  await h.voice.sound('s');
  assert.deepEqual(h.played, []);
  assert.deepEqual(h.spoken, []);
});
