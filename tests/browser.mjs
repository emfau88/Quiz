import {chromium} from 'playwright-core';
import {mkdir,readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {serve} from '../tools/serve.mjs';

const stage = process.argv[2] || 'bestand';
const out = path.resolve('release/screenshots',stage);
await mkdir(out,{recursive:true}); await mkdir('.cache/qa',{recursive:true});
const profile = await mkdtemp(path.resolve('.cache/qa/profile-'));
const server = await serve();
const origin = 'http://127.0.0.1:' + server.address().port;
const catalog = JSON.parse(await readFile('web/data/catalog.json','utf8'));
const log = [], errors = [], external = new Set();
const settings = {headless:true,locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:360,height:640},deviceScaleFactor:3};
let ctx,page,extra;
async function launch() {
  ctx = await chromium.launchPersistentContext(profile,settings);
  page = ctx.pages()[0] || await ctx.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
    const url=r.url();if (/^https?:/.test(url)&&!url.startsWith(origin + '/')) external.add(url);
  });
}
async function read(p=page, scope='quizsalon') {
  return p.evaluate(scope=>new Promise((resolve,reject)=>{
    const req=indexedDB.open(scope);
    req.onsuccess=()=>{const db=req.result,t=db.transaction('local').objectStore('local').get('game');
      t.onsuccess=()=>{db.close();resolve(t.result);};t.onerror=()=>reject(t.error);};
    req.onerror=()=>reject(req.error);
  }),scope);
}
async function check(label,rule){await rule();log.push(label);console.log('OK '+label);}
async function waitFor(selector){await page.locator(selector).first().waitFor({state:'visible'});}
async function click(selector){await page.locator(selector).filter({visible:true}).first().click();}
async function shot(name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png')});}
const daily=state=>Object.values(state.sessions).find(s=>s.mode==='daily');
async function respond(index, correct) {
  const s=daily(await read()),q=s.items[index].q;
  const id=correct ? q.correct_option_id:q.options.find(o=>o.id!==q.correct_option_id).id;
  await click('.answer[data-id="' + id + '"]');await waitFor('#feedback');
}
async function noOverflow(){
  const dims=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,win:innerWidth,x:scrollX,route:location.hash,font:getComputedStyle(document.documentElement).fontSize,
    text:[...document.querySelectorAll('main *,header *,nav *')].flatMap(el=>[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>{const r=document.createRange();r.selectNodeContents(n);return {text:n.textContent.trim().slice(0,40),x:r.getBoundingClientRect().right+scrollX};})).filter(t=>t.x>innerWidth+1).slice(0,8),
    childOverflow:[...document.querySelectorAll('body *')].filter(e=>e.offsetWidth>0&&e.scrollWidth>e.offsetWidth+2).slice(0,10).map(e=>[e.tagName+'.'+e.className,e.scrollWidth,e.offsetWidth]),
    overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>e.tagName+'.'+e.className),
    bad:[...document.querySelectorAll('main button, main input, main select,main .question-title')].filter(e=>
      e.getBoundingClientRect().width && (e.getBoundingClientRect().right > innerWidth+1 || e.getBoundingClientRect().left < -1)).map(e=>e.className)}));
  assert.ok(dims.doc<=dims.win+1 && !dims.bad.length,JSON.stringify(dims));
}
try {
  await launch();await page.goto(origin);await waitFor('.answer');
  const first=daily(await read());
  await check('Erststart mit zehn gespeicherten Fragen und vier bedienbaren Antworten',async()=>{
    assert.equal(first.items.length,10);assert.equal(await page.locator('.answer').count(),4);
    const heights=await page.locator('.answer').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().height));assert.ok(heights.every(h=>h>=64));
    await noOverflow();await shot('01-Frage-360x640');
  });
  await check('Browserprozess vor der Antwort beendet und dieselbe Position fortgesetzt',async()=>{
    await ctx.close();await launch();await page.goto(origin);await waitFor('.answer');assert.deepEqual(daily(await read()).items,first.items);
  });
  await check('Pausieren, Browser-Zurück und Wiederaufnahme behalten Fragen und Reihenfolge',async()=>{
    await click('[data-action=pause]');await click('[data-action=leave-round]');await waitFor('.cover');
    await shot('02-Heute'); await click('[data-action=daily]');await waitFor('.answer');
    await page.goBack();await waitFor('dialog[open]');await click('dialog [data-action=close].primary');
    assert.deepEqual(daily(await read()).items,first.items);
  });
  await check('Zwei Browserfenster beantworten gleichzeitig, genau ein Versuch wird gebucht',async()=>{
    extra=await ctx.newPage();await extra.goto(origin);await extra.locator('.answer').first().waitFor();
    const opt=first.items[0].q.correct_option_id;
    const press=p=>p.evaluate(id=>document.querySelector('.answer[data-id="'+id+'"]')?.click(),opt);
    await Promise.all([press(page),press(extra)]);await waitFor('#feedback');await extra.close();extra=null;
    const st=await read();assert.equal(Object.values(st.progress).reduce((a,p)=>a+p.count,0),1);
    assert.equal(daily(st).items[0].answer.correct,true);
  });
  await check('Nach Prozessende erscheinen dieselbe Erklärung und gesperrte Antworten',async()=>{
    const before=daily(await read());await ctx.close();await launch();await page.goto(origin);await waitFor('#feedback');
    assert.deepEqual(daily(await read()),before);assert.equal(await page.locator('.answer:disabled').count(),4);await shot('03-Erklaerung');
  });
  await check('Quellen und kopierbare Meldung mit ID, Revision und Version',async()=>{
    await click('[data-action=source]');assert.ok(await page.locator('dialog a[href^=http]').count()>0);await page.keyboard.press('Escape');
    await click('[data-action=report]');const text=await page.locator('dialog textarea').inputValue();
    assert.ok(text.includes(first.items[0].q.id)&&text.includes('Semantische Revision'));await page.keyboard.press('Escape');
  });
  for(let i=1;i<10;i++){await click('[data-action=next]');await waitFor('.answer:not(:disabled)');await respond(i,i<7);}
  await check('Vor dem Ergebnis neu gestartet, 7/10, Silber und genau einmal 90 XP',async()=>{
    await ctx.close();await launch();await page.goto(origin);await waitFor('#feedback');await click('[data-action=next]');await waitFor('.score');
    await page.reload();await waitFor('.score');const s=await read();assert.equal(daily(s).result.correct,7);assert.equal(daily(s).result.medal,'Silber');
    assert.equal(Object.keys(s.ledger).length,1);assert.equal(Object.values(s.ledger)[0].xp,90);
    await shot('04-Ergebnis');await click('details.virtual summary');assert.equal(await page.locator('.virtual tbody tr').count(),4);
  });
  await check('Computervergleich über die Einstellungen abschaltbar, echte Albumkarten',async()=>{
    await click('[data-nav=settings]');await page.locator('input[data-setting=comparison]').uncheck();await click('[data-nav=today]');
    await click('[data-action=daily]');assert.equal(await page.locator('details.virtual').count(),0);
    await click('[data-nav=knowledge]');await waitFor('.album-item');assert.equal(await page.locator('.album-item').count(),10);await shot('05-Wissensalbum');
  });
  await click('[data-nav=topics]');await waitFor('.topic-card');await shot('06-Themen');
  if (stage!=='starter') {
    await check('Fünferprobe, Fortsetzung, keine Tages-XP und gesperrter Folgekauf im Browser',async()=>{
      await click('.topic-card');await click('[data-mode=trial]');await waitFor('.answer');
      let s=Object.values((await read()).sessions).find(x=>x.mode==='trial');assert.equal(s.items.length,5);
      await click('[data-action=pause]');await click('[data-action=leave-round]');await click('[data-nav=topics]');await click('.topic-card');
      for(let i=0;i<5;i++){await click('.answer');await waitFor('#feedback');await click('[data-action=next]');}
      await waitFor('.score');let st=await read();assert.equal(st.sessions[s.id].result.xp,0);assert.equal(Object.keys(st.ledger).length,1);
      await click('[data-nav=topics]');await click('.topic-card');await waitFor('dialog[open]');
      assert.equal(await page.locator('dialog [data-action=purchase]').count(),0);assert.match(await page.locator('dialog').innerText(),/Google Play/);await page.keyboard.press('Escape');
    });
  }
  await check('Alle Kernansichten bei 360×640, 360×800 und vergrößertem Webtext',async()=>{
    for(const height of [640,800]) {
      await page.setViewportSize({width:360,height});
      for (const scale of [100,150,200]){
        await page.evaluate(s=>document.documentElement.style.fontSize=s+'%',scale);
        for(const view of ['today','topics','knowledge','settings']){
          await click('[data-nav='+view+']');await noOverflow();
        }
      }
    }
    await page.evaluate(()=>document.documentElement.style.fontSize='');
  });
  await check('Offline-Neustart aus dem Service-Worker-Cache',async()=>{
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.reload();await waitFor('.mast');
    await ctx.setOffline(true);await page.reload();await waitFor('.mast');await click('[data-nav=knowledge]');assert.ok(await page.locator('.album-item').count()>=10);
    await ctx.setOffline(false);
  });
  await page.setViewportSize({width:1280,height:850});await click('[data-nav=today]');await shot('07-Desktop-Heute');
  await check(stage==='starter' ? 'Direkt öffnende HTML-Datei zeigt die erste Tagesfrage ohne Netzwerk' : 'Direkt öffnende HTML-Datei spielt ohne Netzwerk eine freie anspruchsvolle Themenrunde',async()=>{
    await ctx.close();await launch();await ctx.setOffline(true);
    await page.goto(pathToFileURL(path.resolve('release/Quizsalon-Lokaltest.html')).href);await waitFor('.answer');
    await page.setViewportSize({width:1280,height:850});await shot('08-Desktop-Frage');
    await page.setViewportSize({width:360,height:640});
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');await noOverflow();await shot('09-Grosse-Schrift');
    await page.evaluate(()=>document.documentElement.style.fontSize='');
    if(stage==='starter') return;
    await click('[data-nav=topics]');await click('.topic-card');await click('[data-mode=challenge]');await waitFor('.answer');
    for(let i=0;i<10;i++){await click('.answer');await waitFor('#feedback');await click('[data-action=next]');}
    await waitFor('.score');const st=await read(page,'quizsalon-lokaltest');assert.equal(Object.keys(st.ledger).length,0);
    assert.ok(Object.values(st.sessions).find(s=>s.mode==='challenge'&&s.status==='completed'));assert.equal(external.size,0);
  });
  assert.deepEqual(errors,[]);assert.equal(external.size,0);
  const result={at:new Date().toISOString(),stage,version:catalog.version,questions:catalog.questions.length,browser:ctx.browser().version(),
    locale:'de-DE',timezone:'Europe/Berlin',checks:log,uncaughtPageErrors:errors,externalRequests:[...external]};
  await writeFile(path.join(out,'pruefung.json'),JSON.stringify(result,null,2));
} finally { if(extra)await extra.close();await ctx?.close();server.close(); }
