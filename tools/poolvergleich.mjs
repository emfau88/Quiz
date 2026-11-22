import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as current from '../web/js/engine.js';
import {RULES} from '../web/js/rules.js';

const qa = resolve('release/qa/fragenpool');
await mkdir('.cache/fragenpool', {recursive:true});
const previous = await mkdtemp(resolve('.cache/fragenpool/vergleich-'));
execFileSync('python', ['-m','zipfile','-e',join(qa,'ausgangsversion.zip'),previous]);
const old = await import(pathToFileURL(join(previous,'engine.js')).href);
const json = async path => JSON.parse(await readFile(path,'utf8'));
const before = await json(join(previous,'catalog.json'));
const after = await json('web/data/catalog.json');
const classification = (await json(join(qa,'klassifikation-ausgang.json'))).questions;
assert.equal(before.version, 'de-7363fcba52a1');
const baselineTopics = new Map(classification.map(row => [row.id, row.topic]));
const groups = {
  entertainment: {
    topics: ['filmpreise','buehne'],
    contextual: [],
    paths: ['content/culture/escene.json','content/culture/estage.json']
  },
  geography_travel: {
    topics: ['hauptstaedte','grenzen','waehrungen'],
    // Capitals that form a substantial clue even though the main subject is historical or geographical.
    contextual: ['qs-brasilia-planstadt','qs-babylon-bagdad','qs-bojana-sofia','qs-stari-ras-serbien'],
    paths: ['content/science/03-reisen-hauptstaedte.json','content/science/03-reisen-grenzen.json','content/science/03-reisen-waehrungen.json']
  }
};
for (const group of Object.values(groups)) {
  const rows = (await Promise.all(group.paths.map(json))).flat();
  group.ids = new Set(rows.map(q => q.id));
}
const time = {day:'2026-11-22', now:'2026-11-22T11:00:00Z', zone:'Europe/Berlin', offset:60};
const samples = 1000;
const increment = (histogram,key) => {histogram[key]=(histogram[key] || 0)+1;};
function measure(engine, catalog, mode, category) {
  const config = RULES.rounds[mode];
  const result = {samples, minTopics:config.length, minCategories:config.length, unexpectedMix:0,
    topicDraws:{}, distinctTopics:{}, byDifficulty:{easy:0,medium:0,hard:0}, originalSeriesAtLeastThree:0, subjectGroupAtLeastThree:0};
  for (let i=0; i<samples; i++) {
    const round = engine.startRound(engine.newGame(), catalog, 'poolvergleich-'+i, time, {mode,category,entitled:true});
    const questions = round.items.map(item => item.q);
    const topics = questions.map(q => q.tags.find(tag => tag.startsWith('thema_'))?.slice(6) || baselineTopics.get(q.id));
    assert.ok(topics.every(Boolean));
    const breadth = new Set(topics).size;
    result.minTopics = Math.min(result.minTopics,breadth);
    result.minCategories = Math.min(result.minCategories,new Set(questions.map(q => q.category)).size);
    increment(result.distinctTopics,breadth);
    const difficulties = {easy:0,medium:0,hard:0};
    for (const [j,q] of questions.entries()) {
      increment(difficulties,q.difficulty);
      increment(result.byDifficulty,q.difficulty);
      increment(result.topicDraws,topics[j]);
    }
    if (Object.values(difficulties).some((n,j) => n !== config.mix[j])) result.unexpectedMix++;
    const group = groups[category];
    if (group) {
      if (questions.filter(q => group.ids.has(q.id)).length >= 3) result.originalSeriesAtLeastThree++;
      if (questions.filter((q,j) => group.topics.includes(topics[j]) || group.contextual.includes(q.id)).length >= 3) result.subjectGroupAtLeastThree++;
    }
  }
  return result;
}
const report = {baseline:before.version,catalog:after.version,date:time.day,installations:'poolvergleich-0 … poolvergleich-999',
  groupTopics:Object.fromEntries(Object.entries(groups).map(([id,g])=>[id,{topics:g.topics,contextual:g.contextual}])), oldPoolOldRule:{}, newPoolOldRule:{}, newPoolNewRule:{}};
for (const category of Object.keys(RULES.categories)) {
  report.oldPoolOldRule[category] = measure(old,before,'trial',category);
  report.newPoolOldRule[category] = measure(old,after,'trial',category);
  const runs = report.newPoolNewRule[category] = {};
  for (const mode of ['trial','topic','challenge']) {
    const m = runs[mode] = measure(current,after,mode,category);
    assert.equal(m.unexpectedMix,0,category+'/'+mode);
    assert.ok(m.minTopics >= (mode === 'trial' ? 4 : 5),category+'/'+mode);
  }
  if (groups[category]) {
    assert.ok(runs.trial.originalSeriesAtLeastThree <= 100 && runs.trial.subjectGroupAtLeastThree <= 100,category);
    console.log(category,report.oldPoolOldRule[category].originalSeriesAtLeastThree,report.newPoolOldRule[category].originalSeriesAtLeastThree,
      runs.trial.originalSeriesAtLeastThree,runs.trial.subjectGroupAtLeastThree);
  }
}
assert.equal(report.oldPoolOldRule.entertainment.originalSeriesAtLeastThree,506);
assert.equal(report.oldPoolOldRule.geography_travel.originalSeriesAtLeastThree,323);
report.daily = measure(current,after,'daily',null);
assert.ok(report.daily.minCategories >= 4);
assert.equal(report.daily.unexpectedMix,0);
await writeFile(join(qa,'auswahlvergleich.json'),JSON.stringify(report,null,2)+'\n');
