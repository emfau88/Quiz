import { RULES } from './rules.js';
import {availableTopicModes, currentQuestions, matchesSubtopic} from './subtopics.js';
import {prepareFriendRound} from './friends.js';

const { rounds, progress: learning, simulation } = RULES;
const difficulties = ['easy', 'medium', 'hard'];
export const keyOf = q => q.id + '@' + q.semantic_revision;
export const copy = value => JSON.parse(JSON.stringify(value));

export function clock(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return {
    now: date.toISOString(),
    day: [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-'),
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    offset: -date.getTimezoneOffset()
  };
}
export function addDays(day, days) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function monthsBefore(date, months) {
  const first = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()-months,1));
  const end = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0));
  first.setUTCDate(Math.min(date.getUTCDate(),end.getUTCDate()));
  return first.toISOString().slice(0,10);
}
export function monday(day) {
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay();
  return addDays(day, -(weekday + 6) % 7);
}
export function newGame() {
  return {schema: 2, sessions: {}, progress: {}, awards: {}, ledger: {}, trials: {}, corrections: {},
    settings: {comparison: true, sound: false, haptics: false}, lastView: 'today'};
}
export function migrate(saved) {
  if (!saved) return newGame();
  if (saved.schema === 1) {
    // V1 already contained snapshots, answers, ledger and trials.
    saved.awards ??= {};
    saved.lastView ??= 'today';
    saved.settings = {...newGame().settings, ...saved.settings};
    for (const [key, p] of Object.entries(saved.progress)) {
      if (p.mastered && !saved.awards[key]) saved.awards[key] = {day: p.lastDay};
    }
    saved.schema = 2;
  }
  if (saved.schema !== 2) throw new Error('Dieser Spielstand benötigt eine neuere Version von Quizsalon.');
  return saved;
}
export class GameError extends Error {
  constructor(code, message, sessionId = '') {
    super(message);
    this.code = code;
    this.sessionId = sessionId;
  }
}

function generator(seed) {
  let n = 2166136261;
  for (const char of seed) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
  return () => {
    n = (n + 0x6D2B79F5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function simulate(questions, seed, sessions, rematch) {
  const random = generator(seed);
  const shuffled = shuffle(simulation.opponents, random);
  let trio = shuffled.slice(0, 3);
  if (rematch) {
    // Older games stored the three names and hits before stable guest IDs were introduced.
    trio = rematch.opponents.map(o => simulation.opponents.find(g => g.id === o.id || g.name === o.name));
  } else {
    const previous = sessions.filter(s => s.opponents?.length === 3).at(-1);
    const previousNames = new Set(previous?.opponents.map(o => o.name));
    if (trio.every(g => previousNames.has(g.name))) trio[2] = shuffled.find(g => !previousNames.has(g.name));
  }
  return trio.map(opponent => {
    const hits = questions.map(q => {
      const base = simulation.base[q.difficulty];
      const adjustment = opponent.specialties.includes(q.category) ? simulation.specialty_bonus : -simulation.other_penalty;
      return random() < Math.min(simulation.max, Math.max(simulation.min, base + adjustment));
    });
    return {id: opponent.id, name: opponent.name, specialties: [...opponent.specialties], hits, correct: hits.filter(Boolean).length};
  });
}
function choose(state, catalog, mode, category, day, seed, subtopic, rematch) {
  const config = rounds[mode];
  const random = generator(seed);
  const reservedFacts = new Set(), reservedIds = new Set(), seenByCategory = {};
  for (const s of Object.values(state.sessions)) {
    for (const item of s.items) {
      if (s.status === 'active') {
        reservedFacts.add(item.q.fact_key);
        reservedIds.add(item.q.id);
      }
      if (item.answer && !item.void) seenByCategory[item.q.category] = (seenByCategory[item.q.category] || 0) + 1;
    }
  }
  const dailyMix = mode === 'daily' && catalog.daily_formats;
  const dailyClues = dailyMix ? new Set(catalog.daily_clues) : null;
  const pool = shuffle(currentQuestions(state, catalog, day).filter(q =>
    (!category || category === q.category) && (!subtopic || matchesSubtopic(q, subtopic)) &&
    !reservedFacts.has(q.fact_key) && !reservedIds.has(q.id)
  ), random);
  const topicOf = new Map(pool.map(q => [q.id, q.category + '/' + (q.tags?.find(t => t.startsWith('thema_')) || '')]));
  const topicOrder = new Map(shuffle([...new Set(topicOf.values())], random).map((topic, index) => [topic, index]));
  const byTopic = new Map(), byForm = new Map();
  const formOf = new Map(pool.map(q => [q.id, q.tags?.find(t => t.startsWith('form_')) || '']));
  const remaining = dailyMix ? {...config.formats} : null;
  if (remaining) remaining.other = config.length - Object.values(config.formats).reduce((a,b) => a+b, 0);
  const formatGroup = form => dailyMix && Object.hasOwn(config.formats, form) ? form : 'other';
  const picked = [], usedIds = new Set(), usedFacts = new Set(), byCategory = {}, byDifficulty = {};
  const regular = dailyMix ? pool.filter(q => !q.research) : pool;
  const featured = dailyMix ? regular.filter(q => dailyClues.has(q.id)) : [];
  let hasFeatured = false;
  function take(candidates, limit, kind, oldest = false) {
    for (let n = 0; n < limit; n++) {
      let q, bestDate, bestRank;
      for (const candidate of candidates) {
        if (usedIds.has(candidate.id) || usedFacts.has(candidate.fact_key)) continue;
        const form = formOf.get(candidate.id);
        if (dailyMix && (!remaining[formatGroup(form)]
          || (form === 'form_wiedererkennen' && byForm.get(form) >= config.max_recognition))) continue;
        if (form === 'form_herleiten' && featured.length && !hasFeatured &&
            remaining[form] === 1 && !dailyClues.has(candidate.id)) continue;
        const progress = oldest && state.progress[keyOf(candidate)];
        const date = oldest ? (kind === 'due' ? progress.due : progress.lastDay) : '';
        if (q && date > bestDate) continue;
        const topic = topicOf.get(candidate.id);
        const deficit = config.mix[difficulties.indexOf(candidate.difficulty)] - (byDifficulty[candidate.difficulty] || 0);
        if ((mode === 'topic' || mode === 'challenge') && deficit <= 0) continue;
        // The seeded topic order gives small subjects a chance alongside large series.
        const rank = [Number(deficit > 0), -(byCategory[candidate.category] || 0),
          -(byTopic.get(topic) || 0), deficit, -(seenByCategory[candidate.category] || 0),
          -(byForm.get(form) || 0), -topicOrder.get(topic)];
        if (mode === 'quick') {
          const prior = state.progress[keyOf(candidate)];
          rank.unshift(-(byCategory[candidate.category] || 0), Number(!prior), Number(prior?.lastDay <= repeatBefore));
        }
        if (q && date === bestDate) {
          const firstDifference = rank.findIndex((value, i) => value !== bestRank[i]);
          if (firstDifference < 0 || rank[firstDifference] < bestRank[firstDifference]) continue;
        }
        q = candidate;
        bestDate = date;
        bestRank = rank;
      }
      if (!q) break;
      usedIds.add(q.id);
      usedFacts.add(q.fact_key);
      const topic = topicOf.get(q.id);
      byTopic.set(topic, (byTopic.get(topic) || 0) + 1);
      const form = formOf.get(q.id);
      byForm.set(form, (byForm.get(form) || 0) + 1);
      if (dailyClues?.has(q.id)) hasFeatured = true;
      if (dailyMix) remaining[formatGroup(form)]--;
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      picked.push({q, kind: mode === 'quick' ? (state.progress[keyOf(q)] ? 'review' : 'new') : kind});
    }
  }
  const due = q => state.progress[keyOf(q)]?.due <= day;
  const fresh = q => !state.progress[keyOf(q)];
  const repeatBefore = addDays(day, -rounds.preferred_repeat_gap);
  function fill(candidates, limit) {
    if (!limit) return;
    const target = picked.length + limit;
    take(candidates.filter(fresh), limit, 'new');
    if (picked.length < target) {
      take(candidates.filter(q => state.progress[keyOf(q)]?.lastDay <= repeatBefore), target - picked.length, 'review', true);
      take(candidates.filter(q => !fresh(q)), target - picked.length, 'review', true);
    }
  }
  if (dailyMix) {
    const current = new Date(day + 'T12:00:00Z');
    if (config.research_weekdays.includes(current.getUTCDay())) {
      const cutoff = monthsBefore(current,config.research_months);
      const findings = pool.filter(q => q.research?.published_on >= cutoff);
      if (current.getUTCDay() === config.recent_research_weekday) {
        const recent = monthsBefore(current,config.recent_research_months);
        const unseen = findings.filter(q => fresh(q) && q.research.published_on >= recent);
        const newest = unseen.reduce((latest,q) => q.research.published_on > latest ? q.research.published_on : latest,'');
        take(unseen.filter(q => q.research.published_on === newest),1,'new');
      }
      if (!picked.length) take(findings.filter(fresh), 1, 'new');
      if (!picked.length) take(findings.filter(due), 1, 'due', true);
      if (!picked.length) fill(findings, 1);
    }
  }
  if (mode === 'quick') {
    const latestFive = Object.values(state.sessions).filter(s => s.items.length === config.length).at(-1);
    const previousFacts = new Set(latestFive?.items.map(i => i.q.fact_key));
    const sourceFacts = new Set(rematch?.items.map(i => i.q.fact_key));
    take(pool.filter(q => !previousFacts.has(q.fact_key) && !sourceFacts.has(q.fact_key)), config.length, 'new');
    if (rematch && picked.length < config.length) {
      take(pool.filter(q => !sourceFacts.has(q.fact_key)), config.length - picked.length, 'new');
    }
    take(pool, config.length - picked.length, 'new');
  } else {
    take(regular.filter(due), rounds.max_due - picked.filter(item => item.kind === 'due').length, 'due', true);
  }
  if (dailyMix) {
    for (const form of Object.keys(config.formats)) {
      if (form === 'form_herleiten' && featured.length && remaining[form]) {
        take(featured.filter(fresh), remaining[form], 'new');
        if (!hasFeatured) fill(featured,1);
      }
      fill(regular.filter(q => formOf.get(q.id) === form), remaining[form]);
    }
  }
  fill(regular, config.length - picked.length);
  const isReview = picked.some(item => item.kind === 'review');
  if (picked.length < config.length) {
    const open = Object.values(state.sessions).find(s => s.status === 'active' && s.items.some(i => !category || i.q.category === category));
    throw new GameError('POOL', open
      ? 'Eine offene Runde reserviert Fragen. Spiele sie zu Ende oder gib sie im Verlauf auf.'
      : 'Für diese Runde sind zurzeit zu wenige unterschiedliche Fragen verfügbar.', open?.id);
  }
  const items = shuffle(picked, random).map(({q, kind}) => ({
    q: copy(q), order: shuffle(q.options.map(o => o.id), random), kind, answer: null, void: false
  }));
  return {items, isReview};
}

export function startRound(state, catalog, installId, time,
    {mode = 'daily', category = null, entitled = false, subtopic = null, rematchOf = null, invite = null} = {}) {
  const sessions = Object.values(state.sessions);
  let prepared, rematch;
  if (mode === 'daily') {
    const existing = state.sessions['daily-' + time.day];
    if (existing) return existing;
    category = null;
    subtopic = rematchOf = null;
  } else if (mode === 'friend') {
    prepared = prepareFriendRound(state, catalog, time.day, invite);
    if (prepared.status === 'existing') return state.sessions[prepared.sessionId];
    if (prepared.status !== 'ready') throw new GameError(prepared.code || 'INVITE', prepared.message, prepared.sessionId);
    category = subtopic = rematchOf = null;
  } else {
    if (mode === 'quick') {
      if (category || subtopic) throw new GameError('MODE', 'Die Kurzrunde mischt die Kategorien.');
      if (rematchOf) {
        rematch = state.sessions[rematchOf];
        if (!state.settings.comparison || !rematch || !ranking(rematch).length) {
          throw new GameError('REMATCH', 'Für diesen Tisch ist keine Revanche verfügbar.');
        }
      }
    } else if (!['trial', 'topic', 'challenge'].includes(mode) || !Object.hasOwn(RULES.categories, category) ||
        rematchOf || (subtopic && (mode === 'trial' || RULES.subtopics[subtopic]?.category !== category))) {
      throw new GameError('MODE', 'Diese Themenrunde ist unbekannt.');
    }
    const active = sessions.find(s => s.mode !== 'daily' && s.status === 'active');
    if (active) {
      if (active.category === category && active.mode === mode && (active.subtopic ?? null) === subtopic &&
          (active.rematchOf ?? null) === rematchOf) return active;
      throw new GameError('ACTIVE_TOPIC', 'Du hast eine offene Zusatzrunde. Du kannst sie fortsetzen oder im Verlauf aufgeben.', active.id);
    }
    if (mode === 'trial' && state.trials[category]) throw new GameError('TRIAL_USED', 'Diese Kennenlernrunde wurde bereits gestartet.');
    if (mode === 'topic' || mode === 'challenge') {
      if (!entitled) throw new GameError('PLUS', 'Für weitere Themenrunden benötigst du Quizsalon Plus.');
      if (!availableTopicModes(state, catalog, time.day, category, subtopic).includes(mode)) {
        throw new GameError('POOL', 'Für diese Mischung sind zurzeit zu wenige Fragen verfügbar.', sessions.find(s => s.status === 'active')?.id);
      }
    }
  }
  const id = prepared?.key || (mode === 'daily' ? 'daily-' + time.day : mode + '-' + (sessions.length + 1));
  const seed = [installId, time.day, RULES.selection_version, id].join('/');
  const {items, isReview} = prepared || choose(state, catalog, mode, category, time.day, seed, subtopic, rematch);
  const simSeed = seed + '/computer';
  const session = {id, mode, category, status: 'active', day: time.day, zone: time.zone, offset: time.offset,
    created: time.now, completed: null, cursor: 0, seed, selectionVersion: RULES.selection_version,
    catalogVersion: catalog.version, items, isReview, simSeed,
    opponents: mode === 'daily' || mode === 'quick' ? simulate(items.map(i => i.q), simSeed, sessions, rematch) : [], result: null};
  if (prepared) session.friendScore = prepared.score;
  if (subtopic) session.subtopic = subtopic;
  if (rematchOf) session.rematchOf = rematchOf;
  state.sessions[id] = session;
  if (mode === 'trial') state.trials[category] = id;
  return session;
}

export function answer(state, id, position, optionId, time) {
  const s = state.sessions[id], item = s?.items[position];
  if (!item || item.answer || item.void || s.status !== 'active' || s.cursor !== position) return false;
  if (!item.order.includes(optionId)) throw new GameError('OPTION', 'Diese Antwort gehört nicht zur Frage.');
  const key = keyOf(item.q), old = state.progress[key];
  const correct = optionId === item.q.correct_option_id;
  const recalled = Boolean(correct && old && !old.lastCorrect && time.day >= addDays(old.lastDay, learning.recall_min_days));
  const firstCorrect = old?.firstCorrect || (correct ? time.day : null);
  const newlyMastered = Boolean(correct && old?.firstCorrect && !state.awards[key] &&
    time.day >= addDays(old.firstCorrect, learning.mastery_min_days));
  const event = {optionId, correct, at: time.now, day: time.day, first: !old, recalled, newlyMastered};
  const interval = correct ? (old ? learning.repeat_correct_days : learning.correct_days) : learning.wrong_days;
  // A first successful answer following errors uses the first-success interval.
  const days = correct && !old?.correctCount ? learning.correct_days : interval;
  state.progress[key] = {
    firstAt: old?.firstAt || time.now, firstRight: old ? old.firstRight : correct,
    firstCorrect, lastDay: time.day, lastCorrect: correct, lastAt: time.now,
    lastError: correct ? old?.lastError || null : time.day, count: (old?.count || 0) + 1,
    correctCount: (old?.correctCount || 0) + Number(correct), due: addDays(time.day, days),
    mastered: Boolean(state.awards[key] || newlyMastered)
  };
  if (newlyMastered) state.awards[key] = {day: time.day};
  item.answer = event;
  return true;
}
export function resultFor(s) {
  const items = s.items.filter(i => !i.void);
  const correct = items.filter(i => i.answer?.correct).length;
  const valid = items.length;
  const medal = valid >= learning.medal_min_valid
    ? Object.entries(learning.medals).sort((a,b) => b[1] - a[1]).find(([, ratio]) => correct / valid >= ratio)?.[0] || null : null;
  const xp = s.mode === 'daily' && valid > 0 ? learning.completion_xp + learning.correct_xp * correct : 0;
  return {correct, valid, xp, medal, recalled: items.filter(i => i.answer?.recalled).length};
}
export function advance(state, id, position, time) {
  const s = state.sessions[id], item = s?.items[position];
  if (!item || s.status !== 'active' || s.cursor !== position || !(item.answer || item.void)) return false;
  s.cursor++;
  if (s.cursor === s.items.length) {
    s.result = resultFor(s);
    s.status = 'completed';
    s.completed = time.now;
    if (s.result.xp) state.ledger['daily-complete:' + s.id] ??= {xp: s.result.xp, day: s.day, at: time.now};
  }
  return true;
}
export function abandon(state, id) {
  if (state.sessions[id]?.status === 'active') state.sessions[id].status = 'abandoned';
}
export function applyCorrections(state, catalog) {
  const known = state.corrections ??= {};
  for (const correction of catalog.corrections) known[keyOf(correction)] = correction;
  const retired = new Set(Object.keys(known));
  if (!retired.size) return;
  for (const s of Object.values(state.sessions)) {
    for (const item of s.items) {
      if (!retired.has(keyOf(item.q))) continue;
      s.corrected = true;
      if (s.status !== 'completed') item.void = true;
    }
  }
  for (const key of retired) delete state.progress[key];
}
export function experience(state) {
  const xp = Object.values(state.ledger).reduce((sum, entry) => sum + entry.xp, 0);
  const levels = learning.levels, last = levels.at(-1);
  const level = xp < last ? levels.filter(x => xp >= x).length : levels.length + Math.floor((xp - last) / learning.later_level_step);
  const floor = levels[level - 1] ?? last + (level - levels.length) * learning.later_level_step;
  return {xp, level, floor, next: levels[level] ?? floor + learning.later_level_step};
}
export function weekActivity(state, day) {
  const start = monday(day), end = addDays(start, 7);
  return Object.values(state.sessions).filter(s => s.mode === 'daily' && s.status === 'completed' &&
    s.result.valid > 0 && s.day >= start && s.day < end).map(s => s.day);
}
export function collection(state, catalog) {
  const current = new Map(catalog.questions.map(q => [q.id, q]));
  const withdrawn = new Map([...Object.entries(state.corrections || {}), ...catalog.corrections.map(c => [keyOf(c), c])]);
  const found = new Map();
  for (const s of Object.values(state.sessions)) {
    for (const item of s.items) {
      if (!item.answer) continue;
      const key = keyOf(item.q);
      const correction = withdrawn.get(key);
      const latest = current.get(correction?.replacement_id || item.q.id);
      const corrected = Boolean(correction || (latest && latest.semantic_revision !== item.q.semantic_revision));
      const validLatest = latest && !withdrawn.has(keyOf(latest));
      const q = validLatest ? latest : corrected ? null : item.q;
      const entry = {key, id: item.q.id, category: item.q.category, q, corrected,
        mastered: Boolean(state.awards[key]), at: item.answer.at};
      // A revised card may inherit an historical award for display only.
      const group = q?.id || item.q.id;
      const prior = found.get(group);
      entry.mastered ||= Boolean(prior?.mastered);
      entry.corrected ||= Boolean(prior?.corrected);
      if (prior?.at > entry.at) entry.at = prior.at;
      found.set(group, entry);
    }
  }
  return [...found.values()].sort((a, b) => b.at.localeCompare(a.at));
}
export function statistics(state, catalog) {
  const valid = new Set([...catalog.questions, ...(catalog.archived || [])].map(keyOf));
  for (const c of catalog.corrections) valid.delete(keyOf(c));
  for (const k of Object.keys(state.corrections || {})) valid.delete(k);
  const stats = {first: {hits: 0, total: 0}, repeat: {hits: 0, total: 0}};
  for (const [key, p] of Object.entries(state.progress)) {
    if (!valid.has(key)) continue;
    stats.first.total++;
    stats.first.hits += Number(p.firstRight);
    stats.repeat.total += p.count - 1;
    stats.repeat.hits += p.correctCount - Number(p.firstRight);
  }
  return stats;
}
export function ranking(session) {
  const length = session.mode === 'daily' ? 10 : session.mode === 'quick' ? 5 : 0;
  if (!length || session.status !== 'completed' || session.corrected ||
      session.result?.valid !== length || session.opponents?.length !== 3) return [];
  const rows = [{name: 'Du', correct: session.result.correct, human: true}, ...session.opponents];
  rows.sort((a, b) => b.correct - a.correct);
  return rows.map(row => ({...row, rank: 1 + rows.filter(r => r.correct > row.correct).length}));
}
