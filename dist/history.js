import {calculate,chartAt,wrap} from './engine.js';
import {solarReturn,munthaLongitude,chartSignals} from './forecast.js';
const DAY=86400000;
// Editorial major-event hypotheses. These are not classical event-certainty
// rules. Eligibility requires multiple domains and distinct evidence in both
// charts; age only excludes inappropriate claims and never supplies evidence.
export const majorEventRules=[
 {id:'career-leap',label:'Major career rise',minAge:18,kind:'good',requires:[['career','good'],['money','good']],title:'Your career and earnings took a major step up.',detail:'A role change substantially increased both your responsibility and earned income.',check:'Both changes happened together in this window and lasted. A routine annual raise, praise or a slightly larger assignment does not count.'},
 {id:'career-reversal',label:'Major career setback',minAge:18,kind:'watch',requires:[['career','watch'],['money','watch']],title:'A serious work setback interrupted your income.',detail:'A lost role, failed business engagement or comparable disruption materially reduced earned income.',check:'There was an actual interruption to work and income. Deadline pressure, a delayed promotion or a voluntary break with income intact does not count.'},
 {id:'venture-breakthrough',label:'Independent success',minAge:18,kind:'good',requires:[['initiative','good'],['money','good']],title:'Something you built became a substantial source of income.',detail:'An independent venture moved beyond a trial and began making a meaningful contribution to your livelihood.',check:'It produced sustained earned income and changed your financial position. Starting a hobby, posting online or earning a small one-off payment does not count.'},
 {id:'financial-shock',label:'Major financial setback',minAge:18,kind:'watch',requires:[['money','watch'],['commitments','watch']],title:'A financial setback forced a major change in your spending.',detail:'A substantial loss or obligation required a prolonged reduction in spending or a significant use of savings.',check:'The financial consequence materially changed your standard of living. Routine bills, tuition, a planned purchase or a brief tight month does not count.'},
 {id:'home-displacement',label:'Major home disruption',minAge:5,kind:'watch',requires:[['home','watch'],['commitments','watch']],title:'You unexpectedly lost a settled living arrangement.',detail:'A serious household disruption forced you to leave or fundamentally reorganise where you lived.',check:'It was an unplanned, consequential change to the main home. School or college moves, holidays, ordinary tenancy changes and routine family duties do not count.'},
 {id:'relationship-rupture',label:'Major relationship breakdown',minAge:18,kind:'watch',requires:[['relationships','watch'],['home','watch']],title:'An important relationship broke down and changed your home life.',detail:'A sustained separation or estrangement changed day-to-day living arrangements or close family contact.',check:'Both the relationship breakdown and a lasting change to daily home life occurred. Arguments, cancelled plans and a brief period of tension do not count.'}
];
function supportingEvidence(rows,rule){
 return rule.requires.flatMap(([domain,kind])=>rows.find(r=>r.id===domain).evidence.filter(e=>e.kind===kind));
}
export function majorEventMatches(annualSignals,monthlySignals,age){
 return majorEventRules.flatMap(rule=>{
 if(age<rule.minAge)return [];
 let score=0;
 for(const rows of [annualSignals,monthlySignals]){
  for(const [domain,kind] of rule.requires){
   const row=rows.find(r=>r.id===domain),key=kind==='good'?'positive':'negative',opposite=kind==='good'?'negative':'positive';
   if(!row||row[key]<1||row[key]-row[opposite]<1)return [];
   score+=row[key]-row[opposite];
  }
  const evidence=supportingEvidence(rows,rule);
  const reasons=new Set(evidence.map(e=>e.reason));
  const planets=new Set(evidence.flatMap(e=>e.reason.match(/Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn/g)||[]));
  // Do not count one duplicated aspect or one planet as independent confirmation.
  if(reasons.size<2||planets.size<2)return [];
 }
 if(score<8)return [];
 return [{rule,score,annualEvidence:supportingEvidence(annualSignals,rule),monthlyEvidence:supportingEvidence(monthlySignals,rule)}];
 });
}
export function reviewSummary(events,reviews={}){
 const summary={matches:0,misses:0,unsure:0,unreviewed:0,total:events.length};
 for(const e of events){const value=reviews[e.id]?.verdict;summary[value==='match'?'matches':value==='miss'?'misses':value==='unsure'?'unsure':'unreviewed']++;}return summary;
}
export function selectLifeEvents(candidates,limit=10){
 const sorted=[...candidates].sort((a,b)=>b.score-a.score||+a.start-+b.start||a.id.localeCompare(b.id));
 const chosen=[],typeCounts=new Map();
 // Never repeat the same event type within three solar years. One event per
 // year, up to two per type. Ten is a ceiling, never a target to fill.
 while(chosen.length<limit){
 const eligible=sorted.filter(c=>!chosen.includes(c)&&(typeCounts.get(c.ruleId)||0)<2&&!chosen.some(e=>e.annualYear===c.annualYear||(e.ruleId===c.ruleId&&Math.abs(e.annualYear-c.annualYear)<3)));
 if(!eligible.length)break;
 const adjusted=c=>c.score+(chosen.length?Math.min(5,Math.min(...chosen.map(e=>Math.abs(+e.start-+c.start)))/(365.25636*DAY))*0.35:0);
 eligible.sort((a,b)=>adjusted(b)-adjusted(a)||b.score-a.score||+a.start-+b.start||a.id.localeCompare(b.id));
 const best=eligible[0];chosen.push(best);typeCounts.set(best.ruleId,(typeCounts.get(best.ruleId)||0)+1);
 }
 return chosen.sort((a,b)=>+a.start-+b.start||a.id.localeCompare(b.id));
}
export function buildLifeHistory(input,A,{asOf=new Date(),onProgress=()=>{}}={}){
 const birthChart=calculate(input,A),birth=new Date(birthChart.date),cutoff=new Date(asOf);
 if(!Number.isFinite(+cutoff)||cutoff<birth||cutoff.getUTCFullYear()>2100)throw Error('Past-event review needs a valid date after birth, no later than 2100.');
 const target=birthChart.planets.find(p=>p.name==='Sun').longitude,firstYear=birth.getUTCFullYear()+5,lastYear=cutoff.getUTCFullYear();
 const candidates=[],annualReturns=[];let annualCount=0;
 const returnAt=year=>{const near=new Date(birth);near.setUTCFullYear(year);return solarReturn(target,near,A);};
 let start=firstYear<=lastYear?returnAt(firstYear):null;
 for(let year=firstYear;year<=lastYear;year++){
 if(start>=cutoff)break;
 const end=returnAt(year+1),age=year-birth.getUTCFullYear();
 const annual=chartAt(start,input.lat,input.lon,A),muntha=munthaLongitude(birthChart.ascendant,age),annualSignals=chartSignals(annual,muntha);
 annualReturns.push({year,start,end,age,muntha,ascendant:annual.ascendant});annualCount++;
 const boundaries=[start];for(let m=1;m<12;m++)boundaries.push(solarReturn(wrap(target+30*m),new Date(+start+m*365.25636/12*DAY),A));boundaries.push(end);
 const yearBest=new Map();
 for(let month=0;month<12;month++){
 // Use completed solar months only, never a prediction window extending beyond today.
 if(boundaries[month+1]>cutoff)break;
 const monthly=chartAt(boundaries[month],input.lat,input.lon,A),monthlySignals=chartSignals(monthly);
 for(const match of majorEventMatches(annualSignals,monthlySignals,age)){
 const {rule,score,annualEvidence,monthlyEvidence}=match;
 const candidate={id:`history-v2-${year}-${month+1}-${rule.id}`,ruleId:rule.id,domain:rule.id,label:rule.label,kind:rule.kind,title:rule.title,detail:rule.detail,check:rule.check,score,age,annualYear:year,start:boundaries[month],end:boundaries[month+1],evidence:{requirements:rule.requires,annual:annualEvidence,monthly:monthlyEvidence,annualReturn:start,monthlyReturn:boundaries[month],muntha,annualAscendant:annual.ascendant,monthlyAscendant:monthly.ascendant}};
 if(!yearBest.has(rule.id)||yearBest.get(rule.id).score<score)yearBest.set(rule.id,candidate);
 }
 }
 candidates.push(...yearBest.values());start=end;onProgress({completed:year-firstYear+1,total:Math.max(1,lastYear-firstYear+1)});
 }
 const events=selectLifeEvents(candidates);
 return {version:'retrospective-major-2',birth,asOf:cutoff,events,annualReturns,annualCount,candidateCount:candidates.length,requestedCount:10,location:{lat:Number(input.lat),lon:Number(input.lon),assumption:'Birthplace used for every past return. Historical residences are not known.'},selection:'Major-event editorial rules require two agreeing domains, distinct evidence and at least two named planets in each chart, with total net score at least eight. One per solar year, two per type at least three years apart. No generic fallback.',limits:['Retrospective hypotheses, not established biography','Specific editorial event hypotheses are unvalidated and are not established facts','Past locations assumed; missing historical residence can change houses','Only completed solar months from age five onward','Age is an exclusion filter only; schooling, routine work and ordinary expenses are never candidates','This review is not a controlled test of predictive accuracy']};
}
