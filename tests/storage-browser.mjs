import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {serve} from '../tools/serve.mjs';
import {newGame,startRound,answer,advance,addDays,clock,keyOf} from '../web/js/engine.js';

const catalog=JSON.parse(await readFile('web/data/catalog.json','utf8'));
const server=await serve(), url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({serviceWorkers:'block',locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:360,height:640},deviceScaleFactor:3});
const page=await ctx.newPage(), checks=[];
const game=async()=>page.evaluate(async()=>{const {readGame}=await import('/js/storage.js');return readGame();});
const button=selector=>page.locator(selector).filter({visible:true}).first();
const now=clock(),oldDay=addDays(now.day,-3), oldTime={...now,day:oldDay,now:oldDay+'T10:00:00Z'};
const old=newGame(), s=startRound(old,catalog,'old-install',oldTime);
for(let i=0;i<10;i++){
  const q=s.items[i].q;const opt=i<7?q.correct_option_id:q.options.find(o=>o.id!==q.correct_option_id).id;
  answer(old,s.id,i,opt,oldTime);advance(old,s.id,i,oldTime);
}
const active=startRound(old,catalog,'old-install',now);
old.schema=1;delete old.awards;delete old.lastView;
let correctionCatalog;
const qaDir='release/screenshots/sonderfaelle';
try {
  await mkdir(qaDir,{recursive:true});
  await page.goto(url+'/data/manifest.json');
  await page.evaluate(state=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('quizsalon',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('local');
    request.onsuccess=()=>{const db=request.result,t=db.transaction('local','readwrite');
      t.objectStore('local').put(state,'game');t.objectStore('local').put('old-install','installation');
      t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};
  }),old);
  await page.goto(url+'/#runde/'+active.id);await page.waitForSelector('.answer');
  let saved=await game();
  assert.equal(saved.schema,2);assert.deepEqual(saved.sessions[active.id],active);assert.deepEqual(saved.ledger,old.ledger);
  checks.push('Physisch gespeicherte IndexedDB v1 mit alter Tagesrunde, Ledger und offenen Snapshots zu v2 migriert.');
  const rollback=await page.evaluate(async({sid,now})=>{
    const {transact,readGame}=await import('/js/storage.js'),{answer}=await import('/js/engine.js');
    const original=JSON.stringify(await readGame());
    try{
      await transact(g=>{answer(g,sid,0,g.sessions[sid].items[0].q.correct_option_id,now);throw Error('absichtlicher Abbruch im Test');});
    }catch(e){if(!e.message.includes('absichtlicher Abbruch'))throw e;}
    return JSON.stringify(await readGame())===original;
  },{sid:active.id,now});
  assert.ok(rollback);checks.push('Erzwungener Transaktionsabbruch nach Antwort und Lernbuchung lässt beide unverändert.');
  // Real production scheduler chooses up to two errors from three calendar days ago.
  const duePositions=active.items.map((it,i)=>it.kind==='due'?i:-1).filter(i=>i>=0);
  assert.equal(duePositions.length,2);
  const pos=duePositions[0];
  for(let i=0;i<=pos;i++){
    await button('.answer[data-id="'+active.items[i].q.correct_option_id+'"]').click();
    await page.waitForSelector('#feedback');
    if(i<pos) await button('[data-action=next]').click();
  }
  await page.locator('#feedback .earned').first().waitFor();
  assert.match(await page.locator('#feedback').innerText(),/Wiedergewusst/);
  await page.locator('#feedback').scrollIntoViewIfNeeded();
  await page.screenshot({path:qaDir+'/01-Wiedergewusst.png'});
  checks.push('Wiedergewusst nach vorherigem Fehler und drei Kalendertagen an der Oberfläche belegt.');
  const target=active.items[pos].q,withdrawnKey=keyOf(target);
  correctionCatalog={version:'qa-korrektur',questions:catalog.questions.filter(q=>keyOf(q)!==withdrawnKey),
    corrections:[{id:target.id,semantic_revision:target.semantic_revision,reason:'Prüfszenario'}]};
  await ctx.route('**/data/catalog.json',route=>route.fulfill({json:correctionCatalog}));
  await page.reload();await page.getByRole('heading',{name:'Diese Frage wird korrigiert.'}).waitFor();
  saved=await game();assert.ok(saved.sessions[active.id].items[pos].void);assert.ok(!saved.progress[withdrawnKey]);
  assert.deepEqual(saved.sessions[s.id].result,old.sessions[s.id].result);
  assert.ok(saved.sessions[s.id].corrected);assert.equal(Object.values(saved.ledger)[0].xp,90);
  await page.screenshot({path:qaDir+'/02-Korrektur.png'});
  for(let i=pos;i<10;i++){
    if(i>pos){await button('.answer').click();await page.waitForSelector('#feedback');}
    await button('[data-action=next]').click();
  }
  await page.waitForSelector('.score');assert.match(await page.locator('.score').innerText(),/von 9/);
  assert.equal(await page.locator('details.virtual').count(),0);
  await button('[data-nav=knowledge]').click();await page.getByText('Diese Erklärung wird überprüft.').waitFor();
  checks.push('Zurückgezogene beantwortete Position offen neutralisiert, Abschlussnenner 9, kein Vergleich, sichere Albumanzeige und unveränderte Alt-XP.');
  await button('[data-nav=settings]').click();await button('[data-action=reset]').click();await button('.actions [data-action=close]').click();
  assert.ok(Object.keys((await game()).sessions).length>0);
  await button('[data-action=reset]').click();await button('[data-action=confirm-reset]').click();await page.waitForSelector('.cover');
  assert.deepEqual((await game()).ledger,{});assert.deepEqual((await game()).sessions,{});
  checks.push('Lokales Zurücksetzen erst nach ausdrücklicher Bestätigung. Abbrechen erhält den Spielstand.');
  await writeFile(qaDir+'/pruefung.json',JSON.stringify({at:new Date().toISOString(),catalog:catalog.version,browser:browser.version(),
    fixture:'Vorbereiteter Spielstand mit drei Tage altem falschem Versuch; Rückzug ausschließlich im Testbrowser.',checks},null,2));
  console.log(checks.join('\n'));
}finally{await browser.close();server.close();}
