import assert from 'node:assert/strict';
import {cp,mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,devices} from 'playwright-core';
import {serve} from '../tools/serve.mjs';
import {playBeforeUpdate,auditBeforeUpdate} from './upgrade-example.mjs';

const [previous,current,out='release/qa/modern-0.3.0']=process.argv.slice(2);
assert.ok(previous&&current,'Zwei gebaute Pages-Verzeichnisse erforderlich');
const work=await mkdtemp(path.resolve('.cache/modern/published-'));
await cp(previous,work,{recursive:true});
const server=await serve(0,{directory:work,basePath:'/Quiz/'});
const browser=await chromium.launch();
try {
  const context=await browser.newContext({...devices['Pixel 7'],locale:'de-DE',timezoneId:'Europe/Berlin'});
  const page=await context.newPage();
  await page.clock.setFixedTime(new Date('2026-11-23T11:00:00Z'));
  const start='http://127.0.0.1:'+server.address().port+'/Quiz/';
  await page.goto(start);
  const progress=()=>page.evaluate(async()=> {
    const storage=await import('./js/storage.js');
    return storage.readGame();
  });
  await playBeforeUpdate(page);
  const before=await progress();
  const example=auditBeforeUpdate(before);
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const previousRuntime=JSON.parse(await readFile(path.join(previous,'data/manifest.json'),'utf8'));
  const currentRuntime=JSON.parse(await readFile(path.join(current,'data/manifest.json'),'utf8'));
  assert.equal(before.sessions['daily-'+example.openDay].catalogVersion, previousRuntime.version);
  const workerName=async dir=>(await readFile(path.join(dir,'sw.js'),'utf8')).match(/quizsalon-assets-[0-9a-f]+/)[0];
  const previousWorker=await workerName(previous), currentWorker=await workerName(current);
  assert.notEqual(currentWorker,previousWorker);
  await cp(current,work,{recursive:true,force:true});
  const link=start+'spielen.html?v='+JSON.parse(await readFile('package.json','utf8')).version;
  await page.goto(link);
  await page.waitForURL(u=>u.pathname==='/Quiz/');
  await page.locator('#feedback').waitFor();
  assert.deepEqual(await progress(),before);
  assert.equal(await page.evaluate(async ()=>(await (await fetch('./data/manifest.json')).json()).version),currentRuntime.version);
  assert.deepEqual(await page.evaluate(()=>caches.keys()),[currentWorker]);
  await context.setOffline(true);
  await page.goto('about:blank');
  await page.goto(link);
  await page.waitForURL(u=>u.pathname==='/Quiz/');
  await page.locator('#feedback').waitFor();
  assert.deepEqual(await progress(),before);
  await mkdir(out,{recursive:true});
  await writeFile(path.join(out,'pages-update.json'),JSON.stringify({at:new Date().toISOString(),browser:browser.version(),
    previous:previousRuntime.version,current:currentRuntime.version,previousWorker,currentWorker,example,updatedViaReadmeLink:true,savedRoundUnchanged:true,
    reopenedReadmeLinkOffline:true},null,2)+'\n');
  console.log(previousRuntime.version,'→',currentRuntime.version,'über den Spiel-Link, gespeicherte Runde auch offline fortgesetzt.');
} finally {
  await browser.close();server.close();server.closeAllConnections();
}
