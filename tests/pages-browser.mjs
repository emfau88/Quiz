import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium, devices, webkit} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const directory = path.resolve(process.argv[2]);
const basePath = '/Quiz/';
const phones = {
  chromium: {browser: chromium, device: 'Pixel 7', width: 360},
  webkit: {browser: webkit, device: 'iPhone 13', width: 390}
};

for (const name of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(phones)) {
  const {browser, device, width} = phones[name];
  const instance = await browser.launch();
  let server;
  try {
    server = await serve(0, {directory, basePath});
    const start = new URL(basePath, 'http://127.0.0.1:' + server.address().port);
    const context = await instance.newContext({
      ...devices[device], viewport: {width, height: 740}, locale: 'de-DE'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    const response = await page.goto(start.href);
    assert.equal(response.status(), 200);
    const answer = page.locator('.answer:enabled').first();
    const feedback = page.locator('#feedback');
    const title = page.locator('.question-title');
    await answer.waitFor();
    assert.equal(await page.locator('.answer').count(), 4);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const firstQuestion = await title.innerText();
    await answer.tap();
    await feedback.waitFor();
    const firstFeedback = await feedback.innerText();

    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope), start.href);
    // Stop the actual origin. Both browsers must now serve a previously unrequested URL from the offline cache.
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
    await assert.rejects(fetch(start), {name: 'TypeError'});
    await page.goto('about:blank');
    const offline = new URL('?wiederaufnahme', start);
    assert.equal((await page.goto(offline.href)).status(), 200);
    await feedback.waitFor();
    assert.equal(await title.innerText(), firstQuestion);
    assert.equal(await feedback.innerText(), firstFeedback);
    assert.equal(await page.locator('.answer:disabled').count(), 4);

    const next = page.locator('[data-action="next"]');
    for (let i = 1; i < 10; i++) {
      await next.tap();
      await answer.tap();
      await feedback.waitFor();
    }
    await next.tap();
    await page.locator('.score').waitFor();
    await page.locator('.nav-mobile [data-nav="topics"]').tap();
    await page.locator('.topic-card').first().waitFor();
    assert.equal(await page.locator('.topic-card').count(), 6);
    await page.locator('.topic-card').first().tap();
    await page.locator('[data-mode="challenge"]').tap();
    await answer.waitFor();
    assert.deepEqual(errors, []);
    console.log(`${name} · ${width}px · Tagesrunde, Offline-Neustart, Spielstand und anspruchsvolle Themenrunde bestanden`);
  } finally {
    if (server?.listening) {
      server.close();
      server.closeAllConnections();
    }
    await instance.close();
  }
}
