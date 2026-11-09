import test from 'node:test';
import assert from 'node:assert/strict';
import {stellarLords,planetaryPeriod,kpTimingCheck} from '../dist/kp.js';

test('nakshatra and sub divisions follow Vimshottari proportions at boundaries',()=>{
 assert.deepEqual(stellarLords(0),{starLord:'Ketu',subLord:'Ketu',starIndex:0});
 assert.equal(stellarLords(360/27*7/120+0.00001).subLord,'Venus');
 assert.equal(stellarLords(360/27).starLord,'Venus');
 assert.equal(stellarLords(-0.01).starLord,'Mercury');
});
test('planetary periods follow birth Moon star and change at sub-period boundary',()=>{
 const birth=new Date('2000-01-01T00:00:00Z');
 const initial=planetaryPeriod(0,birth,birth);
 assert.equal(initial.maha,'Ketu');assert.equal(initial.bhukti,'Ketu');
 const later=planetaryPeriod(0,birth,new Date(+initial.subEnd+1000));
 assert.equal(later.maha,'Ketu');assert.equal(later.bhukti,'Venus');
});
test('partial KP status is tied to period lords and natal positions',()=>{
 const natal={date:'2000-01-01T00:00:00Z',planets:['Moon','Ketu','Venus','Sun','Mars','Rahu','Jupiter','Saturn','Mercury'].map((name,i)=>({name,longitude:i*20,house:i%12+1}))};
 const result=kpTimingCheck(natal,'marriage',new Date('2001-01-01T00:00:00Z'));
 assert.ok(['supports','mixed','no-support'].includes(result.status));
 assert.equal(result.factors.length,2);
 assert.match(result.limitation,/not independent validation/);
});
