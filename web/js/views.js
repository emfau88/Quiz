import {RULES} from './rules.js';
import {addDays, monday, experience, weekActivity, statistics, collection, ranking} from './engine.js';
import {icon, logo} from './icons.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const nameOf = category => RULES.categories[category] || 'Tagesrunde';
const displayDay = (day, options) => new Intl.DateTimeFormat('de-DE', options).format(new Date(day + 'T12:00:00Z'));
const fullDay = day => displayDay(day, {weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const shortDay = day => displayDay(day, {day:'numeric', month:'long', timeZone:'UTC'});
const dayLabels = ['Mo','Di','Mi','Do','Fr','Sa','So'];
export const modeLabel = s => ({daily:'Tagesrunde',trial:'Kennenlernrunde',topic:'Themenrunde',challenge:'Anspruchsvolle Themenrunde'}[s.mode]);
const action = (id, label, style = 'secondary', extra = '') => '<button type="button" class="btn ' + style + '" data-action="' + id + '" ' + extra + '>' + label + '</button>';
export {action, nameOf};

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
  const title = modeLabel(s) + (s.category ? ' · ' + nameOf(s.category) : '');
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
    session?.status === 'active' ? 'Deine Runde ist gespeichert. Spiele bei Frage ' + (session.cursor + 1) + ' weiter.' : 'Zehn Fragen aus der Welt des Wissens. Du bestimmst das Tempo.';
  return heading(fullDay(day),'Heute im Quizsalon') + '<div class="two-col"><div><section class="cover"><img src="./assets/salon.webp" alt=""><div class="cover-text"><div class="cover-kind">' +
    icon('today') + ' Tagesquiz</div><h2>Deine Tagesrunde</h2><p>' + esc(copy) + '</p>' +
    (session?.status === 'abandoned' ? action('themes','Themen entdecken','light') : action('daily',esc(label),'light')) + '</div></section>' +
    (other.length ? '<section class="paper section-card"><h2>Offene Runden</h2>' + other.map(historyRow).join('') + '</section>' : '') +
    '<section class="shortcut"><span class="tile-icon">' + icon('topics') + '</span><div class="grow"><h3>Themen entdecken</h3><p>Sechs Kategorien mit je einer kostenlosen Kennenlernrunde.</p></div>' +
    '<button data-nav="topics" class="icon-button" aria-label="Zu den Themen">' + icon('topics') + '</button></section></div>' + sidePanel(state,day,false) + '</div>';
}
export function quizPage({state, session: s, day}) {
  const pos = s.cursor, item = s.items[pos], q = item.q;
  const label = s.isReview ? 'Wiederholungsrunde' : (s.mode === 'daily' ? 'Die Tagesrunde' : modeLabel(s));
  const count = 'Frage ' + (pos + 1) + ' von ' + s.items.length;
  const segments = s.items.map((_,i) => '<span class="' + (i < pos ? 'done' : i === pos ? 'current' : '') + '"></span>').join('');
  const selected = item.answer;
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
    body = '<h2 class="question-title" id="question" tabindex="-1" aria-describedby="position">' + esc(q.question) +
      '</h2><div class="answers" role="group" aria-labelledby="question">' + opts + '</div>';
    if (selected) {
      const answerText = q.options.find(o => o.id === q.correct_option_id).text;
      body += '<section class="feedback" tabindex="-1" id="feedback" aria-labelledby="feedback-heading"><h3 id="feedback-heading">' +
        icon(selected.correct ? 'check' : 'info') + (selected.correct ? 'Richtig gewusst!' : 'Richtig ist „' + esc(answerText) + '“.') +
        '</h3><p>' + esc(q.explanation) + '</p>' + (selected.recalled ? '<p class="earned">' + icon('replay') + 'Wiedergewusst · Diesmal richtig erinnert.</p>' : '') +
        (selected.newlyMastered ? '<p class="earned">' + icon('medal') + 'Sicher gewusst · Karte im Wissensalbum.</p>' : '') + '</section>';
    }
  }
  const finished = item.void || selected;
  return heading(fullDay(s.day),label,action('pause',icon('pause') + 'Pausieren','quiet-btn')) +
    '<div class="two-col"><section class="paper question-card"><div class="question-meta">' + pill(q.category) +
    '<span class="position" id="position">' + count + '</span></div><div class="segments" aria-hidden="true">' + segments + '</div>' + body +
    (finished ? '<div class="question-actions">' + action('next',pos === s.items.length - 1 ? 'Ergebnis ansehen' : 'Nächste Frage','primary','data-pos="' + pos + '"') + '</div>' : '') +
    '<div class="question-foot">' + (finished ? action('source',icon('book') + 'Quellen','text-btn') : '<span>' + (item.kind === 'new' ? icon('list') + 'Eine Antwort auswählen' : icon('replay') + 'Wiederholungsfrage') + '</span>') +
    action('report',icon('flag') + 'Frage melden','text-btn') + '</div></section>' + sidePanel(state,day) + '</div>';
}
export function resultPage({state, session:s, day}) {
  const r = s.result, rows = state.settings.comparison ? ranking(s) : [];
  const comparator = rows.length ? '<details class="paper section-card virtual"><summary><span>' + icon('topics') +
    'Virtuelle Quizrunde</span>' + icon('down') + '</summary><p>Drei Computergegner haben dieselben Fragen gespielt. Bei gleicher Trefferzahl teilt ihr euch den Platz.</p>' +
    '<table><caption class="sr-only">Ergebnisse der virtuellen Quizrunde</caption><thead><tr><th>Platz</th><th>Spieler</th><th>Treffer</th></tr></thead><tbody>' +
    rows.map(row => '<tr' + (row.human ? ' class="own-row"' : '') + '><td>' + row.rank + '.</td><td>' + esc(row.name) +
      (row.human ? '' : '<small>Computergegner</small>') + '</td><td>' + row.correct + '</td></tr>').join('') + '</tbody></table></details>' : '';
  return heading(fullDay(s.day),'Dein Rundenergebnis') + '<div class="two-col"><div><section class="paper result-card"><div class="result-symbol">' +
    icon(r.medal ? 'medal' : 'book') + '</div><p class="small-label">' + esc(modeLabel(s)) + ' abgeschlossen</p><h2 class="score">' + r.correct + '<span> von </span>' + r.valid +
    '</h2><p>Fragen richtig beantwortet</p><div class="result-awards">' + (r.medal ? '<span>' + icon('medal') + esc(r.medal) + '</span>' : '') +
    (s.mode === 'daily' ? '<span>' + icon('spark') + '+' + r.xp + ' XP</span>' : '<span>' + icon('book') + 'Wissensalbum aktualisiert</span>') + '</div>' +
    (s.corrected ? '<p class="notice">Eine Frage wurde nachträglich korrigiert. Das Abschlussdatum und bereits gebuchte XP bleiben erhalten.</p>' :
      r.recalled ? '<p class="notice">Wiedergewusst · ' + r.recalled + (r.recalled === 1 ? ' frühere Frage' : ' frühere Fragen') + ' diesmal richtig beantwortet.</p>' : '') +
    action('home','Zur Übersicht','primary') + '</section>' + comparator + '</div>' + sidePanel(state,day) + '</div>';
}
const colorNames = {'nature_animals':'nature','geography_travel':'travel','everyday_technology':'tech','history_discoveries':'history','entertainment':'music','language_culture':'culture'};
export function topicsPage({state, billing}) {
  const open = Object.values(state.sessions).find(s => s.status === 'active' && s.mode !== 'daily');
  const cards = Object.entries(RULES.categories).map(([id,title]) => {
    const active = open?.category === id;
    const status = active ? 'Angefangene Runde fortsetzen' : billing.allowed ? billing.topicLabel :
      state.trials[id] ? 'Kennenlernrunde bereits genutzt' : 'Kostenlos kennenlernen · 5 Fragen';
    return '<button class="topic-card ' + colorNames[id] + '" data-action="topic" data-id="' + id + '"><span class="topic-art">' +
      icon(id) + '</span><span class="topic-label"><strong>' + esc(title) + '</strong><small>' + status + '</small></span></button>';
  }).join('');
  return heading('Themenrunden','Deine Themen',action('plus',icon('spark') + esc(billing.label),'quiet-btn'),'topics') +
    '<p class="intro">' + (billing.allowed ? 'Wähle ein Thema und die Schwierigkeit für deine nächste Runde.' : 'Wähle ein Thema. Die erste Kennenlernrunde jeder Kategorie ist kostenlos.') + '</p>' +
    (open ? '<section class="paper section-card"><h2>Offene Themenrunde</h2>' + historyRow(open) + '</section>' : '') +
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
    const filtered = cards.filter(c => filter === 'all' || (filter === 'mastered' ? c.mastered : c.category === filter));
    panel = '<div class="panel-line"><h2>Wissensalbum</h2><span class="mini-count">' + cards.length + (cards.length === 1 ? ' Karte' : ' Karten') +
      '</span></div><p class="quiet">Hier kannst du die Erklärungen deiner gespielten Fragen nachlesen.</p>';
    if (cards.length) {
      panel += '<label class="filter">Karten anzeigen<select id="album-filter">' + [['all','Alle Karten'],['mastered','Sicher gewusst'],...Object.entries(RULES.categories)].map(([id,name]) =>
        '<option value="' + id + '"' + (id===filter?' selected':'') + '>' + esc(name) + '</option>').join('') + '</select></label>';
    }
    panel += filtered.length ? filtered.map(c => '<details class="album-item"><summary><span><small>' + esc(nameOf(c.category)) +
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
    toggle('comparison','Computergegner anzeigen','Optionaler Vergleich im Ergebnis der Tagesrunde.',state.settings.comparison) +
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
