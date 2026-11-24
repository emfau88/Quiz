import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const save = (path, data) => writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const button = name => '[data-action="'+name+'"]';
const learning = state => Object.values(state.progress).reduce((sum,item)=>sum+item.count,0);
const orderedDeck = round => round.items.map(({q,order})=>({id:q.id,content:q.content_revision,semantic:q.semantic_revision,order}));
const names = round => round.opponents.map(person=>person.name);
const facts = round => round.items.map(item=>item.q.fact_key);
const active = async (ui,mode) => {
  const rounds=Object.values((await ui.profile()).sessions).filter(round=>round.mode===mode && round.status==='active');
  assert.equal(rounds.length,1,mode);
  return rounds[0];
};
const billing = ui => ui.js('JSON.parse(QuizAndroid.billingState()).state');

async function update(before, ui) {
  const {restart, js, exists, click, profile, passed, report, shell, folder, pkg} = ui;
  const checkpoint = join(folder,'spielstand-vor-update.json');
  await restart();
  const version = shell('dumpsys','package',pkg).match(/versionName=([^\s]+)/)[1];
  assert.equal(version,before?'0.3.0':'0.4.0');
  let originalZone;
  if (before) {
    if (process.argv.includes('--seed-history')) {
      const first=await active(ui,'daily');
      await play(ui,first,4);
      originalZone=shell('getprop','persist.sys.timezone')||'GMT';
      const other=['Pacific/Kiritimati','Pacific/Pago_Pago'].find(zone=>
        new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date())!==first.day);
      assert.ok(other);
      shell('cmd','alarm','set-timezone',other);
      await restart();
    }
    await click('.brand');
    await click('[data-action="daily"]');
    await exists('button.answer:not(:disabled)');
    await click('button.answer:not(:disabled)');
    await exists('#feedback');
    await click('.nav-mobile [data-nav="topics"]');
    await click('[data-action="topic"][data-id="history_discoveries"]');
    await click('[data-action="begin-topic"][data-mode="trial"]');
    await click('button.answer');
    await exists('#feedback');
  }
  const state = await profile();
  // Compare the actual display names, all previously rolled hits and their sums. The
  // new version can add persistent portrait IDs to the legacy snapshots.
  const originalTable = round => round.opponents.map(({name,hits,correct})=>({name,hits,correct}));
  const sessions = Object.values(state.sessions);
  const daily = sessions.find(round => round.mode === 'daily' && round.status === 'active');
  const trial = sessions.find(round => round.mode === 'trial' && round.status === 'active');
  assert.ok(daily && trial);
  assert.equal(daily.opponents.length,3);
  assert.ok(daily.items[0].answer && trial.items[0].answer);
  assert.equal(state.trials.history_discoveries,trial.id);
  const observations = {
    dailyId:daily.id, trialId:trial.id, totalSessions:sessions.length,
    dailyItemsSHA256:hash(daily.items), trialItemsSHA256:hash(trial.items),
    table:originalTable(daily), trials:state.trials, ledger:state.ledger,
    progressSHA256:hash(state.progress), awardsSHA256:hash(state.awards),
    installationSHA256:hash(await js('QuizAndroid.getInstallationId()')),
    lastView:state.lastView, dailyCursor:daily.cursor, trialCursor:trial.cursor,
  };
  assert.ok(observations.table.every(person=>person.hits.length===10));
  const manifest = await js("fetch('./data/manifest.json').then(r=>r.json())");
  if (before) {
    save(checkpoint,{run:new Date().toISOString(),version,catalog:manifest.version,originalZone,observations});
    const backup=process.argv.find(arg=>arg.startsWith('--save-profile='));
    if (backup) save(backup.slice(15),await js('JSON.parse(QuizAndroid.readGame())'));
    passed('0.3.0 mit offener Tagesrunde und Kennenlernrunde. Beide ersten Antworten über die Oberfläche gespeichert. Figuren und alle 30 simulierten Treffer, verbrauchte Probe, bisherige Tagesbuchungen und Fortschritt gesichert.');
    return;
  }
  const old = JSON.parse(readFileSync(checkpoint,'utf8'));
  assert.deepEqual(observations,old.observations);
  await exists('#feedback');
  await click('[data-action="next"]');
  await exists('button.answer:not(:disabled)');
  assert.equal((await profile()).sessions[trial.id].cursor,1);
  report.versionBefore=old.version;
  report.versionAfter=version;
  report.catalogBefore=old.catalog;
  report.catalogAfter=manifest.version;
  report.observations=observations;
  const registrations=await js("('serviceWorker' in navigator) ? navigator.serviceWorker.getRegistrations().then(all=>all.map(reg=>reg.scope)) : []");
  assert.deepEqual(registrations,[]);
  report.nativeServiceWorkers=registrations;
  passed('Das installierte Update erhält die beiden offenen Runden samt Karten und Antworten, alle 30 Treffer der drei alten Computergegner, lokale Kennung, bisherige Tagesbuchungen und verbrauchte Probe.');
  passed('Android zeigt die gespeicherte Erklärung. Weiter öffnet Frage zwei der identischen Kennenlernrunde.');
  if(old.originalZone) shell('cmd','alarm','set-timezone',old.originalZone);
}

async function rankedScreen(ui) {
  const {restart,profile,click,js,exists,screenshot,passed}=ui;
  await restart();
  if (!(await profile()).settings.comparison) {
    await click('[data-nav="settings"]');
    await click('[data-setting="comparison"]');
  }
  const rounds=Object.values((await profile()).sessions);
  const tied=rounds.find(round=>round.mode==='quick' && round.status==='completed' &&
    round.opponents.some(guest=>guest.correct===round.result.correct));
  assert.ok(tied);
  await click('.nav-mobile [data-nav="knowledge"]');
  await click('[data-action="tab"][data-id="history"]');
  await click('[data-action="open-session"][data-id="'+tied.id+'"]');
  await exists('.result-card');
  await checkTable(ui);
  const layout=await js("(()=>{const table=document.querySelector('details.virtual table');const counts=[...table.querySelectorAll('thead th')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length});const info=[...table.querySelectorAll('.ranking-person small')].map(e=>({label:e.textContent,display:getComputedStyle(e).display}));return {counts,info}})()");
  assert.deepEqual(layout.counts,[1,1,1]);
  assert.ok(layout.info.every(row=>row.display==='block' && row.label));
  await screenshot('rangtisch','details.virtual');
  ui.report.session=tied.id;
  ui.report.layout=layout;
  passed('Bei 360 dp bleiben alle drei Spaltenüberschriften einzeilig, Namen und Fachgebiete stehen in getrennten Zeilen. Geteilte Plätze sind in der gespeicherten Runde sichtbar.');
}

async function play(ui, round, score, interruptAfter = 0) {
  for (let i=0; i<round.items.length; i++) {
    const item=round.items[i];
    const chosen=i<score?item.q.correct_option_id:item.order.find(id=>id!==item.q.correct_option_id);
    await ui.click('button.answer[data-id="'+chosen+'"]');
    await ui.exists('#feedback');
    if (i+1===interruptAfter) {
      const saved=(await ui.profile()).sessions[round.id];
      assert.equal(saved.items[i].answer.optionId,chosen);
      ui.shell('cmd','connectivity','airplane-mode','enable');
      assert.equal(ui.shell('settings','get','global','airplane_mode_on'),'1');
      await ui.restart();
      await ui.exists('#feedback');
      assert.deepEqual((await ui.profile()).sessions[round.id],saved);
      ui.passed('Abbruch nach Antwort '+(i+1)+', Flugmodus, Prozessneustart zur gespeicherten Erklärung. Karten, Reihenfolge, Antwort und Quiztisch stimmen überein.');
    }
    await ui.click(button('next'));
  }
  await ui.exists('.result-card');
  const result=(await ui.profile()).sessions[round.id];
  assert.equal(result.status,'completed');
  assert.equal(result.result.valid,round.items.length);
  assert.equal(result.result.correct,score);
  return result;
}

async function checkTable(ui) {
  await ui.click('details.virtual summary');
  assert.match(await ui.js("document.querySelector('details.virtual caption').textContent"),/drei Computergegner/i);
  const rows=await ui.js("Array.from(document.querySelectorAll('details.virtual tbody tr'),row=>({rank:parseInt(row.firstElementChild.textContent),score:Number(row.lastElementChild.textContent)}))");
  assert.equal(rows.length,4);
  for (const row of rows) assert.equal(row.rank,1+rows.filter(other=>other.score>row.score).length);
  return rows;
}

async function shareSheet(ui,textPart) {
  const current=()=>ui.shell('dumpsys','activity','activities').split(/\r?\n/).filter(line=>/topResumedActivity=|mResumedActivity:/.test(line)).join(' ');
  assert.match(current(),/de\.quizsalon\.vorschau/);
  const before=await ui.profile();
  await ui.click(button('system-share'));
  const chooser=await ui.eventually(()=>{const active=current();return /ChooserActivity/.test(active)&&active;},'Android-Teilen-Menü nicht geöffnet',12);
  ui.report.sharesheet=chooser.trim();
  ui.shell('uiautomator','dump','/data/local/tmp/quizsalon-sharesheet.xml');
  const tree=ui.shell('cat','/data/local/tmp/quizsalon-sharesheet.xml');
  assert.ok(tree.includes(textPart),'Android-Inhaltsvorschau fehlt: '+textPart);
  await delay(300);
  ui.screenCapture('systemmenue');
  ui.shell('input','keyevent','4');
  await ui.eventually(()=>/de\.quizsalon\.vorschau/.test(current()),'Rückkehr zur App');
  await ui.exists('dialog[open] #share-value');
  assert.deepEqual(await ui.profile(),before);
  ui.passed('Erst die Teilen-Schaltfläche öffnete das echte Android Sharesheet. Systemvorschau enthielt den freigegebenen Text. Android-Zurück führte zum unveränderten Dialog und Spielstand.');
}

async function confirmClipboard(ui,value) {
  await ui.click(button('copy-share'));
  await ui.eventually(()=>ui.js("document.querySelector('#copy-status')?.textContent.includes('kopiert')"),'Kopierbestätigung');
  // A read-only native clipboard check would require Android privileges. Paste with
  // the real Android key event into a temporary inspector-only editable field.
  await ui.js("(()=>{const field=document.createElement('textarea');field.id='qa-android-paste';document.querySelector('dialog[open]').append(field);field.focus();return true})()");
  try {
    ui.shell('input','keyevent','KEYCODE_PASTE');
    assert.equal(await ui.eventually(()=>ui.js("document.querySelector('#qa-android-paste').value"),'Native Zwischenablage lieferte keinen Text',12),value);
  } finally { await ui.js("document.querySelector('#qa-android-paste')?.remove()"); }
  ui.passed('Über die Kopieraktion in die native Android-Zwischenablage geschrieben und per Android-Einfügetaste vollständig wieder gelesen.');
}

async function regular(ui) {
  const {restart, js, click, exists, screenshot, profile, passed, report, shell, folder}=ui;
  shell('wm','size','1080x1920');
  shell('wm','density','480');
  await restart();
  await click('.brand');
  await exists('.cover');
  await click(button('daily'));
  await exists('.result-card');
  await ui.widthCheck('Tagesergebnis mit 360 dp');
  await screenshot('01-tagesergebnis');
  const baseline=await profile(), initialBilling=await billing(ui);
  assert.notEqual(initialBilling,'entitled');
  const daily=Object.values(baseline.sessions).find(s=>s.mode==='daily' && s.status==='completed');
  assert.ok(daily);
  const rounds=[];
  let previous=daily;
  for (let index=0;index<4;index++) {
    const rematch=index===3;
    await click(button(rematch?'rematch':'quick'));
    await exists('button.answer:not(:disabled)');
    const round=await active(ui,'quick');
    assert.equal(round.items.length,5);
    assert.equal(new Set(facts(round)).size,5);
    assert.equal(new Set(round.items.map(i=>i.q.category)).size,5);
    assert.ok(facts(round).every(key=>!facts(previous).includes(key)));
    assert.equal(new Set(names(round)).size,3);
    if (rematch) {
      assert.equal(round.rematchOf,previous.id);
      assert.deepEqual(names(round),names(previous));
    } else assert.ok(names(round).some(person=>!names(previous).includes(person)));
    assert.deepEqual(await js("Array.from(document.querySelectorAll('#guest-list strong'),el=>el.textContent)"),names(round));
    assert.equal(await js("document.querySelector('#guest-heading').textContent"),'Heute am Tisch mit drei Computergegnern');
    if(index===0) await screenshot('02-kurzrunde-und-quiztisch');
    const completed=await play(ui,round,index===1?round.opponents[0].correct:index===0?4:3,index===0?2:0);
    assert.equal(completed.result.xp,0);
    if(index===0) {
      await screenshot('03-kurzergebnis');
      await click(button('invite-friend'));
      await exists('dialog[open] #share-value');
      const link=await js("document.querySelector('#share-value').value");
      assert.match(link,/^https:\/\/emfau88\.github\.io\/Quiz\/spielen\.html#freunde\/1\/4\//);
      save(join(folder,'einladung.json'),{link,day:round.day,senderScore:4,deck:orderedDeck(round),installationSHA256:hash(await js('QuizAndroid.getInstallationId()'))});
      await screenshot('04-einladung');
      await shareSheet(ui,'Schaffst du meine 4 von 5?');
      await confirmClipboard(ui,link);
      await click('dialog[open] '+button('close'));
    }
    const rows=await checkTable(ui);
    if(index===1) {
      assert.ok(new Set(rows.map(row=>row.rank)).size<4);
      await screenshot('05-quiztisch-und-revanche','details.virtual');
    }
    rounds.push({id:round.id,questions:round.items.map(i=>i.q.id),table:names(round),rows,score:completed.result.correct,rematchOf:round.rematchOf||null});
    previous=round;
  }
  const after=await profile();
  assert.deepEqual(after.trials,baseline.trials);
  assert.deepEqual(after.ledger,baseline.ledger);
  assert.equal(await billing(ui),initialBilling);
  assert.equal(learning(after)-learning(baseline),20);
  report.rounds=rounds;
  report.dayBookings=after.ledger;
  report.trials=after.trials;
  report.billing=initialBilling;
  passed('Drei gewöhnliche Fünferrunden direkt vom Ergebnis, anschließend eine Revanche mit denselben drei Computergegnern und fünf neuen Sachverhalten. Jede neue normale Besetzung änderte sich. Gleiche Treffer teilten denselben Platz.');
  passed('20 eigene Zusatzantworten im Lernstand, identische Tagesbuchungen, Themenproben und Kaufstatus der regulären Vorschau.');
  await click(button('themes'));
  await exists('.topic-grid');
  await screenshot('06-themenwahl');
  await click('[data-action="topic"][data-id="nature_animals"]');
  await click('[data-action="topic-scope"][data-subtopic="wetter"]');
  assert.ok(!await js("document.querySelector('dialog [data-action=begin-topic]')"));
  await exists('dialog '+button('plus'));
  await screenshot('07-wetter-plus');
  await click('dialog '+button('close'));
  await click('[data-nav="settings"]');
  await click('[data-setting="comparison"]');
  assert.equal((await profile()).settings.comparison,false);
  await click('.brand');
  await click(button('quick'));
  await exists('button.answer:not(:disabled)');
  assert.ok(!await js("document.querySelector('#guest-heading')"));
  const hidden=await active(ui,'quick');
  await play(ui,hidden,2);
  assert.ok(!await js("document.querySelector('details.virtual, [data-action=rematch]')"));
  passed('Ergebnis → Thema wählen → Wetter führt zum echten Plus-Angebot. Nach Ausschalten des Vergleichs bleiben Quiztisch und Revanche bei der nächsten vollständig gespielten Kurzrunde ausgeblendet.');
}

async function localTopics(ui) {
  const {restart,click,js,exists,screenshot,report,passed}=ui;
  await restart();
  const daily=await active(ui,'daily');
  await play(ui,daily,6);
  const baseline=await ui.profile();
  const rules=JSON.parse(readFileSync('specs/product_rules.json','utf8'));
  report.variants=[];
  for (const [scope,topic] of Object.entries(rules.subtopics)) {
    const expected=scope==='tierverhalten'?['topic']:['topic','challenge'];
    for (const mode of expected) {
      await click(button('themes'));
      await click('[data-action="topic"][data-id="'+topic.category+'"]');
      await click('[data-action="topic-scope"][data-subtopic="'+scope+'"]');
      const shown=await js("Array.from(document.querySelectorAll('dialog [data-action=begin-topic]'),el=>({mode:el.dataset.mode,scope:el.dataset.subtopic}))");
      assert.deepEqual(shown.filter(o=>o.scope===scope).map(o=>o.mode).sort(),[...expected].sort());
      assert.ok(!shown.some(r=>r.mode==='trial'));
      if (scope==='tierverhalten') assert.ok(shown.some(r=>r.scope==='' && r.mode==='challenge'));
      if (mode==='topic') await screenshot('unterthema-'+scope);
      await click('[data-action="begin-topic"][data-mode="'+mode+'"][data-subtopic="'+scope+'"]');
      await exists('button.answer:not(:disabled)');
      const round=await active(ui,mode);
      assert.equal(round.subtopic,scope);
      assert.equal(round.category,topic.category);
      assert.equal(round.items.length,10);
      assert.ok(round.items.every(({q})=>q.category===topic.category && topic.tags.some(tag=>q.tags.includes(tag))));
      const mix=['easy','medium','hard'].map(level=>round.items.filter(i=>i.q.difficulty===level).length);
      assert.deepEqual(mix,rules.rounds[mode].mix);
      const result=await play(ui,round,7);
      report.variants.push({scope,mode,mix,cards:round.items.map(i=>i.q.id),result:result.result});
      passed(topic.label+' · '+mode+' bis zum Ergebnis. Alle zehn Sachverhalte mit passendem redaktionellen Thema und exakter Schwierigkeitsmischung.');
    }
  }
  const after=await ui.profile();
  assert.deepEqual(after.trials,baseline.trials);
  assert.deepEqual(after.ledger,baseline.ledger);
  assert.equal(await billing(ui),'unavailable');
  assert.equal(learning(after)-learning(baseline),50);
  passed('50 eigene Antworten in fünf angebotenen Unterthemenvarianten. Tierverhalten verweist für anspruchsvoll auf die Hauptrubrik. Die lokale Ausgabe meldet weiterhin keinen Play-Besitz.');
}

async function localFinish(ui) {
  const {restart,click,js,exists,report,passed}=ui;
  await restart();
  await click('.nav-mobile [data-nav="topics"]');
  await click('[data-action="topic"][data-id="nature_animals"]');
  await click('[data-action="topic-scope"][data-subtopic="wetter"]');
  await click('[data-action="begin-topic"][data-mode="topic"][data-subtopic="wetter"]');
  await exists('button.answer:not(:disabled)');
  const first=await active(ui,'topic');
  assert.ok(first.items.every(i=>i.q.tags.includes('thema_wetter')));
  const state=await ui.profile();
  const result=await play(ui,first,8);
  assert.equal(learning(await ui.profile())-learning(state),10);
  assert.equal(result.result.xp,0);
  assert.equal(await billing(ui),'unavailable');
  report.assets={};
  for (const asset of ['sw.js','styles.css']) {
    const installed=await js("fetch("+JSON.stringify('./'+asset)+").then(r=>r.arrayBuffer()).then(b=>crypto.subtle.digest('SHA-256',b)).then(b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join(''))");
    const expected=createHash('sha256').update(readFileSync('web/'+asset)).digest('hex');
    assert.equal(installed,expected);
    report.assets[asset]=installed;
  }
  report.questions=orderedDeck(first);report.result=result.result;
  passed('Endgültiges Lokaltest-APK: zehn Wetterfragen über die sichtbare Themenwahl bis 8/10 gespielt. Zehn Lernbuchungen, keine Tages-XP, kein Play-Besitz. Die zur Laufzeit ausgelieferten Stylesheet- und Worker-Bytes entsprechen dem Abgabestand.');
}

async function recipient(ui) {
  const {js,exists,click,restart,profile,report,shell,screenshot,passed}=ui;
  const option=process.argv.find(arg=>arg.startsWith('--invite='));
  assert.ok(option,'--invite=<erspielte-Einladung.json> erforderlich');
  const source=JSON.parse(readFileSync(option.slice(9),'utf8'));
  const zone=shell('getprop','persist.sys.timezone')||'GMT';
  const auto=shell('settings','get','global','auto_time_zone');
  try {
    shell('settings','put','global','auto_time_zone','0');
    // Choose the date opposite to the sender on a device with a real system clock.
    const zoneDate=t=>new Intl.DateTimeFormat('sv-SE',{timeZone:t}).format(new Date());
    const target=['Pacific/Kiritimati','Pacific/Pago_Pago'].find(z=>zoneDate(z)!==source.day);
    assert.ok(target);
    shell('cmd','alarm','set-timezone',target);
    await restart();
    const before=await profile(), oldBilling=await billing(ui);
    const deviceHash=hash(await js('QuizAndroid.getInstallationId()'));
    assert.notEqual(deviceHash,source.installationSHA256);
    const open=async hash=>{await js('location.hash='+JSON.stringify(hash));await exists('.invitation-card');};
    const fragment=new URL(source.link).hash;
    await open(fragment);
    await exists(button('begin-friend'));
    const preview=await profile();
    assert.deepEqual(preview.progress,before.progress);
    assert.deepEqual(preview.ledger,before.ledger);
    assert.deepEqual(preview.trials,before.trials);
    assert.deepEqual(preview.sessions,before.sessions);
    assert.equal(await billing(ui),oldBilling);
    await screenshot('01-einladung');
    await click(button('begin-friend'));
    await exists('button.answer:not(:disabled)');
    const round=await active(ui,'friend');
    assert.notEqual(round.day,source.day);
    assert.deepEqual(orderedDeck(round),source.deck);
    assert.equal(round.friendScore,source.senderScore);
    const complete=await play(ui,round,3,2);
    await exists('.friend-result');
    assert.equal(await js("document.querySelector('.result-card .score').textContent.trim()"),'3 von 5');
    assert.equal(await js("document.querySelector('.friend-result strong').textContent"),'4 von 5');
    await screenshot('02-euer-vergleich','.result-card .score');
    await click(button('reply-friend'));
    await exists('dialog textarea#share-value');
    const text=await js("document.querySelector('#share-value').value");
    assert.match(text,/3 von 5.*4 von 5/);
    await shareSheet(ui,'Ich habe im Quizsalon 3 von 5');
    await confirmClipboard(ui,text);
    await click('dialog '+button('close'));
    const saved=await profile();
    assert.deepEqual(saved.ledger,before.ledger);
    assert.deepEqual(saved.trials,before.trials);
    assert.equal(learning(saved)-learning(before),5);
    assert.equal(complete.result.xp,0);
    await js('location.hash='+JSON.stringify(fragment));
    await ui.eventually(()=>js("location.hash.startsWith('#ergebnis/')"),'Wiedergeöffnete Einladung führt zum alten Ergebnis');
    await exists('.friend-result');
    assert.deepEqual((await profile()).progress,saved.progress);
    assert.deepEqual((await profile()).sessions[round.id],complete);
    await open('#freunde/1/4/beschaedigt');
    assert.match(await js("document.querySelector('.invitation-card').textContent"),/nicht spielbar/);
    await exists(button('quick'));
    assert.ok(!await js("document.querySelector('[data-action=begin-friend]')"));
    report.senderDay=source.day;report.receiverDay=round.day;report.receiverInstallationSHA256=deviceHash;
    report.deck=orderedDeck(round);report.sentScore=source.senderScore;report.ownResult=complete.result;
    report.browserResolution=shell('cmd','package','resolve-activity','--brief','-a','android.intent.action.VIEW','-d','https://emfau88.github.io/Quiz/spielen.html');
    passed('Zweiter nativer Testspielstand an anderem Systemkalendertag: unverändertes Profil nach dem Ansehen, dieselben fünf Karten mit allen Antwortreihenfolgen, eigenes Ergebnis 3/5 gegen übermittelte 4/5. Wiederöffnen erzeugt keine weitere Buchung. Beschädigter Link bietet die normale Kurzrunde.');
  } finally {
    shell('cmd','alarm','set-timezone',zone);
    shell('settings','put','global','auto_time_zone',auto==='null'?'1':auto);
  }
}

export async function runContinue(mode, ui) {
  if (mode === 'continue-before' || mode === 'continue-after') return update(mode === 'continue-before',ui);
  if (mode === 'continue-regular') return regular(ui);
  if (mode === 'continue-table') return rankedScreen(ui);
  if (mode === 'continue-local') return localTopics(ui);
  if (mode === 'continue-final-local') return localFinish(ui);
  if (mode === 'continue-friend') return recipient(ui);
  throw new Error('Unbekannter Android-Fall '+mode);
}
