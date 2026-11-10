import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarBounds} from '../dist/timeline.js';

test('shared calendar begins with the earliest past prediction and ends at the last selected future event',()=>{
 const past=[{start:new Date('2018-04-01')},{start:new Date('2014-09-19')}];
 const future={from:new Date('2026-11-10'),to:new Date('2036-11-10'),events:[{start:new Date('2034-10-01'),end:new Date('2034-11-01')}]};
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).startYear,2014);
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).startMonth,8);
 assert.deepEqual(calendarBounds(past,future,new Date('2026-11-10')).endMonth,10);
 assert.equal(calendarBounds([],future,new Date('2026-11-10')).startYear,2026);
});
