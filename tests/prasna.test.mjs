import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {lostItemReading,questionInstant,searchClue} from '../dist/prasna.js';
import {northIndianChart} from '../dist/kundali-chart.js';

const context=vm.createContext({Date});
vm.runInContext(fs.readFileSync(new URL('../dist/vendor/astronomy.js',import.meta.url),'utf8'),context);
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
