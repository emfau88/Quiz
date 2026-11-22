// Verify the actual standalone editions at one file URL, with an isolated persistent browser profile.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const previous = process.argv[2];
assert.ok(previous,'Aufruf: node tests/html-upgrade.mjs PFAD_ZUR_VORHERIGEN_HTML');
const current = 'release/Quizsalon-Lokaltest.html';
const out = process.argv[3] || 'release/qa/fragenpool';
const oldSelection = Number(process.argv[4] || 1);
const work = await mkdtemp(resolve('.cache/fragenpool/html-'));
const local = join(work,'Quizsalon.html'), profile = join(work,'browser');
const digest = value => createHash('sha256').update(value).digest('hex');
const readOrigin = async page => page.evaluate(async () => {
  const db = await new Promise((ok,fail) => {
    const request = indexedDB.open('quizsalon-lokaltest',2);
    request.onsuccess = () => ok(request.result);
    request.onerror = () => fail(request.error);
  });
  const get = key => new Promise((ok,fail) => {
    const request = db.transaction('local').objectStore('local').get(key);
    request.onsuccess = () => ok(request.result);
    request.onerror = () => fail(request.error);
  });
  try {return {game:await get('game'),installation:await get('installation')};} finally {db.close();}
});
const net = [], errors = [];
async function open() {
  const ctx=await chromium.launchPersistentContext(profile,{offline:true,headless:true,locale:'de-DE',
    timezoneId:'Europe/Berlin',viewport:{width:360,height:640}});
  const page=ctx.pages()[0];
  page.on('request',req=>{if (/^https?:/i.test(req.url())) net.push(req.url());});
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(pathToFileURL(local).href);
  return {ctx,page};
}
await mkdir(out,{recursive:true});
await copyFile(previous,local);
let {ctx,page}=await open();
let before;
try {
  await page.locator('button.answer').first().click();
  await page.locator('#feedback').waitFor();
  before=await readOrigin(page);
} finally {await ctx.close();}
await copyFile(current,local);
({ctx,page}=await open());
try {
  const session=Object.values(before.game.sessions).find(s=>s.mode==='daily');
  if (!(await page.locator('#feedback').isVisible())) {
    await page.goto(pathToFileURL(local).href+'#runde/'+session.id);
  }
  await page.locator('#feedback').waitFor();
  const after=await readOrigin(page);
  assert.deepEqual(after,before);
  assert.equal(session.selectionVersion,oldSelection);
  await page.locator('[data-action="next"]').click();
  await page.locator('button.answer').first().waitFor();
  for (let n=1;n<10;n++) {
    await page.locator('button.answer').first().click();
    await page.locator('#feedback').waitFor();
    await page.locator('[data-action="next"]').click();
  }
  await page.waitForFunction(()=>location.hash.startsWith('#ergebnis'));
  let final=await readOrigin(page);
  const completed=final.game.sessions[session.id];
  assert.equal(completed.status,'completed');
  assert.equal(Object.keys(final.game.ledger).length,1);
  const ledger=JSON.stringify(final.game.ledger);
  await page.reload();
  await page.locator('#app main').waitFor();
  final=await readOrigin(page);
  assert.equal(JSON.stringify(final.game.ledger),ledger);
  assert.equal(net.length,0);
  assert.deepEqual(errors,[]);
  await writeFile(join(out,'html-update.json'),JSON.stringify({
    at:new Date().toISOString(),browser:ctx.browser().version(),oldHtmlSHA256:digest(await readFile(previous)),
    newHtmlSHA256:digest(await readFile(current)),oldCatalog:session.catalogVersion,
    newCatalog:JSON.parse(await readFile('web/data/manifest.json','utf8')).version,
    savedStateAndInstallationEqual:true,answerAndProgressRestored:true,retainedOrder:true,
    oldSelectionVersion:session.selectionVersion,
    completedValid:completed.result.valid,ledgerEntries:Object.keys(final.game.ledger).length,xp:completed.result.xp,
    externalRequests:net,pageErrors:errors
  },null,2)+'\n');
  console.log('Offline-Dateiupdate: Antwort, Reihenfolge, Kennung und Fortschritt identisch. Eine Abschlussbuchung.');
} finally {await ctx.close();}
