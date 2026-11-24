import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,devices} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const out=process.argv[2] || 'release/qa/weiterspielen-0.4.0';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const server=await serve();
const origin='http://127.0.0.1:'+server.address().port+'/';
const ctx=await browser.newContext({...devices['Pixel 7'],viewport:{width:360,height:740},locale:'de-DE',timezoneId:'Europe/Berlin'});
const action=(p,name)=>p.locator('[data-action="'+name+'"]:visible').first();
const state=p=>p.evaluate(async()=> (await import('./js/storage.js')).readGame());
const facts=s=>s.items.map(i=>i.q.fact_key);
async function counters(p) {
  return p.evaluate(async()=>{
    const game=await (await import('./js/storage.js')).readGame();
    const {experience,weekActivity}=await import('./js/engine.js');
    return {ledger:game.ledger,week:weekActivity(game,'2026-11-24'),xp:experience(game).xp,trials:game.trials,
      access:(await import('./js/access.js')).themeAccess().state};
  });
}
async function respond(p) {
  await p.locator('.answer:enabled').first().click();await p.locator('#feedback').waitFor();
}
try {
  const page=await ctx.newPage(), errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.clock.setFixedTime(new Date('2026-11-24T11:00:00Z'));
  await page.goto(origin);
  for(let n=0;n<10;n++){await respond(page);await action(page,'next').click();}
  await page.locator('.score').waitFor();
  const resultURL=page.url();
  await action(page,'themes').click();
  await page.locator('.topic-card').first().click();
  await page.locator('dialog [data-mode=trial]').click();
  for(let n=0;n<5;n++){await respond(page);await action(page,'next').click();}
  await page.locator('.score').waitFor();
  await page.goto(resultURL);await page.locator('.score').waitFor();
  const before=await counters(page);
  assert.equal(before.access,'unavailable');
  assert.equal(Object.keys(before.trials).length,1);
  assert.ok(before.xp>0);
  const albumBefore=Object.keys((await state(page)).progress).length;
  const second=await ctx.newPage();
  await second.clock.setFixedTime(new Date('2026-11-24T11:00:00Z'));
  await second.goto(resultURL);await second.locator('.score').waitFor();
  await Promise.all([page,second].map(p=>action(p,'quick').click()));
  await Promise.all([page,second].map(p=>p.locator('.answer:enabled').first().waitFor()));
  assert.equal(page.url(),second.url());
  assert.equal(Object.values((await state(page)).sessions).filter(s=>s.mode==='quick').length,1);
  await second.close();
  const rounds=[],allFacts=new Set();
  for(let round=0;round<3;round++){
    if(round){await action(page,'quick').click();await page.locator('.answer:enabled').first().waitFor();}
    const active=Object.values((await state(page)).sessions).find(s=>s.mode==='quick'&&s.status==='active');
    assert.equal(new Set(active.items.map(i=>i.q.category)).size,5);
    for(const fact of facts(active)){assert.ok(!allFacts.has(fact));allFacts.add(fact);}
    for(let i=0;i<5;i++){
      await respond(page);
      if(!round && i===1){
        const paused=await state(page);
        await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
        await ctx.setOffline(true);
        await page.clock.setFixedTime(new Date('2026-11-25T11:00:00Z'));
        await page.goto('about:blank');await page.goto(origin);
        await page.locator('#feedback').waitFor();
        assert.deepEqual(await state(page),paused);
      }
      await action(page,'next').click();
    }
    await page.locator('.score').waitFor();
    const saved=(await state(page)).sessions[active.id];
    assert.equal(saved.result.xp,0);
    assert.deepEqual(saved.opponents,active.opponents);
    rounds.push({id:saved.id,startDay:saved.day,endDay:saved.completed.slice(0,10),correct:saved.result.correct,
      facts:facts(saved),guests:saved.opponents.map(g=>g.id)});
  }
  const after=await counters(page);assert.deepEqual(after,before);
  const game=await state(page);
  assert.equal(Object.keys(game.progress).length,albumBefore+15);
  await page.locator('[data-nav=knowledge]:visible').first().click();
  await page.locator('.album-item').first().waitFor();
  assert.equal(await page.locator('.album-item').count(),albumBefore+15);
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'kostenlose-kurzrunden.json'),JSON.stringify({executed:new Date().toISOString(),
    browser:browser.version(),edition:'reguläre Webfassung ohne Plus',sameSessionAcrossTwoTabs:true,
    offlineReloadWithTwoAnswered:true,rounds,before,after,albumBefore,albumAfter:Object.keys(game.progress).length,pageErrors:errors},null,2)+'\n');
  console.log('Drei kostenlose Kurzrunden, ein gleichzeitiger Start, Offline-Abschluss am Folgetag, 15 neue Albumkarten und identische Wertung.');
} finally {await browser.close();server.close();server.closeAllConnections();}
