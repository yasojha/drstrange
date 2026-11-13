import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {buildLifeWindows,rankWindows} from '../dist/windows.js';
const ctx={Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../dist/vendor/astronomy.js',import.meta.url),'utf8'),ctx);const A=ctx.Astronomy;
const input={date:'1990-01-01',time:'12:00',offset:5.5,lat:28.6139,lon:77.209};
const report=buildLifeWindows(input,A,{asOf:new Date('2026-11-11Z')});
test('four event types have up to five ranked nonoverlapping windows',()=>{
 assert.deepEqual(Object.keys(report.groups),['marriage','children','income','business']);
 for(const [type,events] of Object.entries(report.groups)){
  assert.ok(events.length<=5);assert.equal(new Set(events.map(e=>e.rank)).size,events.length);
  for(const e of events){assert.equal(e.type,type);assert.ok(+e.start<+e.end);assert.ok(e.evidence.length>=2);if(type==='marriage')assert.ok(e.age>=21&&e.age<=40);}
 }
});
test('travel groups appear on the shared calendar with both strengths',()=>{
 for(const type of ['foreign-travel','domestic-travel']){
  const windows=report.travelGroups[type];
  assert.deepEqual(new Set(windows.map(event=>event.strength)),new Set(['Strong','Mild']));
  assert.ok(windows.every(event=>report.events.includes(event)&&event.end<=report.to));
 }
});
test('ranker does not invent windows to fill a quota',()=>{assert.deepEqual(rankWindows([]),[]);});
test('known life events and names do not alter calculated windows',()=>{
 const again=buildLifeWindows({...input,name:'Different',marriageDate:'2015-01',childBirth:'2020-01'},A,{asOf:new Date('2026-11-11Z')});
 assert.deepEqual(again.events,report.events);
});
