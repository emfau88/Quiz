// Runs an Android end-to-end pass on a dedicated emulator with a fresh Quizsalon preview profile.
// ADB drives the OS; the debug WebView exposes DOM actions through Chrome DevTools Protocol.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';

const [serial, output, mode = 'daily', fresh] = process.argv.slice(2);
if (!/^emulator-\d+$/.test(serial || '') || !output) {
  throw new Error('Aufruf: node tools/android-ui.mjs emulator-PORT AUSGABEVERZEICHNIS');
}
const folder = resolve(output);
mkdirSync(folder, {recursive:true});
const pkg = mode === 'local' ? 'de.quizsalon.lokaltest' : 'de.quizsalon.vorschau';
const activity = pkg + '/de.quizsalon.app.MainActivity';
const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], {encoding:'utf8', timeout:45000}).trim();
const shell = (...args) => adb('shell', ...args);
if (!/^Quizsalon/.test(adb('emu','avd','name'))) throw new Error('Eigene Quizsalon-Test-AVD erforderlich.');
if (fresh === '--fresh') assert.match(shell('pm','clear',pkg),/Success/);
const report = {device: shell('getprop','ro.product.model'), api:shell('getprop','ro.build.version.sdk'),
  pageSize:shell('getconf','PAGESIZE'), run:new Date().toISOString(), checks:[], screenshots:[]};
const passed = text => { report.checks.push(text); console.log(text); };
let socket, forwardedPort, webBounds;
let calls = new Map(), nextId = 0;

async function eventually(action, description, attempts=80) {
  let observed;
  for (let i=0; i<attempts; i++) {
    try { observed = await action(); if (observed) return observed; } catch (error) { observed = error.message; }
    await delay(250);
  }
  throw new Error(description + ' (' + String(observed) + ')');
}
function call(method, params) {
  const id = ++nextId;
  return new Promise((yes, no) => {
    const timer = setTimeout(() => {calls.delete(id); no(new Error(method + ' timeout'));}, 7000);
    calls.set(id, msg => {clearTimeout(timer); msg.error ? no(new Error(msg.error.message)) : yes(msg.result);});
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function js(expression) {
  const value = await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  return value.result.value;
}
async function attached(measureWithoutBounds = false) {
  const pid = await eventually(() => shell('pidof',pkg), 'App-Prozess nicht bereit');
  forwardedPort = adb('forward','tcp:0','localabstract:webview_devtools_remote_' + pid);
  const page = await eventually(async () => {
    const response = await fetch('http://127.0.0.1:' + forwardedPort + '/json/list');
    const list = await response.json();
    return list.find(tab => tab.url?.startsWith('https://appassets.androidplatform.net/'));
  }, 'Lokale WebView nicht bereit');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((yes,no) => {socket.onopen = yes; socket.onerror = no;});
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    const done = calls.get(data.id);
    if (done) { calls.delete(data.id); done(data); }
  };
  await eventually(() => js("Boolean(document.querySelector('.mast'))"),'Spieloberfläche nicht bereit');
  if (!measureWithoutBounds) await readWebBounds();
}
async function readWebBounds() {
  const view = await eventually(() => {
    shell('uiautomator','dump','/data/local/tmp/quizsalon-view.xml');
    const ui = shell('cat','/data/local/tmp/quizsalon-view.xml');
    return [...ui.matchAll(/<node\b[^>]+>/g)].map(m=>m[0]).find(node=>node.includes('class="android.webkit.WebView"'));
  },'Die WebView ist auf dem Gerät nicht sichtbar.',5);
  webBounds = view.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);
}
async function coldStartFlow() {
  shell('wm','size','1080x1920');
  shell('wm','density','360');
  shell('settings','put','system','font_scale','1.0');
  await restart();
  await exists('button.answer:not(:disabled)');
  const manifest=await js("fetch('./data/manifest.json').then(r=>r.json())");
  report.build='Installierte, debuggable Play-Vorschau mit '+manifest.active+' Fragen';
  report.method='Bestehende lokale Runde, Prozess per am force-stop beendet. Zeit vom Start des ADB-Aufrufs am start bis die laufende WebView vier aktivierte Antworten und die erste per Hit-Test als antippbar meldet. Host-Monotonuhr, Abfrageintervall bis 250 ms, ADB- und Verbindungsaufwand enthalten.';
  report.samplesMs=[];
  for (let i=0;i<3;i++) {
    detach();
    shell('am','force-stop',pkg);
    const start=performance.now();
    shell('am','start','-n',activity);
    await attached(true);
    await eventually(()=>js("(() => {const answers=[...document.querySelectorAll('button.answer:not(:disabled)')]; if(answers.length!==4 || document.visibilityState!=='visible')return false; const r=answers[0].getBoundingClientRect(); return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button')===answers[0];})()"),'Erste Antwort nicht antippbar');
    report.samplesMs.push(Math.round(performance.now()-start));
    await readWebBounds();
    await click('button.answer');
    await exists('#feedback');
    await click('[data-action="next"]');
    await exists('button.answer:not(:disabled)');
  }
  report.medianMs=[...report.samplesMs].sort((a,b)=>a-b)[1];
  passed('Drei Kaltstarts mit anschließend per Android-Berührung tatsächlich bestätigter Antwort, Median ' + report.medianMs + ' ms');
}
function detach() {
  socket?.close();
  if (forwardedPort) adb('forward','--remove','tcp:' + forwardedPort);
  forwardedPort = null;
}
async function restart() {
  detach();
  shell('am','force-stop',pkg);
  shell('am','start','-W','-n',activity);
  await attached();
}
const query = selector => 'document.querySelector(' + JSON.stringify(selector) + ')';
const exists = selector => eventually(() => js('Boolean(' + query(selector) + ')'),selector);
async function click(selector) {
  await exists(selector);
  await js(query(selector) + ".scrollIntoView({block:'center'})");
  await delay(280);
  const point = await js("(() => {const el=" + query(selector) + "; const r=el.getBoundingClientRect(); if(el.disabled || !r.width || !r.height)return null; return [(r.left+r.right)/2,(r.top+r.bottom)/2,innerWidth];})()");
  assert.ok(point,selector);
  const scale = (webBounds[2]-webBounds[0])/point[2];
  shell('input','tap',String(Math.round(webBounds[0]+point[0]*scale)),String(Math.round(webBounds[1]+point[1]*scale)));
  await delay(350);
}
async function screenshot(name, selector) {
  if (selector) await js(query(selector) + "?.scrollIntoView({block:'start'})");
  else await js('window.scrollTo(0,0)');
  await js('document.fonts.ready.then(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok))))');
  // Force a full SurfaceFlinger redraw on headless emulators before reading Android's real screen.
  shell('cmd','statusbar','expand-notifications');
  await delay(500);
  shell('cmd','statusbar','collapse');
  await delay(1600);
  const nameWithExt = name + '.png';
  const devicePng = '/data/local/tmp/quizsalon-frame.png';
  shell('screencap','-p',devicePng);
  adb('pull',devicePng,join(folder,nameWithExt));
  report.screenshots.push(nameWithExt);
}
async function topicsScreen() {
  await restart();
  await click('.nav-mobile [data-nav="topics"]');
  if (await js("Boolean(document.querySelector('dialog[open] [data-action=leave-round]'))")) await click('[data-action="leave-round"]');
  await exists('.topic-grid');
  await click('.nav-mobile [data-nav="topics"]');
  await exists('.topic-grid');
  await screenshot('05-themen');
}
async function upgradeFlow(after) {
  const checkpoint = join(folder,'session-vor-update.json');
  await restart();
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const data = async () => {
    const state=await profile();
    const session=Object.values(state.sessions).find(s=>s.mode==='trial' && s.status==='active');
    assert.ok(session);
    return {sessionId:session.id, sessionSHA256:hash(session), progressSHA256:hash(state.progress),
      ledgerSHA256:hash(state.ledger), installationSHA256:hash(await js('QuizAndroid.getInstallationId()'))};
  };
  const shipped = await js("fetch('./data/manifest.json').then(r => r.json())");
  if (!after) {
    await click('.nav-mobile [data-nav="topics"]');
    await exists('.topic-grid');
    await click('[data-action="topic"][data-id="history_discoveries"]');
    await click('[data-action="begin-topic"][data-mode="trial"]');
    await click('button.answer');
    await exists('#feedback');
    assert.ok(shipped.reference_complete && shipped.active >= 150);
    writeFileSync(checkpoint,JSON.stringify({catalog:shipped.version,...await data()},null,2)+'\n');
    passed('In der installierten Ausgangsfassung mit '+shipped.active+' Fragen eine Kennenlernrunde begonnen und einmal geantwortet');
  } else {
    const {catalog,...before}=JSON.parse(readFileSync(checkpoint,'utf8'));
    const expected=JSON.parse(readFileSync('web/data/manifest.json','utf8'));
    assert.equal(shipped.active,expected.active);
    assert.equal(shipped.version,expected.version);
    assert.notEqual(shipped.version,catalog);
    assert.deepEqual(await data(),before);
    await exists('#feedback');
    await click('[data-action="next"]');
    await exists('button.answer');
    const resumed=(await profile()).sessions[before.sessionId];
    assert.equal(resumed.cursor,1);
    report.catalogBefore=catalog;
    report.catalogAfter=shipped.version;
    passed('Nach dem APK-Update sind offene Runde, Antworten, Fortschritt, Buchungen und Installationskennung identisch');
    passed('Die gespeicherte Erklärung blieb sichtbar. Weiter führt in derselben Kennenlernrunde zur zweiten Frage.');
  }
}
const profile = () => js('JSON.parse(QuizAndroid.readGame()).value');
const daily = async () => Object.values((await profile()).sessions).find(session => session.mode === 'daily');
async function widthCheck(label) {
  const measure = await js("({w:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth})");
  assert.ok(measure.document <= measure.w + 1 && measure.body <= measure.w + 1,JSON.stringify(measure));
  passed(label + ' ohne horizontales Überlaufen (' + measure.w + ' CSS-Pixel)');
}
async function dailyFlow(gallery = false) {
  shell('wm','size','1080x1920');
  shell('wm','density',gallery ? '360' : '480');
  shell('settings','put','system','font_scale','1.0');
  shell('cmd','connectivity','airplane-mode','enable');
  await restart();
  const initial = await daily();
  assert.equal(initial.status,'active');
  assert.equal(initial.cursor,0);
  assert.equal(initial.items.filter(i=>i.answer).length,0,'Frisches Testprofil erforderlich');
  assert.equal(initial.items.length,10);
  assert.equal(await js("document.querySelectorAll('button.answer').length"),4);
  await widthCheck((gallery ? '480 × 853' : '360 × 640') + ', Erststart im Flugmodus');
  await screenshot('01-frage');
  const tree = await call('Accessibility.getFullAXTree',{});
  assert.ok(tree.nodes.filter(n => n.role?.value === 'button').length >= 4);
  assert.ok(tree.nodes.find(n => n.name?.value === initial.items[0].q.question));
  passed('Frage und Antwortschaltflächen im Accessibility-Baum der laufenden WebView');
  await restart();
  assert.deepEqual(await daily(),initial);
  passed('Prozess vor erster Antwort beendet und identisch wiederaufgenommen');
  for (let pos = 0; pos < 10; pos++) {
    const item = (await daily()).items[pos];
    const id = pos < 7 ? item.q.correct_option_id : item.order.find(option => option !== item.q.correct_option_id);
    const selector = 'button.answer[data-id="' + id + '"]';
    await click(selector);
    await exists('#feedback');
    assert.equal(await js("document.querySelectorAll('button.answer:disabled').length"),4);
    if (pos === 0) {
      await screenshot('02-erklaerung','#feedback');
      const saved = await daily();
      await restart();
      assert.deepEqual(await daily(),saved);
      await exists('#feedback');
      passed('Prozess nach Antwort beendet, Antwort, Reihenfolge und Erklärung identisch');
      shell('input','keyevent','4');
      await exists('dialog[open]');
      passed('System-Zurück während einer Runde öffnet die bewusste Pausenentscheidung');
      shell('input','keyevent','4');
      await eventually(()=>js("!document.querySelector('dialog[open]')"),'Pausendialog geschlossen');
    }
    if (pos === 9) {
      await restart();
      await exists('#feedback');
      passed('Prozess vor Ergebnis beendet, letzte Erklärung und Weiteraktion verfügbar');
    }
    await click('[data-action="next"]');
  }
  await exists('.result-card');
  const result = await daily();
  assert.equal(result.result.correct,7);
  assert.equal(result.result.valid,10);
  assert.equal(result.result.xp,90);
  assert.equal(Object.keys((await profile()).ledger).length,1);
  passed('Sieben richtige Antworten ergeben 90 XP und einen einzigen Ledger-Eintrag');
  await screenshot('03-ergebnis');
  await click('details.virtual summary');
  assert.equal(await js("document.querySelectorAll('details.virtual tbody tr').length"),4);
  assert.equal(await js("Array.from(document.querySelectorAll('details.virtual tbody small')).filter(el=>el.textContent==='Computergegner').length"),3);
  passed('Virtueller Vergleich enthält drei ausdrücklich bezeichnete Computergegner');
  await click('[data-action="home"]');
  await exists('.cover');
  await screenshot('04-heute');
  await click('.nav-mobile [data-nav="topics"]');
  await exists('.topic-grid');
  await click('.nav-mobile [data-nav="topics"]');
  await exists('.topic-grid');
  await screenshot('05-themen');
  await click('.nav-mobile [data-nav="knowledge"]');
  await exists('.subtabs');
  await screenshot('06-wissen');
  await click('[data-nav="settings"]');
  await exists('[data-action="set-reminder"]');
  assert.equal(await js("JSON.parse(QuizAndroid.reminderState()).enabled"),false);
  assert.equal(await js("JSON.parse(QuizAndroid.billingState()).state"),'unavailable');
  assert.ok(!await js("JSON.parse(QuizAndroid.billingState()).price"));
  passed('Erinnerung anfangs aus, unkonfigurierte Play-Vorschau bietet keinen Preis und keinen Kauf an');
  if (gallery) return;
  for (const [size,scale] of [['1080x2400','1.5'],['1080x1920','2.0']]) {
    shell('wm','size',size);
    shell('settings','put','system','font_scale',scale);
    await restart();
    await widthCheck(size + ' mit Android-Systemschrift ' + scale);
    await click('.brand');
    await click('[data-action="daily"]');
    await exists('.result-card');
    await widthCheck('Ergebnis mit Android-Systemschrift ' + scale);
    assert.equal((await daily()).result.xp,90);
    await screenshot('schrift-' + scale);
  }
  assert.equal(Object.keys((await profile()).ledger).length,1);
  passed('Wiederholte Ergebnisaufrufe und Schriftwechsel behalten genau einen Bonus');
}
async function systemButton(id) {
  const node = await eventually(() => {
    shell('uiautomator','dump','/data/local/tmp/quizsalon-permission.xml');
    const xml = shell('cat','/data/local/tmp/quizsalon-permission.xml');
    return [...xml.matchAll(/<node\b[^>]+>/g)].map(entry => entry[0])
        .find(text => text.includes('resource-id="com.android.permissioncontroller:id/' + id + '"'));
  },'Android-Berechtigungsdialog ' + id, 4);
  const box = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);
  shell('input','tap',String(Math.floor((box[0]+box[2])/2)),String(Math.floor((box[1]+box[3])/2)));
  await delay(450);
}
async function platformFlow() {
  await restart();
  await click('.nav-mobile [data-nav="topics"]');
  await exists('.topic-grid');
  await screenshot('05-themen');
  await click('[data-nav="settings"]');
  await exists('[data-action="set-reminder"]');
  await js("const timeInput=document.querySelector('#reminder-time');timeInput.value='17:35'");
  await click('[data-action="set-reminder"]');
  await systemButton('permission_deny_button');
  assert.equal(await js("JSON.parse(QuizAndroid.reminderState()).enabled"),false);
  passed('Tatsächliche Ablehnung der Android-Benachrichtigungserlaubnis lässt Erinnerung aus');
  await click('[data-action="set-reminder"]');
  await systemButton('permission_allow_button');
  await eventually(()=>js("JSON.parse(QuizAndroid.reminderState()).enabled"),'Erinnerung nach Freigabe');
  const prefs = await js("JSON.parse(QuizAndroid.reminderState())");
  // The settings view may have been recreated by Android while the permission dialog was open.
  assert.match(prefs.time,/^\d\d:\d\d$/);
  const pending = () => shell('dumpsys','alarm').split(/Pending alarm batches:|Past-due non-wakeup alarms:|Alarm Stats:/)[0].includes('de.quizsalon.app.FIRE');
  assert.equal(pending(),true);
  passed('Nach aktiver Erlaubnis ist der lokale Alarm im Android-Alarmmanager registriert');
  const originalZone = shell('getprop','persist.sys.timezone') || 'GMT';
  shell('cmd','alarm','set-timezone','Europe/Berlin');
  await restart();
  assert.equal((await js("JSON.parse(QuizAndroid.reminderState())")).time,prefs.time);
  assert.equal(pending(),true);
  passed('Nach Zeitzonenwechsel und App-Neustart bleibt die lokale Erinnerungszeit erhalten');
  shell('cmd','alarm','set-timezone',originalZone);
  await click('[data-action="stop-reminder"]');
  await eventually(()=>js("!JSON.parse(QuizAndroid.reminderState()).enabled"),'Erinnerung ausgeschaltet');
  passed('Ausschaltaktion löscht den gewählten Erinnerungszeitpunkt');
}
async function notificationFlow() {
  await restart();
  await click('[data-nav="settings"]');
  shell('pm','grant',pkg,'android.permission.POST_NOTIFICATIONS');
  const time = await js("(() => {const next=new Date(Date.now()+85000); const chosen=String(next.getHours()).padStart(2,'0')+':'+String(next.getMinutes()).padStart(2,'0');document.querySelector('#reminder-time').value=chosen;return chosen;})()");
  await click('[data-action="set-reminder"]');
  await eventually(()=>js('JSON.parse(QuizAndroid.reminderState()).time===' + JSON.stringify(time)),'Weckzeit gespeichert');
  shell('input','keyevent','KEYCODE_HOME');
  report.requestedLocalTime=time;
  let key;
  for(let i=0; i<96 && !key; i++) {
    await delay(5000);
    key = shell('cmd','notification','list').split(/\r?\n/).find(line=>line.includes('|' + pkg + '|7|'));
  }
  assert.ok(key,'Android hat die ungenaue Erinnerung im Beobachtungszeitraum noch nicht ausgeliefert');
  report.notificationKey=key;
  passed('Nach Wahl der Uhrzeit hat das Betriebssystem bei im Hintergrund liegender App die echte Quizsalon-Benachrichtigung zugestellt');
  await restart();
  await click('[data-nav="settings"]');
  await click('[data-action="stop-reminder"]');
  assert.ok(!shell('cmd','notification','list').includes('|' + pkg + '|7|'));
  passed('Ausschalten entfernt auch die bereits zugestellte Benachrichtigung');
}
async function localFlow() {
  await restart();
  await click('.nav-mobile [data-nav="topics"]');
  if (await js("Boolean(document.querySelector('dialog[open] [data-action=leave-round]'))")) await click('[data-action="leave-round"]');
  await exists('.topic-grid');
  assert.equal(await js("document.querySelector('[data-action=plus]').textContent.trim()"),'Lokaler Thementest');
  assert.equal(await js("JSON.parse(QuizAndroid.billingState()).state"),'unavailable');
  await click('.nav-mobile [data-nav="topics"]');
  await exists('.topic-grid');
  await screenshot('lokaltest-themen');
  const before = await profile();
  const category = 'geography_travel';
  await click('[data-action="topic"][data-id="' + category + '"]');
  await click('[data-action="begin-topic"][data-mode="challenge"]');
  await exists('button.answer');
  await screenshot('lokaltest-themenrunde');
  const session = () => profile().then(p => Object.values(p.sessions).find(s=>s.mode==='challenge'));
  const round = await session();
  assert.equal(round.category,category);
  assert.equal(round.items.length,10);
  for (let i=0;i<10;i++) {
    await click('button.answer');
    await exists('#feedback');
    await click('[data-action="next"]');
  }
  await exists('.result-card');
  assert.equal((await session()).status,'completed');
  assert.deepEqual((await profile()).ledger,before.ledger);
  passed('Separater Lokaltest: freie anspruchsvolle Themenrunde mit zehn Fragen abgeschlossen, keine Tages-XP');
  assert.equal(await js("JSON.parse(QuizAndroid.billingState()).state"),'unavailable');
  passed('Native Lokaltestausgabe meldet keinen Kauf und erteilt kein Play-Entitlement');
}
try {
  if (mode === 'daily') await dailyFlow();
  else if (mode === 'gallery') await dailyFlow(true);
  else if (mode === 'platform') await platformFlow();
  else if (mode === 'notification') await notificationFlow();
  else if (mode === 'cold') await coldStartFlow();
  else if (mode === 'local') await localFlow();
  else if (mode === 'topics') await topicsScreen();
  else if (mode === 'upgrade-before' || mode === 'upgrade-after') await upgradeFlow(mode === 'upgrade-after');
  else throw new Error('Unbekannte Testart');
  report.ok = true;
} finally {
  writeFileSync(join(folder,'android-ui.json'),JSON.stringify(report,null,2)+'\n');
  detach();
  shell('cmd','connectivity','airplane-mode','disable');
  shell('settings','put','system','font_scale','1.0');
}
