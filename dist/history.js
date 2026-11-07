import {calculate,chartAt,wrap} from './engine.js';
import {solarReturn,munthaLongitude,chartSignals} from './forecast.js';
const DAY=86400000;
// Claims are fixed before feedback. This catalogue deliberately avoids medical,
// bereavement, fertility, marriage and other unsupported high-stakes event claims.
const catalogue={
 initiative:{label:'Personal plans',minAge:16,good:['You started a project of your own.','You began something outside your usual work or studies and took responsibility for it.','A specific project that actually began, not an idea you only considered.'],watch:['A personal plan had to be put on hold.','A project you intended to start or finish was postponed after resistance or practical obstacles.','A named plan with a real postponement during this window.']},
 money:{label:'Money',minAge:18,good:['Your earnings increased.','You received a pay increase or started an additional source of earned income.','An actual change in earnings, not an offer that never became income.'],watch:['A large expense disrupted your budget.','An unplanned payment made you reduce other spending or use savings.','One identifiable expense that changed your budget, not routine bills.']},
 home:{label:'Home & family',minAge:5,good:['A difficult situation at home settled down.','A household disagreement or prolonged disruption was resolved and daily life became more settled.','A specific issue and a clear resolution, not a generally pleasant year.'],watch:['A family responsibility disrupted your routine.','You had to change your usual schedule because of an ongoing household or family obligation.','A concrete responsibility that lasted beyond a single busy day.']},
 learning:{label:'Learning',minAge:5,good:['You completed an important learning milestone.','You passed an important exam, completed a course or finished a substantial creative project.','One completed milestone. Interest in a subject alone does not count.'],watch:['A study or training plan was delayed.','An exam, course or substantial learning project took longer than planned or was interrupted.','A specific delay or interruption, not simply finding a subject difficult.']},
 workload:{label:'Daily work',minAge:18,good:['You finished a task that had been dragging on.','A substantial work backlog or unresolved assignment finally reached completion.','An identifiable task with a finish date, not ordinary weekly work.'],watch:['Extra work repeatedly disrupted your personal time.','An extended period of additional duties or rework reduced the time you had outside work.','A sustained change in workload, not one late evening.']},
 relationships:{label:'Relationships',minAge:18,good:['You repaired an important relationship.','A specific conversation or agreement ended an ongoing disagreement with someone close.','A real disagreement followed by reconciliation, not simply meeting someone.'],watch:['A disagreement changed a shared plan.','You and someone close could not agree, and a plan was delayed, changed or dropped.','A named shared plan that changed because of a disagreement.']},
 commitments:{label:'Shared responsibilities',minAge:18,good:['A shared obligation was finally resolved.','You completed a pending joint payment, agreement or administrative responsibility.','An actual obligation closed out, not a vague sense of relief.'],watch:['An old obligation returned and needed action.','A previously unresolved payment, agreement or paperwork issue required your attention again.','A specific old issue that resurfaced, rather than a new task.']},
 career:{label:'Career',minAge:18,good:['You took on a bigger role at work.','You were given a promotion, a wider remit or responsibility for a substantial assignment.','A documented change in responsibility, not praise without a role change.'],watch:['An important work milestone was delayed.','A planned role change, project completion or approval did not happen on its expected schedule.','A specific milestone with an expected date and a later outcome.']}
};
export function reviewSummary(events,reviews={}){
 const summary={matches:0,misses:0,unsure:0,unreviewed:0,total:events.length};
 for(const e of events){const value=reviews[e.id]?.verdict;summary[value==='match'?'matches':value==='miss'?'misses':value==='unsure'?'unsure':'unreviewed']++;}return summary;
}
export function selectLifeEvents(candidates,limit=10){
 const sorted=[...candidates].sort((a,b)=>b.score-a.score||+a.start-+b.start||a.id.localeCompare(b.id));
 const chosen=[],typeCounts=new Map();
 // A maximum of two per claim type and one event per solar year limit repeated
 // generic statements. Rank first, then greedily reward temporal separation.
 while(chosen.length<limit){
 const eligible=sorted.filter(c=>!chosen.includes(c)&&(typeCounts.get(c.ruleId)||0)<2&&!chosen.some(e=>e.annualYear===c.annualYear));
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
 for(const signal of monthlySignals){
 const rule=catalogue[signal.id];if(!rule||age<rule.minAge)continue;
 const annualSignal=annualSignals.find(s=>s.id===signal.id);
 for(const kind of ['good','watch']){
 const key=kind==='good'?'positive':'negative',other=kind==='good'?'negative':'positive';
 // Reject weak and mixed claims: both charts must agree, with net support in each.
 if(annualSignal[key]<1.5||signal[key]<1||annualSignal[key]<=annualSignal[other]||signal[key]<=signal[other])continue;
 const score=annualSignal[key]+signal[key],ruleId=`${signal.id}-${kind}`;
 const [title,detail,check]=rule[kind];
 const candidate={id:`history-v1-${year}-${month+1}-${ruleId}`,ruleId,domain:signal.id,label:rule.label,kind,title,detail,check,score,age,annualYear:year,start:boundaries[month],end:boundaries[month+1],evidence:{annual:annualSignal.evidence,monthly:signal.evidence,annualReturn:start,monthlyReturn:boundaries[month],muntha,annualAscendant:annual.ascendant,monthlyAscendant:monthly.ascendant}};
 if(!yearBest.has(ruleId)||yearBest.get(ruleId).score<score)yearBest.set(ruleId,candidate);
 }
 }
 }
 candidates.push(...yearBest.values());start=end;onProgress({completed:year-firstYear+1,total:Math.max(1,lastYear-firstYear+1)});
 }
 const events=selectLifeEvents(candidates);
 return {version:'retrospective-core-1',birth,asOf:cutoff,events,annualReturns,annualCount,candidateCount:candidates.length,requestedCount:10,location:{lat:Number(input.lat),lon:Number(input.lon),assumption:'Birthplace used for every past return. Historical residences are not known.'},selection:'Strongest agreeing annual/monthly signals, non-mixed, maximum one per solar year and two per claim type, with temporal-diversity preference.',limits:['Retrospective hypotheses, not established biography','Broad editorial event templates are not uniquely identifying','Past locations assumed; missing historical residence can change houses','Only completed solar months from age five onward','Adult-only domains are excluded below eighteen','This review is not a controlled test of predictive accuracy']};
}
