import {RULES} from './rules.js';
import {addDays, monday, experience, weekActivity, statistics, collection, ranking} from './engine.js';
import {icon, logo} from './icons.js';
import {friendLinkFor} from './friends.js';
import {subtopicOptions} from './subtopics.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const nameOf = category => RULES.categories[category] || 'Tagesrunde';
const displayDay = (day, options) => new Intl.DateTimeFormat('de-DE', options).format(new Date(day + 'T12:00:00Z'));
const fullDay = day => displayDay(day, {weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const shortDay = day => displayDay(day, {day:'numeric', month:'long', timeZone:'UTC'});
const dayLabels = ['Mo','Di','Mi','Do','Fr','Sa','So'];
export const modeLabel = s => s.mode === 'quick' && s.rematchOf ? 'Revanche' :
  ({daily:'Tagesrunde',quick:'Kurzrunde',friend:'Freundesrunde',trial:'Kennenlernrunde',topic:'Themenrunde',challenge:'Anspruchsvolle Themenrunde'}[s.mode] || 'Quizrunde');
const action = (id, label, style = 'secondary', extra = '') => '<button type="button" class="btn ' + style + '" data-action="' + id + '" ' + extra + '>' + label + '</button>';
export {action, nameOf};

const guestStrengths = {nature_animals:'Natur',geography_travel:'Reisen',everyday_technology:'Technik',history_discoveries:'Geschichte',entertainment:'Film & Musik',language_culture:'Sprache'};
function guestInfo(guest) {
  const saved = RULES.simulation.opponents.find(person => (guest.id && person.id === guest.id) || person.name === guest.name);
  const id = saved?.id ?? guest.id;
  const picture = id && /^[a-z0-9_-]+$/.test(id) ? globalThis.QUIZSALON_GUEST_PORTRAITS?.[id] ?? ('./assets/guests/' + id + '.png') : '';
  return {picture, strength:(guest.specialties ?? saved?.specialties ?? []).map(k => guestStrengths[k] || nameOf(k)).join(' · ')};
}
function portrait(source) {
  return source ? '<img class="guest-portrait" src="' + esc(source) + '" width="44" height="44" alt="">' : '';
}
function guestIntroduction(guests) {
  return '<section class="guest-intro" aria-labelledby="guest-heading"><h3 id="guest-heading">Heute am Tisch mit drei Computergegnern</h3>' +
    '<ul id="guest-list">' + guests.map(guest => {
      const {picture,strength} = guestInfo(guest);
      return '<li>' + portrait(picture) + '<span><strong>' + esc(guest.name) + '</strong><small>' + esc(strength) + '</small></span></li>';
    }).join('') + '</ul></section>';
}

function nav(active) {
  return [['today','Heute','today'],['topics','Themen','topics'],['knowledge','Mein Wissen','book']].map(([id,text,symbol]) =>
    '<button class="nav-item' + (active === id ? ' current' : '') + '" data-nav="' + id + '"' +
    (active === id ? ' aria-current="page"' : '') + '>' + icon(symbol) + '<span>' + text + '</span></button>').join('');
}
export function frame(active, body) {
  return '<header class="mast"><div class="shell mast-inner"><button data-nav="today" class="brand" aria-label="Quizsalon, zur Übersicht">' +
    logo + '<span>Quizsalon</span></button><nav class="nav-main" aria-label="Hauptnavigation">' + nav(active) +
    '</nav><button data-nav="settings" class="settings-button" aria-label="Einstellungen" title="Einstellungen">' + icon('gear') +
    '</button></div></header><main id="main" tabindex="-1" class="shell main">' + body +
    '</main><nav class="nav-mobile" aria-label="Hauptnavigation">' + nav(active) + '</nav>';
}
function heading(context, title, right = '', symbol = 'sun') {
  return '<div class="page-heading"><div><p class="eyebrow">' + icon(symbol) + esc(context) +
    '</p><h1 tabindex="-1">' + esc(title) + '</h1></div>' + right + '</div>';
}
function pill(category) {
  return '<span class="category-tag cat-' + esc(category) + '">' + icon(category) + esc(nameOf(category)) + '</span>';
}
function weekContent(state, day) {
  const days = weekActivity(state, day);
  const start = monday(day);
  const marks = dayLabels.map((label,i) => {
    const date = addDays(start,i), played = days.includes(date);
    const description = fullDay(date) + (played ? ', abgeschlossen' : ', offen');
    return '<li class="' + (played ? 'played ' : '') + (date === day ? 'this-day' : '') + '" aria-label="' + esc(description) +
      '"><span class="week-dot">' + (played ? icon('check') : '<i></i>') + '</span><span>' + label + '</span></li>';
  }).join('');
  const count = Math.min(days.length, RULES.progress.week_goal);
  return '<div class="panel-line"><h3>Wochenziel</h3><span class="mini-count">' + count + ' / ' + RULES.progress.week_goal +
    '</span></div><p class="quiet">An vier Tagen die Tagesrunde abschließen.</p><ul class="week" aria-label="Aktivität dieser Woche">' + marks + '</ul>';
}
function levelContent(state) {
  const {xp, level, floor, next} = experience(state);
  return '<div class="level-row"><span class="level-icon">' + icon('medal') + '</span><div><span class="small-label">Erfahrungsstufe ' + level +
    '</span><strong>' + xp + ' XP</strong></div></div><progress aria-label="Fortschritt bis zur nächsten Erfahrungsstufe" max="' +
    (next - floor) + '" value="' + (xp - floor) + '"></progress><p class="quiet">Noch ' + (next - xp) + ' XP bis Stufe ' + (level + 1) + '.</p>';
}
function sidePanel(state, day, artwork = true) {
  return '<aside class="companion" aria-label="Dein Fortschritt">' + (artwork ? '<img class="salon-art" src="./assets/salon.webp" alt="">' : '') +
    '<div class="side-inner">' + weekContent(state, day) + '<div class="divider"></div>' + levelContent(state) + '</div></aside>';
}
function historyRow(s) {
  const detail = s.subtopic ? s.subtopic[0].toLocaleUpperCase('de-DE') + s.subtopic.slice(1) : s.category ? nameOf(s.category) : '';
  const title = modeLabel(s) + (detail ? ' · ' + detail : '');
  const status = s.status === 'completed' ? s.result.correct + ' von ' + s.result.valid + ' richtig' : s.status === 'active'
    ? 'Offen · ' + s.items.filter(i => i.answer || i.void).length + ' von ' + s.items.length + ' bearbeitet' : 'Aufgegeben';
  return '<div class="history-row"><span class="tile-icon">' + icon(s.category || 'today') + '</span><div class="grow"><strong>' +
    esc(title) + '</strong><p>' + esc(shortDay(s.day)) + ' · ' + esc(status) + '</p></div>' +
    (s.status === 'abandoned' ? '' : action('open-session',s.status === 'active' ? 'Fortsetzen' : 'Ergebnis','tertiary','data-id="' + esc(s.id) + '"')) + '</div>';
}
export function todayPage({state, day}) {
  const session = state.sessions['daily-' + day];
  const other = Object.values(state.sessions).filter(s => s.status === 'active' && s.id !== session?.id);
  const label = !session ? 'Tagesrunde starten' : {active:'Runde fortsetzen',completed:'Ergebnis ansehen',abandoned:'Heute aufgegeben'}[session.status];
  const copy = session?.status === 'completed' ? 'Du hast heute ' + session.result.correct + ' von ' + session.result.valid + ' Fragen richtig beantwortet.' :
    session?.status === 'abandoned' ? 'Morgen erwartet dich eine neue Tagesrunde. Deine bisherigen Antworten bleiben im Wissensalbum.' :
    session?.status === 'active' ? 'Deine Runde ist gespeichert. Spiele bei Frage ' + (session.cursor + 1) + ' weiter.' : 'Heute erwarten dich zehn Fragen, darunter eine Schätzung und zwei Rätsel mit Hinweisen.';
  return heading(fullDay(day),'Heute im Quizsalon') + '<div class="two-col"><div><section class="cover"><img src="./assets/salon.webp" alt=""><div class="cover-text"><div class="cover-kind">' +
    icon('today') + ' Tagesquiz</div><h2>Deine Tagesrunde</h2><p>' + esc(copy) + '</p>' +
    (session?.status === 'abandoned' ? action('themes','Themen entdecken','light') : action('daily',esc(label),'light')) + '</div></section>' +
    '<div class="home-shortcuts">' +
    action('quick','<span class="tile-icon">'+icon('replay')+'</span><span><strong>Noch 5 Fragen</strong><small>Kostenlose gemischte Runde</small></span>'+icon('chevron'),'shortcut-link') +
    action('themes','<span class="tile-icon">'+icon('topics')+'</span><span><strong>Thema wählen</strong><small>Sechs Kategorien entdecken</small></span>'+icon('chevron'),'shortcut-link') + '</div>' +
    (other.length ? '<section class="paper section-card"><h2>Offene Runden</h2>' + other.map(historyRow).join('') + '</section>' : '') +
    '</div>' + sidePanel(state,day,false) + '</div>';
}
export function quizPage({state, session: s, day}) {
  const pos = s.cursor, item = s.items[pos], q = item.q;
  const label = s.mode === 'daily' ? (s.isReview ? 'Wiederholungsrunde' : 'Die Tagesrunde') : modeLabel(s);
  const count = 'Frage ' + (pos + 1) + ' von ' + s.items.length;
  const segments = s.items.map((_,i) => '<span class="' + (i < pos ? 'done' : i === pos ? 'current' : '') + '"></span>').join('');
  const selected = item.answer;
  const task = q.tags?.includes('form_schaetzen') ? 'Schätzfrage' : q.tags?.includes('form_herleiten') ? 'Zum Herleiten' : '';
  const researchYear = q.research?.published_on.slice(0, 4);
  const context = [task, researchYear && 'Aus der Forschung ' + researchYear].filter(Boolean).join(' · ');
  const showGuests = pos === 0 && !selected && !item.void && state.settings.comparison && s.opponents?.length === 3 && ['daily','quick'].includes(s.mode);
  let body;
  if (item.void) {
    body = '<h2 class="question-title" id="question" tabindex="-1">Diese Frage wird korrigiert.</h2><p>Wir überspringen diese Position. Sie zählt für dieses Ergebnis nicht mit.</p>';
  } else {
    const opts = item.order.map((id, i) => {
      const chosen = selected?.optionId === id, right = Boolean(selected && id === q.correct_option_id);
      const text = q.options.find(o => o.id === id).text;
      const marker = right ? icon('check') : chosen ? icon('close') : String.fromCharCode(65 + i);
      const result = right ? 'Richtig' : chosen ? 'Deine Antwort' : '';
      return '<button class="answer' + (right ? ' right' : chosen ? ' wrong' : '') +
        '" data-action="answer" data-id="' + esc(id) + '" data-pos="' + pos + '"' + (selected ? ' disabled' : '') +
        '><span class="letter" aria-hidden="true">' + marker + '</span><span class="answer-text">' + esc(text) + '</span>' +
        (result ? '<span class="answer-state">' + result + '</span>' : '') + '</button>';
    }).join('');
    body = (context ? '<p class="question-format" id="question-format">' + esc(context) + '</p>' : '') +
      '<h2 class="question-title" id="question" tabindex="-1" aria-describedby="position' + (context ? ' question-format' : '') + (showGuests ? ' guest-heading guest-list' : '') + '">' + esc(q.question) +
      '</h2><div class="answers" role="group" aria-labelledby="question">' + opts + '</div>';
    if (selected) {
      const answerText = q.options.find(o => o.id === q.correct_option_id).text;
      body += '<section class="feedback" tabindex="-1" id="feedback" aria-labelledby="feedback-heading"><h3 id="feedback-heading">' +
        icon(selected.correct ? 'check' : 'info') + (selected.correct ? 'Richtig gewusst!' : 'Richtig ist „' + esc(answerText) + '“.') +
        '</h3><p>' + esc(q.explanation) + '</p>' +
        (researchYear ? '<p class="research-source"><a target="_blank" rel="noopener noreferrer" href="' + esc(q.research.url) +
          '">Quelle · ' + esc(q.research.publisher) + '</a> · <time datetime="' + esc(q.research.published_on) + '">' +
          esc(displayDay(q.research.published_on,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})) + '</time></p>' : '') +
        (selected.recalled ? '<p class="earned">' + icon('replay') + 'Wiedergewusst · Diesmal richtig erinnert.</p>' : '') +
        (selected.newlyMastered ? '<p class="earned">' + icon('medal') + 'Sicher gewusst · Karte im Wissensalbum.</p>' : '') + '</section>';
    }
  }
  const finished = item.void || selected;
  return heading(fullDay(s.day),label,action('pause',icon('pause') + 'Pausieren','quiet-btn')) +
    '<div class="two-col"><section class="paper question-card"><div class="question-meta">' + pill(q.category) +
    '<span class="position" id="position">' + count + '</span></div><div class="segments" aria-hidden="true">' + segments + '</div>' + (showGuests ? guestIntroduction(s.opponents) : '') + body +
    (finished ? '<div class="question-actions">' + action('next',pos === s.items.length - 1 ? 'Ergebnis ansehen' : 'Nächste Frage','primary','data-pos="' + pos + '"') + '</div>' : '') +
    '<div class="question-foot">' + (finished ? action('source',icon('book') + 'Quellen','text-btn') : '<span>' + (item.kind === 'new' ? icon('list') + 'Eine Antwort auswählen' : icon('replay') + 'Wiederholungsfrage') + '</span>') +
    action('report',icon('flag') + 'Frage melden','text-btn') + '</div></section>' + sidePanel(state,day) + '</div>';
}
function nextWeekdayHint(state,day) {
  if (weekActivity(state,day).length !== RULES.progress.week_goal - 1) return '';
  const today = state.sessions['daily-' + day];
  const next = today && today.status !== 'active' ? addDays(day,1) : day;
  return next < addDays(monday(day),7) ? '<p class="week-hint">' + icon('today') + 'Noch ein Spieltag bis zum Wochenziel.</p>' : '';
}
export function friendComparable(s) {
  return s?.mode === 'friend' && s.status === 'completed' && !s.corrected && s.result?.valid === 5 &&
    Number.isInteger(s.friendScore) && s.friendScore >= 0 && s.friendScore <= 5 && s.items.every(item => !item.void && item.answer);
}
function friendResult(s) {
  if (!friendComparable(s)) return '';
  return '<section class="friend-result" aria-label="Euer Vergleich"><p>Geteiltes Ergebnis <strong>' + s.friendScore + ' von 5</strong></p>' +
    action('reply-friend','Ergebnis zurückschicken','text-btn') + '</section>';
}
export function invitationPage({invitation, invitationState, state}) {
  const status = invitationState?.status || 'invalid';
  const valid = status !== 'invalid';
  const title = valid ? 'Schaffst du meine ' + invitation.score + ' von 5?' : 'Diese Einladung ist nicht spielbar';
  let description, controls;
  if (status === 'ready') {
    description = 'Dir wurden fünf Quizfragen und ein Ergebnis geschickt. Du spielst kostenlos genau dieselben Fragen.';
    controls = action('begin-friend','Freundesrunde starten','primary');
  } else if (status === 'existing') {
    const finished = invitationState.sessionStatus === 'completed', abandoned = invitationState.sessionStatus === 'abandoned';
    description = finished ? 'Du hast diese Einladung bereits gespielt. Dein Ergebnis ist gespeichert.' :
      abandoned ? 'Du hast diese Freundesrunde aufgegeben.' : 'Du hast diese Freundesrunde schon begonnen. Deine Antworten sind gespeichert.';
    controls = abandoned ? action('quick','Gewöhnliche Kurzrunde starten','primary') : action('open-session',finished ? 'Euer Ergebnis ansehen' : 'Freundesrunde fortsetzen','primary','data-id="' + esc(invitationState.sessionId) + '"');
  } else if (status === 'conflict') {
    const daily = invitationState.code === 'DAILY_CONFLICT', saved=state.sessions[invitationState.sessionId];
    description = daily ? 'Mindestens eine dieser Fragen ist für deine offene Tagesrunde reserviert. Spiele die Tagesrunde zuerst zu Ende.' :
      'Du hast bereits eine Zusatzrunde angefangen. Setze sie fort oder gib sie auf, bevor du diese Einladung spielst.';
    controls = action('open-session',daily ? 'Tagesrunde fortsetzen' : 'Offene Runde fortsetzen','primary','data-id="' + esc(invitationState.sessionId) + '"') +
      (!daily && saved ? action('abandon','Offene Runde aufgeben','text-btn','data-id="' + esc(saved.id) + '"') : '');
  } else {
    description = invitationState?.message || 'Der Link ist unvollständig oder die versendeten Fragen sind in dieser Fassung nicht verfügbar.';
    controls = action('quick','Gewöhnliche Kurzrunde starten','primary');
  }
  return '<div class="invite-page">' + heading('Freundesrunde','Deine Einladung','','book') +
    '<section class="paper invitation-card"><span class="invite-emblem" aria-hidden="true">' + icon('book') + '</span><h2>' + esc(title) +
    '</h2><p>' + esc(description) + '</p>' + (status === 'ready' ? '<p class="quiet">Erst nach deiner Runde kannst du dein eigenes Ergebnis teilen.</p>' : '') +
    '<div class="actions">' + controls + action('home','Zur Übersicht','text-btn') + '</div></section></div>';
}
export function resultPage({state, session:s, day,catalog,pendingInvitation}) {
  const r = s.result, rows = state.settings.comparison ? ranking(s) : [];
  const comparator = rows.length ? '<details class="paper section-card virtual"><summary><span>' + icon('topics') +
    'Dein Quiztisch · drei Computergegner</span>' + icon('down') + '</summary><p>Bei gleicher Trefferzahl teilt ihr euch den Platz.</p>' +
    '<table><caption class="sr-only">Heute am Tisch mit drei Computergegnern</caption><thead><tr><th scope="col">Platz</th><th scope="col">Am Tisch</th><th scope="col">Treffer</th></tr></thead><tbody>' +
    rows.map(row => {
      const {picture,strength} = row.human ? {} : guestInfo(row);
      return '<tr' + (row.human ? ' class="own-row"' : '') + '><td>' + row.rank + '.</td><th scope="row"><span class="ranking-person">' +
        portrait(picture) + '<span>' + esc(row.name) + (row.human ? '' : '<small>' + esc(strength || 'Computergegner') + '</small>') +
        '</span></span></th><td>' + row.correct + '</td></tr>';
    }).join('') + '</tbody></table>' +
    action('rematch',icon('replay')+'Revanche mit diesem Tisch','secondary','data-id="' + esc(s.id) + '"') + '</details>' : '';
  const invite = s.mode === 'quick' && friendLinkFor(s,state,catalog,day);
  return heading(fullDay(s.day),'Dein Rundenergebnis') + '<div class="two-col"><div><section class="paper result-card"><div class="result-symbol">' +
    icon(r.medal ? 'medal' : 'book') + '</div><p class="small-label">' + esc(modeLabel(s)) + ' abgeschlossen</p><h2 class="score">' + r.correct + '<span> von </span>' + r.valid +
    '</h2><p>Fragen richtig beantwortet</p>' + (friendResult(s) || '<div class="result-awards">' + (r.medal ? '<span>' + icon('medal') + esc(r.medal) + '</span>' : '') +
    (s.mode === 'daily' ? '<span>' + icon('spark') + '+' + r.xp + ' XP</span>' : '<span>' + icon('book') + 'Wissensalbum aktualisiert</span>') + '</div>') +
    (s.corrected ? '<p class="notice">Mindestens eine Frage wurde nachträglich korrigiert. ' +
      (s.mode === 'daily' ? 'Bereits gebuchte XP bleiben erhalten.' : 'Das persönliche Rundenergebnis findest du hier.') + '</p>' :
      r.recalled ? '<p class="notice">Wiedergewusst · ' + r.recalled + (r.recalled === 1 ? ' frühere Frage' : ' frühere Fragen') + ' diesmal richtig beantwortet.</p>' : '') +
    nextWeekdayHint(state,day) + '<div class="result-next">' + action('quick','Noch 5 Fragen ' + icon('chevron'),'primary') +
    action('themes','Thema wählen','secondary') + '</div>' +
    (invite ? action('invite-friend','Freunde herausfordern','invite-button') : '') +
    (pendingInvitation ? action('return-invite','Zur Freundeseinladung','text-btn') : '') +
    action('home','Zur Übersicht','text-btn result-home') + '</section>' + comparator + '</div>' + sidePanel(state,day) + '</div>';
}
const colorNames = {'nature_animals':'nature','geography_travel':'travel','everyday_technology':'tech','history_discoveries':'history','entertainment':'music','language_culture':'culture'};
export function topicsPage({state, billing,catalog,day}) {
  const open = Object.values(state.sessions).find(s => s.status === 'active' && s.mode !== 'daily');
  const cards = Object.entries(RULES.categories).map(([id,title]) => {
    const active = open?.category === id;
    const subtopics = subtopicOptions(state,catalog,day,id);
    const status = active ? 'Angefangene Runde fortsetzen' : billing.allowed ? billing.topicLabel :
      state.trials[id] ? 'Kennenlernrunde bereits genutzt' : 'Kostenlos kennenlernen · 5 Fragen';
    return '<button class="topic-card ' + colorNames[id] + '" data-action="topic" data-id="' + id + '"><span class="topic-art">' +
      icon(id) + '</span><span class="topic-label"><strong>' + esc(title) + '</strong><small>' + esc(status) + '</small>' +
      (subtopics.length ? '<small class="topic-includes">Mit ' + subtopics.map(item=>esc(item.label)).join(' und ') + '</small>' : '') + '</span></button>';
  }).join('');
  return heading('Themenrunden','Deine Themen',action('plus',icon('spark') + esc(billing.label),'quiet-btn'),'topics') +
    '<p class="intro">' + (billing.allowed ? 'Wähle ein Thema und die Schwierigkeit für deine nächste Runde.' : 'Wähle ein Thema. Die erste Kennenlernrunde jeder Kategorie ist kostenlos.') + '</p>' +
    (open ? '<section class="paper section-card"><h2>Offene Zusatzrunde</h2>' + historyRow(open) + '</section>' : '') +
    '<div class="topic-grid">' + cards + '</div>';
}
export function knowledgePage({state,catalog,day,tab,filter}) {
  const cards = collection(state,catalog), stats = statistics(state,catalog);
  const tabs = [['album','Wissensalbum'],['history','Verlauf'],['stats','Statistik']].map(([id,name]) =>
    '<button class="subtab' + (id===tab ? ' picked' : '') + '" data-action="tab" data-id="' + id + '" ' +
    (id===tab ? 'aria-current="true"' : '') + '>' + name + '</button>').join('');
  let panel;
  if (tab === 'history') {
    const history = Object.values(state.sessions).sort((a,b) => b.created.localeCompare(a.created));
    panel = '<h2>Deine Runden</h2>' + (history.length ? history.map(s =>
      '<div class="history-item">' + historyRow(s) + (s.status === 'active' ? action('abandon','Runde aufgeben','text-btn','data-id="' + esc(s.id) + '"') : '') + '</div>'
    ).join('') : '<p>Noch keine gespielte Runde.</p>');
  } else if (tab === 'stats') {
    const {level} = experience(state), thresholds = RULES.progress.levels;
    const steps = Array.from({length:Math.max(thresholds.length,level + 1)},(_,i) => {
      const needed = thresholds[i] ?? thresholds.at(-1) + (i - thresholds.length + 1) * RULES.progress.later_level_step;
      return '<li><span>Stufe ' + (i + 1) + '</span><span>' + needed + ' XP' +
        (i < level ? ' · erreicht' : '') + '</span></li>';
    }).join('');
    panel = '<h2>Deine Antworten</h2><dl class="stat-list"><div><dt>Erstversuche</dt><dd>' + stats.first.hits + ' von ' + stats.first.total +
      ' richtig</dd></div><div><dt>Wiederholungen</dt><dd>' + stats.repeat.hits + ' von ' + stats.repeat.total +
      ' richtig</dd></div><div><dt>Sicher gewusst</dt><dd>' + Object.keys(state.awards).length + ' Auszeichnungen</dd></div></dl>' +
      '<p class="quiet">„Sicher gewusst“ erhältst du für zwei richtige Antworten auf dieselbe Frage mit mindestens drei Tagen Abstand.</p>' +
      '<details class="rules-detail"><summary><strong>Erfahrungsstufen und Medaillen</strong>' + icon('down') +
      '</summary><p>Eine abgeschlossene Tagesrunde bringt 20 XP und jede richtige Antwort weitere 10 XP. Themenrunden entwickeln dein Album weiter.</p>' +
      '<ul class="level-list">' + steps + '</ul><p>Ab acht gültigen Fragen gibt es Bronze für mindestens 50 Prozent richtige Antworten, Silber für 70 und Gold für 90 Prozent.</p></details>' +
      '<details class="rules-detail"><summary><strong>Wie entsteht „Wiedergewusst“?</strong>' + icon('down') +
      '</summary><p>War deine letzte Antwort auf eine Frage falsch und erinnerst du dich mindestens drei Kalendertage später richtig, erscheint „Wiedergewusst“.</p></details>';
  } else {
    const hasResearch = cards.some(c=>c.q?.research);
    if (filter === 'research' && !hasResearch) filter = 'all';
    const filtered = cards.filter(c => filter === 'all' || (filter === 'mastered' && c.mastered) ||
      (filter === 'research' && c.q?.research) || c.category === filter);
    panel = '<div class="panel-line"><h2>Wissensalbum</h2><span class="mini-count">' + cards.length + (cards.length === 1 ? ' Karte' : ' Karten') +
      '</span></div><p class="quiet">Hier kannst du die Erklärungen deiner gespielten Fragen nachlesen.</p>';
    if (cards.length) {
      const filters = [['all','Alle Karten'],['mastered','Sicher gewusst']];
      if (hasResearch) filters.push(['research','Aus der Forschung']);
      panel += '<label class="filter">Karten anzeigen<select id="album-filter">' + [...filters,...Object.entries(RULES.categories)].map(([id,name]) =>
        '<option value="' + id + '"' + (id===filter?' selected':'') + '>' + esc(name) + '</option>').join('') + '</select></label>';
    }
    panel += filtered.length ? filtered.map(c => '<details class="album-item"><summary><span><small>' + esc(nameOf(c.category)) +
      (c.q?.research ? ' · Forschung '+esc(c.q.research.published_on.slice(0,4)) : '') +
      (c.q?.tags.includes('damals_und_heute') ? ' · Damals und heute' : '') + (c.mastered ? (c.corrected ? ' · Auszeichnung aus früherer Fassung' : ' · Sicher gewusst') : '') + (c.corrected ? ' · Korrektur' : '') + '</small><strong>' +
      esc(c.q?.question || 'Diese Erklärung wird überprüft.') + '</strong></span>' + icon('down') +
      '</summary>' + (c.q ? '<p><b>' + esc(c.q.options.find(o => o.id === c.q.correct_option_id)?.text) + '</b></p><p>' +
        esc(c.q.explanation) + '</p>' + sourceLinks(c.q) : '<p>Eine geprüfte neue Erklärung liegt noch nicht vor.</p>') + '</details>').join('') :
      '<div class="empty">' + icon('book') + '<p>' + (cards.length ? 'Hier gibt es noch keine passenden Karten.' : 'Nach deiner ersten Antwort erscheint hier die erste Karte.') + '</p></div>';
  }
  return heading('Deine Sammlung','Mein Wissen','','book') + '<nav class="subtabs" aria-label="Ansichten in Mein Wissen">' + tabs +
    '</nav><div class="two-col"><section class="paper section-card">' + panel + '</section>' + sidePanel(state,day) + '</div>';
}
export function sourceLinks(q) {
  return '<ul class="sources">' + q.sources.map(s => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a></li>').join('') + '</ul>';
}
function toggle(name, label, hint, checked) {
  return '<label class="toggle"><span><strong>' + esc(label) + '</strong><small>' + esc(hint) + '</small></span><input type="checkbox" data-setting="' + name +
    '" ' + (checked ? 'checked' : '') + '><i aria-hidden="true"></i></label>';
}
export function settingsPage({state, native, reminder, billing}) {
  return heading('Quizsalon','Einstellungen','','gear') + '<div class="settings-grid"><section class="paper section-card"><h2>Beim Spielen</h2>' +
    toggle('comparison','Computergegner anzeigen','Quiztisch und Revanche in Tagesrunden und gemischten Kurzrunden.',state.settings.comparison) +
    toggle('sound','Rückmeldeton','Kurzer Ton nach der Antwort.',state.settings.sound) +
    toggle('haptics','Haptik','Kurzes Vibrieren auf unterstützten Geräten.',state.settings.haptics) +
    '<h2 class="subhead">Tägliche Erinnerung</h2>' + (native ?
      '<label class="time-label" for="reminder-time">Ortszeit</label><input id="reminder-time" type="time" value="' + esc(reminder.time || '18:00') +
      '"><p class="quiet">' + esc(reminder.message || (reminder.enabled ? 'Erinnerung eingeschaltet.' : 'Erinnerung ausgeschaltet.')) +
      '</p><div class="actions">' + action('set-reminder',reminder.enabled ? 'Uhrzeit speichern' : 'Erinnerung einschalten') +
      (reminder.enabled ? action('stop-reminder','Ausschalten','text-btn') : '') + '</div>' : '<p>Lokale Erinnerungen kannst du in der Android-App einrichten.</p>') +
    '</section><section class="paper section-card"><h2>Themenzugang und Spielstand</h2><p>' + esc(billing.description) + '</p>' +
    action('plus',billing.canRestore ? 'Plus und Kaufwiederherstellung' : esc(billing.label)) + '<div class="divider"></div><h3>Spielstand zurücksetzen</h3><p>Entfernt deine Antworten, Runden und Auszeichnungen auf diesem Gerät. Ein bestätigter Play-Kauf bleibt erhalten.</p>' +
    action('reset','Spielstand zurücksetzen','danger-outline') + '<div class="divider"></div>' + action('privacy','Datenschutz und App-Informationen','text-btn') + '</section></div>';
}
