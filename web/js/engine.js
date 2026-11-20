import { RULES } from './rules.js';

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
export function monday(day) {
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay();
  return addDays(day, -(weekday + 6) % 7);
}
export function newGame() {
  return {schema: 2, sessions: {}, progress: {}, awards: {}, ledger: {}, trials: {},
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
function simulate(questions, seed) {
  const random = generator(seed);
  return simulation.opponents.map(opponent => {
    const hits = questions.map(q => {
      const base = simulation.base[q.difficulty];
      const adjustment = opponent.specialties.includes(q.category) ? simulation.specialty_bonus : -simulation.other_penalty;
      return random() < Math.min(simulation.max, Math.max(simulation.min, base + adjustment));
    });
    return {name: opponent.name, hits, correct: hits.filter(Boolean).length};
  });
}
function choose(state, catalog, mode, category, day, seed) {
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
  const withdrawn = new Set(catalog.corrections.map(keyOf));
  const pool = shuffle(catalog.questions.filter(q =>
    (!category || category === q.category) && (!q.valid_until || q.valid_until >= day) &&
    !withdrawn.has(keyOf(q)) && !reservedFacts.has(q.fact_key) && !reservedIds.has(q.id)
  ), random);
  const picked = [], usedIds = new Set(), usedFacts = new Set(), byCategory = {}, byDifficulty = {};
  function take(candidates, limit, kind, oldest = false) {
    for (let n = 0; n < limit; n++) {
      const available = candidates.filter(q => !usedIds.has(q.id) && !usedFacts.has(q.fact_key));
      if (!available.length) break;
      const rank = q => {
        const deficit = config.mix[difficulties.indexOf(q.difficulty)] - (byDifficulty[q.difficulty] || 0);
        return [Number(deficit > 0), -(byCategory[q.category] || 0), deficit, -(seenByCategory[q.category] || 0)];
      };
      available.sort((a, b) => {
        if (oldest) {
          const ap = state.progress[keyOf(a)], bp = state.progress[keyOf(b)];
          const order = kind === 'due' ? ap.due.localeCompare(bp.due) : ap.lastDay.localeCompare(bp.lastDay);
          if (order) return order;
        }
        const ar = rank(a), br = rank(b);
        for (let k = 0; k < ar.length; k++) if (ar[k] !== br[k]) return br[k] - ar[k];
        return 0;
      });
      const q = available[0];
      usedIds.add(q.id);
      usedFacts.add(q.fact_key);
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      picked.push({q, kind});
    }
  }
  const due = pool.filter(q => state.progress[keyOf(q)]?.due <= day);
  take(due, rounds.max_due, 'due', true);
  take(pool.filter(q => !state.progress[keyOf(q)]), config.length - picked.length, 'new');
  const isReview = picked.length < config.length;
  if (isReview) {
    const older = pool.filter(q => state.progress[keyOf(q)]?.lastDay <= addDays(day, -rounds.preferred_repeat_gap));
    take(older, config.length - picked.length, 'review', true);
    take(pool.filter(q => state.progress[keyOf(q)]), config.length - picked.length, 'review', true);
  }
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

export function startRound(state, catalog, installId, time, {mode = 'daily', category = null, entitled = false} = {}) {
  if (mode === 'daily') {
    const existing = state.sessions['daily-' + time.day];
    if (existing) return existing;
    category = null;
  } else {
    if (!['trial', 'topic', 'challenge'].includes(mode) || !Object.hasOwn(RULES.categories, category)) {
      throw new GameError('MODE', 'Diese Themenrunde ist unbekannt.');
    }
    const active = Object.values(state.sessions).find(s => s.mode !== 'daily' && s.status === 'active');
    if (active) {
      if (active.category === category && active.mode === mode) return active;
      throw new GameError('ACTIVE_TOPIC', 'Du hast eine offene Themenrunde. Du kannst sie fortsetzen oder im Verlauf aufgeben.', active.id);
    }
    if (mode === 'trial' && state.trials[category]) throw new GameError('TRIAL_USED', 'Diese Kennenlernrunde wurde bereits gestartet.');
    if (mode !== 'trial' && !entitled) throw new GameError('PLUS', 'Für weitere Themenrunden benötigst du Quizsalon Plus.');
  }
  const id = mode === 'daily' ? 'daily-' + time.day : mode + '-' + (Object.keys(state.sessions).length + 1);
  const seed = [installId, time.day, RULES.selection_version, id].join('/');
  const {items, isReview} = choose(state, catalog, mode, category, time.day, seed);
  const simSeed = seed + '/computer';
  const session = {id, mode, category, status: 'active', day: time.day, zone: time.zone, offset: time.offset,
    created: time.now, completed: null, cursor: 0, seed, selectionVersion: RULES.selection_version,
    catalogVersion: catalog.version, items, isReview, simSeed,
    opponents: mode === 'daily' ? simulate(items.map(i => i.q), simSeed) : [], result: null};
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
  if (!catalog.corrections.length) return;
  const retired = new Set(catalog.corrections.map(keyOf));
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
  const withdrawn = new Map(catalog.corrections.map(c => [keyOf(c), c]));
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
  const valid = new Set(catalog.questions.map(keyOf));
  for (const c of catalog.corrections) valid.delete(keyOf(c));
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
  if (session.mode !== 'daily' || session.corrected || session.result?.valid !== 10) return [];
  const rows = [{name: 'Du', correct: session.result.correct, human: true}, ...session.opponents];
  rows.sort((a, b) => b.correct - a.correct);
  return rows.map(row => ({...row, rank: 1 + rows.filter(r => r.correct > row.correct).length}));
}
