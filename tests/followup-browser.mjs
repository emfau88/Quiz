import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs,promisify} from 'node:util';
import {chromium,devices} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const {values:options} = parseArgs({options:{pages:{type:'string'},live:{type:'boolean'},out:{type:'string'},
  commit:{type:'string'},run:{type:'string'}}});
assert.ok(Boolean(options.pages) !== Boolean(options.live), 'Genau eine Quelle wählen: --pages VERZEICHNIS oder --live');
if(options.commit) assert.match(options.commit,/^[a-f0-9]{40}$/);
const readme = options.live ? await (async()=>{
  const response=await fetch('https://raw.githubusercontent.com/emfau88/Quiz/main/README.md');
  assert.equal(response.status,200);
  return response.text();
})() : await readFile('README.md','utf8');
const publicLink = readme.match(/https:\/\/emfau88\.github\.io\/Quiz\/spielen\.html\?v=[\d.]+/)[0];
const version = JSON.parse(await readFile('package.json','utf8')).version;
assert.equal(new URL(publicLink).searchParams.get('v'),version);
const server = options.live ? null : await serve(0,{directory:path.resolve(options.pages),basePath:'/Quiz/'});
const base = server ? 'http://127.0.0.1:'+server.address().port : new URL(publicLink).origin;
const visit = url => {const source=new URL(url);return base+source.pathname+source.search+source.hash;};
const browser = await chromium.launch();
const output = options.out || '.cache/freundesrunde';
await mkdir(output,{recursive:true});
const errors = [], sent = [], checks = [];
const digest = value => createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
async function phone(day) {
  const ctx=await browser.newContext({...devices['Pixel 7'],viewport:{width:360,height:740},locale:'de-DE',timezoneId:'Europe/Berlin',
    permissions:['clipboard-read','clipboard-write']});
  const page=await ctx.newPage();
  await page.clock.setFixedTime(new Date(day+'T11:00:00Z'));
  page.on('pageerror',err=>errors.push(err.message));
  page.on('request',req=>{if(req.method()!=='GET')sent.push(req.method()+' '+req.url());});
  return {ctx,page};
}
const action=(p,name)=>p.locator('[data-action="'+name+'"]:visible').first();
const state=p=>p.evaluate(async()=> (await import('./js/storage.js')).readGame());
const access=p=>p.evaluate(async()=> (await import('./js/access.js')).themeAccess().state);
const session=(g,mode)=>Object.values(g.sessions).find(s=>s.mode===mode);
const snapshot=s=>s.items.map(({q,order})=>({id:q.id,content:q.content_revision,semantics:q.semantic_revision,order}));
async function choose(p,s,i,hits) {
  const item=s.items[i], expected=i<hits ? item.q.correct_option_id : item.order.find(id=>id!==item.q.correct_option_id);
  await p.locator('.answer[data-pos="'+i+'"]:enabled').first().waitFor();
  const shown=await p.locator('.answer').evaluateAll(nodes=>nodes.map(node=>node.dataset.id));
  assert.deepEqual(shown,item.order);
  await p.locator('.answer[data-id="'+expected+'"]:enabled').click();
  await p.locator('#feedback').waitFor();
}
async function copyShown(p) {
  await p.bringToFront();
  const displayed=await p.locator('#share-value').inputValue();
  await action(p,'copy-share').click();
  await p.waitForFunction(()=>document.querySelector('#copy-status')?.textContent.includes('kopiert'));
  assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),displayed);
  return displayed;
}
try {
  const a=await phone('2026-11-24'), b=await phone('2026-11-26');
  await a.page.goto(visit(publicLink));
  await a.page.locator('.answer:enabled').first().waitFor();
  const assets={};
  for (const asset of ['js/app.js','js/engine.js','js/friends.js','styles.css','data/catalog.json']) {
    const source=await a.page.evaluate(async file=>(await fetch('./'+file)).text(),asset);
    assets[asset]=digest(source);
    const expected=options.live&&options.commit
      ? (await promisify(execFile)('git',['show',options.commit+':web/'+asset],{maxBuffer:16*1024*1024,encoding:'utf8'})).stdout
      : await readFile('web/'+asset,'utf8');
    assert.equal(assets[asset],digest(expected),asset);
  }
  const daily=session(await state(a.page),'daily');
  await choose(a.page,daily,0,1);
  await action(a.page,'pause').click();
  await action(a.page,'leave-round').click();
  await action(a.page,'quick').click();
  await a.page.locator('.answer:enabled').first().waitFor();
  const quick=session(await state(a.page),'quick');
  for(let i=0;i<5;i++){await choose(a.page,quick,i,4);await action(a.page,'next').click();}
  await a.page.locator('.score').waitFor();
  assert.equal(session(await state(a.page),'quick').result.correct,4);
  await action(a.page,'invite-friend').click();
  const invitation=await copyShown(a.page);
  const url=new URL(invitation);
  assert.equal(url.origin+url.pathname, new URL(publicLink).origin+new URL(publicLink).pathname);
  assert.equal(url.search,'');
  assert.match(url.hash,/^#freunde\/1\/4\//);
  checks.push('A erspielt vier Treffer und kopiert den öffentlichen Link über die Oberfläche.');
  await b.page.goto(visit(publicLink)+'#freunde/1/5/defekt');
  await b.page.getByText('Diese Einladung ist nicht spielbar').waitFor();
  assert.equal(await action(b.page,'quick').count(),1);
  const before=await state(b.page), billing=await access(b.page);
  assert.deepEqual(before.sessions,{});
  await b.page.goto(visit(invitation));
  await action(b.page,'begin-friend').waitFor();
  assert.match(await b.page.locator('.invitation-card').innerText(),/4\s+von\s+5/);
  assert.deepEqual(await state(b.page),before);
  assert.equal(await access(b.page),billing);
  await b.page.screenshot({path:path.join(output,'einladung.png')});
  checks.push('Vor dem ersten Tagesstart: beschädigter Link, gültige Vorschau und identischer Lern- und Zugangsstand.');
  await action(b.page,'begin-friend').click();
  await b.page.locator('.answer:enabled').first().waitFor();
  await b.page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const received=session(await state(b.page),'friend');
  assert.equal(received.friendScore,4);
  assert.notEqual(quick.day,received.day);
  assert.deepEqual(snapshot(received),snapshot(quick));
  await choose(b.page,received,0,3);await action(b.page,'next').click();
  await choose(b.page,received,1,3);
  const paused=await state(b.page);
  await b.ctx.setOffline(true);
  await b.page.clock.setFixedTime(new Date('2026-11-27T11:00:00Z'));
  await b.page.goto('about:blank');await b.page.goto(visit(invitation));
  await b.page.locator('#feedback').waitFor();
  assert.deepEqual(await state(b.page),paused);
  await action(b.page,'next').click();
  for(let i=2;i<5;i++){await choose(b.page,received,i,3);await action(b.page,'next').click();}
  await b.page.locator('.friend-result').waitFor();
  assert.match(await b.page.locator('.score').innerText(),/3\s*von\s*5/);
  assert.match(await b.page.locator('.friend-result').innerText(),/4\s+von\s+5/);
  await b.page.locator('.friend-result').scrollIntoViewIfNeeded();
  await b.page.screenshot({path:path.join(output,'freundesvergleich.png')});
  const completed=await state(b.page);
  assert.deepEqual(completed.ledger,{});
  assert.deepEqual(completed.trials,{});
  assert.equal(Object.keys(completed.progress).length,5);
  assert.equal(completed.sessions[received.id].day,'2026-11-26');
  await action(b.page,'reply-friend').click();
  assert.match(await copyShown(b.page),/3 von 5.*4 von 5/);
  await b.page.goto('about:blank');await b.page.goto(visit(invitation));
  await b.page.locator('.friend-result').waitFor();
  assert.deepEqual(await state(b.page),completed);
  checks.push('B spielt dieselben fünf Karten und Antwortreihenfolgen, beendet offline am Folgetag mit 3/5 und kopiert den Antworttext.');
  checks.push('Wiederöffnen zeigt den Vergleich. Fünf eigene Lernbuchungen, keine Tages-XP und keine verbrauchte Probe.');
  assert.deepEqual(errors,[]);assert.deepEqual(sent,[]);
  await writeFile(path.join(output,'freundesrunde.json'),JSON.stringify({executed:new Date().toISOString(),edition:version,
    origin:options.live?base:'lokal bereitgestellte Pages-Ausgabe',readmeLink:publicLink,assetsSHA256:assets,
    commit:options.commit,actionsRun:options.run,
    browser:browser.version(),isolatedProfiles:2,sender:{day:quick.day,score:4},recipient:{day:received.day,completedDay:'2026-11-27',score:3},
    identicalCardsAndDisplayedOptions:snapshot(received),checks,pageErrors:errors,outgoingNonGet:sent},null,2)+'\n');
  console.log('Zwei getrennte Profile · 4/5 gegen 3/5 · Offline-Wiederaufnahme, Kopieren und Wiederöffnen bestanden.');
} finally {
  await browser.close();
  if(server){server.close();server.closeAllConnections();}
}
