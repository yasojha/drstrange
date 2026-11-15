import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {lostItemAssessment,lostItemReading,questionInstant,searchClue} from '../src/prasna.js';
import {northIndianChart} from '../src/kundali-chart.ts';

const context=vm.createContext({Date});
vm.runInContext(fs.readFileSync(new URL('../src/vendor/astronomy.js',import.meta.url),'utf8'),context);
const astronomy=context.Astronomy;
const now=new Date('2026-11-15T13:05:34Z');

test('question uses the supplied current instant or converts the exact earlier local time',()=>{
 assert.equal(questionInstant({timing:'now'},now),now);
 assert.equal(questionInstant({timing:'earlier',date:'2026-11-15',time:'01:15',offset:5.5},now).toISOString(),
  '2026-11-14T19:45:00.000Z');
 assert.throws(()=>questionInstant({timing:'earlier',date:'2026-11-15',time:'01:15',offset:''},now),/offset/);
 assert.throws(()=>questionInstant({timing:'earlier',date:'2026-11-16',time:'01:15',offset:5.5},now),/already passed/);
});

test('a Pisces Moon wraps the second sign to Aries and uses its ruler’s placement',()=>{
 const mars={name:'Mars',sign:7,house:5};
 const clue=searchClue({planets:[{name:'Moon',sign:11},mars]});
 assert.equal(clue.moonSign,'Pisces');
 assert.equal(clue.ruler,mars);
 assert.equal(clue.sign,'Scorpio');
 assert.equal(clue.title,'A narrow gap or a hidden pocket');
});

test('the question casts a location-specific chart with a checklist independent of the clue',()=>{
 const input={name:'House keys',category:'keys',lastSeen:'on the kitchen counter',lat:28.0229,lon:73.3119,timing:'now'};
 const result=lostItemReading(input,astronomy,now);
 const otherItem=lostItemReading({...input,name:'Phone',category:'phone',lastSeen:''},astronomy,now);
 const otherCity=lostItemReading({...input,lat:40.71,lon:-74},astronomy,now);
 assert.equal(result.chart.date,now.toISOString());
 assert.equal(result.chart.planets.length,9);
 assert.notEqual(result.chart.ascSign,otherCity.chart.ascSign);
 assert.deepEqual(result.clue,otherItem.clue);
 assert.match(result.steps[0],/kitchen counter/);
 assert.match(otherItem.steps[1],/Call the phone/);
 assert.throws(()=>lostItemReading({...input,lat:''},astronomy,now),/both location coordinates/);
 const svg=northIndianChart(result.chart,{title:'Question chart',label:'Question chart',selected:[result.clue.ruler.house]});
 assert.equal((svg.match(/<polygon/g)||[]).length,12);
 assert.equal((svg.match(/class="selected"/g)||[]).length,1);
 assert.doesNotMatch(svg,/tabindex/);
});


function assessmentChart(overrides={},ascSign=1){
 const positions={Sun:260,Moon:185,Mars:5,Mercury:276,Jupiter:250,Venus:47,Saturn:310,...overrides};
 return {
  ascSign,
  planets:Object.entries(positions).map(([name,longitude])=>{
   const sign=Math.floor(longitude/30);
   return {name,longitude,sign,house:(sign-ascSign+12)%12+1};
  })
 };
}

function assessment(chart,context={}){
 const item=chart.planets.find(planet=>planet.name==='Mars');
 return lostItemAssessment(chart,item,context);
}

test('the chart alone never shows an insider or outsider clue',()=>{
 const familiar=assessmentChart();
 const defaultReading=assessment(familiar);
 assert.match(defaultReading.status.title,/Unclear/);
 assert.equal(defaultReading.access,null);
 const possible=assessment(familiar,{theftEvidence:'signs'});
 assert.match(possible.status.title,/Possible theft/);
 assert.equal(possible.access,null);
 const noPattern=assessment(assessmentChart({Moon:196}));
 assert.match(noPattern.status.title,/misplacement/);
 assert.equal(noPattern.access,null);
});

test('reported direct evidence unlocks familiar, outside and unresolved access clues',()=>{
 const direct={theftEvidence:'direct'};
 const familiar=assessment(assessmentChart(),direct);
 const outside=assessment(assessmentChart({Moon:196,Venus:65}),direct);
 const both=assessment(assessmentChart({Venus:65}),direct);
 assert.match(familiar.status.title,/reported direct evidence/);
 assert.match(familiar.access.title,/Familiar access/);
 assert.match(outside.access.title,/Outside access/);
 assert.match(both.access.title,/unclear/);
});

test('a last known sighting takes priority over the symbolic home-or-away lead',()=>{
 const home=assessmentChart({Mars:126});
 const away=assessmentChart({Mars:275});
 assert.match(assessment(home).area.title,/inside your home/);
 assert.match(assessment(away).area.title,/away from home/);
 assert.match(assessment(away,{lastLocation:'home'}).area.title,/inside your home/);
 assert.match(assessment(home,{lastLocation:'away'}).area.title,/away from home/);
});

test('recovery distinguishes supportive, mixed, difficult and unresolved signals',()=>{
 assert.match(assessment(assessmentChart({Jupiter:340})).recovery.title,/favours recovery/);
 assert.match(assessment(assessmentChart({Jupiter:340,Saturn:44})).recovery.title,/mixed/);
 assert.match(assessment(assessmentChart({Saturn:44})).recovery.title,/more effort/);
 assert.match(assessment(assessmentChart()).recovery.title,/unclear/);
 const nearFull=assessmentChart({Sun:224,Moon:44,Jupiter:104});
 assert.match(assessment(nearFull).recovery.detail,/near-full Moon.*Jupiter/);
});
