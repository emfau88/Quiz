import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import {chromium, devices, webkit} from 'playwright-core';
import {serve} from '../tools/serve.mjs';

const directory = path.resolve(process.argv[2]);
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const basePath = '/Quiz/';
const phones = {
  chromium: {browser: chromium, device: 'Pixel 7', width: 360},
  webkit: {browser: webkit, device: 'iPhone 13', width: 390}
};
const temporary = path.resolve(os.tmpdir());
const newProfile = () => mkdtemp(path.join(temporary, 'quizsalon-pages-'));
async function removeProfile(profile) {
  if (profile && path.dirname(path.resolve(profile)) === temporary && path.basename(profile).startsWith('quizsalon-pages-')) {
    await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:120});
  }
}

async function persistentRestart(name, browser, device, width) {
  const profile = await newProfile();
  const options = {...devices[device], viewport:{width,height:740}, locale:'de-DE'};
  const server = await serve(0, {directory,basePath});
  const start = new URL(basePath, 'http://127.0.0.1:' + server.address().port);
  let context;
  try {
    context = await browser.launchPersistentContext(profile, options);
    let page = context.pages()[0] || await context.newPage();
    await page.goto(start.href);
    await page.locator('.answer:enabled').first().tap();
    await page.locator('#feedback').waitFor();
    const saved = await page.locator('#feedback').innerText();
    const question = await page.locator('.question-title').innerText();
    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
    await assert.rejects(fetch(start), {name:'TypeError'});
    await context.close();
    context = await browser.launchPersistentContext(profile, options);
    page = context.pages()[0] || await context.newPage();
    const response = await page.goto(new URL('?installationsneustart', start).href, {waitUntil:'commit'});
    assert.equal(response.status(), 200);
    await page.locator('#feedback').waitFor();
    assert.equal(await page.locator('#feedback').innerText(), saved);
    assert.equal(await page.locator('.question-title').innerText(), question);
    assert.equal(await page.locator('.answer:disabled').count(), 4);
    await page.waitForLoadState('load');
    await page.locator('[data-action="next"]').tap();
    await page.locator('.answer:enabled').first().waitFor();
    console.log(`${name} · dauerhafte Installation nach Prozessende ohne Origin neu geöffnet und weitergespielt`);
  } finally {
    await context?.close();
    if (server.listening) { server.closeAllConnections();server.close(); }
    await removeProfile(profile);
  }
}

for (const name of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(phones)) {
  const {browser, device, width} = phones[name];
  // The Windows WebKit private test port can stall when immediately re-entering the last origin it discarded.
  // A real process restart with an installed profile also proves that the worker and answers survive process loss.
  const profile = name === 'webkit' && process.platform === 'win32' ? await newProfile() : null;
  const instance = profile ? null : await browser.launch();
  let server, context;
  try {
    server = await serve(0, {directory, basePath});
    const start = new URL(basePath, 'http://127.0.0.1:' + server.address().port);
    const options = {...devices[device], viewport: {width, height: 740}, locale: 'de-DE'};
    const errors = [];
    let page, answer, feedback, title;
    async function openPhone() {
      context = profile ? await browser.launchPersistentContext(profile, options) : await instance.newContext(options);
      page = context.pages()[0] || await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      answer = page.locator('.answer:enabled').first();
      feedback = page.locator('#feedback');
      title = page.locator('.question-title');
    }
    await openPhone();

    const playLink = new URL('spielen.html?v=' + version, start);
    const response = await page.goto(playLink.href);
    assert.equal(response.status(), 200);
    await page.waitForURL(url => url.pathname === start.pathname);
    const formats = [];
    async function recordFormat() {
      formats.push(await page.locator('#question-format').allTextContents().then(labels => labels.join(' ')));
      const source = page.locator('#feedback a[href^="https://"]');
      if (formats.at(-1).includes('Aus der Forschung')) assert.equal(await source.count(), 1);
    }
    async function checkPhoneLayout() {
      const {scrollWidth, visibleWidth, clipped} = await page.evaluate(() => {
        const root = document.documentElement;
        const visibleWidth = window.visualViewport?.width ?? root.clientWidth;
        const clipped = [...document.querySelectorAll('.question-title, .answer, .answer-text')].filter(el => {
          const box = el.getBoundingClientRect();
          return box.left < -1 || box.right > visibleWidth + 1 || el.scrollWidth > el.clientWidth + 1;
        }).map(el => el.className);
        return {scrollWidth: root.scrollWidth, visibleWidth, clipped};
      });
      // The configured phone width stays fixed. Windows WebKit subtracts a gutter from innerWidth;
      // mobile Chromium can instead grow innerWidth when a descendant overflows.
      assert.ok(scrollWidth <= width + 1, `${name}: document ${scrollWidth}px, configured viewport ${width}px`);
      assert.deepEqual(clipped, [], `${name}: question or answers extend beyond the visible ${visibleWidth}px`);
    }
    await answer.waitFor();
    assert.equal(await page.locator('.answer').count(), 4);
    await checkPhoneLayout();
    await page.evaluate(() => document.fonts.ready);
    await checkPhoneLayout();
    const firstQuestion = await title.innerText();
    await answer.tap();
    await feedback.waitFor();
    const firstFeedback = await feedback.innerText();
    await recordFormat();

    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope), start.href);
    // Stop the actual origin. Both browsers must now serve a previously unrequested URL from the offline cache.
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
    await assert.rejects(fetch(start), {name: 'TypeError'});
    await page.goto('about:blank');
    if (profile) {
      await context.close();
      context = null;
      await openPhone();
    }
    const offline = new URL('?wiederaufnahme', start);
    assert.equal((await page.goto(offline.href, {waitUntil:'commit'})).status(), 200);
    await feedback.waitFor();
    await page.waitForLoadState('load');
    assert.equal(await title.innerText(), firstQuestion);
    assert.equal(await feedback.innerText(), firstFeedback);
    assert.equal(await page.locator('.answer:disabled').count(), 4);

    const next = page.locator('[data-action="next"]');
    for (let i = 1; i < 10; i++) {
      await next.tap();
      await answer.tap();
      await feedback.waitFor();
      await recordFormat();
    }
    assert.equal(formats.filter(label => label.includes('Schätzfrage')).length, 1);
    assert.equal(formats.filter(label => label.includes('Zum Herleiten')).length, 2);
    await next.tap();
    await page.locator('.score').waitFor();
    await page.locator('.nav-mobile [data-nav="topics"]').tap();
    await page.locator('.topic-card').first().waitFor();
    assert.equal(await page.locator('.topic-card').count(), 6);
    const images = await page.locator('.topic-card img').evaluateAll(imgs => Promise.all(imgs.map(async img => {
      await img.decode();
      return img.naturalWidth;
    })));
    assert.deepEqual(images, Array(6).fill(720));
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
    await context?.close();
    await instance?.close();
    await removeProfile(profile);
  }
  if (!profile) await persistentRestart(name, browser, device, width);
}
