import { chromium, webkit } from '../../../../node_modules/playwright-core/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createStore, memoryStorage } from '../../../../js/services/store.js';
import { newProfile, emptyDevice } from '../../../../js/core/schema.js';
import { buildCurriculum } from '../../../../js/core/curriculum.js';
import { buildLevels, planModule, finishModule } from '../../../../js/core/levels.js';
import { planLesson, finishSession } from '../../../../js/core/session.js';
import * as DATA from '../../../../js/data/curriculum.js';
import * as LEVEL_DATA from '../../../../js/data/levels.js';

const output = '/private/tmp/educa-audit-20261025';
await mkdir(output, {recursive: true});
const result = { date: '2026-10-25', commit: 'fd23ac1', static: {}, browser: {} };
const cur = buildCurriculum(DATA);
const L = buildLevels(LEVEL_DATA);
const profile = newProfile({ name: 'Léa', age: '7-9' });
profile.path = {open: 65, stars: {}, placed: true, advanced: true};
profile.cards = ['r_first', 'diplome-n3'];
result.static.inventory = {
  steps: cur.steps.length, words: cur.words.length, tools: cur.tools.length, sentences: cur.sentences.length,
  levels: L.levels.length, ordinaryModules: L.modules.filter(m => !m.isControle).length,
  controls: L.modules.filter(m => m.isControle).length,
  questions: L.modules.reduce((n,m) => n + planModule(m, profile, {n: 10000}).length, 0),
  byLevel: L.levels.map(lv => ({ id: lv.id, grade: lv.grade, modules: L.modulesOf(lv.id).length,
    items: L.modulesOf(lv.id).reduce((n,m) => n + m.items.reduce((sum,it) => sum + (it.questions?.length || 1),0),0) })),
  stepsWithoutNewWord: cur.steps.filter(s => !cur.newWordsAt(s.index).length).map(s => s.id),
};

// A failed write is forgotten after flush: retry without another mutation does not recover it.
const base = memoryStorage();
let fail = false;
const storage = { ...base, setItem(k,v) { if (fail) throw new Error('quota'); base.setItem(k,v); } };
const s = createStore({storage}); s.load(); const p = s.addProfile({name:'Initial'});
fail = true; s.updateProfile(p.id, x => ({...x,name:'Après panne'})); s.flush();
fail = false; s.flush();
result.static.failedWrite = { memory: s.profile(p.id).name, disk: JSON.parse(base.getItem('educa2:p:'+p.id)).name, degraded: s.degraded };

// A complete export contains the limit, but importAll drops it.
s.updateDevice(d => ({...d,dailyMinutes:15}));
const exported = s.exportAll();
const restored = createStore({storage:memoryStorage()}); restored.load(); restored.importAll(exported);
result.static.importLimit = {exported: exported.device.dailyMinutes, restored:restored.device().dailyMinutes};

// Two app instances read the same profile, then overwrite the same key.
const shared = memoryStorage(); const a = createStore({storage:shared}); a.load(); const child = a.addProfile({});
const b = createStore({storage:shared}); b.load();
a.updateProfile(child.id,x=>({...x,stats:{...x.stats,answers:x.stats.answers+1}})); a.flush();
b.updateProfile(child.id,x=>({...x,stats:{...x.stats,answers:x.stats.answers+1}})); b.flush();
result.static.multiInstance = {expectedAnswers:2, actualAnswers:JSON.parse(shared.getItem('educa2:p:'+child.id)).stats.answers};

const ctl = L.modules.find(m => m.isControle);
const qs = planModule(ctl,profile);
const assisted = finishModule(profile,{module:ctl,results:qs.map(()=>({outcome:'help'}))},cur);
result.static.assistedControl = {module:ctl.id,total:qs.length,passed:assisted.report.passed,accuracy:assisted.report.accuracy};
let start = newProfile({});
for(let n=0;n<2;n++) start = finishSession(start,{kind:'lesson',step:0,results:Array.from({length:10},()=>({outcome:'ko'}))},cur).profile;
result.static.failedProgression = {openAfterTwoAllWrong:start.path.open,stars:start.path.stars};
result.static.mutedEarlyLesson = {planned:planLesson(cur,newProfile({}),0).length,
  retained:planLesson(cur,newProfile({}),0).filter(it=>!new Set(['listen','sound','syllable','hearword','build']).has(it.kind)).length};

const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined, headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},bypassCSP:true,serviceWorkers:'block'});
const page = await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const origin='http://127.0.0.1:8766/';
await page.goto(origin); await page.waitForTimeout(400);
await page.screenshot({path:output+'/01-bienvenue.png',fullPage:true});
const d={...emptyDevice(),order:[profile.id],activeId:profile.id,muted:true};
await page.evaluate(({d,p})=>{localStorage.setItem('educa2:device',JSON.stringify(d));localStorage.setItem('educa2:p:'+p.id,JSON.stringify(p));},{d,p:profile});
await page.reload();await page.waitForSelector('.btn-play');await page.waitForTimeout(400);
await page.screenshot({path:output+'/02-accueil.png',fullPage:true});
result.browser.initialNavigation = await page.evaluate(()=>({title:document.title,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
await page.getByRole('button',{name:/Mes cartes/}).click();
result.browser.collection = {earnedDiploma:profile.cards.includes('diplome-n3'),visibleDiplomas:await page.getByRole('button',{name:/Diplôme/}).count(),title:await page.locator('h1').textContent()};
await page.getByRole('button',{name:'Première leçon',exact:true}).click();
await page.waitForTimeout(100);
await page.keyboard.press('Shift+Tab');
result.browser.modalFocus = await page.evaluate(()=>({insideDialog:!!document.activeElement.closest('[role=dialog]'),focused:document.activeElement.outerHTML.slice(0,250),backgroundInert:document.querySelector('#app').inert}));
await page.keyboard.press('Escape');
result.browser.escapeAfterFocusLeak = await page.locator('[role=dialog]').count();
await page.getByRole('button',{name:'Retourner la carte',exact:true}).focus();
await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Retour',exact:true}).click();
await page.getByRole('button',{name:'Espace des grands',exact:true}).click();
const words=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf'];
for(const word of (await page.locator('.panel .h1').textContent()).split(',').map(w=>w.trim())) await page.locator('.gate-pad').getByRole('button',{name:String(words.indexOf(word)),exact:true}).click();
await page.getByRole('tab',{name:'Appareil',exact:true}).click();
await page.waitForTimeout(700);await page.screenshot({path:output+'/03-adulte-appareil.png',fullPage:true});
const axeSrc = await readFile('../../../../node_modules/axe-core/axe.min.js','utf8');
result.browser.axeAllImpacts = await page.evaluate(async src=>{(0,eval)(src);const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};},axeSrc);
await page.getByRole('tab',{name:'Données',exact:true}).click();
await page.evaluate(async()=>{const {saveRecording}=await import('./js/services/recordings.js');await saveRecording('audit',new Blob(['audit'],{type:'audio/webm'}));});
await page.getByRole('button',{name:'Tout effacer sur cet appareil…',exact:true}).click();
await page.getByRole('button',{name:/Confirmer : TOUT effacer/}).click();
await page.waitForSelector('.pick');
result.browser.recordingAfterWipe=await page.evaluate(async()=>{const {loadRecordings}=await import('./js/services/recordings.js');return [...(await loadRecordings()).keys()];});
result.browser.errors=errors;
await context.close();await browser.close();
await writeFile(output+'/results.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
