import {calculate,chartAt,wrap,houseOf} from './engine.js';
import {kpTimingCheck} from './kp.js';
const DAY=86400000;
export const delta=(a,b)=>wrap(a-b+180)-180;
export function solarLongitude(date,A){const T=(date.getTime()/DAY+2440587.5-2451545)/36525;return wrap(A.Ecliptic(A.GeoVector('Sun',date,true)).elon-(23.8530556+(5028.796195*T+1.1054348*T*T)/3600));}
// Root tolerance is numerical precision only, not ephemeris accuracy.
export function solarReturn(target,near,A){
 let lo=near.getTime()-8*DAY,hi=near.getTime()+8*DAY;
 if(delta(solarLongitude(new Date(lo),A),target)>0||delta(solarLongitude(new Date(hi),A),target)<0)throw Error('Could not bracket solar return.');
 for(let i=0;i<40&&hi-lo>100;i++){const mid=(lo+hi)/2;if(delta(solarLongitude(new Date(mid),A),target)<0)lo=mid;else hi=mid;}
 return new Date(Math.round((lo+hi)/2));
}
export function addMonths(date,count){const y=date.getUTCFullYear(),m=date.getUTCMonth()+count;const end=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(date.getUTCDate(),end)));}
export function munthaLongitude(natalAsc,completedYears){return wrap(natalAsc+30*completedYears);}
const orbs={Sun:15,Moon:12,Mars:8,Mercury:7,Jupiter:9,Venus:7,Saturn:9};
export function tajikaAspects(chart){
 const p=chart.planets.filter(p=>p.name in orbs),result=[];
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
 const a=p[i],b=p[j],separation=Math.abs(delta(a.longitude,b.longitude)),signGap=Math.min((a.sign-b.sign+12)%12,(b.sign-a.sign+12)%12);
 const angle=({0:0,2:60,3:90,4:120,6:180})[signGap];if(angle===undefined)continue;
 const error=Math.abs(separation-angle),limit=(orbs[a.name]+orbs[b.name])/2;
 if(error<=limit)result.push({a:a.name,b:b.name,angle,error,limit,kind:angle===60||angle===120?'friendly':'hard'});
 }return result;
}
// Editorial domain mappings and weights, not classical numerical strength scores.
const themes=[
 {id:'initiative',label:'Personal plans',houses:[1,3],good:'A personal project moves forward.',watch:'Your plans meet resistance.',detailGood:'You get more room to act on your own decisions.',detailWatch:'Pushing harder causes arguments. Change the approach.'},
 {id:'money',label:'Money',houses:[2,11],good:'Income gets a stronger opening.',watch:'Expenses put pressure on your budget.',detailGood:'A useful offer or payment discussion deserves attention.',detailWatch:'Keep a buffer. Avoid committing money before the terms are clear.'},
 {id:'home',label:'Home & family',houses:[4],good:'Home life settles down.',watch:'Family matters take more effort.',detailGood:'A household decision becomes easier to agree on.',detailWatch:'Unfinished chores and different expectations cause friction.'},
 {id:'learning',label:'Learning & creative work',houses:[5,9],good:'A course or creative project makes progress.',watch:'Study or creative plans hit delays.',detailGood:'Focused work gets a better response.',detailWatch:'Keep deadlines realistic. Do not take on a second project yet.'},
 {id:'workload',label:'Daily work',houses:[6],good:'A difficult task gets sorted.',watch:'Small tasks pile up.',detailGood:'You make headway on work that has been dragging.',detailWatch:'Check the details. Rushing creates work you have to repeat.'},
 {id:'relationships',label:'Relationships',houses:[7],good:'A close relationship gets easier.',watch:'Joint plans cause disagreements.',detailGood:'A direct conversation clears up what each person wants.',detailWatch:'Do not agree just to end the conversation. Settle the actual issue.'},
 {id:'commitments',label:'Shared responsibilities',houses:[8,12],good:'A shared responsibility becomes easier to manage.',watch:'An old obligation needs attention.',detailGood:'You get room to resolve a pending matter.',detailWatch:'Check shared bills, paperwork and unfinished commitments.'},
 {id:'career',label:'Career',houses:[10],good:'Your work gets noticed.',watch:'Work brings delays and extra pressure.',detailGood:'This is the stronger period to ask for more responsibility.',detailWatch:'Confirm deadlines and ownership before saying yes.'}
];
const kpRuleForTheme={initiative:'venture-breakthrough',money:'career-leap',home:'home-displacement',learning:'graduation',workload:'first-job',relationships:'marriage',commitments:'marriage',career:'career-leap'};
function housePolarity(p){
 const h=p.house,benefic=['Jupiter','Venus','Mercury'].includes(p.name);
 if(h===3||h===11)return 'good';
 if(h===6)return benefic||p.name==='Moon'?'watch':'good';
 if(h===8||h===12)return 'watch';
 if(h===10)return p.name==='Saturn'?'watch':'good';
 if(h===9&&p.name==='Sun')return 'good';
 // Moon is only judged below when waxing and not joined to a hard planet.
 return benefic||p.name==='Moon'?'good':'watch';
}
export function chartSignals(chart,muntha=null){
 const rows=themes.map(t=>({...t,positive:0,negative:0,evidence:[]}));
 const add=(house,kind,weight,reason)=>{const t=rows.find(t=>t.houses.includes(house));t[kind==='good'?'positive':'negative']+=weight;t.evidence.push({kind,weight,reason});};
 const planets=chart.planets.filter(p=>p.name in orbs),sun=planets.find(p=>p.name==='Sun');
 for(const p of planets){
 if(p.name==='Moon'){
 const waxing=wrap(p.longitude-sun.longitude)<180;
 const afflicted=planets.some(q=>['Sun','Mars','Saturn'].includes(q.name)&&q.sign===p.sign);
 if(!waxing||afflicted)continue;
 }
 add(p.house,housePolarity(p),1,`${p.name}: annual/monthly house ${p.house}`);
 }
 for(const aspect of tajikaAspects(chart)){
 // Friendly contact with Jupiter/Venus adds support; hard contact with Mars/Saturn adds pressure.
 const pair=planets.filter(p=>p.name===aspect.a||p.name===aspect.b);
 if(aspect.kind==='friendly'&&pair.some(p=>['Jupiter','Venus'].includes(p.name)))for(const p of pair)add(p.house,'good',0.5,`${aspect.a}–${aspect.b}: friendly ${aspect.angle}° contact`);
 if(aspect.kind==='hard'&&pair.some(p=>['Mars','Saturn'].includes(p.name)))for(const p of pair)add(p.house,'watch',0.5,`${aspect.a}–${aspect.b}: hard ${aspect.angle}° contact`);
 }
 if(muntha!==null){const h=houseOf(muntha,chart.ascendant);add(h,[1,2,3,5,9,10,11].includes(h)?'good':'watch',2,`Annual Muntha in house ${h}`);}
 return rows;
}
function segmentSignals(annual,monthly){
 const a=chartSignals(annual.chart,annual.muntha),m=chartSignals(monthly);
 return m.map((row,i)=>({...row,positive:row.positive>0&&a[i].positive>0?row.positive+a[i].positive:0,negative:row.negative>0&&a[i].negative>0?row.negative+a[i].negative:0,evidence:[...a[i].evidence.map(e=>({...e,chart:'annual'})),...row.evidence.map(e=>({...e,chart:'monthly'}))]}));
}
export function buildForecast(input,A,{start=new Date(),location={lat:input.lat,lon:input.lon}}={}){
 const natal=calculate(input,A),birth=new Date(natal.date);
 const from=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate())),to=addMonths(from,12);
 if(!Number.isFinite(from.getTime())||from<birth||from.getUTCFullYear()<1900||to.getUTCFullYear()>2100)throw Error('Forecast start must be after birth and the 12-month period must end by 2100.');
 const target=natal.planets.find(p=>p.name==='Sun').longitude;
 const years=[];
 for(let year=from.getUTCFullYear()-1;year<=to.getUTCFullYear()+1;year++){
 const near=new Date(birth);near.setUTCFullYear(year);
 years.push({year,start:solarReturn(target,near,A),age:year-birth.getUTCFullYear()});
 }
 const annuals=[],segments=[];
 for(let y=0;y<years.length-1;y++){
 const item=years[y],end=years[y+1].start;if(end<=from||item.start>=to)continue;
 const annual={...item,end,chart:chartAt(item.start,location.lat,location.lon,A),muntha:munthaLongitude(natal.ascendant,item.age)};annuals.push(annual);
 const boundaries=[item.start];for(let m=1;m<12;m++)boundaries.push(solarReturn(wrap(target+30*m),new Date(item.start.getTime()+m*365.25636/12*DAY),A));boundaries.push(end);
 for(let m=0;m<12;m++)if(boundaries[m+1]>from&&boundaries[m]<to){
 const monthly=chartAt(boundaries[m],location.lat,location.lon,A);
 segments.push({start:boundaries[m],end:boundaries[m+1],annualYear:item.year,solarMonth:m+1,chart:monthly,signals:segmentSignals(annual,monthly)});
 }
 }
 const months=Array.from({length:12},(_,index)=>{
 const start=addMonths(from,index),end=addMonths(from,index+1),scores=themes.map(t=>({...t,positive:0,negative:0,evidence:[]}));
 const parts=segments.filter(s=>s.start<end&&s.end>start);
 for(const s of parts){const weight=(Math.min(end,s.end)-Math.max(start,s.start))/(end-start);
 for(let i=0;i<scores.length;i++){scores[i].positive+=s.signals[i].positive*weight;scores[i].negative+=s.signals[i].negative*weight;scores[i].evidence.push(...s.signals[i].evidence);}}
 const strongest=kind=>scores.filter(s=>s[kind]>0).sort((a,b)=>b[kind]-a[kind]||a.id.localeCompare(b.id))[0]||null;
 const good=strongest('positive'),watch=strongest('negative');
 const midpoint=new Date((+start+ +end)/2);
 return {index,start,end,scores,good,watch,kpGood:good?kpTimingCheck(natal,kpRuleForTheme[good.id],midpoint):null,kpWatch:watch?kpTimingCheck(natal,kpRuleForTheme[watch.id],midpoint):null,mixed:!!good&&good.id===watch?.id,segments:parts.map(s=>({start:s.start,end:s.end,annualYear:s.annualYear,solarMonth:s.solarMonth}))};
 });
 const headlines=themes.map(t=>{
 const candidates=months.flatMap(m=>{const s=m.scores.find(s=>s.id===t.id);return [{kind:'good',score:s.positive,month:m.index},{kind:'watch',score:s.negative,month:m.index}];}).sort((a,b)=>b.score-a.score||a.month-b.month);
 const best=candidates[0];return {...t,...best,kp:best.score?months[best.month][best.kind==='good'?'kpGood':'kpWatch']:null,title:best.score===0?`No clear change in ${t.label.toLowerCase()}.`:t[best.kind],detail:best.score===0?'The current rules do not give a strong forecast here.':t[best.kind==='good'?'detailGood':'detailWatch']};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,5);
 return {version:'tajika-core-1',from,to,natal,location,annuals,months,headlines,method:{solar:'sidereal / approximate Lahiri',houses:'whole sign',monthly:'natal solar longitude + 30° per month',muntha:'natal ascendant + completed solar years × 30°',ranking:'editorial weights, annual and monthly agreement required, duration weighted',limitations:['Core Tajika subset, not full classical Varshaphala','No elected year lord, Panchavargiya Bala, sahams, dashas or full 16 yogas','Geometric aspects only; applying/separating and perfection not evaluated','Independent ephemeris and predictive validation pending']}};
}
