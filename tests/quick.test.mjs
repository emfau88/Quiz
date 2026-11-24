import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,startRound,answer,advance,abandon,applyCorrections,ranking} from '../web/js/engine.js';
import {friendLinkFor,parseFriendLink} from '../web/js/friends.js';
import {RULES} from '../web/js/rules.js';
import {resultPage} from '../web/js/views.js';

const catalog=JSON.parse(readFileSync(new URL('../web/data/catalog.json',import.meta.url)));
const time={day:'2026-11-24',now:'2026-11-24T11:00:00Z',zone:'Europe/Berlin',offset:60};
const open=(state,options,source=catalog)=>startRound(state,source,'test-quiztisch',time,options);
const ids=s=>s.items.map(i=>i.q.fact_key);
const guests=s=>s.opponents.map(g=>g.id);
function finish(game,s,hits=4){
  while(s.status==='active'){
    const idx=s.cursor,it=s.items[idx];
    if(!it.void)answer(game,s.id,idx,idx<hits?it.q.correct_option_id:it.order.find(id=>id!==it.q.correct_option_id),time);
    advance(game,s.id,idx,time);
  }
  return s;
}
test('rotating tables use all twelve guests, rotate at least one, freeze three five-part predictions and avoid the last five',()=>{
  const roster=new Set(),game=newGame();
  const reserved=open(game,{mode:'daily'}),keep=structuredClone(reserved);
  let previous=reserved;
  for(let n=0;n<40;n++){
    const current=open(game,{mode:'quick'}),trio=guests(current);
    assert.deepEqual(open(game,{mode:'quick'}),current);
    assert.equal(new Set(trio).size,3);
    assert.ok(trio.some(id=>!guests(previous).includes(id)));
    assert.ok(current.opponents.every(g=>g.hits.length===5&&g.hits.filter(Boolean).length===g.correct&&g.specialties.length>=1));
    assert.equal(new Set(current.items.map(i=>i.q.category)).size,5);
    assert.ok(ids(current).every(id=>!ids(previous).includes(id)&&!ids(reserved).includes(id)));
    assert.equal(current.items.filter(i=>i.kind==='new').length,5);
    trio.forEach(id=>roster.add(id));
    previous=finish(game,current);
  }
  assert.equal(roster.size,12);assert.deepEqual(game.sessions[keep.id],keep);
  assert.deepEqual(game.ledger,{});assert.deepEqual(game.trials,{});
});
test('rematches reuse the saved trio even for 0.3.0 names, draw fresh facts and hide comparisons after correction',()=>{
  const game=newGame(),daily=open(game,{mode:'daily'});
  daily.opponents=RULES.simulation.opponents.slice(0,3).map((g,n)=>({name:g.name,...{hits:Array.from({length:10},(_,i)=>i<n+4),correct:n+4}}));
  finish(game,daily);
  const old=structuredClone(daily);
  const match=open(game,{mode:'quick',rematchOf:old.id});
  assert.deepEqual(guests(match),['ada','oskar','mira']);
  assert.ok(ids(match).every(id=>!ids(old).includes(id)));
  assert.equal(match.opponents[0].hits.length,5);
  assert.deepEqual(old,game.sessions[old.id]);
  assert.throws(()=>open(game,{mode:'quick'}),e=>e.code==='ACTIVE_TOPIC'&&e.sessionId===match.id);
  finish(game,match);
  const invite=friendLinkFor(match,game,catalog,time.day);
  assert.ok(invite);
  game.settings.comparison=false;
  assert.throws(()=>open(game,{mode:'quick',rematchOf:match.id}),e=>e.code==='REMATCH');
  assert.equal(friendLinkFor(match,game,catalog,time.day),invite);
  game.settings.comparison=true;
  const corrected={...catalog,corrections:[match.items[0].q]};
  applyCorrections(game,corrected);
  assert.deepEqual(ranking(match),[]);
  assert.equal(friendLinkFor(match,game,corrected,time.day),null);
  assert.throws(()=>open(game,{mode:'quick',rematchOf:match.id},corrected),e=>e.code==='REMATCH');
});
test('available alternatives are exhausted before repeating facts when the pool has only six cards',()=>{
  const sample={version:'six',corrections:[],questions:catalog.questions.filter(q=>!q.research&&!q.valid_until).slice(0,6)};
  const game=newGame(),first=finish(game,open(game,{mode:'quick'},sample));
  const next=open(game,{mode:'quick'},sample);
  assert.equal(new Set(ids(next)).size,5);assert.equal(ids(next).filter(f=>!ids(first).includes(f)).length,1);
  assert.ok(next.isReview);
});
test('a friendly match is free and idempotent and can finish personally after a withdrawal',()=>{
  const a=newGame(),source=finish(a,open(a,{mode:'quick'}));
  const invite=parseFriendLink(friendLinkFor(source,a,catalog,time.day));
  const b=newGame(),received=open(b,{mode:'friend',invite});
  assert.equal(received.friendScore,4);
  assert.equal(open(b,{mode:'friend',invite}),received);
  assert.throws(()=>open(b,{mode:'quick'}),e=>e.sessionId===received.id);
  applyCorrections(b,{...catalog,corrections:[received.items[0].q]});
  finish(b,received,2);
  assert.equal(received.result.valid,4);assert.ok(received.corrected);
  assert.deepEqual(ranking(received),[]);
  assert.equal(open(b,{mode:'friend',invite}),received);
  assert.deepEqual(b.ledger,{});assert.deepEqual(b.trials,{});
  const quick=open(b,{mode:'quick'});abandon(b,quick.id);
  assert.ok(!ids(quick).includes(source.items[0].q.fact_key));
});

test('the weekly hint appears only with a real fourth day still available in this week',()=>{
  const game=newGame();
  function play(day) {
    const when={...time,day,now:day+'T11:00:00Z'};
    return finish(game,startRound(game,catalog,'ziel',when));
  }
  const render=(session,day)=>resultPage({state:game,session,day,catalog}).includes('Noch ein Spieltag bis zum Wochenziel.');
  play('2026-11-23');
  const second=play('2026-11-24');
  assert.equal(render(second,'2026-11-24'),false);
  const third=play('2026-11-25');
  assert.equal(render(third,'2026-11-25'),true);
  assert.equal(render(third,'2026-11-29'),true);
  game.sessions['daily-2026-11-29']={...third,id:'daily-2026-11-29',day:'2026-11-29',status:'abandoned'};
  assert.equal(render(third,'2026-11-29'),false);
  const fourth=play('2026-11-26');
  assert.equal(render(fourth,'2026-11-26'),false);
});
