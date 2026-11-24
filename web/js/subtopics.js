import {RULES} from './rules.js';

const grades = ['easy', 'medium', 'hard'];

export function matchesSubtopic(question, id) {
  const topic = Object.hasOwn(RULES.subtopics, id) && RULES.subtopics[id];
  return Boolean(topic && question.category === topic.category &&
    topic.tags.some(tag => question.tags?.includes(tag)));
}

// Local withdrawals persist even if a later catalog no longer lists them.
export function currentQuestions(state, catalog, day) {
  const unavailable = new Set(Object.keys(state.corrections || {}));
  for (const list of [catalog.corrections || [], catalog.archived || []]) {
    for (const q of list) unavailable.add(q.id + '@' + q.semantic_revision);
  }
  return catalog.questions.filter(q => (!q.status || q.status === 'release_approved') &&
    (!q.valid_until || q.valid_until >= day) &&
    (!q.research || q.research.published_on <= day) &&
    !unavailable.has(q.id + '@' + q.semantic_revision));
}

export function availableTopicPool(state, catalog, day, category, subtopic = null) {
  if (!Object.hasOwn(RULES.categories, category)) return [];
  const ids = new Set(), facts = new Set();
  for (const session of Object.values(state.sessions)) {
    if (session.status !== 'active') continue;
    for (const {q} of session.items) {
      ids.add(q.id);
      facts.add(q.fact_key);
    }
  }
  return currentQuestions(state, catalog, day).filter(q => {
    if (q.category !== category || (subtopic !== null && !matchesSubtopic(q, subtopic)) ||
        ids.has(q.id) || facts.has(q.fact_key)) return false;
    ids.add(q.id);
    facts.add(q.fact_key);
    return true;
  });
}

function availability(pool) {
  const counts = {easy: 0, medium: 0, hard: 0};
  for (const q of pool) counts[q.difficulty]++;
  const variants = ['topic', 'challenge'].filter(mode =>
    RULES.rounds[mode].mix.every((needed, i) => counts[grades[i]] >= needed));
  return {variants, counts};
}

export function availableTopicModes(state, catalog, day, category, subtopic = null) {
  return availability(availableTopicPool(state, catalog, day, category, subtopic)).variants;
}

export function subtopicOptions(state, catalog, day, category) {
  const pool = availableTopicPool(state, catalog, day, category);
  return Object.entries(RULES.subtopics).filter(([, topic]) => topic.category === category)
    .map(([id, topic]) => ({id, label: topic.label, category,
      ...availability(pool.filter(q => matchesSubtopic(q, id)))}));
}
