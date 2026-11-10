import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {buildLongTermForecast} from '../dist/long-term.js';
const ctx={Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../dist/vendor/astronomy.js',import.meta.url),'utf8'),ctx);const A=ctx.Astronomy;
const input={date:'1990-01-01',time:'12:00',offset:5.5,lat:28.6139,lon:77.209};
const from=new Date('2026-11-10T00:00:00Z');
const report=buildLongTermForecast(input,A,{start:from});
test('future scans ten years and shows only selected consequential windows',()=>{
 assert.equal(report.from.toISOString(),'2026-11-10T00:00:00.000Z');assert.equal(report.to.toISOString(),'2036-11-10T00:00:00.000Z');
 assert.ok(report.events.length<=8);assert.ok(report.headlines.length<=5);
 for(const event of report.events){assert.ok(+event.start>=+report.from&&+event.end<=+report.to&&+event.start<+event.end);assert.ok(!['marriage','graduation','first-job','first-child'].includes(event.ruleId));assert.ok(event.evidence.annual.length&&event.evidence.monthly.length);}
 assert.deepEqual(report.headlines.map(e=>e.id),[...report.events].sort((a,b)=>b.score-a.score).slice(0,5).map(e=>e.id));
});
test('the outlook never reads biographical confirmations',()=>{
 const again=buildLongTermForecast({...input,name:'Elsewhere',knownMarriage:'2023-01',reviews:{future:'match'}},A,{start:from});assert.deepEqual(again.events,report.events);
});
