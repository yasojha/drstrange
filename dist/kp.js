// KP stellar-period cross-check only. This does not calculate KP ayanamsa,
// Placidus cusps, cuspal promises, node agency, or ruling planets.
import {wrap} from './engine.js';
const ORDER=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const YEARS={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
const YEAR_MS=365.2425*86400000,STAR=360/27;
export function stellarLords(longitude){
 const angle=wrap(longitude),index=Math.floor((angle+1e-10)/STAR)%27,starLord=ORDER[index%9];
 let remaining=(angle-index*STAR)/STAR*120,subLord=starLord;
 for(let i=0;i<9;i++){
  const lord=ORDER[(ORDER.indexOf(starLord)+i)%9];
  if(remaining<YEARS[lord]+1e-10){subLord=lord;break;}
  remaining-=YEARS[lord];
 }
 return {starLord,subLord,starIndex:index};
}
export function planetaryPeriod(moonLongitude,birth,at){
 const moon=wrap(moonLongitude),starIndex=Math.floor((moon+1e-10)/STAR)%27,first=ORDER[starIndex%9];
 const elapsed=(moon-starIndex*STAR)/STAR*YEARS[first];
 let start=+birth-elapsed*YEAR_MS;
 for(let i=0;i<20;i++){
  const maha=ORDER[(ORDER.indexOf(first)+i)%9],end=start+YEARS[maha]*YEAR_MS;
  if(+at<end){
   let subStart=start;
   for(let j=0;j<9;j++){
    const bhukti=ORDER[(ORDER.indexOf(maha)+j)%9],subEnd=subStart+YEARS[maha]*YEARS[bhukti]/120*YEAR_MS;
    if(+at<subEnd||j===8)return {maha,bhukti,start:new Date(start),end:new Date(end),subStart:new Date(subStart),subEnd:new Date(subEnd)};
    subStart=subEnd;
   }
  }
  start=end;
 }
 throw Error('Date is outside supported planetary periods.');
}
const EVENT_HOUSES={
 marriage:[2,7,11],graduation:[4,9,11],'first-job':[2,6,10,11],
 'first-child':[2,5,11],'career-leap':[2,6,10,11],
 'career-reversal':[1,5,8,12],'venture-breakthrough':[2,3,10,11],
 'financial-shock':[8,12],'home-displacement':[4,8,12],
 'relationship-rupture':[1,6,10,12]
};
export function kpTimingCheck(natal,ruleId,when){
 const moon=natal.planets.find(p=>p.name==='Moon');
 const period=planetaryPeriod(moon.longitude,new Date(natal.date),when);
 const houses=EVENT_HOUSES[ruleId]||[];
 const factors=[period.maha,period.bhukti].map(lord=>{
  const planet=natal.planets.find(p=>p.name===lord),starLord=stellarLords(planet.longitude).starLord;
  const starPlanet=natal.planets.find(p=>p.name===starLord);
  const signified=[starPlanet.house,planet.house];
  return {lord,starLord,signified,matched:signified.filter(h=>houses.includes(h))};
 });
 const support=factors.reduce((sum,f)=>sum+(f.matched.length?1:0),0);
 return {status:support===2?'supports':support===1?'mixed':'no-support',support,period:{maha:period.maha,bhukti:period.bhukti},factors,
  limitation:'Partial KP stellar timing using approximate Lahiri and whole-sign natal houses. No KP cuspal promise or Placidus houses; this is not independent validation.'};
}
