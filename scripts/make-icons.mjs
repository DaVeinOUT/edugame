#!/usr/bin/env node
/* scripts/make-icons.mjs — icônes pleine page (maskable, Apple) à partir de icons/icon.svg
   Usage : CHROMIUM_PATH=/usr/bin/chromium node scripts/make-icons.mjs
   - icon-maskable-512.png : fond plein cadre, contenu réduit à 72 % (zone de sécurité Android : cercle de 80 %)
   - apple-touch-icon.png  : 180x180 plein cadre, sans coins arrondis ni transparence (iOS remplit le transparent en noir) */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.EDUCA_OUT || path.join(ROOT, 'icons');
const SAFE_SCALE = 0.72;

const svg = await readFile(path.join(ROOT, 'icons/icon.svg'), 'utf8');
/* Même dessin : on retire les coins arrondis (rx) et on réduit le contenu autour du centre. */
const fullBleed = (scale) => svg
  .replace(/ rx="\d+"/, '')
  .replace(/(<text[\s\S]*?<polygon[\s\S]*?\/>)/, `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">$1</g>`);

async function render(browser, markup, size, file) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
  await writeFile(file, await page.screenshot({ type: 'png', omitBackground: false }));
  await page.close();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
await render(browser, fullBleed(SAFE_SCALE), 512, path.join(OUT, 'icon-maskable-512.png'));
await render(browser, fullBleed(0.9), 180, path.join(OUT, 'apple-touch-icon.png'));
await browser.close();
console.log('icônes écrites dans', OUT);
