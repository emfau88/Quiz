import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,devices} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const live = process.argv[2] === '--live';
const local = live ? null : await serve(0,{directory:path.resolve(process.argv[2]),basePath:'/Quiz/'});
const base = live ? 'https://emfau88.github.io/Quiz/' : 'http://127.0.0.1:'+local.address().port+'/Quiz/';
const out = live ? '.cache/modern/live' : 'release/screenshots/modern-0.3.0';
const qa = live ? out : 'release/qa/modern-0.3.0';
const catalogBytes = await readFile('web/data/catalog.json');
const catalog = JSON.parse(catalogBytes);
const digest = value=>createHash('sha256').update(value).digest('hex');
const browser = await chromium.launch();
try {
  await Promise.all([mkdir(out,{recursive:true}),mkdir(qa,{recursive:true})]);
  const ctx=await browser.newContext({...devices['Pixel 7'],viewport:{width:390,height:780},deviceScaleFactor:1,
    locale:'de-DE',timezoneId:'Europe/Berlin'});
  const page=await ctx.newPage();
  if (!live) await page.clock.setFixedTime(new Date('2026-11-22T12:00:00+01:00'));
  const errors=[], external=[], labels=[], research=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(req.url().startsWith('http') && new URL(req.url()).origin!==new URL(base).origin) external.push(req.url());});
  const release=JSON.parse(await readFile('package.json','utf8')).version;
  await page.goto(base+'spielen.html?v='+release);
  await page.waitForURL(u=>u.pathname==='/Quiz/');
  await page.locator('.answer').first().waitFor();
  const served=await ctx.request.get(base+'data/catalog.json');
  assert.equal(served.status(),200);
  assert.equal(digest(await served.body()),digest(catalogBytes));
  const state = await page.evaluate(async ()=>(await import('./js/storage.js')).readGame());
  const round = Object.values(state.sessions).find(s=>s.mode==='daily');
  assert.equal(round.catalogVersion,catalog.version);
  if (live) {
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(out,'04-GitHub-Spiel-Link.png')});
  }
  let capturedEstimate=false,capturedReasoning=false;
  for(let i=0;i<10;i++) {
    const item=round.items[i];
    await page.locator('.question-title').filter({hasText:item.q.question}).waitFor();
    const label=(await page.locator('#question-format').allTextContents()).join(' ');
    labels.push(label);
    if (!live && ((!capturedEstimate && label.includes('Schätzfrage')) || (!capturedReasoning && label.includes('Zum Herleiten')))) {
      const estimate=label.includes('Schätzfrage');
      await page.locator('#question-format').evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top-105));
      await page.screenshot({path:path.join(out,estimate?'01-Schaetzfrage.png':'02-Herleiten.png')});
      if(estimate)capturedEstimate=true;else capturedReasoning=true;
    }
    await page.locator('.answer').nth(item.order.indexOf(item.q.correct_option_id)).tap();
    const feedback=page.locator('#feedback');
    await feedback.waitFor();
    if (item.q.research) {
      const link=feedback.locator('a');
      assert.equal(await link.getAttribute('href'),item.q.research.url);
      assert.ok((await link.innerText()).includes(item.q.research.publisher));
      assert.equal(await feedback.locator('.research-source time').getAttribute('datetime'),item.q.research.published_on);
      research.push({id:item.q.id,source:item.q.research.url,published:item.q.research.published_on});
      if (!live) {
        await feedback.evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top-180));
        await page.screenshot({path:path.join(out,'03-Forschung-mit-Quelle.png')});
      }
    }
    if(!i) {
      await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
      await ctx.setOffline(true);
      await page.reload();
      await feedback.waitFor();
      assert.ok((await page.locator('.question-title').innerText()).includes(item.q.question));
    }
    await page.locator('[data-action="next"]').tap();
  }
  await page.locator('.score').waitFor();
  assert.equal(labels.filter(x=>x.includes('Schätzfrage')).length,1);
  assert.equal(labels.filter(x=>x.includes('Zum Herleiten')).length,2);
  const weekday=new Date(round.day+'T12:00Z').getUTCDay();
  assert.equal(research.length,[0,2,4].includes(weekday)?1:0);
  const final=await page.evaluate(async ()=>(await import('./js/storage.js')).readGame());
  assert.equal(Object.keys(final.ledger).length,1);
  assert.equal(final.sessions[round.id].result.correct,10);
  if(research.length) {
    await page.locator('.nav-mobile [data-nav="knowledge"]').tap();
    await page.locator('#album-filter').selectOption('research');
    const entry=page.locator('details.album-item');
    assert.equal(await entry.count(),1);
    await entry.locator('summary').tap();
    assert.equal(await entry.locator('a').first().getAttribute('href'),research[0].source);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  const report={at:new Date().toISOString(),day:round.day,catalog:catalog.version,questions:catalog.questions.length,
    link:base+'spielen.html?v='+release,browser:browser.version(),viewport:[390,780],offlineAfterFirstAnswer:true,
    formats:labels,research,correct:10,awardedOnce:true,sha256Catalog:digest(catalogBytes),external,errors};
  await writeFile(path.join(qa,'mobile-runde.json'),JSON.stringify(report,null,2)+'\n');
  console.log(release,catalog.version,round.day,'10 Antworten, 1 Schätzfrage, 2 Herleitungen,',research.length,'aktuelle Forschungsfrage(n), offline fortgesetzt.');
} finally {
  await browser.close();
  if(local){local.close();local.closeAllConnections();}
}
