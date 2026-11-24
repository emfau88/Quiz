import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {parseFriendLink} from '../web/js/friends.js';

const file=resolve('release/Quizsalon-Lokaltest.html');
const out=process.argv[2]||'release/qa/weiterspielen-0.4.0';
const url=pathToFileURL(file).href;
const catalog=JSON.parse(await readFile('web/data/catalog.json','utf8'));
const browser=await chromium.launch();
const context=await browser.newContext({offline:true,viewport:{width:360,height:640},locale:'de-DE',
  permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),requested=new Set(),errors=[];
const action=name=>page.locator('[data-action="'+name+'"]:visible').first();
page.on('request',req=>{if(!req.url().startsWith('data:'))requested.add(req.url().split('#')[0]);});
page.on('pageerror',err=>errors.push(err.message));
try {
  await page.goto(url);
  await page.locator('.answer:enabled').first().waitFor();
  await action('pause').click();await action('leave-round').click();await action('quick').click();
  const portraits=page.locator('#guest-list img');
  await portraits.first().waitFor();
  const pictures=await portraits.evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
    await img.decode();return {embedded:img.src.startsWith('data:image/png;base64,'),width:img.naturalWidth};
  })));
  assert.equal(pictures.length,3);assert.ok(pictures.every(p=>p.embedded&&p.width===192));
  const asked=[];
  for(let i=0;i<5;i++){
    await page.locator('.answer[data-pos="'+i+'"]:enabled').first().waitFor();
    const wording=await page.locator('.question-title').textContent();
    const q=catalog.questions.find(card=>card.question===wording);
    assert.ok(q,wording);asked.push(q.id);
    const id=i<4?q.correct_option_id:q.options.find(o=>o.id!==q.correct_option_id).id;
    await page.locator('.answer[data-id="'+id+'"]').click();await page.locator('#feedback').waitFor();
    await action('next').click();
  }
  await action('invite-friend').click();
  const link=await page.locator('#share-value').inputValue(),invitation=parseFriendLink(link);
  assert.match(link,/^https:\/\/emfau88\.github\.io\/Quiz\/spielen\.html#freunde\//);
  assert.equal(invitation.score,4);assert.deepEqual(invitation.cards.map(c=>c.id),asked);
  await action('copy-share').click();
  await page.waitForFunction(()=>document.querySelector('#copy-status')?.textContent.includes('kopiert'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),link);
  assert.deepEqual([...requested],[url]);assert.deepEqual(errors,[]);
  await mkdir(out,{recursive:true});
  await writeFile(join(out,'einzeldatei-einladung.json'),JSON.stringify({executed:new Date().toISOString(),
    fileSHA256:createHash('sha256').update(await readFile(file)).digest('hex'),browser:browser.version(),offlineFromLaunch:true,
    filesRead:requested.size,additionalFiles:0,correct:4,cards:asked,embeddedPortraits:pictures,clipboardEqualsPublicLink:true},null,2)+'\n');
  console.log('Offline-Einzeldatei: drei eingebettete Porträts, 4/5 erspielt und öffentlicher Freundeslink in der Zwischenablage.');
} finally {await browser.close();}
