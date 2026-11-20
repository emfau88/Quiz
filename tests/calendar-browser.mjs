import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const server=await serve(),browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'de-DE',serviceWorkers:'block'});
const page=await ctx.newPage(),checks=[];
async function state(){return page.evaluate(async()=>{const {readGame}=await import('/js/storage.js');return readGame();});}
async function here(){return page.evaluate(async()=>(await import('/js/engine.js')).clock());}
const click=s=>page.locator(s).filter({visible:true}).first().click();
async function playToday(){
  await click('[data-nav=today]');await page.waitForSelector('.cover');await click('[data-action=daily]');await page.waitForSelector('.answer');
}
try{
  const cdp=await ctx.newCDPSession(page);
  await cdp.send('Emulation.setTimezoneOverride',{timezoneId:'Europe/Berlin'});
  await page.clock.install({time:new Date('2026-03-29T00:59:00Z')});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('.answer');
  const id='daily-2026-03-29',first=(await state()).sessions[id];
  assert.equal(first.offset,60);
  await page.clock.setSystemTime(new Date('2026-03-29T01:01:00Z'));
  assert.equal((await here()).offset,120);
  await playToday();assert.deepEqual((await state()).sessions[id].items,first.items);
  checks.push('Sommerzeitsprung CET auf CEST verändert weder day_key noch Fragen oder Reihenfolge.');
  await page.clock.setSystemTime(new Date('2026-03-29T21:59:00Z'));assert.equal((await here()).day,'2026-03-29');
  await page.clock.setSystemTime(new Date('2026-03-29T22:01:00Z'));assert.equal((await here()).day,'2026-03-30');
  await playToday();const monday='daily-2026-03-30',mid=await state();
  assert.deepEqual(mid.sessions[id],first);assert.equal(mid.sessions[monday].items.length,10);
  assert.ok(!mid.sessions[monday].items.some(i=>first.items.some(j=>j.q.fact_key===i.q.fact_key)));
  checks.push('Zwei Minuten über Mitternacht. Montag hat seine eigene Tagesrunde, Sonntag bleibt unverändert und reserviert seine Fragen.');
  await cdp.send('Emulation.setTimezoneOverride',{timezoneId:'America/New_York'});
  assert.equal((await here()).day,'2026-03-29');await playToday();
  assert.equal(Object.keys((await state()).sessions).length,2);
  assert.equal((await state()).sessions[id].zone,'Europe/Berlin');
  await cdp.send('Emulation.setTimezoneOverride',{timezoneId:'Europe/Berlin'});
  await click('[data-nav=knowledge]');await click('[data-action=tab][data-id=history]');
  await click('[data-action=open-session][data-id="'+id+'"]');
  for(let i=0;i<10;i++){await click('.answer:not(:disabled)');await page.waitForSelector('#feedback');await click('[data-action=next]');}
  await page.waitForSelector('.score');
  const weeks=await page.evaluate(async()=>{
    const {readGame}=await import('/js/storage.js'),{weekActivity}=await import('/js/engine.js'),g=await readGame();
    return [weekActivity(g,'2026-03-29'),weekActivity(g,'2026-03-30')];
  });
  assert.deepEqual(weeks,[['2026-03-29'],[]]);
  checks.push('Zeitzonenwechsel über die Datumsgrenze zieht keine weitere Runde. Später Abschluss über den Verlauf zählt zur ursprünglichen Woche.');
  await page.clock.setSystemTime(new Date('2036-05-08T20:00:00Z'));await playToday();
  await page.clock.setSystemTime(new Date('2026-03-29T22:03:00Z'));await playToday();
  assert.equal((await state()).sessions[monday].status,'active');
  checks.push('Zehn Jahre vorgestellte und wieder korrigierte Uhr verursacht keine Sperre der tatsächlichen Tagesrunde.');
  await mkdir('release/qa',{recursive:true});
  await writeFile('release/qa/kalender-browser.json',JSON.stringify({at:new Date().toISOString(),browser:browser.version(),
    fixture:'Kontrollierte Browseruhr und echte Intl-Zeitzonenregeln. Bedienung über die normale HTML-Oberfläche.',checks},null,2));
  console.log(checks.join('\n'));
}finally{await browser.close();server.close();}
