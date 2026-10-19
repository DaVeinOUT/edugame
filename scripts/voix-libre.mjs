#!/usr/bin/env node
/* ============================================================
   scripts/voix-libre.mjs — voix humaine libre pour EDUCA
   Télécharge, pour les mots du jeu, les enregistrements d'UN SEUL locuteur
   de Lingua Libre (Wikimedia Commons), vérifie leur licence, écrit le
   fichier d'attributions, puis (commande « encode ») les convertit en MP3.

     node scripts/voix-libre.mjs fetch    # audio-src/*.wav + audio-src/mots.json (ignorés par git) + audio/ATTRIBUTIONS.md
     node scripts/voix-libre.mjs encode   # audio-src/*.wav -> audio/mots/*.mp3 + js/data/wordaudio.js
     node scripts/voix-libre.mjs check    # contrôle acoustique des fins de mots (voir cmdCheck)
     node scripts/voix-libre.mjs sounds   # sons isolés, voyelles et consonnes (même voix) -> audio/sons/*.mp3 + js/data/sounds.js

   Aucune dépendance (Node >= 20 : fetch intégré ; ffmpeg dans le PATH pour « encode »).
   Variables : EDUCA_ROOT (racine du dépôt), EDUCA_OUT (dossier de sortie), FFMPEG (binaire).
   ============================================================ */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.EDUCA_OUT || ROOT;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
/* Les WAV sources (~25 Mo) restent HORS des dossiers publiés (audio/ est copié tel quel par la CI et mis en cache hors-ligne). */
const SRC_DIR = 'audio-src';

/* Wikimedia exige un User-Agent qui dit qui parle (sans donnée personnelle). */
const UA = 'EDUCA-voix-libre/1.0 (https://github.com/DaVeinOUT/edugame; outil de recherche de prononciations libres)';
const SPARQL = 'https://lingualibre.org/bigdata/namespace/wdq/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const PAUSE_MS = 700;                    // politesse : une requête à la fois, ~1,4 fichier/s
const MAX_TRIES = 6;                     // 429 / 503 : on attend (Retry-After) puis on réessaie
const BATCH = 50;                        // titres par requête imageinfo

/* Voix principale (CC0) puis voix de secours (CC BY-SA 4.0), par identifiant Lingua Libre.
   EDUCA_NO_FALLBACK=1 : une seule voix (les mots manquants restent à la synthèse vocale). */
const PRIMARY = { id: 'Q142683', name: 'Poslovitch' };
const FALLBACKS = process.env.EDUCA_NO_FALLBACK ? [] : [
  { id: 'Q1422544', name: 'Sartus85' },
  { id: 'Q215420', name: 'LoquaxFR' },
  { id: 'Q102123', name: 'WikiLucas00' },
];
/* Mots dont la prononciation dépend du sens : on choisit le fichier à la main. */
const FORCE_FILE = { vis: 'vis (nom commun)' };
const OK_LICENSES = new Set(['CC0', 'CC BY-SA 4.0', 'CC BY 4.0']);

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** fetch poli : en cas de 429/503 on respecte « Retry-After » puis on attend de plus en plus longtemps. */
async function politeFetch(url, options = {}) {
  for (let essai = 1; ; essai++) {
    const res = await fetch(url, { ...options, headers: { 'User-Agent': UA, ...options.headers } });
    if (res.ok || ![429, 503].includes(res.status) || essai >= MAX_TRIES) return res;
    const wait = Number(res.headers.get('retry-after')) || 5 * 2 ** (essai - 1);
    console.warn(`  ${res.status} : pause de ${wait} s (essai ${essai}/${MAX_TRIES})`);
    await sleep(wait * 1000);
  }
}

/** Les mots du jeu, en clair (sans la notation de segmentation). */
async function gameWords() {
  const cur = await import(pathToFileURL(path.join(ROOT, 'js/data/curriculum.js')).href);
  const { parseSeg } = await import(pathToFileURL(path.join(ROOT, 'js/core/seg.js')).href);
  const all = [
    ...cur.LEXICON.map(([seg]) => seg),
    ...cur.TOOL_WORDS.map(w => w.seg),
    ...cur.SENTENCES.flatMap(s => s.words),
  ];
  return [...new Set(all.map(seg => parseSeg(seg).text.toLowerCase()))].sort((a, b) => a.localeCompare(b, 'fr'));
}

async function sparql(query) {
  const res = await politeFetch(SPARQL, {
    method: 'POST',
    headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);
  return (await res.json()).results.bindings;
}

/** Fichiers Commons (un par mot) d'un locuteur, pour une liste de mots. */
async function filesBySpeaker(speaker, words) {
  const values = words.map(w => JSON.stringify(w)).join(' ');
  const rows = await sparql(`
    PREFIX e: <https://lingualibre.org/entity/> PREFIX d: <https://lingualibre.org/prop/direct/>
    SELECT ?word ?file WHERE {
      VALUES ?word { ${values} }
      ?rec d:P7 ?word ; d:P4 e:Q21 ; d:P5 e:${speaker.id} ; d:P3 ?file . }`);
  const byWord = new Map();
  for (const r of rows) {
    const name = decodeURIComponent(r.file.value.split('Special:FilePath/')[1]);
    byWord.set(r.word.value, [...(byWord.get(r.word.value) ?? []), name]);
  }
  return byWord;
}

/** Plusieurs fichiers pour un mot : le choix forcé, sinon le fichier sans précision entre parenthèses. */
function pickFile(word, speaker, names) {
  const plain = `LL-Q150 (fra)-${speaker.name}-${word}.wav`;
  const forced = FORCE_FILE[word] && `LL-Q150 (fra)-${speaker.name}-${FORCE_FILE[word]}.wav`;
  return names.find(n => n === forced) ?? names.find(n => n === plain) ?? names[0];
}

/** Licence, auteur et adresse de téléchargement d'après l'API de Commons. */
async function commonsInfo(fileNames) {
  const info = new Map();
  for (let i = 0; i < fileNames.length; i += BATCH) {
    const titles = fileNames.slice(i, i + BATCH).map(n => `File:${n}`).join('|');
    const url = `${COMMONS}?${new URLSearchParams({ action: 'query', format: 'json', maxlag: '5', prop: 'imageinfo', iiprop: 'url|size|extmetadata', titles })}`;
    const res = await politeFetch(url);
    if (!res.ok) throw new Error(`Commons ${res.status}`);
    for (const page of Object.values((await res.json()).query.pages)) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      info.set(page.title.replace(/^File:/, ''), {
        url: ii.url.split('?')[0],
        page: ii.descriptionurl,
        size: ii.size,
        license: ii.extmetadata.LicenseShortName?.value ?? 'inconnue',
        licenseUrl: ii.extmetadata.LicenseUrl?.value ?? '',
      });
    }
    await sleep(PAUSE_MS);
  }
  return info;
}

/** Nom de fichier ASCII sûr (jamais deux mots pour le même nom : « mais » / « maïs »). */
export function slugs(words) {
  const used = new Set();
  return new Map(words.map(w => {
    const base = w.normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, '-') || 'x';
    let s = base;
    for (let n = 2; used.has(s); n++) s = `${base}-${n}`;
    used.add(s);
    return [w, s];
  }));
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function download(url, dest) {
  if (await exists(dest)) return;
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`téléchargement ${res.status} : ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  await sleep(PAUSE_MS);
}

async function cmdFetch() {
  const words = await gameWords();
  const slug = slugs(words);
  const dir = path.join(OUT, SRC_DIR);
  await mkdir(dir, { recursive: true });

  const chosen = new Map();                         // mot -> { speaker, file }
  let todo = words;
  for (const speaker of [PRIMARY, ...FALLBACKS]) {
    if (!todo.length) break;
    const found = await filesBySpeaker(speaker, todo);
    for (const [w, names] of found) chosen.set(w, { speaker, file: pickFile(w, speaker, names) });
    todo = words.filter(w => !chosen.has(w));
    console.log(`${speaker.name} : ${found.size} mots trouvés, reste ${todo.length}`);
  }

  const info = await commonsInfo([...chosen.values()].map(c => c.file));
  const entries = [];
  for (const w of words) {
    const c = chosen.get(w);
    const i = c && info.get(c.file);
    if (!i) { entries.push({ mot: w, absent: true }); continue; }
    if (!OK_LICENSES.has(i.license)) { console.warn(`licence refusée (${i.license}) : ${c.file}`); entries.push({ mot: w, absent: true }); continue; }
    await download(i.url, path.join(dir, `${slug.get(w)}.wav`));
    entries.push({ mot: w, fichier: slug.get(w), locuteur: c.speaker.name, licence: i.license, page: i.page, secours: c.speaker !== PRIMARY });
  }
  await writeFile(path.join(OUT, SRC_DIR, 'mots.json'), JSON.stringify(entries, null, 1) + '\n');
  await mkdir(path.join(OUT, 'audio'), { recursive: true });
  await writeFile(path.join(OUT, 'audio/ATTRIBUTIONS.md'), attributions(entries));
  const missing = entries.filter(e => e.absent).map(e => e.mot);
  console.log(`${entries.length - missing.length}/${words.length} mots téléchargés ; absents : ${missing.join(', ') || 'aucun'}`);
}

function attributions(entries) {
  const done = entries.filter(e => !e.absent);
  const bySpeaker = new Map();
  for (const e of done) {
    const who = `${e.locuteur} — ${e.licence}`;
    bySpeaker.set(who, [...(bySpeaker.get(who) ?? []), e]);
  }
  const lines = [
    '# Attributions des voix (mots parlés)', '',
    'Prononciations enregistrées par des bénévoles avec **Lingua Libre** (Wikimédia France) et publiées sur',
    '**Wikimedia Commons**. Conversion en MP3 (coupe des silences, volume uniformisé) par EDUCA.', '',
  ];
  for (const [who, list] of bySpeaker) {
    lines.push(`## ${who} (${list.length} mots)`, '', list.map(e => `[${e.mot}](${e.page})`).join(' · '), '');
  }
  lines.push('Licences : CC0 = domaine public (https://creativecommons.org/publicdomain/zero/1.0/) ;',
    'CC BY-SA 4.0 = attribution + partage à l\'identique (https://creativecommons.org/licenses/by-sa/4.0/).', '');
  return lines.join('\n');
}

/* Coupe des silences aux deux bouts (on garde 30 ms), fondus courts, MP3 mono 24 kHz 32 kb/s.
   Volume : les mots durent 0,4 à 1,3 s, trop peu pour « loudnorm » (EBU R128 veut 400 ms mesurables) ;
   on mesure donc le niveau efficace (RMS) du mot et on applique un gain fixe + un limiteur de crêtes. */
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak';
const TRIM_CHAIN = [TRIM, 'areverse', TRIM, 'afade=t=in:d=0.02', 'areverse', 'afade=t=in:d=0.005'].join(',');
const TARGET_RMS_DB = -20;             // niveau moyen visé (≈ -18 LUFS pour de la parole)
const PEAK_CEILING_DB = -1.5;          // crête maximale après gain
const MAX_GAIN_DB = 20;                // on ne remonte jamais un bruit de plus de 20 dB
/* Sons des consonnes : 48 kb/s, car à 32 kb/s l'encodeur coupe au-dessus de 8 kHz et le [s] sonnerait
   sourd, presque [ch]. Leur niveau se mesure au-dessus de 300 Hz : un haut-parleur de téléphone ne rend
   presque rien plus bas, là où se trouve l'essentiel d'un « mmm » (même niveau perçu que « ou », « lune »). */
const SOUND_BITRATE = '48k';
const PHONE_BAND = 'highpass=f=300,highpass=f=300';
const PHONE_RMS_DB = -24;

function runFfmpeg(args) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg a échoué (${args.join(' ')}) : ${r.stderr.slice(-300)}`);
  return r.stderr;
}

/** Niveau efficace et crête (dB) d'un clip, éventuellement après un filtre (bande mesurée). */
function measure(file, filter = '') {
  const log = runFfmpeg(['-i', file, '-af', `${filter ? `${filter},` : ''}astats=metadata=0`, '-f', 'null', '-']);
  const overall = log.slice(log.lastIndexOf('Overall'));
  const rms = Number(/RMS level dB:\s*(-?[\d.]+)/.exec(overall)?.[1]);
  const peak = Number(/Peak level dB:\s*(-?[\d.]+)/.exec(overall)?.[1]);
  if (!Number.isFinite(rms) || !Number.isFinite(peak)) throw new Error(`mesure impossible : ${file}`);
  return { rms, peak };
}

/** Clip -> MP3. Consonnes : déjà taillées (pas de coupe), niveau « téléphone », 48 kb/s. */
function encodeOne(src, dest, { trim = true, phoneBand = false, bitrate = '32k' } = {}) {
  const tmp = path.join(os.tmpdir(), `educa-${process.pid}-${path.basename(dest)}.wav`);
  try {
    runFfmpeg(['-i', src, ...(trim ? ['-af', TRIM_CHAIN] : []), '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', tmp]);
    const { rms } = measure(tmp, phoneBand ? PHONE_BAND : '');
    const gain = Math.min(MAX_GAIN_DB, (phoneBand ? PHONE_RMS_DB : TARGET_RMS_DB) - rms).toFixed(2);
    const ceiling = (10 ** (PEAK_CEILING_DB / 20)).toFixed(3);
    runFfmpeg(['-i', tmp, '-af', `volume=${gain}dB,alimiter=limit=${ceiling}:attack=1:release=20:level=disabled`,
      '-c:a', 'libmp3lame', '-b:a', bitrate, '-id3v2_version', '0', dest]);
  } finally {
    rmSync(tmp, { force: true });
  }
}

async function cmdEncode() {
  const entries = JSON.parse(await readFile(path.join(OUT, SRC_DIR, 'mots.json'), 'utf8')).filter(e => !e.absent);
  await mkdir(path.join(OUT, 'audio/mots'), { recursive: true });
  for (const e of entries) encodeOne(path.join(OUT, SRC_DIR, `${e.fichier}.wav`), path.join(OUT, 'audio/mots', `${e.fichier}.mp3`));
  const map = Object.fromEntries(entries.map(e => [e.mot, e.fichier]));
  await mkdir(path.join(OUT, 'js/data'), { recursive: true });
  await writeFile(path.join(OUT, 'js/data/wordaudio.js'),
    `/* Généré par scripts/voix-libre.mjs — ne pas éditer. mot -> audio/mots/<fichier>.mp3 */\nexport const WORD_FILES = ${JSON.stringify(map, null, 1)};\n`);
  console.log(`${entries.length} fichiers MP3 écrits dans audio/mots/`);
}

/* Contrôle sans oreille humaine : la FIN du mot enregistré colle-t-elle au découpage du jeu ?
   Un [s] ou [ch] final prononcé laisse une friction aiguë ; une voyelle finale (lettres muettes
   comprises : « tout », « riz ») n'en laisse aucune. Mesure : énergie de la dérivée / énergie du
   signal sur les 60 dernières ms actives (≈ part des hautes fréquences). Repère « os » [ɔs]
   contre [o], « est » [ɛ] contre [ɛst], « tout » [tu] contre [tut]… L'écoute humaine reste conseillée. */
const VOWEL_END = new Set(['a', 'e', 'é', 'è', 'i', 'o', 'u', 'ou', 'on', 'an', 'in', 'un', 'eu', 'oi', 'ui', 'ien']);
const FRIC_MIN = { s: 0.35, ch: 0.15 };   // [ʃ] est moins aigu que [s]

function finalHf(file) {
  const r = spawnSync(FFMPEG, ['-v', 'quiet', '-i', file, '-f', 's16le', '-ac', '1', '-ar', '24000', '-'], { maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`lecture impossible : ${file}`);
  const x = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
  const N = 240;   // trames de 10 ms
  const frames = [];
  for (let i = 0; i + N <= x.length; i += N) {
    let e = 0, d = 0;
    for (let k = i + 1; k < i + N; k++) { e += x[k] * x[k]; const v = x[k] - x[k - 1]; d += v * v; }
    frames.push({ e, hf: e ? d / (2 * e) : 0 });
  }
  const maxE = Math.max(...frames.map(t => t.e));
  const last = frames.filter(t => t.e > maxE * 0.01).slice(-6);
  return last.reduce((s, t) => s + t.hf, 0) / (last.length || 1);
}

async function cmdCheck() {
  const { parseSeg } = await import(pathToFileURL(path.join(ROOT, 'js/core/seg.js')).href);
  const cur = await import(pathToFileURL(path.join(ROOT, 'js/data/curriculum.js')).href);
  const { WORD_FILES } = await import(pathToFileURL(path.join(OUT, 'js/data/wordaudio.js')).href);
  const segs = new Map([...cur.LEXICON.map(([seg]) => seg), ...cur.TOOL_WORDS.map(w => w.seg)]
    .map(seg => [parseSeg(seg).text.toLowerCase(), parseSeg(seg)]));
  const doubts = [];
  let checked = 0;
  for (const [mot, fichier] of Object.entries(WORD_FILES)) {
    const parsed = segs.get(mot);
    const end = parsed?.graphemes.filter(g => !g.mute).at(-1)?.p;
    const kind = VOWEL_END.has(end) ? 'voyelle' : end in FRIC_MIN ? 'friction' : null;
    if (!kind) continue;
    checked += 1;
    const hf = finalHf(path.join(OUT, 'audio/mots', `${fichier}.mp3`));
    if ((kind === 'voyelle' && hf > 0.25) || (kind === 'friction' && hf < FRIC_MIN[end])) doubts.push(`${mot} (attendu : ${kind}, mesure ${hf.toFixed(2)})`);
  }
  console.log(`${checked} fins de mots contrôlées ; à écouter : ${doubts.join(' ; ') || 'aucun'}`);
  if (doubts.length) process.exitCode = 1;
}

/* Sons isolés des VOYELLES, dits par la même voix que les mots, grâce à des mots d'un seul son
   (rapport du 13/10, A4.6, option 2). Premier mot trouvé chez le locuteur principal.
   Noms de fichiers ASCII (é/è : pas de piège de normalisation Unicode d'un système à l'autre). */
const VOWEL_SOUNDS = [
  { ph: 'a', file: 'a', words: ['a', 'ah'] },
  { ph: 'i', file: 'i', words: ['y', 'hi'] },
  { ph: 'o', file: 'o', words: ['eau', 'au', 'oh'] },
  { ph: 'u', file: 'u', words: ['eu', 'hu'] },
  { ph: 'ou', file: 'ou', words: ['ou', 'où', 'houx'] },
  { ph: 'é', file: 'e-aigu', words: ['et', 'ai'] },
  { ph: 'è', file: 'e-grave', words: ['est'] },
  { ph: 'on', file: 'on', words: ['on', 'ont'] },
  { ph: 'an', file: 'an', words: ['an', 'en'] },
  { ph: 'in', file: 'in', words: ['hein', 'un'] },
  { ph: 'oi', file: 'oi', words: ['oie'] },
];

/* Les CONSONNES, et les voyelles qu'aucun mot d'un seul son ne donne, taillées dans des mots de la
   même voix. La synthèse WebAudio d'avant sonnait au téléphone comme un bourdonnement (« vouuu »).
   Passages repérés par analyse acoustique (énergie, voisement, centre spectral) puis vérifiés au
   spectrogramme ; les temps (secondes) valent pour ces enregistrements précis.
   • tenue : la partie stable d'une consonne qu'on peut prolonger (souvent en fin de mot, où elle dure
     le plus), portée à 0,6 s — « mmmm », jamais « me » ;
   • brève : une explosion (p, t, k…) ne s'entend pas seule : on garde l'explosion et le tout début de
     la voyelle qui suit, coupé court (« p(e) ») ;
   • voyelle : la voyelle d'un mot, sans sa consonne d'attaque.
   Le [v] de cette voix est presque un pur bourdonnement : on y glisse le souffle de son [f] (« breath »). */
const CUT_SOUNDS = [
  { ph: 'm', file: 'm', word: 'homme', from: 0.42, to: 0.54, kind: 'tenue' },
  { ph: 'n', file: 'n', word: 'âne', from: 0.46, to: 0.6, kind: 'tenue' },
  { ph: 'gn', file: 'gn', word: 'ligne', from: 0.42, to: 0.6, kind: 'tenue' },
  { ph: 'l', file: 'l', word: 'lit', from: 0.27, to: 0.36, kind: 'tenue' },
  { ph: 'r', file: 'r', word: 'rat', from: 0.245, to: 0.31, kind: 'tenue' },
  { ph: 's', file: 's', word: 'os', from: 0.55, to: 0.69, kind: 'tenue' },
  { ph: 'z', file: 'z', word: 'zéro', from: 0.3, to: 0.4, kind: 'tenue' },
  { ph: 'f', file: 'f', word: 'neuf', from: 0.47, to: 0.57, kind: 'tenue' },
  { ph: 'v', file: 'v', word: 'vu', from: 0.12, to: 0.26, kind: 'tenue', breath: { word: 'neuf', from: 0.47, to: 0.57, db: -7 } },
  { ph: 'ch', file: 'ch', word: 'niche', from: 0.46, to: 0.6, kind: 'tenue' },
  { ph: 'j', file: 'j', word: 'je', from: 0.27, to: 0.38, kind: 'tenue' },
  { ph: 'p', file: 'p', word: 'peu', from: 0.235, to: 0.36, kind: 'breve' },
  { ph: 'b', file: 'b', word: 'beurre', from: 0.19, to: 0.37, kind: 'breve' },
  { ph: 't', file: 't', word: 'tenir', from: 0.17, to: 0.33, kind: 'breve' },
  { ph: 'd', file: 'd', word: 'de', from: 0.15, to: 0.33, kind: 'breve' },
  { ph: 'k', file: 'k', word: 'queue', from: 0.255, to: 0.45, kind: 'breve' },
  { ph: 'g', file: 'g', word: 'gueux', from: 0.18, to: 0.36, kind: 'breve' },
  { ph: 'y', file: 'y', word: 'yeux', from: 0.28, to: 0.5, kind: 'breve' },
  { ph: 'ks', file: 'ks', word: 'axe', from: 0.435, to: 0.66, kind: 'breve' },
  { ph: 'e', file: 'e', word: 'ce', from: 0.325, kind: 'voyelle' },
  { ph: 'eu', file: 'eu', word: 'feu', from: 0.31, kind: 'voyelle' },
  { ph: 'ui', file: 'ui', word: 'huis', from: 0.3, kind: 'voyelle' },
  { ph: 'oin', file: 'oin', word: 'point', from: 0.185, kind: 'voyelle' },
  { ph: 'ien', file: 'ien', word: 'chien', from: 0.335, kind: 'voyelle' },
];
/* [w] (kiwi) : un [u] bref, le fichier de « ou ». */
const SOUND_ALIASES = { w: 'ou' };
const CUT_HOW = { tenue: 'consonne prolongée', breve: 'explosion et début de voyelle', voyelle: 'sans la consonne d\'attaque' };

const PCM_RATE = 44100;
const HOLD_S = 0.6;                       // durée d'une consonne tenue
const VOICELESS = new Set(['s', 'ch', 'f']);

/** Échantillons (−1…1) d'un fichier, après un filtre ffmpeg. */
function pcm(file, filter) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-af', filter, '-f', 'f32le', '-ac', '1', '-ar', String(PCM_RATE), '-'],
    { maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`lecture impossible : ${file}`);
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}

function writeWav(samples, dest) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(PCM_RATE), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', dest],
    { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength) });
  if (r.status !== 0) throw new Error(`écriture impossible : ${dest}`);
}

/** Copie avec fondus linéaires (secondes) au début et à la fin. */
function faded(x, fadeIn, fadeOut) {
  const a = Math.round(fadeIn * PCM_RATE);
  const b = Math.round(fadeOut * PCM_RATE);
  return x.map((v, i) => v * Math.min(1, i / a, (x.length - 1 - i) / b));
}

const rms = x => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);

/** Frottement prolongé : grains de 40 ms tirés au hasard (graine fixe) dans la partie stable, fenêtre
    sinus à 50 % de recouvrement (puissance constante) — un bruit naturel, sans motif qui se répète. */
function noiseHold(x, from, to, seconds) {
  const G = Math.round(0.04 * PCM_RATE);
  const lo = Math.round(from * PCM_RATE);
  const span = Math.round(to * PCM_RATE) - G - lo;
  if (span <= 0) throw new Error(`passage trop court pour des grains de 40 ms (${from}–${to})`);
  const n = Math.round(seconds * PCM_RATE);
  const out = new Float32Array(n + G);
  let seed = 12345;
  for (let t = 0; t + G <= out.length; t += G / 2) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const s = lo + Math.floor((seed / 2147483648) * span);
    for (let i = 0; i < G; i++) out[t + i] += x[s + i] * Math.sin((Math.PI * i) / G);
  }
  return out.slice(0, n);
}

/** Son voisé prolongé sans changer la hauteur (atempo : 0,5 au plus par étage), avec marge puis coupé net. */
function voicedHold(file, from, to, seconds) {
  const len = to - from;
  const target = seconds + 0.4;                       // atempo perd un peu aux deux bouts
  const halves = Math.max(0, Math.ceil(Math.log2(target / len)));
  const tempo = [...Array(halves).fill('atempo=0.5'), `atempo=${((2 ** halves * len) / target).toFixed(4)}`].join(',');
  const y = pcm(file, `atrim=start=${from}:end=${to},asetpts=N/SR/TB,highpass=f=80,${tempo},atrim=end=${seconds}`);
  if (y.length < (seconds - 0.01) * PCM_RATE) throw new Error(`étirement trop court : ${file}`);
  return y;
}

function cutSound(c, src, breathSrc) {
  const cut = `atrim=start=${c.from}${c.to ? `:end=${c.to}` : ''},asetpts=N/SR/TB,highpass=f=60`;
  if (c.kind === 'voyelle') return faded(pcm(src, cut), 0.015, 0.04);
  if (c.kind === 'breve') return faded(pcm(src, cut), 0.004, 0.05);
  const held = VOICELESS.has(c.ph)
    ? noiseHold(pcm(src, 'highpass=f=1000'), c.from, c.to, HOLD_S)
    : voicedHold(src, c.from, c.to, HOLD_S);
  if (!c.breath) return faded(held, 0.06, 0.15);
  const breath = noiseHold(pcm(breathSrc, 'highpass=f=1000'), c.breath.from, c.breath.to, HOLD_S);
  const gain = (rms(held) / rms(breath)) * 10 ** (c.breath.db / 20);
  return faded(held.map((v, i) => v + gain * (breath[i] ?? 0)), 0.06, 0.15);
}

/** Télécharge (une fois) les enregistrements sources : mot -> { wav, page, license }. */
async function sourceWords(words, found) {
  const missing = words.filter(w => !found.has(w));
  if (missing.length) throw new Error(`mots sources introuvables chez ${PRIMARY.name} : ${missing.join(', ')}`);
  const file = w => pickFile(w, PRIMARY, found.get(w));
  const info = await commonsInfo(words.map(file));
  const dir = path.join(OUT, SRC_DIR, 'sons', 'mots');
  await mkdir(dir, { recursive: true });
  const slug = slugs(words);
  const out = new Map();
  for (const w of words) {
    const i = info.get(file(w));
    if (!i || !OK_LICENSES.has(i.license)) throw new Error(`« ${w} » : pas d'enregistrement libre (${i?.license ?? 'absent'})`);
    const wav = path.join(dir, `${slug.get(w)}.wav`);
    await download(i.url, wav);
    out.set(w, { wav, page: i.page, license: i.license });
  }
  return out;
}

async function vowelSounds(found) {
  const chosen = VOWEL_SOUNDS.map(v => {
    const word = v.words.find(w => found.has(w));
    return word ? { ...v, word, commons: pickFile(word, PRIMARY, found.get(word)) } : { ...v, word: null };
  });
  const info = await commonsInfo(chosen.filter(c => c.word).map(c => c.commons));
  const srcDir = path.join(OUT, SRC_DIR, 'sons');
  await mkdir(srcDir, { recursive: true });
  const done = [];
  for (const c of chosen) {
    const i = c.word && info.get(c.commons);
    if (!i || !OK_LICENSES.has(i.license)) { console.warn(`son [${c.ph}] : pas d'enregistrement libre (reste à la synthèse)`); continue; }
    const wav = path.join(srcDir, `${c.file}.wav`);
    await download(i.url, wav);
    encodeOne(wav, path.join(OUT, 'audio/sons', `${c.file}.mp3`));
    done.push({ ...c, how: 'mot d\'un seul son', page: i.page, license: i.license });
  }
  return done;
}

async function cutSounds(found) {
  const src = await sourceWords([...new Set(CUT_SOUNDS.flatMap(c => [c.word, c.breath?.word].filter(Boolean)))], found);
  const done = [];
  for (const c of CUT_SOUNDS) {
    const tmp = path.join(os.tmpdir(), `educa-${process.pid}-son-${c.file}.wav`);
    try {
      writeWav(cutSound(c, src.get(c.word).wav, c.breath && src.get(c.breath.word).wav), tmp);
      encodeOne(tmp, path.join(OUT, 'audio/sons', `${c.file}.mp3`),
        c.kind === 'voyelle' ? {} : { trim: false, phoneBand: true, bitrate: SOUND_BITRATE });
    } finally {
      rmSync(tmp, { force: true });
    }
    const breath = c.breath ? ` + souffle de « ${c.breath.word} » (${src.get(c.breath.word).page})` : '';
    done.push({ ...c, how: `${CUT_HOW[c.kind]}${breath}`, page: src.get(c.word).page, license: src.get(c.word).license });
  }
  return done;
}

async function cmdSounds() {
  const cutWords = CUT_SOUNDS.flatMap(c => [c.word, c.breath?.word].filter(Boolean));
  const found = await filesBySpeaker(PRIMARY, [...new Set([...VOWEL_SOUNDS.flatMap(v => v.words), ...cutWords])]);
  await mkdir(path.join(OUT, 'audio/sons'), { recursive: true });
  await mkdir(path.join(OUT, 'js/data'), { recursive: true });
  const done = [...await vowelSounds(found), ...await cutSounds(found)];
  const files = { ...Object.fromEntries(done.map(d => [d.ph, d.file])), ...SOUND_ALIASES };
  await writeFile(path.join(OUT, 'js/data/sounds.js'), [
    '/* ============================================================',
    '   DATA/SOUNDS.JS — Sons isolés enregistrés (audio/sons/<fichier>.mp3)',
    '   Généré par « node scripts/voix-libre.mjs sounds » — ne pas éditer.',
    '   Voyelles et consonnes dites par la voix des mots (Poslovitch,',
    '   Lingua Libre, CC0). Un son enregistré par l\'adulte (espace des',
    '   grands) passe toujours devant.',
    '   ============================================================ */',
    '',
    `export const SOUND_FILES = ${JSON.stringify(files, null, 1)};`,
    '',
  ].join('\n'));
  await writeFile(path.join(OUT, 'audio/sons/ATTRIBUTIONS.md'), [
    '# Attributions des sons isolés', '',
    `Chaque son est tiré d'un mot dit par ${PRIMARY.name} (Lingua Libre, Wikimedia Commons) :`, '',
    ...done.map(d => `- [${d.ph}] ← « ${d.word} », ${d.how} : ${d.page} (${d.license})`),
    ...Object.entries(SOUND_ALIASES).map(([ph, file]) => `- [${ph}] : même fichier que [${file}]`), '',
  ].join('\n'));
  console.log(`${done.length} sons : ${done.map(d => `${d.ph}←${d.word}`).join(', ')}`);
}

const cmd = process.argv[2];
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = { fetch: cmdFetch, encode: cmdEncode, check: cmdCheck, sounds: cmdSounds }[cmd];
  if (!run) { console.error('usage : node scripts/voix-libre.mjs fetch|encode|check|sounds'); process.exit(2); }
  run().catch(err => { console.error(err.message); process.exit(1); });
}
