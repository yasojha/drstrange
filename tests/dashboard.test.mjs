import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {buildLongTermForecast} from '../dist/long-term.js';import {buildDashboard,lineChart} from '../dist/dashboard.js';
const context={Date};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../dist/vendor/astronomy.js',import.meta.url),'utf8'),context);
const input={date:'1990-01-01',time:'12:00',offset:5.5,lat:28.6139,lon:77.209};
const future=buildLongTermForecast(input,context.Astronomy,{start:new Date('2026-11-11Z')});
test('dashboard annual points cover the selected future horizon',()=>{
 const windows={groups:{marriage:[],children:[],income:[],business:[]}};const dashboard=buildDashboard(future,windows);
 assert.ok(dashboard.series.length>=10&&dashboard.series.length<=11);
 assert.ok(dashboard.series.every(p=>Number.isFinite(p.income)&&Number.isFinite(p.wellbeing)&&p.to>future.from&&p.from<future.to));
 assert.equal(dashboard.marriage,null);assert.deepEqual(dashboard.children,[]);
 for(const key of ['income','wellbeing']){const svg=lineChart(dashboard.series,key,key);assert.match(svg,/<polyline/);assert.doesNotMatch(svg,/NaN|undefined/);}
});
