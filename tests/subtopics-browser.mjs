import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {chromium, devices} from 'playwright-core';
import {serve} from '../tools/serve.mjs';
import {RULES} from '../web/js/rules.js';

const day = '2026-11-24';
const out = 'release/qa/weiterspielen-0.4.0';
const screens = 'release/screenshots/weiterspielen-0.4.0';
const catalog = JSON.parse(await readFile('web/data/catalog.json', 'utf8'));
const executable = promisify(execFile);
await Promise.all([mkdir(out, {recursive: true}), mkdir(screens, {recursive: true})]);
let staged = process.argv[2];
if (!staged) {
  await mkdir('.cache/weiter-science', {recursive: true});
  staged = path.join(await mkdtemp('.cache/weiter-science/pages-'), 'Quiz');
  await executable(process.execPath, ['tools/package-web.mjs', '--pages', staged]);
}
const pages = await serve(0, {directory: path.resolve(staged), basePath: '/Quiz/'});
const regular = await serve();
const previewURL = 'http://127.0.0.1:' + pages.address().port + '/Quiz/';
const regularURL = 'http://127.0.0.1:' + regular.address().port + '/';
const browser = await chromium.launch({headless: true});
const errors = [], external = [];
const state = page => page.evaluate(async () => (await import('./js/storage.js')).readGame());
const access = page => page.evaluate(async () => (await import('./js/access.js')).themeAccess());
const selector = (mode, slug) => '#dialog [data-action="begin-topic"][data-mode="' + mode + '"][data-subtopic="' + slug + '"]';

async function captureDialog(page, name) {
  await page.evaluate(() => document.fonts.ready);
  // Mobile Chromium briefly paints the last tap over the next dialog.
  await page.waitForTimeout(450);
  await page.screenshot({path: path.join(screens, name), animations: 'disabled'});
}

async function profile(origin) {
  const context = await browser.newContext({...devices['Pixel 7'], viewport: {width: 390, height: 780},
    deviceScaleFactor: 1, locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block'});
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(origin).origin) external.push(r.url());
  });
  await page.clock.setFixedTime(new Date(day + 'T10:00:00+01:00'));
  return page;
}

async function showScope(page, category, subtopic = '') {
  await page.locator('[data-action="topic"][data-id="' + category + '"]').tap();
  if (subtopic) await page.locator('#dialog [data-action="topic-scope"][data-subtopic="' + subtopic + '"]').tap();
  const selected = page.locator('#dialog [data-action="topic-scope"][aria-pressed="true"]');
  assert.equal(await selected.getAttribute('data-subtopic'), subtopic);
}

async function finish(page, round) {
  for (const [i, item] of round.items.entries()) {
    await page.locator('#question').filter({hasText: item.q.question}).waitFor();
    const choice = i % 4 === 3 ? item.order.find(id => id !== item.q.correct_option_id) : item.q.correct_option_id;
    await page.locator('.answer[data-id="' + choice + '"]').tap();
    await page.locator('#feedback').waitFor();
    await page.locator('[data-action="next"]').tap();
  }
  await page.locator('.score').waitFor();
  const saved = (await state(page)).sessions[round.id];
  assert.equal(saved.status, 'completed');
  assert.equal(saved.result.valid, round.items.length);
  assert.equal(saved.result.correct, round.items.length - Math.floor(round.items.length / 4));
  return saved;
}

async function playTheme(page, category, slug, mode) {
  await page.locator(selector(mode, slug)).tap();
  await page.locator('.answer').first().waitFor();
  const round = Object.values((await state(page)).sessions).find(s => s.mode === mode && s.status === 'active');
  assert.equal(round.category, category);
  assert.equal(round.subtopic || '', slug);
  assert.equal(round.items.length, RULES.rounds[mode].length);
  assert.equal(new Set(round.items.map(i => i.q.fact_key)).size, round.items.length);
  const grades = ['easy','medium','hard'].map(level => round.items.filter(i => i.q.difficulty === level).length);
  assert.deepEqual(grades, RULES.rounds[mode].mix);
  for (const {q} of round.items) {
    assert.equal(q.category, category);
    if (slug) assert.ok(RULES.subtopics[slug].tags.some(t => q.tags.includes(t)), q.id);
  }
  const done = await finish(page, round);
  assert.equal(done.result.xp, 0);
  await page.locator('[data-action="themes"]').tap();
  return {category, subtopic: slug || null, mode, grades, score: done.result.correct, xp: done.result.xp,
    questions: round.items.map(({q}) => ({id: q.id, fact: q.fact_key, difficulty: q.difficulty,
      theme: q.tags.find(tag => tag.startsWith('thema_'))}))};
}

async function allVariants() {
  const page = await profile(previewURL), tested = [];
  await page.goto(previewURL + '#themen');
  await page.locator('.topic-card').first().waitFor();
  const billing = await access(page);
  assert.equal(billing.state, 'local');
  for (const [slug, topic] of Object.entries(RULES.subtopics)) {
    await showScope(page, topic.category, slug);
    const variants = await page.locator('#dialog [data-action="begin-topic"][data-subtopic="' + slug + '"]')
      .evaluateAll(els => els.map(el => el.dataset.mode));
    assert.deepEqual(variants, slug === 'tierverhalten' ? ['topic'] : ['topic', 'challenge']);
    if (slug === 'tierverhalten') {
      await page.locator(selector('challenge', '')).getByText(/Anspruchsvoll/).waitFor();
      await captureDialog(page, 'Unterthema-Tierverhalten.png');
    }
    for (const [i, mode] of variants.entries()) {
      if (i) await showScope(page, topic.category, slug);
      tested.push(await playTheme(page, topic.category, slug, mode));
    }
  }
  await showScope(page, 'nature_animals', 'tierverhalten');
  const fallback = await playTheme(page, 'nature_animals', '', 'challenge');
  assert.ok(fallback.questions.some(q => q.theme !== 'thema_tierverhalten'));
  const result = await state(page);
  assert.deepEqual(result.ledger, {});
  assert.deepEqual(result.trials, {});
  assert.equal(Object.values(result.progress).reduce((sum, p) => sum + p.count, 0), 60);
  await page.context().close();
  return {tested, fallback, learnedAnswers: 60, dailyAwards: 0, trialsUsed: 0, access: billing.state};
}

async function reservedWeather() {
  const page = await profile(previewURL);
  // This chosen device seed makes the normal daily selection reserve one of the three hard weather facts.
  await page.goto(previewURL + 'data/manifest.json');
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('quizsalon-lokaltest', 2);
    request.onupgradeneeded = () => request.result.createObjectStore('local');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('local', 'readwrite');
      tx.objectStore('local').put('abnahme-wetter-236', 'installation');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  }));
  await page.goto(previewURL);
  await page.locator('.answer').first().waitFor();
  const daily = Object.values((await state(page)).sessions).find(s => s.mode === 'daily');
  const reserved = daily.items.filter(i => i.q.difficulty === 'hard' && i.q.tags.includes('thema_wetter')).map(i => i.q.id);
  assert.ok(reserved.length > 0);
  await page.locator('.nav-mobile [data-nav="topics"]').tap();
  await showScope(page, 'nature_animals', 'wetter');
  assert.equal(await page.locator(selector('challenge', 'wetter')).count(), 0);
  await page.locator(selector('topic', 'wetter')).waitFor();
  await page.locator(selector('challenge', '')).waitFor();
  await captureDialog(page, 'Unterthema-Wetter-reserviert.png');
  await page.locator('#dialog .modal-close').tap();
  await page.locator('.nav-mobile [data-nav="today"]').tap();
  await page.locator('[data-action="daily"]').tap();
  await finish(page, daily);
  await page.locator('[data-action="themes"]').tap();
  await showScope(page, 'nature_animals', 'wetter');
  await page.locator(selector('challenge', 'wetter')).waitFor();
  await page.context().close();
  return {day, installationSeed: 'abnahme-wetter-236', daily: daily.id, reservedHard: reserved,
    whileReserved: ['topic'], afterRealDailyCompletion: ['topic','challenge']};
}

async function regularTrial() {
  const page = await profile(regularURL);
  await page.goto(regularURL + '#themen');
  await page.locator('.topic-card').first().waitFor();
  const billing = await access(page);
  assert.deepEqual([billing.allowed, billing.state], [false, 'unavailable']);
  await showScope(page, 'nature_animals', 'wetter');
  assert.equal(await page.locator('#dialog [data-action="begin-topic"]').count(), 0);
  await page.locator('#dialog [data-action="plus"]').tap();
  await page.getByRole('heading', {name: 'Quizsalon Plus', exact: true}).waitFor();
  await page.locator('#dialog .modal-close').tap();
  await showScope(page, 'nature_animals');
  await page.locator(selector('trial', '')).waitFor();
  await captureDialog(page, 'Kennenlernrunde-und-Plus.png');
  const trial = await playTheme(page, 'nature_animals', '', 'trial');
  const used = (await state(page)).trials.nature_animals;
  assert.ok(used);
  await page.reload();
  await showScope(page, 'nature_animals');
  assert.equal(await page.locator(selector('trial', '')).count(), 0);
  assert.equal(await page.locator('#dialog [data-action="begin-topic"]').count(), 0);
  await page.locator('#dialog [data-action="plus"]').waitFor();
  await page.context().close();
  return {state: billing.state, subtopicStartedWithoutEntitlement: false, parentTrial: trial,
    savedTrialId: used, freeTrialRemainedConsumedAfterReload: true};
}

async function isolatedEntitlements() {
  const page = await profile(regularURL);
  await page.goto(regularURL + 'data/manifest.json');
  const results = await page.evaluate(async ({day, applicationURL}) => {
    let response;
    globalThis.QuizAndroid = {billingState: () => response};
    const {themeAccess} = await import(new URL('js/access.js', applicationURL));
    const {newGame, startRound} = await import(new URL('js/engine.js', applicationURL));
    const catalog = await (await fetch(new URL('data/catalog.json', applicationURL))).json();
    const time = {day, now: day + 'T09:00:00Z', zone: 'Europe/Berlin', offset: -60};
    const observed = [];
    for (const claimed of ['unavailable','unknown','pending','not_entitled','entitled','revoked','error','malformed']) {
      response = claimed === 'malformed' ? '{' : JSON.stringify({state: claimed, allowed: true});
      const access = themeAccess(), state = newGame();
      let outcome;
      try {
        outcome = startRound(state, catalog, 'fachpruefung', time, {mode: 'topic', category: 'nature_animals',
          subtopic: 'wetter', entitled: access.allowed}).items.length;
      } catch (error) { outcome = error.code; }
      observed.push({supplied: claimed, interpreted: access.state, allowed: access.allowed, start: outcome});
    }
    return observed;
  }, {day, applicationURL: regularURL});
  for (const outcome of results) {
    assert.equal(outcome.allowed, outcome.supplied === 'entitled');
    assert.equal(outcome.start, outcome.allowed ? 10 : 'PLUS');
  }
  await page.context().close();
  return {scope: 'Unveränderte Produktionsmodule access.js und engine.js in isoliertem Browserdokument. ' +
      'Die Testbrücke liefert Statuswerte. Hier wurde keine Google-Play-Transaktion ausgeführt.', results};
}

try {
  const variants = await allVariants();
  const weather = await reservedWeather();
  const regularAccess = await regularTrial();
  const entitlement = await isolatedEntitlements();
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  const report = {at: new Date().toISOString(), catalog: catalog.version, browser: browser.version(),
    viewport: [390, 780], variants, weather, regularAccess, entitlement, errors, external};
  await writeFile(path.join(out, 'themen.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Fünf Unterthemenvarianten, Ausweichrunde, Wetterreservierung, Kennenlernrunde und acht isolierte Kaufstatus geprüft.');
} finally {
  await browser.close();
  for (const server of [regular, pages]) { server.close(); server.closeAllConnections(); }
}
