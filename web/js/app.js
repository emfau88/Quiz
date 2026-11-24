import {RULES} from './rules.js';
import {clock, newGame, startRound, answer, advance, abandon, applyCorrections} from './engine.js';
import {initStorage, readGame, transact, onExternalSave} from './storage.js';
import {themeAccess} from './access.js';
import {loadCatalog} from './catalog.js';
import {CREDITS} from './credits.js';
import {icon} from './icons.js';
import {availableTopicModes,subtopicOptions} from './subtopics.js';
import {friendLinkFor,parseFriendLink,prepareFriendRound} from './friends.js';
import {esc, action, nameOf, frame, quizPage, todayPage, resultPage, knowledgePage, topicsPage, settingsPage,
  invitationPage,friendComparable,modeLabel,sourceLinks} from './views.js';

const app = document.querySelector('#app'), dialog = document.querySelector('#dialog'), native = window.QuizAndroid;
const routes = {today:'heute',topics:'themen',knowledge:'wissen',settings:'einstellungen',quiz:'runde',result:'ergebnis'};
const pages = {today:todayPage,quiz:quizPage,result:resultPage,topics:topicsPage,knowledge:knowledgePage,settings:settingsPage,invitation:invitationPage};
let catalog, installation, state, route = 'today', sessionId = '', tab = 'album', filter = 'all';
let modal = '', trigger, busy = false, lastDay = clock().day;
let invitationHash = '', invitation = null, pendingInvitation = '', shareContent = null;
const APP_VERSION = '0.4.0';
const currentSession = () => state.sessions[sessionId];
const fragment = (page, id = '') => '#' + routes[page] + (id ? '/' + encodeURIComponent(id) : '');
function decodeRoute(hash) {
  if (parseFriendLink(hash)) return {page:'invitation',id:hash};
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
  const invitationState = route === 'invitation' && invitation?.status === 'valid' ? prepareFriendRound(state,catalog,day,invitation) : invitation;
  const context = {state,catalog,day,session:s,native:Boolean(native),reminder:reminderStatus(),billing:themeAccess(),tab,filter,invitation,invitationState,pendingInvitation};
  const active = ['quiz','result'].includes(route) ? (['trial','topic','challenge'].includes(s?.mode) ? 'topics':'today') : route;
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
  if (page === 'invitation') {
    invitationHash = id;
    invitation = parseFriendLink(id);
    pendingInvitation = '';
    const saved = invitation?.status === 'valid' && prepareFriendRound(state,catalog,clock().day,invitation);
    if (saved?.status === 'existing' && saved.sessionStatus !== 'abandoned') {
      state = await transact(s => applyCorrections(s,catalog));
      return go(saved.sessionStatus === 'completed' ? 'result' : 'quiz',saved.sessionId,{replace:true,focus});
    }
    closeDialog();
    route = page; sessionId = '';
    if (location.hash !== id) history[replace ? 'replaceState' : 'pushState']({quizsalon:true},'',id);
    render(focus ? 'h1' : '');
    return;
  }
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
async function begin(mode, category = null, options = {}) {
  let id;
  const time = clock();
  state = await transact(s => {
    applyCorrections(s,catalog);
    const round = startRound(s,catalog,installation,time,{mode,category,entitled:themeAccess().allowed,...options});
    id = round.id;
    s.lastView = fragment(round.status === 'completed' ? 'result':'quiz',id);
  });
  if (mode === 'friend' || route === 'invitation') pendingInvitation = '';
  await openSession(id);
}
function pause() {
  showDialog('pause','Runde pausieren?', '<p>Deine Antworten sind gespeichert. Du kannst mit derselben Frage und Antwortreihenfolge weiterspielen.</p>' +
    '<div class="actions">' + action('close','Fortsetzen','primary') + action('leave-round','Zur Übersicht') + '</div>');
}
function errorDialog(error) {
  const isGame = Boolean(error.code && typeof error.code === 'string');
  const next = error.sessionId ? action('open-session','Offene Runde fortsetzen','primary','data-id="' + esc(error.sessionId) + '"') +
    action('abandon','Offene Runde aufgeben','text-btn','data-id="' + esc(error.sessionId) + '"') : action('close','Schließen','primary');
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
function topicDialog(category,subtopic='',changingScope=false) {
  if (!Object.hasOwn(RULES.categories,category)) return;
  const open = Object.values(state.sessions).find(s => s.status === 'active' && s.mode !== 'daily');
  if (open) {
    if (open.category === category) return openSession(open.id);
    showDialog('open-topic','Eine Zusatzrunde ist noch offen','<p>Du hast eine ' + esc(modeLabel(open)) +
      ' begonnen. Du kannst sie fortsetzen oder aufgeben.</p><div class="actions">' +
      action('open-session','Runde fortsetzen','primary','data-id="' + esc(open.id) + '"') +
      action('abandon','Runde aufgeben','secondary','data-id="' + esc(open.id) + '"') + '</div>');
    return;
  }
  const day = clock().day, access = themeAccess();
  const choices = subtopicOptions(state,catalog,day,category);
  const selected = choices.find(item => item.id === subtopic);
  const scope = selected?.id || '', title = nameOf(category);
  const modes = availableTopicModes(state,catalog,day,category,scope || null);
  const trial = !scope && !state.trials[category];
  const attributes = 'data-id="' + esc(category) + '"';
  const start = (mode,label,style='secondary',slug=scope) => action('begin-topic',label,style,attributes + ' data-mode="' + mode + '" data-subtopic="' + esc(slug) + '"');
  const scopeButton = (id,label) => action('topic-scope',esc(label),'scope-button',attributes + ' data-subtopic="' + esc(id) + '" aria-pressed="' + String(id === scope) + '"');
  let body = choices.length ? '<div class="scope-choices" role="group" aria-label="Themenbereich wählen">' +
    scopeButton('','Gesamte Kategorie') + choices.map(o=>scopeButton(o.id,o.label)).join('') + '</div>' : '';
  if(trial) body += '<section class="topic-offer"><h3>Kostenlos kennenlernen</h3><p>Einmal fünf Fragen aus der gesamten Kategorie.</p>' +
    start('trial','Kennenlernrunde starten','secondary') + '</section>';
  const accessLabel = access.state === 'local' ? 'In dieser Testausgabe frei' : access.allowed ? 'Mit deinem Plus-Zugang' : 'Mit Quizsalon Plus';
  body += '<section class="topic-offer"><h3>' + esc(selected?.label || title) + '</h3><p>' + accessLabel + ' · 10 Fragen</p>';
  if (access.allowed) {
    body += '<div class="actions">' + (modes.includes('topic') ? start('topic','Gemischt · 10 Fragen','primary') : '') +
      (modes.includes('challenge') ? start('challenge','Anspruchsvoll · 10 Fragen') : '') + '</div>';
    if (!modes.length) body += '<p class="quiet">Für diese Auswahl sind zurzeit zu wenige Fragen frei.</p>';
    if (scope && !modes.includes('challenge') && availableTopicModes(state,catalog,day,category).includes('challenge')) {
      body += '<p class="topic-alternative">Die anspruchsvolle Mischung ist in der gesamten Kategorie verfügbar.</p>' +
        start('challenge','Anspruchsvoll · ' + esc(title),'secondary','');
    }
  } else {
    const options = [modes.includes('topic') && 'Gemischt',modes.includes('challenge') && 'Anspruchsvoll'].filter(Boolean).join(' oder ');
    body += '<p class="quiet">' + (options ? esc(options) + '. ' : '') +
      'Ein einmaliger Kauf über Google Play öffnet die freie Themenwahl.</p>' + action('plus','Quizsalon Plus ansehen','secondary');
  }
  showDialog('topic',title,body+'</section>');
  if (changingScope) dialog.querySelector('.scope-button[aria-pressed="true"]')?.focus();
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
async function copyField(field, successMessage) {
  try {
    if (native?.copy) native.copy(field.value);
    else if (navigator.clipboard) await navigator.clipboard.writeText(field.value);
    else { field.select(); if (!document.execCommand('copy')) throw Error(); }
    dialog.querySelector('#copy-status').textContent = successMessage;
  } catch {
    field.focus(); field.select();
    dialog.querySelector('#copy-status').textContent = 'Der Text ist ausgewählt. Nutze die Kopierfunktion deines Geräts.';
  }
}
function sharingDialog(reply) {
  const session=currentSession();
  let url='', text='';
  if(reply) {
    if(!friendComparable(session)) return;
    text='Ich habe im Quizsalon ' + session.result.correct + ' von 5 Fragen richtig beantwortet. Dein geteiltes Ergebnis war ' + session.friendScore + ' von 5.';
  } else {
    url=friendLinkFor(session,state,catalog,clock().day);
    if(!url) return;
    text='Schaffst du meine ' + session.result.correct + ' von 5? Spiele dieselben fünf Fragen im Quizsalon.';
  }
  const system=Boolean(native?.shareText || navigator.share);
  shareContent={text,url};
  const field=reply ? '<label for="share-value">Deine Nachricht</label><textarea id="share-value" readonly>' + esc(text) + '</textarea>' :
    '<p>' + esc(text) + '</p><label for="share-value">Öffentlicher Spiel-Link</label><input id="share-value" type="url" readonly value="' + esc(url) + '">';
  showDialog('share',reply?'Ergebnis zurückschicken':'Freunde herausfordern','<div class="share-fields">' + field +
    '</div><div class="actions">' + (system ? action('system-share',reply?'Nachricht teilen':'Einladung teilen','primary') : '') +
    action('copy-share',reply?'Nachricht kopieren':'Link kopieren',system?'secondary':'primary') +
    '</div><p id="copy-status" role="status"></p>');
}
async function systemShare() {
  if(!shareContent || modal!=='share') return;
  const {text,url}=shareContent;
  try {
    if(native?.shareText) {
      if(native.shareText(url ? text + '\n' + url : text) === false) throw Error();
    } else await navigator.share({title:'Quizsalon',text,...(url ? {url} : {})});
  } catch(error) {
    const status=dialog.querySelector('#copy-status');
    if(status) status.textContent=error.name==='AbortError' ? 'Teilen abgebrochen.' : 'Das Teilen-Menü ist nicht verfügbar. Du kannst den Inhalt kopieren.';
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
    '<p>Externe Quellen öffnen sich nach deiner Auswahl. Wenn du eine Freundeseinladung teilst, enthält ihr Link fünf Fragen in Spielreihenfolge und deine Trefferzahl. Dein Name und dein übriger Spielstand bleiben auf deinem Gerät.</p>' +
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
    case 'home': pendingInvitation=''; await go('today'); break;
    case 'daily': await begin('daily'); break;
    case 'quick': await begin('quick'); break;
    case 'rematch': await begin('quick',null,{rematchOf:id}); break;
    case 'begin-friend':
      if(invitation?.status==='valid') await begin('friend',null,{invite:invitation});
      break;
    case 'return-invite': if(pendingInvitation) await go('invitation',pendingInvitation); break;
    case 'invite-friend': sharingDialog(false); break;
    case 'reply-friend': sharingDialog(true); break;
    case 'system-share': await systemShare(); break;
    case 'copy-share': await copyField(dialog.querySelector('#share-value'),shareContent?.url?'Spiel-Link kopiert.':'Nachricht kopiert.'); break;
    case 'themes': await go('topics'); break;
    case 'pause': pause(); break;
    case 'leave-round': await go('today','',{replace:true}); break;
    case 'open-session':
      if(route==='invitation' && state.sessions[id]?.mode!=='friend') pendingInvitation=invitationHash;
      await openSession(id); break;
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
    case 'copy-report': await copyField(dialog.querySelector('#report-text'),'Meldungstext kopiert.'); break;
    case 'mail-report': {
      const mail = operatorInfo().supportEmail;
      if (mail && native) native.openExternal('mailto:' + mail + '?subject=Quizsalon%20Fragenmeldung&body=' + encodeURIComponent(dialog.querySelector('textarea').value));
      break;
    }
    case 'topic': await topicDialog(id); break;
    case 'topic-scope': await topicDialog(id,el.dataset.subtopic,true); break;
    case 'begin-topic': await begin(el.dataset.mode,id,{subtopic:el.dataset.subtopic || null}); break;
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
    case 'confirm-abandon':
      state = await transact(s => abandon(s,id));
      if(route==='invitation' || pendingInvitation) await go('invitation',pendingInvitation || invitationHash,{replace:true});
      else { tab='history'; await go('knowledge'); }
      break;
    case 'reset':
      showDialog('reset','Spielstand wirklich löschen?', '<p>Alle lokalen Runden, Antworten, Auszeichnungen, Proberunden und Einstellungen werden gelöscht. Das kann nicht rückgängig gemacht werden. Ein echter Plus-Kauf bleibt erhalten.</p><div class="actions">' +
        action('close','Behalten','primary') + action('confirm-reset','Spielstand löschen','danger-outline') + '</div>'); break;
    case 'confirm-reset':
      state = await transact(s => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s,newGame()); });
      native?.setReminder(''); tab='album'; filter='all'; pendingInvitation=''; await go('today','',{replace:true}); break;
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
  if (dest.page !== 'invitation' && route === 'quiz' && currentSession()?.status === 'active') {
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
  const invited=parseFriendLink(location.hash);
  state = invited ? await readGame() : await transact(s => applyCorrections(s,catalog));
  const explicit = location.hash && location.hash !== '#main';
  if (invited) {
    await go('invitation',location.hash,{replace:true,focus:false});
  } else if (!explicit && !Object.keys(state.sessions).length && state.lastView === 'today') {
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
