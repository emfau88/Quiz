import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const out=path.resolve(process.argv[2] || 'release/qa/weiterspielen-0.4.0/ui');
await mkdir(out,{recursive:true});
await mkdir('.cache/qa',{recursive:true});
const stage=path.join(await mkdtemp(path.resolve('.cache/qa/weiter-ui-')),'Quiz');
await promisify(execFile)(process.execPath,['tools/package-web.mjs','--pages',stage]);
const regular=await serve(), local=await serve(0,{directory:stage});
const origin=server=>'http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
const checks=[], scans=[], screenshots=[], failures=[];
const require=createRequire(import.meta.url);
async function profile(server,day,serviceWorkers='block') {
  const context=await browser.newContext({locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:360,height:640},serviceWorkers});
  const page=await context.newPage();
  await page.clock.install({time:new Date(day+'T14:00:00Z')});
  page.on('pageerror',error=>failures.push(error.message));
  return {context,page,url:origin(server)};
}
const game=page=>page.evaluate(async()=>(await import('/js/storage.js')).readGame());
const click=(page,selector)=>page.locator(selector).filter({visible:true}).first().click();
const act=(page,action)=>click(page,'[data-action="'+action+'"]');
const ready=page=>page.locator('.answer:enabled').first().waitFor();
async function session(page) {
  return (await game(page)).sessions[decodeURIComponent(new URL(page.url()).hash.split('/')[1])];
}
async function finish(page,score) {
  const s=await session(page);
  for(let i=s.cursor;i<s.items.length;i++){
    const item=s.items[i], correct=item.q.correct_option_id;
    if(!item.answer){
      await ready(page);
      const answer=i<score?correct:item.order.find(id=>id!==correct);
      await click(page,'.answer[data-id="'+answer+'"]');
    }
    await page.locator('#feedback').waitFor();
    await act(page,'next');
  }
  await page.locator('.score').waitFor();
  return session(page);
}
async function snapshot(page,label,anchor='') {
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);});
  if(anchor) await page.locator(anchor).scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,label+'.png')});
  screenshots.push(label+'.png');
}
async function layout(page,label) {
  const failures=await page.evaluate(()=>{
    const root=document.documentElement;
    if(root.scrollWidth>innerWidth+1)return ['Seite ist breiter als der sichtbare Bereich.'];
    const scope=document.querySelector('dialog[open]') || document.querySelector('main');
    return [...scope.querySelectorAll('h1,h2,h3,button,.answer-text,.guest-intro small,.ranking-person,.friend-scores dd')].filter(el=>{
      if(!el.getClientRects().length || (el.closest('details:not([open])')&&!el.closest('summary')))return false;
      const b=el.getBoundingClientRect();
      return b.left<-.75 || b.right>innerWidth+.75 || el.scrollWidth>el.clientWidth+1;
    }).map(el=>el.textContent.trim());
  });
  assert.deepEqual(failures,[],label);
  if(!await page.evaluate(()=>!!globalThis.axe))await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  scans.push({label,violations});
  assert.deepEqual(violations,[],label);
}
const scale=(page,percent)=>page.evaluate(n=>{document.documentElement.style.fontSize=n+'%';},percent);
const trio=s=>s.opponents.map(person=>person.id);
const cards=s=>s.items.map(item=>[item.q.id,item.order]);
try{
  const a=await profile(regular,'2026-11-24');
  await a.page.goto(a.url);
  await ready(a.page);
  assert.equal(await a.page.locator('.guest-intro li').count(),3);
  await layout(a.page,'Erste Tagesfrage, 100 %');
  await snapshot(a.page,'01-Quiztisch');
  await scale(a.page,200);
  await layout(a.page,'Erste Tagesfrage, 200 %');
  await scale(a.page,100);
  const daily=await finish(a.page,7);
  await snapshot(a.page,'02-Tagesergebnis');
  await layout(a.page,'Tagesergebnis, 100 %');
  await act(a.page,'quick');await ready(a.page);
  const first=await session(a.page);
  assert.equal(first.mode,'quick');assert.notDeepEqual(trio(daily).sort(),trio(first).sort());
  await snapshot(a.page,'03-Kostenlose-Kurzrunde');
  const quick=await finish(a.page,4);
  assert.equal(quick.result.correct,4);
  await snapshot(a.page,'04-Kurzrundenergebnis');
  // Headless Chromium has no operating-system share surface. Exercise its explicit AbortError contract.
  await a.page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{
    globalThis.lastShareData=data;throw new DOMException('Abgebrochen','AbortError');
  }}));
  await a.context.grantPermissions(['clipboard-write','clipboard-read'],{origin:a.url});
  await act(a.page,'invite-friend');
  const publicLink=await a.page.locator('#share-value').inputValue();
  assert.match(publicLink,/^https:\/\/emfau88\.github\.io\/Quiz\/spielen\.html#freunde\/1\/4\//);
  await layout(a.page,'Freundeslink teilen, 100 %');
  await snapshot(a.page,'05-Einladung-teilen');
  await act(a.page,'system-share');
  assert.equal(await a.page.locator('#copy-status').innerText(),'Teilen abgebrochen.');
  assert.equal(await a.page.evaluate(()=>globalThis.lastShareData.url),publicLink);
  await act(a.page,'copy-share');
  await a.page.locator('#copy-status').filter({hasText:'Spiel-Link kopiert.'}).waitFor();
  assert.equal(await a.page.evaluate(()=>navigator.clipboard.readText()),publicLink);
  checks.push('Browser-Teilen mit kontrolliertem AbortError abgebrochen. Danach den echten öffentlichen Link über die Browser-Zwischenablage kopiert und zurückgelesen.');
  await act(a.page,'close');
  await act(a.page,'quick');await ready(a.page);assert.equal((await session(a.page)).mode,'quick');
  await finish(a.page,2);
  await click(a.page,'details.virtual summary');
  for (const percent of [100,200]) {
    await scale(a.page,percent);
    const table=await a.page.locator('.virtual table').evaluate(el=>{
      const bounds=node=>{const r=document.createRange();r.selectNodeContents(node);return r;};
      const headings=[...el.querySelectorAll('thead th')];
      return {
        shortHeadingsOnOneLine:[headings[0],headings.at(-1)].every(th=>bounds(th).getClientRects().length===1),
        strengthsBelowNames:[...el.querySelectorAll('.ranking-person small')].every(small=>
          small.getBoundingClientRect().top>=bounds(small.parentNode.firstChild).getBoundingClientRect().bottom-1)
      };
    });
    assert.deepEqual(table,{shortHeadingsOnOneLine:true,strengthsBelowNames:true});
  }
  await layout(a.page,'Ergebnis mit offenem Quiztisch, 200 %');await scale(a.page,100);
  const previous=await session(a.page);
  await act(a.page,'rematch');await ready(a.page);
  const rematch=await session(a.page);
  assert.deepEqual(trio(rematch),trio(previous));assert.equal(rematch.rematchOf,previous.id);
  await finish(a.page,3);
  const learned=await game(a.page);
  assert.deepEqual(Object.keys(learned.ledger),['daily-complete:'+daily.id]);assert.deepEqual(learned.trials,{});
  checks.push('Tagesergebnis → kostenlose Kurzrunde → zweite Kurzrunde ohne Umweg. Revanche mit dem gleichen Trio; nur Tagesrunde im XP-Ledger.');
  await act(a.page,'themes');
  await a.page.locator('.topic-card').first().waitFor();
  await snapshot(a.page,'06-Thema-waehlen');
  await click(a.page,'.topic-card[data-id="nature_animals"]');
  await click(a.page,'[data-action="topic-scope"][data-subtopic="tierverhalten"]');
  assert.equal(await a.page.locator('dialog [data-mode="topic"]').count(),0);
  assert.match(await a.page.locator('dialog').innerText(),/Google Play/);
  await act(a.page,'close');

  const b=await profile(local,'2026-11-25','allow'), link=b.url+'/'+new URL(publicLink).hash;
  await b.page.goto(link);await b.page.locator('.invitation-card').waitFor();
  assert.deepEqual(Object.keys((await game(b.page)).sessions),[]);
  assert.deepEqual((await game(b.page)).progress,{});
  await layout(b.page,'Einladung vor dem Erststart');
  await snapshot(b.page,'07-Einladung-empfangen');
  await act(b.page,'begin-friend');await ready(b.page);
  const invited=await session(b.page);assert.equal(invited.friendScore,4);assert.deepEqual(cards(invited),cards(quick));
  await b.page.goto(link);await ready(b.page);assert.equal((await session(b.page)).id,invited.id);
  for(let i=0;i<2;i++){
    await click(b.page,'.answer[data-id="'+invited.items[i].q.correct_option_id+'"]');await b.page.locator('#feedback').waitFor();
    await act(b.page,'next');await ready(b.page);
  }
  await b.page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  await b.context.setOffline(true);
  await b.page.reload();await ready(b.page);
  assert.equal((await session(b.page)).cursor,2);
  await finish(b.page,3);
  await b.page.goto(link);await b.page.locator('.friend-result').waitFor();
  await scale(b.page,200);await layout(b.page,'Freundesauswertung, 200 %');await snapshot(b.page,'08-Freundesergebnis-grosse-Schrift','.friend-result');
  await scale(b.page,100);await snapshot(b.page,'09-Freundesergebnis');
  await act(b.page,'reply-friend');
  assert.match(await b.page.locator('#share-value').inputValue(),/3 von 5.*4 von 5/);
  await act(b.page,'close');
  assert.deepEqual((await game(b.page)).ledger,{});
  await b.page.goto(b.url+'/#freunde/1/kaputt');await b.page.locator('.invitation-card').waitFor();
  await act(b.page,'quick');await ready(b.page);
  checks.push('Öffentlicher 4/5-Link auf separatem Profil und anderem Datum. Vorschau ohne Fortschrittsänderung, dieselben fünf Fragen und Antwortreihenfolgen, nach zwei Antworten offline neu geladen und mit 3/5 beendet. Wiederöffnen setzt fort bzw. zeigt das Ergebnis. Beschädigter Link öffnet auf Wunsch eine Kurzrunde.');

  const c=await profile(local,'2026-11-24');
  await c.page.goto(c.url);await ready(c.page);
  for(const [category,slug,expected] of [['entertainment','filmgeschichte',['topic','challenge']],['nature_animals','tierverhalten',['topic']],['nature_animals','wetter',['topic','challenge']]]){
    for(const mode of expected){
      await click(c.page,'[data-nav=topics]');await click(c.page,'.topic-card[data-id="'+category+'"]');
      await click(c.page,'[data-action="topic-scope"][data-subtopic="'+slug+'"]');
      const choices=await c.page.locator('dialog [data-action="begin-topic"][data-subtopic="'+slug+'"]').evaluateAll(es=>es.map(el=>el.dataset.mode));
      assert.deepEqual(choices,expected);
      if(slug==='tierverhalten'){
        assert.equal(await c.page.locator('dialog [data-mode="challenge"][data-subtopic=""]').count(),1);
        await scale(c.page,200);await layout(c.page,'Tierverhalten und anspruchsvolle Hauptkategorie, 200 %');await scale(c.page,100);
        await snapshot(c.page,'10-Tierverhalten');
      }
      await click(c.page,'dialog [data-mode="'+mode+'"][data-subtopic="'+slug+'"]');await ready(c.page);
      const done=await finish(c.page,7);assert.equal(done.items.length,10);assert.equal(done.subtopic,slug);
      const ok=await c.page.evaluate(async({id,slug})=>{
        const {matchesSubtopic}=await import('/js/subtopics.js'),{readGame}=await import('/js/storage.js');
        return (await readGame()).sessions[id].items.every(item=>matchesSubtopic(item.q,slug));
      },{id:done.id,slug});
      assert.ok(ok,slug+' '+mode);
    }
  }
  checks.push('Über die Themenoberfläche fünf verfügbare Unterthemenmischungen in der lokalen Testausgabe bis zum Ergebnis gespielt und alle 50 Karten geprüft. Im regulären Browser bleibt die freie Themenwahl hinter Plus.');
  assert.deepEqual(failures,[]);
  await writeFile(path.join(out,'weiter-ui.json'),JSON.stringify({at:new Date().toISOString(),browser:browser.version(),viewport:[360,640],checks,scans,screenshots,pageErrors:failures},null,2));
  console.log(checks.join('\n'),scans.length+' geprüfte Ansichten, '+screenshots.length+' Screenshots.');
}finally{
  await browser.close();regular.closeAllConnections();regular.close();local.closeAllConnections();local.close();
}
