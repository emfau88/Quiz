import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {chromium,devices,webkit} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const {values} = parseArgs({options:{pages:{type:'string'},url:{type:'string'},out:{type:'string'}}});
const edition = JSON.parse(await readFile('package.json','utf8')).version;
const {categories,simulation} = JSON.parse(await readFile('specs/product_rules.json','utf8'));
const output = values.out ?? '.cache/themenbilder/test';
assert.ok(!(values.pages && values.url));
const server = values.pages ? await serve(0,{directory:path.resolve(values.pages),basePath:'/Quiz/'}) : null;
const file = !server && !values.url;
const entry = new URL(values.url ?? (server ? 'http://127.0.0.1:' + server.address().port + '/Quiz/spielen.html?v=' + edition :
  pathToFileURL(path.resolve('release/Quizsalon-Lokaltest.html')).href));
entry.hash = 'themen';
await mkdir(output,{recursive:true});
const checks = [];
const artworkHashes = {};

async function checkArtwork(page) {
  const files = [...Object.keys(categories).map(id => 'topics/' + id + '.webp'),
    ...simulation.opponents.map(({id}) => 'guests/' + id + '.png')];
  for (const file of files) {
    const expected = createHash('sha256').update(await readFile('web/assets/' + file)).digest('hex');
    const digest = await page.evaluate(async file => {
      const [group,basename] = file.split('/'), id = basename.split('.')[0];
      const source = group === 'topics' ? document.querySelector('.topic-card[data-id="' + id + '"] img').src :
        globalThis.QUIZSALON_GUEST_PORTRAITS?.[id] ?? './assets/' + file;
      const response = await fetch(source);
      if (!response.ok) throw Error(file + ' ' + response.status);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()));
      return Array.from(hash,b => b.toString(16).padStart(2,'0')).join('');
    },file);
    assert.equal(digest,expected,file);
    artworkHashes[file] = digest;
  }
}

async function measurements(cards) {
  return cards.evaluateAll(async buttons => {
    await document.fonts.ready;
    return Promise.all(buttons.map(async button => {
      const img = button.querySelector('img');
      await img.decode();
      const card = button.getBoundingClientRect(), art = img.getBoundingClientRect();
      const style = getComputedStyle(button);
      const label = button.querySelector('.topic-label');
      return {
        id:button.dataset.id, row:card.top, imageTop:art.top, textTop:label.getBoundingClientRect().top,
        topGap:art.top - card.top - parseFloat(style.borderTopWidth),
        leftGap:art.left - card.left - parseFloat(style.borderLeftWidth),
        rightGap:card.right - art.right - parseFloat(style.borderRightWidth),
        ratio:art.width / art.height, pixels:[img.naturalWidth,img.naturalHeight], alt:img.getAttribute('alt'),
        embedded:img.currentSrc.startsWith('data:image/webp;base64,'), distinct:buttons.filter(b => b.querySelector('img').src === img.src).length,
        clipped:label.scrollWidth > label.clientWidth + 1 || label.getBoundingClientRect().bottom > card.bottom + 1
      };
    }));
  });
}

try {
  const engines = [['chromium',chromium,'Pixel 7']];
  if (!file) engines.push(['webkit',webkit,'iPhone 13']);
  for (const [engine,browserType,device] of engines) {
    const browser = await browserType.launch();
    try {
      for (const [width,scale] of [[320,1],[360,1],[390,1],[430,1],[320,2],[390,2],[768,1],[1140,1]]) {
        const mobile = width < 761;
        const context = await browser.newContext({...(mobile ? devices[device] : {}),viewport:{width,height:mobile ? 800 : 900},
          deviceScaleFactor:mobile ? 2 : 1,locale:'de-DE',offline:file});
        try {
          const page = await context.newPage(), requests = [], errors = [];
          page.on('pageerror',err => errors.push(err.message));
          page.on('request',req => { if (!req.url().startsWith('data:')) requests.push(req.url().split('#')[0]); });
          await page.goto(entry.href);
          const cards = page.locator('.topic-card');
          await cards.first().waitFor();
          await page.evaluate(factor => {document.documentElement.style.fontSize = factor * 100 + '%';},scale);
          const rows = new Map(), data = await measurements(cards);
          assert.deepEqual(data.map(c => c.id),Object.keys(categories));
          for (const d of data) {
            assert.deepEqual(d.pixels,[720,360]);
            assert.equal(d.alt,'');
            assert.equal(d.embedded,file);
            assert.equal(d.distinct,1);
            assert.equal(d.clipped,false,engine + ' ' + d.id);
            assert.ok(Math.max(Math.abs(d.topGap),Math.abs(d.leftGap),Math.abs(d.rightGap)) < 1,JSON.stringify(d));
            assert.ok(Math.abs(d.ratio - 2) < .02);
            const row = rows.get(Math.round(d.row));
            if (row) assert.ok(Math.abs(d.textTop - row.textTop) < 1 && Math.abs(d.imageTop - row.imageTop) < 1);
            rows.set(Math.round(d.row),d);
            assert.equal(await page.getByRole('button',{name:new RegExp('^' + categories[d.id])}).count(),1);
          }
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width + 1);
          if (engine === 'chromium' && scale === 1 && [360,1140].includes(width)) {
            await page.screenshot({path:path.join(output,width === 360 ? 'themen-handy.png' : 'themen-desktop.png')});
          }
          if (engine === 'chromium' && scale === 1 && width === 360) {
            await checkArtwork(page);
            for (const [i,{id}] of data.entries()) {
              await cards.nth(i).tap();
              await page.getByRole('dialog',{name:categories[id],exact:true}).waitFor();
              await page.getByRole('button',{name:'Dialog schließen'}).tap();
            }
          }
          if (width === 1140 && scale === 1) {
            await cards.first().focus();
            await page.keyboard.press('Enter');
            await page.getByRole('dialog',{name:categories[data[0].id],exact:true}).waitFor();
            await page.keyboard.press('Escape');
          }
          if (file) assert.deepEqual([...new Set(requests)],[entry.href.split('#')[0]]);
          assert.deepEqual(errors,[]);
          checks.push({engine,browser:browser.version(),width,fontPercent:scale*100,rows:rows.size,
            decodedPictures:data.length,maxTopGapPx:Math.max(...data.map(d => Math.abs(d.topGap)))});
        } finally {await context.close();}
      }
    } finally {await browser.close();}
  }
} finally {if (server) {server.closeAllConnections();server.close();}}
await writeFile(path.join(output,'themenlayout.json'),JSON.stringify({edition,source:file ? 'HTML-Einzeldatei offline' :
  values.url ? entry.href : 'Lokale Pages-Ausgabe',checkedAt:new Date().toISOString(),artworkHashes,checks},null,2)+'\n');
console.log(checks.length + ' Ansichten geprüft · sechs bündige Bilder je Ansicht.');
