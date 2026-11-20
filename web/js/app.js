import {RULES} from './rules.js';
import {clock, newGame, startRound, answer, advance, abandon, applyCorrections} from './engine.js';
import {initStorage, readGame, transact, onExternalSave} from './storage.js';
import {themeAccess} from './access.js';
import {loadCatalog} from './catalog.js';
import {CREDITS} from './credits.js';
import {icon} from './icons.js';
import {esc, action, nameOf, frame, quizPage, todayPage, resultPage, knowledgePage, topicsPage, settingsPage, modeLabel, sourceLinks} from './views.js';

const app = document.querySelector('#app'), dialog = document.querySelector('#dialog'), native = window.QuizAndroid;
const routes = {today:'heute',topics:'themen',knowledge:'wissen',settings:'einstellungen',quiz:'runde',result:'ergebnis'};
const pages = {today:todayPage,quiz:quizPage,result:resultPage,topics:topicsPage,knowledge:knowledgePage,settings:settingsPage};
let catalog, installation, state, route = 'today', sessionId = '', tab = 'album', filter = 'all';
let modal = '', trigger, busy = false, lastDay = clock().day;
const APP_VERSION = '0.1.0';
const currentSession = () => state.sessions[sessionId];
const fragment = (page, id = '') => '#' + routes[page] + (id ? '/' + encodeURIComponent(id) : '');
function decodeRoute(hash) {
  const [path, rawId] = hash.replace(/^#/, '').split('/');
  const page = Object.keys(routes).find(k => routes[k] === path) || 'today';
  let id = '';
  try { id = rawId ? decodeURIComponent(rawId) : ''; } catch { /* Ignore malformed bookmarks. */ }
  return {page, id};
}
function reminderStatus() {
  try { return native ? JSON.parse(native.reminderState()) : {}; } catch { return {}; }
}
function operatorInfo() {
  try { return native?.operatorInfo ? JSON.parse(native.operatorInfo()) : {}; } catch { return {}; }
}
function closeDialog() {
  if (!dialog.open) return;
  dialog.close();
}
function showDialog(name, title, body) {
  if (!dialog.open) trigger = document.activeElement;
  modal = name;
  dialog.innerHTML = '<button class="icon-button modal-close" data-action="close" aria-label="Dialog schließen">' + icon('close') +
    '</button><h2 id="dialog-heading" tabindex="-1">' + esc(title) + '</h2>' + body;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('h2').focus();
}
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  modal = '';
  if (trigger?.isConnected) trigger.focus({preventScroll:true});
  trigger = null;
});
function announce(message) { document.querySelector('#announcement').textContent = message; }
function render(focus = '') {
  const s = currentSession();
  if (route === 'quiz' || route === 'result') {
    if (!s || s.status === 'abandoned') { route = 'today'; sessionId = ''; }
    else route = s.status === 'completed' ? 'result' : 'quiz';
  }
  const day = clock().day;
  const context = {state,catalog,day,session:s,native:Boolean(native),reminder:reminderStatus(),billing:themeAccess(),tab,filter};
  const active = ['quiz','result'].includes(route) ? (s?.mode === 'daily' ? 'today':'topics') : route;
  app.innerHTML = frame(active,pages[route](context));
  document.title = app.querySelector('h1').textContent + ' · Quizsalon';
  if (focus) {
    const target = app.querySelector(focus);
    target?.focus({preventScroll:true});
    if (focus === '#feedback') target?.scrollIntoView({block:'nearest'});
    else window.scrollTo(0,0);
  }
  lastDay = day;
}
async function go(page, id = '', {replace = false, persist = true, focus = true} = {}) {
  if (['quiz','result'].includes(page)) {
    const s = state.sessions[id];
    if (!s || s.status === 'abandoned') { page='today'; id=''; }
    else page = s.status === 'completed' ? 'result':'quiz';
  } else id = '';
  const next = fragment(page,id);
  if (persist && state.lastView !== next) state = await transact(s => { s.lastView = next; });
  closeDialog();
  route = page; sessionId = id;
  if (location.hash !== next) history[replace ? 'replaceState':'pushState']({quizsalon:true},'',next);
  render(focus ? (page === 'quiz' ? '#question':'h1') : '');
}
async function openSession(id) {
  const s = state.sessions[id];
  if (s) await go(s.status === 'completed' ? 'result':'quiz',id);
}
async function begin(mode, category = null) {
  let id;
  const time = clock();
  state = await transact(s => {
    applyCorrections(s,catalog);
    const round = startRound(s,catalog,installation,time,{mode,category,entitled:themeAccess().allowed});
    id = round.id;
    s.lastView = fragment(round.status === 'completed' ? 'result':'quiz',id);
  });
  await openSession(id);
}
function pause() {
  showDialog('pause','Runde pausieren?', '<p>Deine Antworten sind gespeichert. Du kannst mit derselben Frage und Antwortreihenfolge weiterspielen.</p>' +
    '<div class="actions">' + action('close','Fortsetzen','primary') + action('leave-round','Zur Übersicht') + '</div>');
}
function errorDialog(error) {
  const isGame = Boolean(error.code && typeof error.code === 'string');
  const next = error.sessionId ? action('open-session','Offene Runde ansehen','primary','data-id="' + esc(error.sessionId) + '"') +
    action('history','Zum Verlauf') : action('close','Schließen','primary');
  showDialog('error',isGame ? 'Runde öffnen' : 'Speichern oder Laden fehlgeschlagen',
    '<p>' + esc(isGame ? error.message : 'Bitte prüfe, ob auf deinem Gerät Speicherplatz und lokale Website-Daten verfügbar sind. Deine letzte bestätigte Antwort bleibt gespeichert.') +
    '</p><div class="actions">' + next + '</div>');
}
function plusDialog() {
  const access = themeAccess();
  let controls = '';
  if (access.canPurchase) controls += action('purchase','Einmalig für ' + esc(access.price) + ' kaufen','primary');
  if (access.canRestore) controls += action('restore','Kauf wiederherstellen');
  if (!controls) controls = action('close','Verstanden','primary');
  showDialog('plus',access.label,'<p>' + esc(access.description) + '</p><p class="notice">' + esc(access.message) +
    '</p><div class="actions">' + controls + '</div>');
}
function topicDialog(category) {
  const open = Object.values(state.sessions).find(s => s.status === 'active' && s.mode !== 'daily');
  if (open) {
    if (open.category === category) return openSession(open.id);
    showDialog('open-topic','Eine Themenrunde ist noch offen','<p>Du spielst gerade „' + esc(nameOf(open.category)) +
      '“. Du kannst diese Runde fortsetzen oder ausdrücklich aufgeben.</p><div class="actions">' +
      action('open-session','Runde fortsetzen','primary','data-id="' + esc(open.id) + '"') +
      action('abandon','Runde aufgeben','secondary','data-id="' + esc(open.id) + '"') + '</div>');
    return;
  }
  const freeTrial = !state.trials[category], access = themeAccess();
  if (!freeTrial && !access.allowed) { plusDialog(); return; }
  const forMode = (mode,name,style='secondary') => action('begin-topic',name,style,'data-mode="' + mode + '" data-id="' + esc(category) + '"');
  let body = freeTrial ? '<p>Deine kostenlose Kennenlernrunde enthält fünf Fragen. Beim Start wird sie für diese Kategorie reserviert. Du kannst sie später fortsetzen.</p>' : '';
  if (access.allowed) body += '<p>Eine freie Themenrunde enthält zehn Fragen. Wähle die gewünschte Schwierigkeit.</p>';
  body += '<div class="actions">' + (freeTrial ? forMode('trial','Kennenlernrunde starten','primary') : '') +
    (access.allowed ? forMode('topic','Gemischt · 10 Fragen',freeTrial ? 'secondary':'primary') + forMode('challenge','Anspruchsvoll · 10 Fragen') : '') + '</div>';
  showDialog('topic',nameOf(category),body);
}
function reportQuestion() {
  const s = currentSession(), q = s?.items[s.cursor]?.q;
  if (!q) return;
  const summary = 'Rückmeldung zu Quizsalon\nFrage: ' + q.id + '\nInhaltsrevision: ' + q.content_revision +
    '\nSemantische Revision: ' + q.semantic_revision + '\nApp-Version: ' + APP_VERSION + '\n\nMeine Rückmeldung:\n';
  const mail = operatorInfo().supportEmail;
  showDialog('report','Frage melden','<p>Ergänze deine Rückmeldung. Du entscheidest, ob du sie weitergibst.</p>' +
    '<label for="report-text" class="small-label">Meldungstext</label><textarea id="report-text">' + esc(summary) + '</textarea><div class="actions">' +
    action('copy-report','Text kopieren','primary') + (mail ? action('mail-report','E-Mail vorbereiten') : '') + '</div><p id="copy-status" role="status"></p>');
}
async function copyReport() {
  const field = dialog.querySelector('textarea');
  try {
    if (native?.copy) native.copy(field.value);
    else if (navigator.clipboard) await navigator.clipboard.writeText(field.value);
    else { field.select(); if (!document.execCommand('copy')) throw Error(); }
    dialog.querySelector('#copy-status').textContent = 'Meldungstext kopiert.';
  } catch {
    field.focus(); field.select();
    dialog.querySelector('#copy-status').textContent = 'Der Text ist ausgewählt. Nutze die Kopierfunktion deines Geräts.';
  }
}
function sensoryFeedback(correct) {
  if (state.settings.haptics) {
    if (native?.haptic) native.haptic(); else navigator.vibrate?.(25);
  }
  if (state.settings.sound) {
    try {
      const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.value = correct ? 540 : 350;
      gain.gain.setValueAtTime(.045,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime + .13);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .14);
      osc.onended = () => ctx.close();
    } catch { /* Some devices disable audio output. */ }
  }
}
function privacy() {
  const details = operatorInfo();
  showDialog('privacy','Datenschutz und App-Informationen',
    '<p>Quizsalon speichert Antworten, Fortschritt und Einstellungen lokal. Es gibt keine Konten, Werbung oder automatische Spielanalyse. Die Fragen sind bei der Installation enthalten.</p>' +
    '<p>' + (native ? 'Android kann den Spielstand über das Systembackup sichern. Kaufdaten und die Installationskennung sind davon ausgeschlossen. ' +
      (themeAccess().canRestore ? 'Für Käufe kommuniziert Google Play mit deinem Play-Konto.' : 'Diese lokale Testausgabe verkauft keine Produkte.') :
      'Dein Browser verwaltet den Spielstand für diese Ausgabe. Das Löschen der Website-Daten oder ein anderes Browserprofil kann den Zugriff darauf beenden.') + '</p>' +
    '<p>Externe Quellen öffnen sich erst nach deiner Auswahl. Eine Fragenmeldung wird nur auf deinen Wunsch kopiert oder in einer E-Mail vorbereitet.</p>' +
    (details.operator ? '<p>Betreiber · ' + esc(details.operator) + '<br>Kontakt · ' + esc(details.supportEmail) +
      '<br><a target="_blank" rel="noopener" href="' + esc(details.privacyUrl) + '">Datenschutzerklärung öffnen</a></p>' :
      '<p>Lokale Testausgabe. Öffentliche Betreiber- und Supportangaben sind noch offen.</p>') +
    '<p class="quiet">Version ' + APP_VERSION + ' · ' + catalog.questions.length + ' Fragen · Katalog ' + esc(catalog.version) +
    '. Die Salonillustration wurde für Quizsalon erstellt.</p>' + action('credits','Quellen und Lizenzen'));
}
function creditsDialog() {
  const rows = CREDITS.map(c => '<details class="rules-detail"><summary><strong>' + esc(c.title) + '</strong>' +
    icon('down') + '</summary><p>' + esc(c.notice) + '</p><p><a target="_blank" rel="noopener noreferrer" href="' + esc(c.url) +
    '">Zur Originalquelle</a></p>' + (c.license ? '<pre class="license">' + esc(c.license) + '</pre>' : '') + '</details>');
  showDialog('credits','Quellen und Lizenzen','<p>Den Beleg für eine einzelne Frage findest du nach der Antwort und auf ihrer Karte im Wissensalbum.</p>' + rows.join(''));
}
async function runAction(key, el) {
  const id = el.dataset.id, pos = Number(el.dataset.pos);
  switch (key) {
    case 'close': closeDialog(); break;
    case 'home': await go('today'); break;
    case 'daily': await begin('daily'); break;
    case 'themes': await go('topics'); break;
    case 'pause': pause(); break;
    case 'leave-round': await go('today','',{replace:true}); break;
    case 'open-session': await openSession(id); break;
    case 'answer': {
      let changed = false;
      state = await transact(s => { applyCorrections(s,catalog); changed = answer(s,sessionId,pos,id,clock()); });
      render(changed ? '#feedback' : '');
      if (changed) sensoryFeedback(currentSession().items[pos].answer.correct);
      break;
    }
    case 'next':
      state = await transact(s => { applyCorrections(s,catalog); advance(s,sessionId,pos,clock()); });
      if (currentSession().status === 'completed') await go('result',sessionId,{replace:true});
      else render('#question');
      break;
    case 'source': {
      const item = currentSession().items[currentSession().cursor];
      showDialog('source','Quellen zur Frage',item.void ? '<p>Diese Frage ist zur Korrektur zurückgezogen.</p>' : sourceLinks(item.q)); break;
    }
    case 'report': reportQuestion(); break;
    case 'copy-report': await copyReport(); break;
    case 'mail-report': {
      const mail = operatorInfo().supportEmail;
      if (mail && native) native.openExternal('mailto:' + mail + '?subject=Quizsalon%20Fragenmeldung&body=' + encodeURIComponent(dialog.querySelector('textarea').value));
      break;
    }
    case 'topic': await topicDialog(id); break;
    case 'begin-topic': await begin(el.dataset.mode,id); break;
    case 'plus': plusDialog(); break;
    case 'purchase': if (themeAccess().canPurchase) native.purchase(); break;
    case 'restore': if (themeAccess().canRestore) { native.restore(); announce('Kaufabgleich angefordert.'); } break;
    case 'tab': tab=id; render(); app.querySelector('.subtab.picked')?.focus(); break;
    case 'history': tab='history'; await go('knowledge'); break;
    case 'abandon': {
      const s = state.sessions[id];
      if (!s) return;
      showDialog('abandon','Runde endgültig aufgeben?', '<p>Die bisherigen Antworten bleiben gespeichert. Diese ' + esc(modeLabel(s)) +
        ' kannst du danach nicht fortsetzen. ' + (s.mode === 'daily' ? 'Für diesen Tag wird keine neue Runde gezogen.' :
        s.mode === 'trial' ? 'Die Kennenlernrunde für dieses Thema bleibt verbraucht.' : 'Die reservierten Fragen werden wieder frei.') + '</p><div class="actions">' +
        action('close','Runde behalten','primary') + action('confirm-abandon','Endgültig aufgeben','danger-outline','data-id="' + esc(id) + '"') + '</div>'); break;
    }
    case 'confirm-abandon': state = await transact(s => abandon(s,id)); tab='history'; await go('knowledge'); break;
    case 'reset':
      showDialog('reset','Spielstand wirklich löschen?', '<p>Alle lokalen Runden, Antworten, Auszeichnungen, Proberunden und Einstellungen werden gelöscht. Das kann nicht rückgängig gemacht werden. Ein echter Plus-Kauf bleibt erhalten.</p><div class="actions">' +
        action('close','Behalten','primary') + action('confirm-reset','Spielstand löschen','danger-outline') + '</div>'); break;
    case 'confirm-reset':
      state = await transact(s => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s,newGame()); });
      native?.setReminder(''); tab='album'; filter='all'; await go('today','',{replace:true}); break;
    case 'set-reminder': {
      const time = document.querySelector('#reminder-time');
      if (time.reportValidity() && /^\d\d:\d\d$/.test(time.value)) native?.setReminder(time.value);
      else time.focus();
      break;
    }
    case 'stop-reminder': native?.setReminder(''); break;
    case 'privacy': privacy(); break;
    case 'credits': creditsDialog(); break;
  }
}
document.addEventListener('click', async event => {
  const external = event.target.closest('a[href^="https:"]');
  if (external && native?.openExternal) { event.preventDefault(); native.openExternal(external.href); return; }
  if (event.target.closest('.skip')) { event.preventDefault(); document.querySelector('#main')?.focus(); return; }
  const el = event.target.closest('[data-action],[data-nav]');
  if (!el || busy || el.disabled) return;
  busy = true;
  try {
    if (el.dataset.nav) await go(el.dataset.nav);
    else await runAction(el.dataset.action,el);
  } catch (error) { errorDialog(error); }
  finally { busy = false; }
});
document.addEventListener('change', async event => {
  const el = event.target;
  if (el.id === 'album-filter') { filter = el.value; render(); document.querySelector('#album-filter')?.focus(); }
  const name = el.dataset.setting;
  if (!['comparison','sound','haptics'].includes(name)) return;
  try { state = await transact(s => { s.settings[name] = el.checked; }); }
  catch (error) { render(); errorDialog(error); }
});
window.addEventListener('quizsalon:billing', () => { if (modal === 'plus') plusDialog(); else if (state && !dialog.open && ['topics','settings'].includes(route)) render(); });
window.addEventListener('quizsalon:reminder', () => { if (state && route === 'settings') render(); });
window.addEventListener('quizsalon:back', event => {
  if (dialog.open) { event.preventDefault(); closeDialog(); }
  else if (route === 'quiz') { event.preventDefault(); pause(); }
  else if (route !== 'today') { event.preventDefault(); go('today').catch(errorDialog); }
});
window.addEventListener('popstate', () => {
  if (!state) return;
  const dest = decodeRoute(location.hash);
  if (route === 'quiz' && currentSession()?.status === 'active') {
    history.pushState({quizsalon:true},'',fragment(route,sessionId));
    if (dialog.open) closeDialog(); else pause();
  } else go(dest.page,dest.id,{replace:true}).catch(errorDialog);
});
async function refresh() {
  if (!state || busy) return;
  try {
    state = await readGame();
    if (!dialog.open) render();
  } catch (error) { errorDialog(error); }
}
onExternalSave(refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!document.hidden && lastDay !== clock().day) refresh(); },30000);
async function boot() {
  [catalog,installation] = await Promise.all([loadCatalog(),initStorage()]);
  state = await transact(s => applyCorrections(s,catalog));
  const explicit = location.hash && location.hash !== '#main';
  if (!explicit && !Object.keys(state.sessions).length && state.lastView === 'today') {
    history.replaceState({quizsalon:true},'',fragment('today'));
    await begin('daily');
  } else {
    const saved = decodeRoute(explicit ? location.hash : state.lastView);
    await go(saved.page,saved.id,{replace:true,focus:false});
  }
  if (!native && location.protocol !== 'file:' && 'serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(() => { /* A local file bundle needs no service worker. */ });
}
boot().catch(error => {
  app.innerHTML = '<main class="shell startup"><h1>Quizsalon</h1><p>Die Runde konnte nicht geöffnet werden. ' +
    esc(error.message) + '</p><p>Prüfe, ob lokale Website-Daten erlaubt sind. Danach kannst du es erneut versuchen.</p><button class="btn primary" id="retry">Erneut versuchen</button></main>';
  document.querySelector('#retry').onclick = () => location.reload();
});
