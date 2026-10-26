/* Check the assembled application, with a fictional profile and local browsers.
   Run after release, with an optional frozen hash in EDUCA_EXPECTED_KAYA_SHA256.
   CHROMIUM_PATH may point to a local Chromium/Brave executable. No install. */
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright-core';
import { startServer } from '../../tests/e2e/server.mjs';
import { SOUND_FILES } from '../../js/data/sounds.js';
import { CARD_ART } from '../../js/data/card-art.js';

const root = fileURLToPath(new URL('../..', import.meta.url));
const out = resolve(process.argv[2] || join(root, 'docs/verification/2026-10-26/kaya-v2/compatibility'));
const modelPath = 'assets/kaya/kaya-production-v2.glb';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = path => access(path).then(() => true, () => false);
const report = { modelPath, startedAt: new Date().toISOString(), engines: [],
  limits: 'Desktop headless engines and a 390×844 viewport. No physical phone/tablet, energy measurement or human audio validation.' };

await mkdir(out, { recursive: true });
function command(args, file) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  return writeFile(join(out, file), `${result.stdout || ''}${result.stderr || ''}`).then(() => {
    assert.equal(result.status, 0, `${args.join(' ')} failed; see ${file}`);
  });
}
async function filesIn(base, prefix = '') {
  const entries = await readdir(join(base, prefix), { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(base, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]));
  return nested.flat();
}

async function rendered(page) {
  await page.waitForSelector('.kaya[data-renderer="3d"] canvas[data-model="gltf"]', { timeout: 20000 });
  return page.evaluate(async () => {
    const { companionEvent } = await import('./js/ui/kaya.js');
    const element = document.querySelector('[data-kaya-companion]');
    // A synchronous redraw makes readPixels reliable without preserving a costly framebuffer.
    companionEvent(element, 'attentive');
    const canvas = element.querySelector('canvas'), gl = canvas.getContext('webgl2');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const pixel = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return { renderer: element.dataset.renderer, dataset: { ...canvas.dataset },
      webgl: gl.getParameter(gl.VERSION),
      driver: info ? { vendor: gl.getParameter(info.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL) }
        : { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER), unmaskedUnavailable: true },
      pixel: [...pixel], rig: canvas._kayaInspect(),
      trigger: 'technical attentive refresh for pixel read; no evaluated answer' };
  });
}

async function checkEngine(name, engine, siteUrl, expectedHash) {
  const executable = name === 'chromium' && process.env.CHROMIUM_PATH ? process.env.CHROMIUM_PATH : engine.executablePath();
  if (!await exists(executable)) return { name, status: 'unavailable', executable, reason: 'Local executable absent; nothing installed.' };
  const evidence = { name, executable, status: 'running', pageErrors: [], consoleErrors: [], receivedModels: [] };
  let browser, context, phase = 'bootstrap';
  const receipts = [];
  try {
    browser = await engine.launch(name === 'chromium'
      ? { executablePath: executable, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }
      : { executablePath: executable });
    evidence.version = await browser.version();
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
    const page = await context.newPage();
    page.on('pageerror', error => evidence.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); });
    page.on('response', response => {
      if (!new URL(response.url()).pathname.endsWith('.glb')) return;
      const stage = phase;
      receipts.push(response.body().then(bytes => ({ phase: stage, url: response.url(), status: response.status(),
        bytes: bytes.length, sha256: hash(bytes), fromServiceWorker: response.fromServiceWorker() }))
        .catch(error => ({ phase: stage, url: response.url(), error: error.message })));
    });
    await page.goto(siteUrl); await page.waitForSelector('.pick');
    await page.evaluate(async () => {
      const { newProfile, emptyDevice } = await import('./js/core/schema.js');
      const p = { ...newProfile({ name: 'Profil de contrôle', avatar: '🦊' }), id: 'pcompatv2' };
      p.comfort.screenReader = true;
      p.cards = ['son-m', 'r_first'];
      localStorage.setItem('educa2:device', JSON.stringify({ ...emptyDevice(), order: [p.id], activeId: p.id, muted: false }));
      localStorage.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
    });
    phase = 'online-hub';
    await page.reload(); await page.waitForSelector('.btn-play');
    evidence.hub = await rendered(page);
    if (name === 'chromium') assert.match(evidence.hub.driver.renderer, /SwiftShader/i, 'software driver must be measured, not inferred from headless');
    assert.ok(evidence.hub.pixel[3] > 0, `${name}: no rendered mesh pixel`);
    assert.ok(Number(evidence.hub.dataset.triangles) > 10000);
    await page.screenshot({ path: join(out, `${name}-hub.png`), fullPage: true });

    phase = 'online-lesson';
    await page.click('.btn-play'); await page.click('text=C\'est parti');
    await page.waitForSelector('.choice:not([disabled])');
    evidence.lesson = await rendered(page);
    evidence.lesson.overlap = await page.evaluate(() => {
      const kaya = document.querySelector('.lesson-top .kaya').getBoundingClientRect();
      const stage = document.querySelector('.stage').getBoundingClientRect();
      return kaya.bottom > stage.top;
    });
    assert.equal(evidence.lesson.overlap, false);
    await page.locator('.choice:not([disabled])').first().click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('educa2:p:pcompatv2'))?.stats.answers === 1);
    evidence.answers = await page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:pcompatv2')).stats.answers);
    await page.screenshot({ path: join(out, `${name}-lesson.png`), fullPage: true });
    await page.getByRole('button', { name: 'Arrêter', exact: true }).click();
    await page.waitForSelector('.btn-play');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    evidence.downloadComplete = await page.evaluate(async () => {
      const { createOfflineStatus } = await import('./js/services/offline.js');
      return createOfflineStatus().check();
    });
    assert.equal(evidence.downloadComplete, true);

    await context.setOffline(true); phase = 'offline-hub';
    await page.reload(); await page.waitForSelector('.btn-play');
    evidence.offlineHub = await rendered(page);
    assert.ok(evidence.offlineHub.pixel[3] > 0);
    phase = 'offline-model-verification';
    evidence.offlineAsset = await page.evaluate(async modelPath => {
      const response = await fetch(modelPath), buffer = await response.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return { status: response.status, bytes: buffer.byteLength,
        sha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') };
    }, modelPath);
    assert.equal(evidence.offlineAsset.sha256, expectedHash);

    phase = 'offline-card';
    await page.click('.tile:has-text("Mes cartes")');
    evidence.cards = [];
    for (const title of ['Le son m', 'Première leçon']) {
      await page.getByRole('button', { name: title, exact: true }).click();
      await page.$eval('.card-front img', image => image.decode());
      await page.getByRole('button', { name: 'Retourner la carte', exact: true }).click();
      await page.getByRole('button', { name: 'Continuer', exact: true }).waitFor();
      evidence.cards.push(await page.$eval('.card-front img', image => ({ src: image.getAttribute('src'), naturalWidth: image.naturalWidth })));
      if (evidence.cards.length === 1) {
        await page.waitForTimeout(800); // completion of the existing 0.7 s card turn
        await page.screenshot({ path: join(out, `${name}-offline-card.png`) });
      }
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    }
    phase = 'offline-audio';
    evidence.audio = await page.evaluate(async () => {
      const { SOUND_FILES } = await import('./js/data/sounds.js');
      const Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
      const decoder = new Offline(1, 1, 44100), files = [...new Set(Object.values(SOUND_FILES))], decoded = [];
      for (const file of files) {
        const response = await fetch(`audio/sons/${file}.mp3`);
        if (!response.ok) throw new Error(`${file}: ${response.status}`);
        const buffer = await decoder.decodeAudioData(await response.arrayBuffer());
        decoded.push({ file, seconds: buffer.duration });
      }
      const range = await fetch('audio/sons/s.mp3', { headers: { Range: 'bytes=0-1' } });
      return { decoded, range: { status: range.status, bytes: (await range.arrayBuffer()).byteLength } };
    });
    assert.equal(evidence.audio.decoded.length, 35);
    assert.ok(evidence.audio.decoded.every(audio => audio.seconds > 0 && audio.seconds < 3));
    assert.deepEqual(evidence.audio.range, { status: 206, bytes: 2 });
    evidence.receivedModels = await Promise.all(receipts);
    assert.ok(evidence.receivedModels.some(receipt => receipt.phase === 'online-hub'));
    assert.ok(evidence.receivedModels.some(receipt => receipt.phase === 'offline-hub'));
    for (const receipt of evidence.receivedModels) {
      assert.equal(receipt.error, undefined);
      assert.equal(receipt.status, 200);
      assert.ok(new URL(receipt.url).pathname.endsWith(`/${modelPath}`));
      assert.equal(receipt.sha256, expectedHash, `${name}: actual runtime response does not match the frozen model`);
    }
    assert.deepEqual(evidence.pageErrors, []);
    evidence.status = 'passed';
  } catch (error) {
    evidence.status = 'failed'; evidence.failure = { message: error.message, stack: error.stack, phase };
    evidence.receivedModels = await Promise.all(receipts);
  } finally { await context?.close(); await browser?.close(); }
  return evidence;
}

let server;
try {
  await command(['scripts/release.mjs', '--check'], 'release-before.log');
  const sourceModel = await readFile(join(root, modelPath));
  report.sourceHash = hash(sourceModel); report.modelBytes = sourceModel.length;
  if (process.env.EDUCA_EXPECTED_KAYA_SHA256) assert.equal(report.sourceHash, process.env.EDUCA_EXPECTED_KAYA_SHA256);
  const site = await mkdtemp(join(tmpdir(), 'educa-built-runtime-')); report.assembledSite = site;
  await command(['scripts/build-site.mjs', site], 'build.log');
  const files = await filesIn(site);
  for (const path of ['docs', '.agents', '.codex', 'scripts', 'tests']) assert.equal(await exists(join(site, path)), false);
  assert.ok(!files.some(file => /\.blend\d?$/.test(file)));
  assert.deepEqual(files.filter(file => file.endsWith('.glb')), [modelPath]);
  const required = [modelPath, ...Object.values(CARD_ART).flatMap(art => [art.image, art.thumbnail]),
    ...[...new Set(Object.values(SOUND_FILES))].map(file => `audio/sons/${file}.mp3`)];
  report.assembledAssets = [];
  for (const path of required) {
    const bytes = await readFile(join(site, path));
    assert.equal(hash(bytes), hash(await readFile(join(root, path))), `${path}: assembled bytes differ`);
    report.assembledAssets.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  }
  report.packaging = { docsExcluded: true, editableSourcesExcluded: true, archivedModelsExcluded: true,
    cards: 4, soundFiles: 35, servedFiles: files.length };
  const running = await startServer(site); server = running.server;
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    report.engines.push(await checkEngine(name, engine, running.url, report.sourceHash));
    console.log(`${name}: ${report.engines.at(-1).status}`);
  }
  assert.equal(hash(await readFile(join(root, modelPath))), report.sourceHash, 'source asset moved during verification');
  await command(['scripts/release.mjs', '--check'], 'release-after.log');
} catch (error) { report.failure = { message: error.message, stack: error.stack }; }
finally {
  server?.close(); report.finishedAt = new Date().toISOString();
  report.complete = !report.failure && report.engines.length === 2 && report.engines.every(engine => engine.status === 'passed');
  await writeFile(join(out, 'proof.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (!report.complete) { console.error(JSON.stringify(report.failure || report.engines.filter(engine => engine.status !== 'passed'))); process.exitCode = 1; }
else console.log(`Assembled application verified: ${out}`);
