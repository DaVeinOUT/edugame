import {chromium,webkit} from '../../../../node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const out={};
const origin='http://127.0.0.1:8766/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
await page.goto(origin);
await page.evaluate(async()=>{const {newProfile,emptyDevice}=await import('./js/core/schema.js');const p=newProfile({name:'Clavier'});const d={...emptyDevice(),order:[p.id],activeId:p.id};localStorage.setItem('educa2:device',JSON.stringify(d));localStorage.setItem('educa2:p:'+p.id,JSON.stringify(p));});
await page.reload();await page.waitForSelector('.btn-play');
await page.locator('.btn-play').focus();await page.keyboard.press('Enter');
await page.waitForSelector('text=C\'est parti');await page.keyboard.press('Enter');
const log=[];
for(let i=0;i<4;i++){
  await page.waitForSelector('.choice:not([disabled])');
  let tabs=0;
  while(!(await page.evaluate(()=>document.activeElement.matches('.choice:not([disabled])')))&&tabs<25){await page.keyboard.press('Tab');tabs++;}
  await page.keyboard.press('Enter');
  await page.waitForFunction(n=>document.querySelectorAll('.dots i.ok,.dots i.ko').length>=n,i+1);
  log.push({answer:i+1,tabs});
  const correction=await page.locator('button[aria-label=Continuer]').isVisible();
  if(correction) await page.keyboard.press('Enter');
}
out.keyboardWithStateWaits={answers:await page.locator('.dots i.ok,.dots i.ko').count(),log};
await context.close();await browser.close();
try{
  const wk=await webkit.launch();
  const ctx=await wk.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin);await p.waitForSelector('.pick');await p.locator('.pick').first().click();
  await p.waitForSelector('.choice-big');await p.locator('.choice-big').first().click();
  await p.waitForSelector('.choice-big >> text=La jungle');await p.locator('.choice-big').first().click();
  await p.waitForSelector('input.input');await p.getByRole('button',{name:/C'est parti/}).click();
  await p.waitForSelector('.btn-play');
  out.webkitBasic={hubVisible:true,errors};
  await ctx.close();await wk.close();
}catch(e){out.webkitBasic={error:e.message};}
await writeFile('/private/tmp/educa-audit-20261025/additional-results.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
