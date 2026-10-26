import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

let server, url, browser;
before(async () => {
  ({ server, url } = await startServer());
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); server?.close(); });

test('la bibliothèque des sons embarqués se décode après installation et coupure du réseau', async () => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  try {
    await page.goto(url);
    await page.waitForSelector('.pick');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    const result = await page.evaluate(async () => {
      const { SOUND_FILES } = await import('./js/data/sounds.js');
      const context = new OfflineAudioContext(1, 1, 44100);
      const files = [...new Set(Object.values(SOUND_FILES))];
      const decoded = [];
      for (const file of files) {
        const response = await fetch(`audio/sons/${file}.mp3`);
        if (!response.ok) throw new Error(`${file} : ${response.status}`);
        const audio = await context.decodeAudioData(await response.arrayBuffer());
        decoded.push({ file, duration: audio.duration });
      }
      const range = await fetch('audio/sons/s.mp3', { headers: { Range: 'bytes=0-1' } });
      return { decoded, range: { status: range.status, bytes: (await range.arrayBuffer()).byteLength } };
    });
    assert.ok(result.decoded.length >= 35);
    assert.ok(result.decoded.every(audio => audio.duration > 0 && audio.duration < 3));
    assert.deepEqual(result.range, { status: 206, bytes: 2 });
  } finally { await context.close(); }
});

test('un MP3 manquant conserve le son pur local sous CSP, puis stop coupe audio et bouche', async () => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  try {
    await page.route('**/audio-fallback.html', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
      <html lang="fr"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; media-src 'self' blob:; connect-src 'self'">
      <button type="button">Écouter</button></html>` }));
    await page.route('**/audio/sons/m.mp3', route => route.abort());
    await page.goto(url + 'audio-fallback.html');
    await page.evaluate(async () => {
      const { voice } = await import('./js/services/voice.js');
      const { SOUND_FILES } = await import('./js/data/sounds.js');
      window.__voice = voice; window.__played = []; window.__playback = []; window.__spoken = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return play.call(this); };
      if (window.speechSynthesis) {
        const speak = speechSynthesis.speak.bind(speechSynthesis);
        speechSynthesis.speak = utterance => { window.__spoken.push(utterance.text); return speak(utterance); };
      }
      voice.setSoundFiles(SOUND_FILES);
      voice.onPlayback(value => window.__playback.push(value));
      document.querySelector('button').addEventListener('click', () => { window.__done = voice.sound('m'); });
    });
    await page.getByRole('button', { name: 'Écouter', exact: true }).click();
    await page.waitForFunction(() => window.__playback.includes(true));
    const result = await page.evaluate(async () => {
      window.__voice.stop();
      await window.__done;
      return { played: window.__played, playback: window.__playback, spoken: window.__spoken };
    });
    assert.ok(result.played.some(src => src.endsWith('/audio/sons/m.mp3')));
    assert.ok(result.played.some(src => src.startsWith('blob:')), 'le WAV local remplace le MP3 indisponible');
    assert.ok(result.playback.includes(true), 'la bouche démarre sur une vraie lecture audio');
    assert.equal(result.playback.at(-1), false);
    assert.deepEqual(result.spoken, [], 'aucune synthèse vocale ne se superpose au son pur');
  } finally { await context.close(); }
});
