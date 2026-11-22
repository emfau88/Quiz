// Exercise the shipped selector with fresh installs, an open round and an evolving local history.
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {addDays, advance, answer, keyOf, newGame, startRound} from '../web/js/engine.js';
import {RULES} from '../web/js/rules.js';

const catalog = JSON.parse(await readFile('web/data/catalog.json','utf8'));
const output = 'release/qa/modern-0.3.0';
const baseline = '2026-11-22';
const form = q => q.tags.find(tag=>tag.startsWith('form_'));
function tally(hist, value) { hist[value] = (hist[value] || 0)+1; }
function counters() {
  return {rounds:0, forms:{}, research:0, categoryCounts:{}, difficultyMixes:{}, dueMax:0, repeatedIdsWithinRound:0};
}
function playDay(state, install, day, report, finish) {
  const date = {day,now:day+'T12:00:00Z',zone:'Europe/Berlin',offset:60};
  const s = startRound(state,catalog,install,date);
  const cards = s.items.map(i=>i.q), groups = cards.map(form);
  assert.equal(cards.length,10);
  assert.equal(groups.filter(f=>f==='form_schaetzen').length,1);
  assert.equal(groups.filter(f=>f==='form_herleiten').length,2);
  assert.ok(cards.filter(q=>form(q)==='form_herleiten').every(q=>q.tags.includes('tagesraetsel')));
  const featured=cards.filter(q=>catalog.daily_clues.includes(q.id)).length;
  assert.ok(featured>=1);
  if (!finish) assert.equal(featured,2);
  report.featuredClues = (report.featuredClues || 0)+featured;
  assert.ok(groups.filter(f=>f==='form_wiedererkennen').length<=2);
  assert.equal(new Set(cards.map(q=>q.fact_key)).size,10);
  assert.equal(new Set(cards.map(q=>q.id)).size,10);
  assert.equal(startRound(state,catalog,install,date),s);
  report.rounds++;
  groups.forEach(f=>tally(report.forms,f));
  tally(report.categoryCounts,new Set(cards.map(q=>q.category)).size);
  tally(report.difficultyMixes,['easy','medium','hard'].map(level=>cards.filter(q=>q.difficulty===level).length).join('/'));
  const due = s.items.filter(i=>i.kind==='due').length;
  assert.ok(due<=RULES.rounds.max_due);
  report.dueMax=Math.max(report.dueMax,due);
  const findings = cards.filter(q=>q.research);
  const weekday = new Date(day+'T12:00:00Z').getUTCDay();
  assert.equal(findings.length,RULES.rounds.daily.research_weekdays.includes(weekday) ? 1 : 0);
  report.research+=findings.length;
  if (finish) {
    for (const [i,q] of cards.entries()) {
      const option = (i+Number(day.slice(-2)))%4 ? q.correct_option_id : q.options.find(o=>o.id!==q.correct_option_id).id;
      assert.ok(answer(state,s.id,i,option,date));
      assert.ok(advance(state,s.id,i,date));
      assert.ok(state.progress[keyOf(q)]);
    }
    assert.ok(state.ledger['daily-complete:'+s.id]);
  }
  return s;
}
const fresh = counters();
for (let i=0;i<1000;i++) playDay(newGame(),'neu-'+i,addDays(baseline,i%84),fresh,false);
const history = newGame(), returning=counters();
for (let i=0;i<365;i++) playDay(history,'tagesgast',addDays(baseline,i),returning,true);
assert.equal(Object.keys(history.ledger).length,365);
const originalStudies = catalog.questions.filter(q=>q.research);
let dailyReachable=0;
for (const card of catalog.questions) {
  const game=newGame();
  // A single overdue question must remain reachable. Studies use a Tuesday and a player who has seen the other studies.
  const day=addDays(baseline,card.research ? 2 : 1);
  if (card.research) for (const q of originalStudies) game.progress[keyOf(q)]={lastDay:baseline,due:addDays(day,7)};
  game.progress[keyOf(card)]={lastDay:addDays(day,-8),due:addDays(day,-1)};
  const round=startRound(game,catalog,'einzelfall',{day,now:day+'T12:00:00Z',zone:'Europe/Berlin',offset:60});
  assert.ok(round.items.some(i=>i.q.id===card.id),card.id);
  dailyReachable++;
}
const topics = {};
const topicDate = {day:baseline,now:baseline+'T14:00:00Z',zone:'Europe/Berlin',offset:60};
for (const category of Object.keys(RULES.categories)) {
  const expected = catalog.questions.filter(q=>q.category===category);
  const game=newGame(), seen=new Set();
  let roundsPlayed=0;
  for (let i=0;i<Math.ceil(expected.length/RULES.rounds.topic.length);i++) {
    const round = startRound(game,catalog,'themenabnahme',topicDate,{category,mode:'topic',entitled:true});
    for (const [position,item] of round.items.entries()) {
      assert.equal(item.q.category,category);
      seen.add(item.q.id);
      assert.ok(answer(game,round.id,position,item.q.correct_option_id,topicDate));
      assert.ok(advance(game,round.id,position,topicDate));
    }
    roundsPlayed++;
  }
  assert.deepEqual(seen,new Set(expected.map(q=>q.id)));
  assert.equal(Object.keys(game.ledger).length,0);
  topics[category]={roundsPlayed,distinctQuestions:seen.size};
}
const result={catalog:catalog.version,checkedAt:new Date().toISOString(),fresh,returning,
  returningUnique:Object.keys(history.progress).length,completedAwards:Object.keys(history.ledger).length,dailyReachable,topics};
await mkdir(output,{recursive:true});
await writeFile(output+'/tagesrunden.json', JSON.stringify(result,null,2)+'\n');
console.log(catalog.version, fresh.rounds, 'Neuinstallationen,', returning.rounds, 'aufeinanderfolgende Tagesrunden,',
  result.returningUnique, 'unterschiedliche Karten im Jahresverlauf.');
