import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {newGame, startRound} from '../web/js/engine.js';
import {RULES} from '../web/js/rules.js';
import {availableTopicModes, availableTopicPool, matchesSubtopic, subtopicOptions} from '../web/js/subtopics.js';

const catalog = JSON.parse(readFileSync(new URL('../web/data/catalog.json', import.meta.url)));
const day = '2026-11-24', nature = 'nature_animals';
const time = {day, now: day + 'T09:00:00Z', zone: 'Europe/Berlin', offset: -60};

test('three curated topics expose only complete distinct grade mixes inside their category', () => {
  const game = newGame();
  const byTopic = Object.fromEntries(Object.keys(RULES.categories).flatMap(category =>
    subtopicOptions(game, catalog, day, category).map(t => [t.id, t])));
  assert.deepEqual(byTopic.filmgeschichte, {id: 'filmgeschichte', label: 'Filmgeschichte', category: 'entertainment',
    counts: {easy: 54, medium: 31, hard: 11}, variants: ['topic', 'challenge']});
  assert.deepEqual(byTopic.tierverhalten, {id: 'tierverhalten', label: 'Tierverhalten', category: nature,
    counts: {easy: 26, medium: 10, hard: 2}, variants: ['topic']});
  assert.deepEqual(byTopic.wetter, {id: 'wetter', label: 'Wetter', category: nature,
    counts: {easy: 18, medium: 9, hard: 3}, variants: ['topic', 'challenge']});
  for (const [id, topic] of Object.entries(byTopic)) {
    for (const mode of topic.variants) {
      const state = newGame();
      const round = startRound(state, catalog, 'pruefung', time, {mode, category: topic.category, subtopic: id, entitled: true});
      assert.equal(round.items.length, 10);
      assert.equal(new Set(round.items.map(i => i.q.fact_key)).size, 10);
      assert.ok(round.items.every(i => matchesSubtopic(i.q, id)));
      const mix = ['easy','medium','hard'].map(level => round.items.filter(i => i.q.difficulty === level).length);
      assert.deepEqual(mix, RULES.rounds[mode].mix);
    }
  }
  assert.deepEqual(availableTopicModes(game, catalog, day, nature), ['topic', 'challenge']);
  assert.equal(availableTopicPool(game, catalog, day, 'entertainment', 'tierverhalten').length, 0);
  assert.deepEqual(availableTopicModes(game, catalog, day, 'unknown', 'wetter'), []);
});

test('availability counts reservations by ID and fact; releasing a daily round restores the missing weather slot', () => {
  const state = newGame();
  const hard = availableTopicPool(state, catalog, day, nature, 'wetter').filter(q => q.difficulty === 'hard');
  const reserved = state.sessions.alt = {id: 'alt', mode: 'daily', status: 'active', items: [
    {q: {...hard[0], fact_key: 'frueherer-schluessel'}}, {q: {...hard[1], id: 'fruehere-id'}}]};
  assert.deepEqual(availableTopicModes(state, catalog, day, nature, 'wetter'), ['topic']);
  const report = subtopicOptions(state, catalog, day, nature).find(topic => topic.id === 'wetter');
  assert.equal(report.counts.hard, 1);
  const before = JSON.stringify(state);
  assert.throws(() => startRound(state, catalog, 'pruefung', time,
    {mode: 'challenge', category: nature, subtopic: 'wetter', entitled: true}), e => e.code === 'POOL');
  assert.equal(JSON.stringify(state), before);
  reserved.status = 'abandoned';
  assert.deepEqual(availableTopicModes(state, catalog, day, nature, 'wetter'), ['topic', 'challenge']);
});

test('known corrections, expiry, future publications, category, duplicate facts and duplicate IDs affect candidate counts', () => {
  const state = newGame();
  const q = catalog.questions.find(x => matchesSubtopic(x, 'wetter'));
  const make = (id, changes = {}) => ({...q, id, fact_key: 'f-' + id, ...changes});
  const fixture = {corrections: [{id: 'katalog', semantic_revision: q.semantic_revision}],
    archived: [{id: 'archiv', semantic_revision: q.semantic_revision}], questions: [
      make('bis-heute', {valid_until: day}), make('ab-heute', {research: {published_on: day}}),
      make('alt', {valid_until: '2026-11-23'}), make('morgen', {research: {published_on: '2026-11-25'}}),
      make('katalog'), make('lokal'), make('archiv'), make('verworfen', {status: 'draft'}),
      make('nachbar', {category: 'entertainment'}), make('fremd', {tags: ['thema_pflanzen']}),
      make('kopie', {fact_key: 'f-bis-heute'}), make('ab-heute', {fact_key: 'sonstiger-fakt'})]};
  state.corrections['lokal@' + q.semantic_revision] = {};
  const before = JSON.stringify(state);
  assert.deepEqual(availableTopicPool(state, fixture, day, nature, 'wetter').map(x => x.id),
    ['bis-heute', 'ab-heute']);
  assert.deepEqual(availableTopicModes(state, fixture, day, nature, 'wetter'), []);
  assert.equal(JSON.stringify(state), before);
});

test('only parent categories offer a free first taste; absence of Plus never grants subtopic access', () => {
  const state = newGame();
  const start = opts => startRound(state, catalog, 'pruefung', time, {category: nature, ...opts});
  assert.throws(() => start({mode: 'trial', subtopic: 'wetter'}), e => e.code === 'MODE');
  assert.throws(() => start({mode: 'topic', subtopic: 'wetter'}), e => e.code === 'PLUS');
  assert.throws(() => start({mode: 'topic', subtopic: 'unbekannt', entitled: true}), e => e.code === 'MODE');
  assert.deepEqual(state.sessions, {});
  const trial = start({mode: 'trial'});
  assert.equal(trial.items.length, 5);
  trial.status = 'abandoned';
  assert.throws(() => start({mode: 'trial'}), e => e.code === 'TRIAL_USED');
  assert.equal(start({mode: 'topic', subtopic: 'wetter', entitled: true}).items.length, 10);
});
