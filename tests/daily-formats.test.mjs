import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {abandon, addDays, advance, answer, keyOf, newGame, startRound} from '../web/js/engine.js';

const catalog = JSON.parse(readFileSync(new URL('../web/data/catalog.json', import.meta.url)));
const sunday = '2026-11-22';
const date = day => ({day, now:day+'T12:00:00Z',zone:'Europe/Berlin',offset:60});
const start = (state, day, pool=catalog) => startRound(state, pool, 'test-format', date(day));
const has = (q, tag) => q.tags.includes('form_'+tag);

function assertSlots(round) {
  const cards = round.items.map(i => i.q);
  assert.equal(cards.length, 10);
  assert.equal(cards.filter(q=>has(q,'schaetzen')).length, 1);
  assert.equal(cards.filter(q=>has(q,'herleiten')).length, 2);
  assert.ok(cards.filter(q=>has(q,'herleiten')).every(q=>q.tags.includes('tagesraetsel')));
  assert.ok(cards.filter(q=>has(q,'wiedererkennen')).length<=2);
  assert.equal(new Set(cards.map(q=>q.fact_key)).size, 10);
}

test('all seven weekdays keep both exact format quotas, with dated original sources on Tuesday, Thursday and Sunday', () => {
  for (let d=0; d<7; d++) {
    const day = addDays(sunday,d), round = start(newGame(),day);
    assertSlots(round);
    const findings = round.items.filter(i=>i.q.research);
    assert.equal(findings.length, [0,2,4].includes(d) ? 1 : 0);
    for (const {q} of findings) {
      assert.ok(q.research.published_on <= day);
      if (d===0) {
        const eligible = catalog.questions.filter(card=>card.research && card.research.published_on <= sunday &&
          (!has(card,'herleiten') || catalog.daily_clues.includes(card.id)));
        assert.equal(q.research.published_on,eligible.map(card=>card.research.published_on).sort().at(-1));
      }
      assert.ok(q.sources.some(s=>s.url===q.research.url && s.url.startsWith('https://')));
    }
  }
});

test('a queue of overdue estimates and an open round cannot consume extra format places', () => {
  const state = newGame();
  for (const q of catalog.questions.filter(q=>has(q,'schaetzen')&&!q.research)) {
    state.progress[keyOf(q)]={due:'2026-01-01',lastDay:'2025-12-01'};
  }
  const first = start(state,sunday), second = start(state,addDays(sunday,1));
  assertSlots(first);
  assertSlots(second);
  assert.equal(second.items.filter(i=>i.kind==='due').length,1);
  assert.ok(!second.items.some(i=>first.items.some(j=>j.q.fact_key===i.q.fact_key)));
});

test('new daily rounds prefer two featured clues and reserve one when other deductions are due', () => {
  const others = catalog.questions.filter(q=>has(q,'herleiten') && !catalog.daily_clues.includes(q.id) && !q.research).slice(0,2);
  assert.equal(others.length,2);
  const featuredCount = round => round.items.filter(i=>catalog.daily_clues.includes(i.q.id)).length;
  assert.equal(featuredCount(start(newGame(),sunday)),2);
  const state = newGame();
  for (const q of others) state.progress[keyOf(q)] = {due:'2026-01-01',lastDay:'2025-12-01'};
  const round = start(state,addDays(sunday,1));
  assertSlots(round);
  assert.equal(featuredCount(round),1);
  assert.equal(round.items.filter(i=>others.some(q=>q.id===i.q.id)).length,1);
  const experienced=newGame();
  for (const q of catalog.questions.filter(q=>catalog.daily_clues.includes(q.id))) {
    experienced.progress[keyOf(q)]={due:'2027-01-01',lastDay:'2026-11-15'};
  }
  const later=start(experienced,addDays(sunday,1));
  assertSlots(later);
  assert.equal(featuredCount(later),1);
  assert.ok(later.items.some(i=>has(i.q,'herleiten') && i.kind==='new' && !catalog.daily_clues.includes(i.q.id)));
});

test('after all cards are used the ten-place mix is retained when drawing reviews', () => {
  const state = newGame(), first = start(state,sunday);
  const limited = {...catalog,questions:first.items.map(i=>({...i.q,research:undefined}))};
  for (let i=0; i<10; i++) {
    answer(state,first.id,i,first.items[i].q.correct_option_id,date(sunday));
    advance(state,first.id,i,date(sunday));
  }
  const second = start(state,addDays(sunday,1),limited);
  assertSlots(second);
  assert.equal(second.isReview,true);
});

test('future and expired research never occupies a current-research place', () => {
  const sample = catalog.questions.find(q=>q.research);
  const regular = catalog.questions.filter(q=>!q.research);
  const findings = ['2023-11-21','2023-11-22','2026-11-23'].map((published_on,i)=>({
    ...sample, id:'forschung-'+i, fact_key:'forschung-'+i, research:{...sample.research,published_on}
  }));
  const pool = {...catalog,questions:[...regular,...findings],daily_clues:[...catalog.daily_clues,...findings.map(q=>q.id)]};
  const state = newGame(), current = start(state,sunday,pool);
  assert.equal(current.items.find(i=>i.q.research).q.id, 'forschung-1');
  abandon(state,current.id);
  const old = start(newGame(),sunday,{...pool,questions:[...regular,findings[0],findings[2]]});
  assertSlots(old);
  assert.ok(old.items.every(i=>!i.q.research));
});

test('a research estimate fills the estimate place and a withdrawn clue cannot be redrawn', () => {
  const estimate = catalog.questions.find(q=>has(q,'schaetzen') && !q.research);
  const clue = catalog.questions.find(q=>has(q,'herleiten') && !q.research);
  const findings = catalog.questions.find(q=>q.research).research;
  const pool = {...catalog,
    questions:catalog.questions.filter(q=>!q.research).map(q=>q===estimate?{...q,research:{...findings,published_on:sunday}}:q),
    corrections:[...catalog.corrections,{id:clue.id,semantic_revision:clue.semantic_revision,reason:'Prüffall'}]};
  const game=newGame();
  game.progress[keyOf(clue)]={lastDay:'2026-01-01',due:'2026-01-02'};
  const rnd=start(game,sunday,pool);
  assertSlots(rnd);
  assert.equal(rnd.items.filter(i=>i.q.research).length,1);
  assert.equal(rnd.items.find(i=>has(i.q,'schaetzen')).q.id,estimate.id);
  assert.ok(rnd.items.every(i=>i.q.id!==clue.id));
});
