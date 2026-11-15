import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {interpretQuestion,questionTypes,topicQuestionReading} from '../src/prasna-questions.js';

function makeChart(positions,ascSign=0){
 const fullPositions={Mars:12,Saturn:75,Moon:111,Sun:130,Mercury:82,Jupiter:250,Venus:49,...positions};
 return {
  ascSign,
  planets:Object.entries(fullPositions).map(([name,longitude])=>{
   const sign=Math.floor(longitude/30);
   return {name,longitude,sign,house:(sign-ascSign+12)%12+1};
  })
 };
}

test('the same contact opening or separating changes the interview reading',()=>{
 const chart=makeChart();
 const opening=interpretQuestion('interview',chart,makeChart({Mars:12.2}));
 const separating=interpretQuestion('interview',chart,makeChart({Mars:11.8}));
 assert.equal(opening.outcome,'opening');
 assert.match(opening.evidence[0],/applying sextile · 3.00°/);
 assert.equal(separating.outcome,'none');
 assert.match(separating.reason,/moving apart/);
});

test('hard contacts and conflicting testimony keep their own verdicts',()=>{
 const friction=interpretQuestion('interview',makeChart({Saturn:105,Moon:141}),makeChart({Mars:12.2,Saturn:105,Moon:141.5}));
 assert.equal(friction.outcome,'friction');
 assert.match(friction.evidence[0],/applying square/);

 const mixed=interpretQuestion('interview',makeChart({Moon:162}),makeChart({Mars:12.2,Moon:162.5}));
 assert.equal(mixed.outcome,'mixed');
 assert.match(mixed.evidence[1],/applying square/);
});

test('wraparound contacts apply in the right direction',()=>{
 const chart=makeChart({Saturn:326,Mars:28},10);
 const later=makeChart({Saturn:326.01,Mars:27.8},10);
 const reading=interpretQuestion('interview',chart,later);
 assert.equal(reading.outcome,'opening');
 assert.match(reading.evidence[0],/Saturn and Mars · applying sextile · 2.00°/);
});

test('comparison does not favour a job switch when both roles have supportive contacts',()=>{
 const chart=makeChart({Venus:12,Mars:75,Moon:129},6);
 const later=makeChart({Venus:12.2,Mars:75.01,Moon:129.5},6);
 const reading=interpretQuestion('job-change',chart,later);
 assert.equal(reading.outcome,'mixed');
 assert.match(reading.reason,/current and prospective roles/);
});

test('the Moon as ascendant ruler does not repeat the same interview evidence',()=>{
 const chart=makeChart({Moon:12,Mars:75},3);
 const later=makeChart({Moon:12.5,Mars:75},3);
 const reading=interpretQuestion('interview',chart,later);
 assert.deepEqual(reading.evidence,['Moon and Mars · applying sextile · 3.00° from exact.']);
});

test('all eight categories cast a real chart with a category-specific next step',()=>{
 const context=vm.createContext({Date});
 vm.runInContext(fs.readFileSync(new URL('../src/vendor/astronomy.js',import.meta.url),'utf8'),context);
 const now=new Date('2026-11-15T17:00:00Z');
 const base={timing:'now',lat:28.0229,lon:73.3119};
 const types=Object.entries(questionTypes);
 assert.equal(types.length,8);
 const steps=new Set();
 for(const [type,rule] of types){
  const reading=topicQuestionReading({...base,type,question:rule.example},context.Astronomy,now);
  assert.equal(reading.chart.date,now.toISOString());
  assert.equal(reading.text,rule.example);
  assert.ok(reading.headline);
  assert.ok(reading.evidence.length>=1&&reading.evidence.length<=2);
  assert.ok(reading.selected.every(house=>house>=1&&house<=12));
  steps.add(reading.next);
 }
 assert.equal(steps.size,8);
 assert.throws(()=>topicQuestionReading({...base,type:'interview',question:'  '},context.Astronomy,now),/Enter the question/);
 assert.throws(()=>topicQuestionReading({...base,type:'other',question:'Go ahead?'},context.Astronomy,now),/supported question type/);
});
