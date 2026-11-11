import {calculate,chartAt,wrap} from './engine.js';
import {solarReturn,munthaLongitude,chartSignals} from './forecast.js';
import {kpTimingCheck} from './kp.js';
const DAY=86400000;
const types=[
 {id:'marriage',label:'Marriage window',minAge:21,maxAge:40,domains:['relationships','home'],title:'A formal partnership has stronger support.',detail:'This period favors a major commitment or change in a formal partnership. It does not establish that a wedding will occur.'},
 {id:'children',label:'Childbirth window',minAge:21,maxAge:50,domains:['learning','home'],title:'A child joining the family has stronger support.',detail:'This window combines family and fifth-house themes. It cannot establish pregnancy, fertility, or a birth date.'},
 {id:'income',label:'Income increase window',minAge:18,maxAge:75,domains:['career','money'],title:'A substantial increase in earned income has stronger support.',detail:'Career and money indications rise together. A routine raise does not count.'},
 {id:'business',label:'Business start window',minAge:18,maxAge:75,domains:['initiative','career'],title:'Starting an independent business has stronger support.',detail:'Personal initiative and work indications rise together. This does not promise business success.'}
];
export function rankWindows(candidates,limit=5){
 const picked=[];
 for(const c of [...candidates].sort((a,b)=>b.score-a.score||+a.start-+b.start)){
  if(picked.length===limit)break;
  if(picked.some(p=>Math.abs(+p.start-+c.start)<18*30*DAY))continue;
  picked.push(c);
 }
 return picked.map((e,i)=>({...e,strength:i===0?'Strongest':i<3?'Potential':'Lower signal',rank:i+1})).sort((a,b)=>+a.start-+b.start);
}
export function buildLifeWindows(input,A,{asOf=new Date(),location={lat:input.lat,lon:input.lon},horizonYears=10,onProgress=()=>{}}={}){
 const natal=calculate(input,A),birth=new Date(natal.date),today=new Date(asOf),to=new Date(Date.UTC(today.getUTCFullYear()+horizonYears,today.getUTCMonth(),today.getUTCDate()));
 if(!Number.isFinite(+today)||today<birth||to.getUTCFullYear()>2100)throw Error('Invalid window horizon.');
 const sun=natal.planets.find(p=>p.name==='Sun').longitude,first=birth.getUTCFullYear()+18,last=to.getUTCFullYear(),all=[];
 const returnAt=year=>{const d=new Date(birth);d.setUTCFullYear(year);return solarReturn(sun,d,A);};
 for(let year=first;year<=last;year++){
  const start=returnAt(year),end=returnAt(year+1);if(start>=to)break;
  const age=year-birth.getUTCFullYear(),past=end<=today,lat=past?input.lat:location.lat,lon=past?input.lon:location.lon;
  const annual=chartSignals(chartAt(start,lat,lon,A),munthaLongitude(natal.ascendant,age));
  const bounds=[start];for(let m=1;m<12;m++)bounds.push(solarReturn(wrap(sun+30*m),new Date(+start+m*365.25636/12*DAY),A));bounds.push(end);
  for(let month=0;month<12;month++){
   const left=bounds[month],right=bounds[month+1];if(left>=to||right>today&&left<today)continue;
   const future=left>=today;if(!future&&right>today)continue;
   const monthly=chartSignals(chartAt(left,lat,lon,A));
   for(const type of types){
    if(age<type.minAge||age>type.maxAge)continue;
    const rows=type.domains.map(id=>[annual.find(r=>r.id===id),monthly.find(r=>r.id===id)]);
    if(rows.some(pair=>pair.some(r=>!r)||pair[0].positive+pair[1].positive<=pair[0].negative+pair[1].negative))continue;
    const evidence=rows.flatMap(pair=>pair.flatMap(r=>r.evidence.filter(e=>e.kind==='good')));
    if(new Set(evidence.map(e=>e.reason)).size<2)continue;
    const score=rows.flatMap(pair=>pair).reduce((n,r)=>n+r.positive-r.negative,0);
    const kp=kpTimingCheck(natal,type.id==='children'?'first-child':type.id==='income'?'career-leap':type.id==='business'?'venture-breakthrough':'marriage',new Date((+left+ +right)/2));
    if(score<2)continue;
    all.push({id:`window-${type.id}-${year}-${month}`,type:type.id,label:type.label,title:type.title,detail:type.detail,age,score:score+kp.support,kp,start:left,end:right,era:future?'future':'past',evidence});
   }
  }
  onProgress({completed:year-first+1,total:last-first+1});
 }
 const groups=Object.fromEntries(types.map(t=>[t.id,rankWindows(all.filter(e=>e.type===t.id))]));
 return {version:'life-windows-1',asOf:today,to,groups,events:Object.values(groups).flat().sort((a,b)=>+a.start-+b.start),limits:['Rank is relative signal strength, not a probability','Up to five per type; empty categories remain empty','Past locations use birthplace; future residence is held fixed','These signals do not establish marriage, conception, birth, income or business outcomes']};
}
