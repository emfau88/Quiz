import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {answer, advance, applyCorrections, newGame, startRound} from '../web/js/engine.js';
import {friendLinkFor, parseFriendLink, prepareFriendRound} from '../web/js/friends.js';

const day = '2026-11-24';
const time = {day, now: day + 'T09:00:00Z', zone: 'Europe/Berlin', offset: -60};
const clone = data => JSON.parse(JSON.stringify(data));
const catalog = {version: 'test-a', corrections: [], archived: [],
  questions: Array.from({length: 6}, (_, i) => ({
    id: 'frage-' + i, fact_key: 'fakt-' + i, category: 'nature_animals', difficulty: 'easy',
    content_revision: i + 2, semantic_revision: 1, question: 'Prüfkarte ' + i,
    options: ['sonne', 'weiß', 'see', 'tal'].map(id => ({id, text: id})),
    correct_option_id: 'see', tags: ['thema_wetter'], explanation: 'Eine Erklärung.', valid_until: null
  }))};

function sender(source = catalog, hits = 4) {
  const state = newGame();
  const round = {id: 'lokale-kennung', mode: 'quick', status: 'active', cursor: 0, items: [],
    day, zone: time.zone, seed: 'privater-zufallswert', opponents: [{name: 'Mira'}]};
  for (const [i, q] of source.questions.slice(0, 5).entries()) {
    const order = q.options.map(o => o.id);
    round.items.push({q: clone(q), order: [...order.slice(i % 4), ...order.slice(0, i % 4)].reverse(),
      kind: 'new', answer: null, void: false});
  }
  state.sessions[round.id] = round;
  for (const [i, item] of round.items.entries()) {
    const choice = i < hits ? item.q.correct_option_id : item.order.find(id => id !== item.q.correct_option_id);
    assert.ok(answer(state, round.id, i, choice, time));
    assert.ok(advance(state, round.id, i, time));
  }
  return {state, round, link: friendLinkFor(round, state, source, day)};
}

test('completed mixed round publishes only version, score and ordered card revisions/options in an HTTPS fragment', () => {
  const {state, round, link} = sender();
  assert.equal(round.result.correct, 4);
  const url = new URL(link);
  assert.equal(url.origin + url.pathname, 'https://emfau88.github.io/Quiz/spielen.html');
  assert.equal(url.search, '');
  const parts = url.hash.split('/');
  assert.deepEqual(parts.slice(0, 3), ['#freunde', '1', '4']);
  assert.equal(parts.length, 8);
  assert.ok(parts.slice(3).every(token => /^frage-\d~\d~1~[0-3]{4}$/.test(token)));
  assert.deepEqual(parseFriendLink(url), parseFriendLink(url.hash));
  assert.deepEqual(parseFriendLink(url.hash), parseFriendLink(link));
  for (const hidden of [day, round.id, round.seed, 'Mira', 'Europe', 'answer', 'correct', 'weiß', 'see']) {
    assert.ok(!link.includes(hidden), hidden);
  }
  assert.equal(friendLinkFor({...round, rematchOf: 'tisch-1'}, state, catalog, day), link);
  for (const hits of [0, 5]) assert.equal(parseFriendLink(sender(catalog, hits).link).score, hits);
});

test('receiver with another catalog version, local date and progress gets identical cards and stable option IDs', () => {
  const {round, link} = sender();
  const recipient = newGame(), next = clone(catalog);
  next.version = 'späterer-katalog';
  next.questions.reverse();
  for (const q of next.questions) q.options.reverse();
  recipient.progress['frage-0@1'] = {due: '2027-01-01'};
  recipient.progress['frage-1@1'] = {due: '2026-12-01'};
  recipient.trials.nature_animals = 'frühere-probe';
  const before = JSON.stringify(recipient);
  const received = prepareFriendRound(recipient, next, '2026-12-12', parseFriendLink(link));
  assert.equal(received.status, 'ready');
  assert.equal(received.score, 4);
  assert.equal(received.isReview, true);
  assert.deepEqual(received.items.map(i => [i.q.id, i.order]), round.items.map(i => [i.q.id, i.order]));
  assert.deepEqual(received.items.map(i => i.kind), ['review', 'due', 'new', 'new', 'new']);
  assert.ok(received.items.every(i => i.answer === null && i.void === false));
  assert.equal(JSON.stringify(recipient), before);
  received.items[0].q.options[0].text = 'eigene Kopie';
  assert.ok(!next.questions.flatMap(q => q.options).some(o => o.text === 'eigene Kopie'));
});

test('normal routes, older/newer versions, damaged data and duplicate IDs are distinguished before play', () => {
  const hash = new URL(sender().link).hash, parts = hash.split('/');
  assert.equal(parseFriendLink('#heute'), null);
  assert.equal(parseFriendLink('#freunden'), null);
  assert.equal(parseFriendLink(''), null);
  for (const broken of ['#freunde', '#freunde/', hash.replace('/1/', '/0/'), hash.replace('/1/', '/2/'),
    hash.replace('/4/', '/6/'), hash.replace('/4/', '/04/'), hash + '/mehr', parts.slice(0, -1).join('/'),
    [...parts.slice(0, -1), parts[3]].join('/'), hash.replace('~2~1~', '~0~1~'), hash.replace('~2~1~', '~1~2~'),
    hash.replace(/~[0-3]{4}/, '~0013'), hash.replace('frage-0', '%FF'),
    hash.replace('frage-0', '%66rage-0'), hash.replace('~2~1~', '~9007199254740993~1~')]) {
    const invalid = parseFriendLink(broken);
    assert.equal(invalid?.status, 'invalid', broken);
    assert.ok(invalid.message);
    assert.equal(prepareFriendRound(newGame(), catalog, day, invalid).status, 'invalid');
  }
  const copied = parseFriendLink(hash);
  assert.equal(prepareFriendRound(newGame(), catalog, day, {...copied, key: 'daily-2026-11-24'}).status, 'invalid');
});

test('revisions, unknown or ambiguous IDs, duplicate facts, expiry, archive and local withdrawals block new starts', () => {
  const {round, state, link} = sender(), incoming = parseFriendLink(link);
  const changes = [
    c => c.questions.shift(), c => c.questions[0].content_revision++, c => c.questions[0].semantic_revision++,
    c => { c.questions[1].fact_key = c.questions[0].fact_key; },
    c => c.questions.push(clone(c.questions[0])), c => { c.questions[1].status = 'retired'; },
    c => { c.questions[1].valid_until = '2026-11-23'; },
    c => { c.questions[1].research = {published_on: '2026-12-01'}; },
    c => { c.corrections = [{id: 'frage-1', semantic_revision: 1}]; },
    c => { c.archived = [{id: 'frage-1', semantic_revision: 1}]; }
  ];
  for (const change of changes) {
    const edited = clone(catalog);
    change(edited);
    assert.equal(prepareFriendRound(newGame(), edited, day, incoming).status, 'invalid');
    assert.equal(friendLinkFor(round, state, edited, day), null);
  }
  const boundary = clone(catalog);
  boundary.questions[0].valid_until = day;
  boundary.questions[1].research = {published_on: day};
  boundary.corrections.push({id: 'frage-1', semantic_revision: 2});
  assert.equal(prepareFriendRound(newGame(), boundary, day, incoming).status, 'ready');
  const locallyWithdrawn = newGame();
  locallyWithdrawn.corrections['frage-0@1'] = {reason: 'bekannte Korrektur'};
  assert.equal(prepareFriendRound(locallyWithdrawn, catalog, day, incoming).status, 'invalid');
  assert.equal(friendLinkFor(round, locallyWithdrawn, catalog, day), null);
});

test('send gate rejects incomplete/corrected sessions, other modes, an inconsistent answer and score', () => {
  const {round, state} = sender();
  for (const mode of ['friend', 'daily', 'topic', 'challenge', 'trial']) {
    assert.equal(friendLinkFor({...round, mode}, state, catalog, day), null);
  }
  for (const change of [s => {s.status = 'active';}, s => {s.corrected = true;}, s => s.items.pop(),
    s => {s.items[0].void = true;}, s => {s.items[0].answer = null;}, s => {s.result.valid = 4;},
    s => {s.result.correct = 1;}, s => {s.items[0].answer.correct = false;},
    s => {s.items[0].order[0] = s.items[0].order[1];}
  ]) {
    const altered = clone(round);
    change(altered);
    assert.equal(friendLinkFor(altered, state, catalog, day), null);
  }
  assert.equal(friendLinkFor(null, state, catalog, day), null);
});

test('daily reservations by ID or fact take priority; separate active extra round needs an explicit resolution', () => {
  const incoming = parseFriendLink(sender().link), state = newGame();
  const extra = state.sessions.andere = {id: 'andere', mode: 'quick', status: 'active', items: [{q: catalog.questions[5]}]};
  const daily = state.sessions.heute = {id: 'heute', mode: 'daily', status: 'active',
    items: [{q: {...catalog.questions[0], id: 'andere-aufgabe-zum-selben-fakt'}}]};
  const open = () => prepareFriendRound(state, catalog, day, incoming);
  assert.deepEqual([open().code, open().sessionId], ['DAILY_CONFLICT', daily.id]);
  daily.items[0].q = {...catalog.questions[0], fact_key: 'anderer-fakt'};
  assert.equal(open().code, 'DAILY_CONFLICT');
  daily.items[0].q = catalog.questions[5];
  assert.deepEqual([open().code, open().sessionId], ['ACTIVE_TOPIC', extra.id]);
  extra.status = 'abandoned';
  assert.equal(open().status, 'ready');
});

test('duplicate opening resolves to one stored round and its original shared score, including after correction', () => {
  const {link} = sender(), incoming = parseFriendLink(link);
  const modifiedScore = parseFriendLink(link.replace('/4/', '/1/'));
  assert.equal(modifiedScore.key, incoming.key);
  const recipient = newGame();
  const prepared = prepareFriendRound(recipient, catalog, day, incoming);
  const saved = recipient.sessions[prepared.key] = {id: prepared.key, mode: 'friend', status: 'active',
    friendScore: 4, cursor: 0, day, items: prepared.items};
  const again = () => prepareFriendRound(recipient, catalog, day, modifiedScore);
  assert.deepEqual([again().status, again().sessionId, again().score], ['existing', saved.id, 4]);
  for (const [i, item] of saved.items.entries()) {
    const pick = i < 2 ? item.q.correct_option_id : item.order.find(id => id !== item.q.correct_option_id);
    assert.ok(answer(recipient, saved.id, i, pick, time));
    assert.ok(advance(recipient, saved.id, i, time));
  }
  assert.equal(saved.result.correct, 2);
  assert.equal(saved.result.xp, 0);
  assert.equal(again().sessionStatus, 'completed');
  assert.equal(Object.keys(recipient.ledger).length, 0);
  assert.equal(Object.values(recipient.progress).reduce((n, p) => n + p.count, 0), 5);
  recipient.corrections['frage-0@1'] = {};
  assert.equal(again().sessionStatus, 'completed');
  saved.status = 'abandoned';
  assert.equal(again().sessionStatus, 'abandoned');
});

test('format safely preserves punctuation, accents and separators in stable question identifiers', () => {
  const local = clone(catalog);
  local.questions[0].id = 'é/!~%#?ß';
  const {link} = sender(local), incoming = parseFriendLink(link);
  assert.equal(incoming.cards[0].id, local.questions[0].id);
  assert.equal(prepareFriendRound(newGame(), local, day, incoming).items[0].q.id, local.questions[0].id);
});

test('real mixed-round selection and normal free engine entry preserve idempotence, corrections and isolated scorekeeping', () => {
  const actual = JSON.parse(readFileSync(new URL('../web/data/catalog.json', import.meta.url)));
  const senderState = newGame(), recipientState = newGame();
  const quick = startRound(senderState, actual, 'sender-install', time, {mode: 'quick'});
  const done = (state, round, hits, now) => {
    for (const [pos, item] of round.items.entries()) {
      if (!item.void) {
        const selected = pos < hits ? item.q.correct_option_id : item.order.find(id => id !== item.q.correct_option_id);
        assert.ok(answer(state, round.id, pos, selected, now));
      }
      assert.ok(advance(state, round.id, pos, now));
    }
  };
  done(senderState, quick, 4, time);
  const link = friendLinkFor(quick, senderState, actual, day), invite = parseFriendLink(link);
  const recipientTime = {...time, day:'2026-11-25', now:'2026-11-25T18:00:00Z'};
  const before = JSON.stringify(senderState);
  const open = () => startRound(recipientState, actual, 'my-other-install', recipientTime, {mode: 'friend', invite});
  const friend = open();
  assert.equal(open(), friend);
  assert.equal(Object.keys(recipientState.sessions).length, 1);
  assert.equal(friend.friendScore, 4);
  assert.deepEqual(friend.items.map(x => [x.q.id, x.order]), quick.items.map(x => [x.q.id, x.order]));
  const withdrawnGame = clone(recipientState);
  const independentCatalog = {...actual, corrections: [friend.items[1].q]};
  applyCorrections(withdrawnGame, independentCatalog);
  const interrupted = withdrawnGame.sessions[friend.id];
  assert.ok(interrupted.corrected && interrupted.items[1].void);
  done(withdrawnGame, interrupted, 3, recipientTime);
  assert.equal(interrupted.result.valid, 4);
  done(recipientState, friend, 3, recipientTime);
  assert.equal(open(), friend);
  assert.equal(friend.result.correct, 3);
  assert.deepEqual(recipientState.ledger, {});
  assert.deepEqual(recipientState.trials, {});
  assert.equal(Object.values(recipientState.progress).reduce((sum, p) => sum + p.count, 0), 5);
  assert.equal(JSON.stringify(senderState), before);
});
