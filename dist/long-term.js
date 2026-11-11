import {calculate,chartAt,wrap} from './engine.js';
import {solarReturn,munthaLongitude,chartSignals,addMonths} from './forecast.js';
import {majorEventMatches,exploratoryMatches,selectLifeEvents} from './history.js';
import {kpTimingCheck} from './kp.js';
const DAY=86400000;
// Only unusually large, repeatable changes. A birth chart alone cannot tell us
// whether a first marriage, job, qualification or child has already happened.
const repeatable=new Set(['career-leap','career-reversal','venture-breakthrough','financial-shock','home-displacement','relationship-rupture']);
export function buildLongTermForecast(input,A,{start=new Date(),location={lat:input.lat,lon:input.lon},onProgress=()=>{}}={}){
 const natal=calculate(input,A),birth=new Date(natal.date),from=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate())),to=addMonths(from,120);
 if(!Number.isFinite(+from)||from<birth||to.getUTCFullYear()>2100||!Number.isFinite(Number(location.lat))||!Number.isFinite(Number(location.lon)))throw Error('Choose a valid forecast start and residence.');
 const sun=natal.planets.find(p=>p.name==='Sun').longitude,firstYear=from.getUTCFullYear()-1,lastYear=to.getUTCFullYear();
 const returnAt=year=>{const near=new Date(birth);near.setUTCFullYear(year);return solarReturn(sun,near,A);};
 const candidates=[],annualSeries=[];
 for(let year=firstYear;year<=lastYear;year++){
  const annualStart=returnAt(year),annualEnd=returnAt(year+1);if(annualEnd<=from||annualStart>=to)continue;
  const age=year-birth.getUTCFullYear(),annual=chartAt(annualStart,location.lat,location.lon,A),muntha=munthaLongitude(natal.ascendant,age),annualSignals=chartSignals(annual,muntha);
  const net=id=>{const row=annualSignals.find(r=>r.id===id);return row?row.positive-row.negative:0;};
  annualSeries.push({year,from:annualStart,to:annualEnd,income:net('career')+net('money'),wellbeing:net('workload')+net('home')});
  const boundaries=[annualStart];for(let m=1;m<12;m++)boundaries.push(solarReturn(wrap(sun+30*m),new Date(+annualStart+m*365.25636/12*DAY),A));boundaries.push(annualEnd);
  const best=new Map();
  for(let month=0;month<12;month++){
   const windowStart=new Date(Math.max(+from,+boundaries[month])),windowEnd=new Date(Math.min(+to,+boundaries[month+1]));if(windowStart>=windowEnd)continue;
   const monthly=chartAt(boundaries[month],location.lat,location.lon,A),monthlySignals=chartSignals(monthly);
   const strict=majorEventMatches(annualSignals,monthlySignals,age).filter(m=>repeatable.has(m.rule.id));
   const exploratory=exploratoryMatches(annualSignals,monthlySignals,age).filter(m=>repeatable.has(m.rule.id)&&!strict.some(s=>s.rule.id===m.rule.id));
   for(const match of [...strict,...exploratory]){
    const {rule,score,annualEvidence,monthlyEvidence}=match,kp=kpTimingCheck(natal,rule.id,new Date((+windowStart+ +windowEnd)/2)),tier=strict.includes(match)?'stronger':'exploratory';
    if(tier==='exploratory'&&kp.support===0)continue;
    const candidate={id:`future-${year}-${month+1}-${rule.id}`,ruleId:rule.id,label:rule.label,kind:rule.kind,title:rule.title,detail:rule.detail,check:rule.check,score:(tier==='stronger'?score+10:score)+kp.support,tier,kp,age,annualYear:year,start:windowStart,end:windowEnd,evidence:{requirements:rule.requires,annual:annualEvidence,monthly:monthlyEvidence,annualReturn:annualStart,monthlyReturn:boundaries[month],muntha}};
    if(!best.has(rule.id)||best.get(rule.id).score<candidate.score)best.set(rule.id,candidate);
   }
  }
  candidates.push(...best.values());onProgress({completed:year-firstYear+1,total:lastYear-firstYear+1});
 }
 const ranked=selectLifeEvents(candidates,12).sort((a,b)=>b.score-a.score);
 const chosen=[];for(const event of ranked){if(chosen.length>=8)break;if(chosen.filter(e=>e.ruleId===event.ruleId).length>=2)continue;if(chosen.some(e=>e.annualYear===event.annualYear))continue;chosen.push(event);}
 const events=chosen.sort((a,b)=>+a.start-+b.start);
 const headlines=[...events].sort((a,b)=>b.score-a.score).slice(0,5);
 return {version:'long-term-major-1',from,to,events,headlines,annualSeries,candidateCount:candidates.length,location:{lat:Number(location.lat),lon:Number(location.lon)},limits:['Selected turning-point hypotheses, not a monthly prediction or factual promise','Windows are approximate solar months, not exact event dates','KP timing is partial; no independent predictive validation','Residence is held fixed across ten years','One-time milestones are excluded when prior life status is unknown']};
}
