import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame, startRound, answer, advance, abandon, applyCorrections, clock, keyOf,
  experience, resultFor, weekActivity, collection, statistics, ranking, migrate, copy, addDays} from '../web/js/engine.js';

const initial = JSON.parse(readFileSync(new URL('../web/data/catalog.json',import.meta.url)));
const time = (day, hour='12:00') => ({day,now:day+'T'+hour+':00Z',zone:'Europe/Berlin',offset:60});
const day = '2026-11-16';
const base = initial.questions[0];
const category = base.category;
// Artificial catalog only for boundary tests. Never consumed by the catalog compiler.
const fixture = {version:'fixture',corrections:[],questions: Array.from({length:72},(_,i) => ({
  ...base,id:'fixture-'+i,fact_key:'fact-'+i,category: i < 30 ? category : initial.questions.find(q=>q.category!==category).category,
  difficulty:['easy','easy','easy','medium','medium','hard'][i%6]}))};
function start(g=newGame(), cat=initial, date=day, options={}) {return startRound(g,cat,'fixture-install',time(date),options);}
function respond(g,s,pos,correct=true,date=day) {
  const q=s.items[pos].q, id=correct ? q.correct_option_id : q.options.find(o=>o.id!==q.correct_option_id).id;
  return answer(g,s.id,pos,id,time(date));
}
function finish(g,s,hits=7,date=day) {
  while(s.status === 'active') {
    const i=s.cursor;
    if(!s.items[i].void) respond(g,s,i,i<hits,date);
    advance(g,s.id,i,time(date));
  }
  return s.result;
}
test('ten saved snapshots, stable shuffle, distinct facts, reproducible daily selection',()=>{
  const g=newGame(),s=start(g),again=start(), distinct=key=>new Set(s.items.map(i=>i.q[key])).size;
  assert.equal(s.items.length,10);
  assert.equal(distinct('fact_key'),10);
  assert.equal(distinct('id'),10);
  assert.ok(distinct('category')>=4);
  assert.deepEqual(s.items,again.items);
  assert.deepEqual(s.items.map(i=>i.q.difficulty).sort(),['easy','easy','easy','easy','easy','easy','medium','medium','medium','hard'].sort());
  assert.ok(s.items.every(i=>new Set(i.order).size===4));
  const update=copy(initial); update.questions.forEach(q=>q.question='Neue Formulierung');
  assert.deepEqual(start(g,update),s);
  assert.notEqual(s.items[0].q.question,update.questions[0].question);
});
test('answer persists once; duplicate, stale and premature events cannot advance the round',()=>{
  const g=newGame(),s=start(g);
  assert.equal(advance(g,s.id,0,time(day)),false);
  assert.ok(respond(g,s,0,false));
  const saved=JSON.stringify(g);
  assert.equal(respond(g,s,0,true),false);
  assert.equal(JSON.stringify(g),saved);
  assert.equal(g.progress[keyOf(s.items[0].q)].count,1);
  assert.ok(advance(g,s.id,0,time(day)));
  assert.equal(advance(g,s.id,0,time(day)),false);
  const restored=JSON.parse(JSON.stringify(g)); assert.deepEqual(start(restored),s);
});
test('7 of 10 awards 90 XP and silver exactly once, fixed virtual opponents and ties',()=>{
  const g=newGame(),s=start(g),opponents=copy(s.opponents);
  assert.deepEqual(finish(g,s),{correct:7,valid:10,xp:90,medal:'Silber',recalled:0});
  for(let i=0;i<10;i++) {advance(g,s.id,9,time(day)); resultFor(s);}
  assert.equal(Object.keys(g.ledger).length,1);
  assert.deepEqual(experience(g),{xp:90,level:2,floor:80,next:250});
  assert.deepEqual(opponents,s.opponents);
  s.opponents[0].correct=7;
  const rows=ranking(s);
  assert.equal(rows.find(r=>r.human).rank,rows.find(r=>r.name===s.opponents[0].name).rank);
});
test('valid denominator, percentage thresholds and minimum eight for medals',()=>{
  for(const [n,c,medal] of [[10,4,null],[10,5,'Bronze'],[10,7,'Silber'],[10,9,'Gold'],[9,6,'Bronze'],[8,6,'Silber'],[7,7,null],[0,0,null]]) {
    const s={mode:'daily',items:Array.from({length:10},(_,i)=>({void:i>=n,answer:{correct:i<c}}))};
    assert.deepEqual(resultFor(s),{correct:c,valid:n,xp:n ? 20+10*c:0,medal,recalled:0});
  }
});
test('distinct original day, midnight and clock correction, open sessions reserve all facts',()=>{
  const g=newGame(),s=start(g,fixture,day),tomorrow=addDays(day,1);
  const t=start(g,fixture,tomorrow);
  assert.ok(!t.items.some(i=>s.items.some(j=>j.q.fact_key===i.q.fact_key)));
  assert.equal(start(g,fixture,day).id,s.id);
  finish(g,s,7,tomorrow);
  assert.deepEqual(weekActivity(g,day),[day]);
  assert.equal(s.day,day);
  const future=start(g,fixture,'2040-01-01'); abandon(g,future.id);
  assert.equal(start(g,fixture,'2026-11-15').day,'2026-11-15');
  assert.equal(clock(new Date(2026,2,29,0,1)).day,'2026-03-29');
  assert.equal(addDays('2026-03-28',2),'2026-03-30');
});
test('week goal spans four days and Monday boundary follows original day even when finished late',()=>{
  const g=newGame();
  for(let i=0;i<4;i++){const d=addDays(day,i),s=start(g,fixture,d);finish(g,s,5,'2026-11-23');}
  assert.equal(weekActivity(g,'2026-11-22').length,4);
  assert.deepEqual(weekActivity(g,'2026-11-23'),[]);
});
test('one atomic trial per category, pause/resume, surrender and paid modes',()=>{
  const g=newGame(),opt={mode:'trial',category};const s=start(g,fixture,day,opt);
  assert.deepEqual(s.items.map(i=>i.q.difficulty).sort(),['easy','easy','easy','medium','medium']);
  respond(g,s,0);
  assert.equal(start(g,fixture,day,opt),s);
  assert.throws(()=>start(g,fixture,day,{...opt,category:'other'}),e=>e.code==='MODE');
  assert.throws(()=>start(g,fixture,day,{...opt,category:fixture.questions[71].category}),e=>e.code==='ACTIVE_TOPIC');
  abandon(g,s.id); assert.throws(()=>start(g,fixture,day,opt),e=>e.code==='TRIAL_USED');
  assert.equal(Object.keys(g.progress).length,1);
  assert.throws(()=>start(g,fixture,day,{mode:'topic',category}),e=>e.code==='PLUS');
  const paid=start(g,fixture,day,{mode:'challenge',category,entitled:true});
  assert.deepEqual(paid.items.map(i=>i.q.difficulty).sort(),['easy','easy','medium','medium','medium','medium','medium','hard','hard','hard'].sort());
  finish(g,paid);assert.equal(experience(g).xp,0);assert.equal(weekActivity(g,day).length,0);
  const other=start(g,fixture,day,{...opt,category:fixture.questions[71].category});finish(g,other);assert.equal(other.result.xp,0);
  if (initial.questions.length >= 150) {
    const actual = newGame(), categories = new Set(initial.questions.map(q => q.category));
    assert.equal(categories.size, 6);
    for (const name of categories) {
      const trial = {mode:'trial', category:name};
      const round = start(actual, initial, day, trial);
      assert.deepEqual(round.items.map(i=>i.q.difficulty).sort(), ['easy','easy','easy','medium','medium']);
      respond(actual, round, 0);
      assert.equal(start(actual, initial, day, trial).id, round.id);
      finish(actual, round);
      assert.throws(()=>start(actual, initial, day, trial), e=>e.code==='TRIAL_USED');
    }
    assert.equal(experience(actual).xp, 0);
    assert.equal(Object.keys(actual.trials).length, 6);
  }
});
test('pool shortage never consumes trial; expiring and reserved questions excluded',()=>{
  const g=newGame(),small={...fixture,questions:fixture.questions.slice(0,11)};
  const s=start(g,small);
  assert.throws(()=>start(g,small,addDays(day,1)),e=>e.code==='POOL'&&e.sessionId===s.id);
  assert.throws(()=>start(g,small,day,{mode:'trial',category}),e=>e.code==='POOL');
  assert.deepEqual(g.trials,{});
  const old=copy(fixture);old.questions.forEach(q=>q.valid_until='2020-01-01');
  assert.throws(()=>start(newGame(),old),e=>e.code==='POOL');
});
test('due cap and seven-day fallback, no duplicate fact or identifier',()=>{
  const g=newGame(),s=start(g,fixture);finish(g,s,0);
  const next=start(g,fixture,addDays(day,3));
  assert.equal(next.items.filter(i=>i.kind==='due').length,2);
  const small={...fixture,questions:fixture.questions.slice(0,10)};
  const g2=newGame(),full=start(g2,small);finish(g2,full);
  const repeat=start(g2,small,addDays(day,1));assert.ok(repeat.isReview);assert.equal(new Set(repeat.items.map(i=>i.q.fact_key)).size,10);
  const duplicate={...small,questions:small.questions.map(q=>({...q,fact_key:'same-fact'}))};
  assert.throws(()=>start(newGame(),duplicate),e=>e.code==='POOL');
});
function record(g,q,correct,d) {
  const id='test-attempt-'+Object.keys(g.sessions).length;
  const item={q,order:q.options.map(o=>o.id),void:false,answer:null};
  g.sessions[id]={id,mode:'trial',status:'active',cursor:0,items:[item]};
  respond(g,g.sessions[id],0,correct,d);
  return item.answer;
}
test('spaced recall, durable mastery, repeated mistake, first/repeat stats and precise due dates',()=>{
  const g=newGame(),q=fixture.questions[0],k=keyOf(q);
  record(g,q,false,day);assert.equal(g.progress[k].due,addDays(day,3));
  assert.equal(record(g,q,true,addDays(day,2)).recalled,false);assert.equal(g.progress[k].due,addDays(day,9));
  record(g,q,false,addDays(day,3));
  const recall=record(g,q,true,addDays(day,6));assert.equal(recall.recalled,true);assert.equal(recall.newlyMastered,true);
  assert.equal(g.progress[k].due,addDays(day,27));
  assert.equal(record(g,q,true,addDays(day,7)).recalled,false);
  record(g,q,false,addDays(day,8));assert.ok(g.awards[k]);assert.equal(g.progress[k].due,addDays(day,11));
  assert.deepEqual(statistics(g,fixture),{first:{hits:0,total:1},repeat:{hits:3,total:5}});
});
test('withdrawals void active answers; frozen results and historical badges survive; album explains corrections',()=>{
  const g=newGame(),s=start(g,fixture);respond(g,s,0,true);
  const q=s.items[0].q,archived=copy(q),key=keyOf(q);
  g.awards[key]={day};
  const updated=copy(fixture);
  updated.corrections=[{id:q.id,semantic_revision:q.semantic_revision,reason:'Sachkorrektur'}];
  updated.questions=updated.questions.filter(x=>keyOf(x)!==key);
  applyCorrections(g,updated);
  assert.equal(s.items[0].void,true);assert.deepEqual(s.items[0].q,archived);
  assert.ok(!g.progress[key]);assert.ok(g.awards[key]);
  assert.equal(collection(g,updated)[0].q,null);
  const valid={...q,question:'Gültige korrigierte Frage',semantic_revision:2,content_revision:2};
  updated.questions.push(valid);
  assert.equal(collection(g,updated)[0].q.question,valid.question);
  assert.equal(collection(g,fixture)[0].q,null);
  finish(g,s,10);assert.equal(s.result.valid,9);assert.equal(s.result.xp,110);assert.deepEqual(ranking(s),[]);
  const frozen=copy(s.result);
  updated.corrections.push({id:s.items[1].q.id,semantic_revision:1,reason:'Korrektur'});
  applyCorrections(g,updated);assert.deepEqual(s.result,frozen);assert.equal(experience(g).xp,110);
  assert.equal(statistics(g,updated).first.total,8);
  const all=newGame(),none=start(all,fixture);
  applyCorrections(all,{...fixture,corrections:none.items.map(i=>i.q)});finish(all,none);
  assert.equal(none.result.valid,0);assert.equal(experience(all).xp,0);assert.equal(weekActivity(all,day).length,0);
});
test('a new semantic revision starts its own history; typographic revision keeps prior progress',()=>{
  const g=newGame(),q=fixture.questions[0];record(g,q,true,day);
  const typo={...q,content_revision:2}, semantics={...q,content_revision:3,semantic_revision:2};
  assert.equal(record(g,typo,true,addDays(day,3)).first,false);
  assert.equal(statistics(g,{questions:[semantics],corrections:[]}).first.total,0);
  assert.equal(record(g,semantics,false,addDays(day,5)).first,true);
});
test('ordinary archival preserves the open snapshot, album, learning statistics and exactly one daily award',()=>{
  const game=newGame(), session=start(game,fixture);
  const savedCard=session.items[0].q, key=keyOf(savedCard);
  respond(game,session,0,true);
  game.awards[key]={day};
  const rotated={...fixture,questions:fixture.questions.filter(q=>q.id!==savedCard.id),
    archived:[{id:savedCard.id,semantic_revision:savedCard.semantic_revision}]};
  const prior=copy(session);
  applyCorrections(game,rotated);
  assert.deepEqual(start(game,rotated),prior);
  assert.equal(statistics(game,rotated).first.hits,1);
  const card=collection(game,rotated)[0];
  assert.deepEqual(card.q,savedCard);
  assert.equal(card.corrected,false);
  assert.equal(card.mastered,true);
  finish(game,session,10);
  const balance=experience(game).xp;
  assert.equal(advance(game,session.id,9,time(day)),false);
  assert.equal(experience(game).xp,balance);
  assert.equal(Object.keys(game.ledger).length,1);
  const next=start(game,rotated,addDays(day,1));
  assert.ok(next.items.every(item=>item.q.id!==savedCard.id));
  const corrected={...rotated,corrections:[{id:savedCard.id,semantic_revision:savedCard.semantic_revision,reason:'Fehler'}]};
  applyCorrections(game,corrected);
  assert.equal(collection(game,corrected).find(c=>c.id===savedCard.id).q,null);
  assert.ok(!game.progress[key]);
  assert.equal(experience(game).xp,balance);
});
test('small subtopic pools relax diversity while preserving difficulty, overdue order and reservations',()=>{
  const sample={...fixture,questions:fixture.questions.map((q,i)=>({...q,tags:['thema_'+(i%2),'form_wiedererkennen']}))};
  const game=newGame();
  for (const [i,q] of sample.questions.slice(0,3).entries()) {
    game.progress[keyOf(q)]={due:addDays(day,-(3-i)),lastDay:addDays(day,-10)};
  }
  const daily=start(game,sample);
  assert.deepEqual(daily.items.filter(item=>item.kind==='due').map(item=>item.q.id).sort(),sample.questions.slice(0,2).map(q=>q.id).sort());
  const topic=start(game,sample,day,{mode:'topic',category,entitled:true});
  const reserved=new Set(daily.items.map(item=>item.q.fact_key));
  assert.equal(topic.items.length,10);
  assert.ok(topic.items.every(item=>!reserved.has(item.q.fact_key)));
  assert.deepEqual(new Set(topic.items.map(item=>item.q.tags[0])),new Set(['thema_0','thema_1']));
});
test('experience thresholds and persisted v1 migrate without losing the current session',()=>{
  const g=newGame(),s=start(g),snap=copy(s);g.schema=1;delete g.awards;delete g.lastView;
  assert.deepEqual(migrate(g).sessions[s.id],snap);
  assert.equal(g.schema,2);assert.deepEqual(g.awards,{});
  for(const [xp,level] of [[0,1],[79,1],[80,2],[249,2],[250,3],[500,4],[999,4],[1000,5],[1500,6]]) {
    g.ledger={sample:{xp}};assert.equal(experience(g).level,level);
  }
  assert.throws(()=>migrate({schema:9}),/neuere Version/);
});
