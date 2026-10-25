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

async function activity(kind) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  // Les vraies activités s’exécutent dans le DOM, sans monter une deuxième leçon.
  await page.route('**/support-harness.html', route => route.fulfill({ contentType: 'text/html',
    body: '<!doctype html><html lang="fr"><meta charset="utf-8"><body><main id="stage"></main></body></html>' }));
  await page.goto(url + 'support-harness.html');
  await page.evaluate(async kind => {
    const { createSupportTrace } = await import('./js/core/support.js');
    const { buildCurriculum } = await import('./js/core/curriculum.js');
    const DATA = await import('./js/data/curriculum.js');
    const { runChoice } = await import('./js/activities/choice.js');
    const { runText } = await import('./js/activities/text.js');
    const { runBuild } = await import('./js/activities/build.js');
    const cur = buildCurriculum(DATA), support = createSupportTrace(); support.reset({ eventId: kind });
    const voice = { seq: () => Promise.resolve(), say: () => Promise.resolve(), sound: () => Promise.resolve(), stop() {} };
    const api = { cur, voice, stage: document.querySelector('#stage'), kaya: document.createElement('div'), rand: () => 0,
      alive: () => true, feedback() {}, waitContinue: () => Promise.resolve(),
      sfx: { correct() {}, wrong() {}, pop() {} },
      noteSupport: type => support.note(type),
      setReplay(fn) { window.__replay = fn; }, setHelp(fn) { window.__help = fn; },
      onAnswer(result) { window.__observation = { ...result, support: support.close() }; },
    };
    const word = cur.word('moto');
    let q;
    if (kind === 'build') {
      const slots = word.parsed.graphemes.map(g => ({ g: g.g, mute: g.mute }));
      window.__letters = slots.filter(s => !s.mute).map(s => s.g);
      q = { kind: 'build', word, slots, tiles: [...window.__letters, 'x'], prompt: ['Écris le mot.'], caption: 'Écris le mot.' };
      window.__activity = runBuild(q, api);
    } else if (kind === 'text') {
      q = { kind: 'adv', type: 'gap', text: 'Le chat ___.', prompt: ['Complète.'], answer: 'dort',
        options: [{ id: 'dort', text: 'dort' }, { id: 'mange', text: 'mange' }] };
      window.__activity = runText(q, api);
    } else {
      q = { kind: 'read', word, answer: 'moto', prompt: ['Lis le mot.'], caption: 'Lis le mot.',
        options: [{ id: 'moto', emoji: '🏍️', say: 'moto' }, { id: 'lune', emoji: '🌙', say: 'lune' }] };
      window.__activity = runChoice(q, api);
    }
  }, kind);
  return { context, page };
}

test('les écoutes optionnelles et la réécoute sont tracées sans transformer une réponse juste en aide', async () => {
  for (const kind of ['read', 'text']) {
    const { context, page } = await activity(kind);
    try {
      await page.getByRole('button', { name: `Écouter : ${kind === 'read' ? 'moto' : 'dort'}`, exact: true }).click();
      await page.evaluate(() => window.__replay());
      await page.locator(`.choice[data-id="${kind === 'read' ? 'moto' : 'dort'}"]`).click();
      const result = await page.evaluate(async () => { await window.__activity; return window.__observation; });
      assert.equal(result.outcome, 'ok');
      assert.deepEqual(result.support.methods, { 'option-audio': 1, 'instruction-replay': 1 });
    } finally { await context.close(); }
  }
});

test('l’aide explicite qui lit le mot garde son résultat guidé et sa nature audio', async () => {
  const { context, page } = await activity('read');
  try {
    await page.evaluate(() => window.__help());
    await page.locator('.choice[data-id="moto"]').click();
    const result = await page.evaluate(async () => { await window.__activity; return window.__observation; });
    assert.equal(result.outcome, 'help');
    assert.deepEqual(result.support.methods, { 'explicit-help': 1, 'text-audio': 1 });
  } finally { await context.close(); }
});

test('le guidage automatique après deux erreurs de construction est observé sans réécrire le résultat', async () => {
  const { context, page } = await activity('build');
  try {
    await page.locator('.gtile[data-g="x"]').click(); await page.locator('.gtile[data-g="x"]').click();
    const letters = await page.evaluate(() => window.__letters);
    for (const letter of letters) await page.locator(`.gtile[data-g="${letter}"]:not(.used)`).first().click();
    const result = await page.evaluate(async () => { await window.__activity; return window.__observation; });
    assert.equal(result.outcome, 'ko', 'les conditions de résultat historiques restent identiques');
    assert.deepEqual(result.support.methods, { 'construction-hint': 1 });
  } finally { await context.close(); }
});
