import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarBounds} from '../dist/timeline.js';

test('shared calendar begins with the earliest past prediction and ends at the last forecast month',()=>{
 const past=[{start:new Date('2018-04-01')},{start:new Date('2014-09-19')}];
 const future={from:new Date('2026-11-10'),to:new Date('2027-11-10'),months:Array.from({length:12},(_,i)=>({start:new Date(Date.UTC(2026,10+i,10))}))};
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).startYear,2014);
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).startMonth,8);
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).endMonth,9);
 assert.equal(calendarBounds([],future,new Date('2026-11-10')).startYear,2026);
});
