import {reviewSummary} from './history.js';
import {calendarBounds} from './timeline.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const range=e=>`${date(e.start)} – ${date(new Date(+e.end-1))}`;
let worker=null,report=null,forecastTimeline=null,reviews={},selected=null,identity=null,isExample=false;
const states={match:'Matches',miss:'Doesn’t match',unsure:'Not sure'};
export function setForecastTimeline(next){forecastTimeline=next;if(report)render();}
export function startLifeHistory(input,example){
 const today=new Date(),key=JSON.stringify([input.date,input.time,input.offset,input.lat,input.lon,today.toISOString().slice(0,10)]);isExample=example;
 if(key===identity&&report){render();return;}
 worker?.terminate();worker=null;report=null;reviews={};selected=null;identity=key;
 $('#life-content').hidden=true;$('#life-progress').hidden=false;$('#life-progress').textContent='Calculating past years…';$('#life-export').disabled=true;
 try{
 worker=new Worker(new URL('./history-worker.js',import.meta.url),{type:'module'});const active=worker;
 active.onmessage=({data})=>{if(active!==worker)return;
 if(data.type==='progress')$('#life-progress').textContent=`Checking major turning points · ${data.completed} of ${data.total}`;
 if(data.type==='error'){showError(data.message);active.terminate();worker=null;}
 if(data.type==='complete'){report=data.report;selected=null;$('#life-progress').hidden=true;$('#life-content').hidden=false;$('#life-export').disabled=false;render();active.terminate();worker=null;}
 };
 active.onerror=()=>{if(active!==worker)return;showError('The past-event calculation could not finish. Submit your details again to retry.');active.terminate();worker=null;};
 active.postMessage({input:{date:input.date,time:input.time,offset:input.offset,lat:input.lat,lon:input.lon},asOf:today.toISOString()});
 }catch{showError('This browser could not start the past-event calculation. Your annual forecast is still available.');}
}
function showError(message){$('#life-progress').hidden=false;$('#life-progress').textContent=message;}
function status(e){return reviews[e.id]?.verdict;}
function updateSummary(){
 const s=reviewSummary(report.events,reviews);
 $('#life-summary').innerHTML=[['Matches',s.matches],['Doesn’t match',s.misses],['Not sure',s.unsure],['Not reviewed',s.unreviewed]].map(([name,n])=>`<div><strong>${n}</strong><span>${name}</span></div>`).join('');
 $('#life-review-progress').textContent=`${s.total-s.unreviewed} of ${s.total} reviewed. This is your assessment, not a measured accuracy score.`;
}
function drawCalendar(){
 const bounds=calendarBounds(report.events,forecastTimeline,report.asOf);
 if(!bounds){$('#life-timeline').innerHTML='<p class="empty">No dated reading is available.</p>';return;}
 const {startYear:first,startMonth:firstMonth,endYear:last,endMonth:lastMonth}=bounds;
 $('#calendar-range').textContent=`${date(bounds.first)} → ${date(forecastTimeline?new Date(+forecastTimeline.to-1):bounds.last)}`;
 const byMonth=new Map();
 for(const e of report.events){const midpoint=new Date((+new Date(e.start)+ +new Date(e.end))/2),key=`${midpoint.getUTCFullYear()}-${midpoint.getUTCMonth()}`;byMonth.set(key,[...(byMonth.get(key)||[]),e]);}
 const forecastMonths=new Map();
 for(const m of forecastTimeline?.months||[]){const start=new Date(m.start),key=`${start.getUTCFullYear()}-${start.getUTCMonth()}`;forecastMonths.set(key,[...(forecastMonths.get(key)||[]),m]);}
 const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 $('#life-timeline').innerHTML=Array.from({length:last-first+1},(_,i)=>{
  const year=first+i;
  const months=monthNames.flatMap((name,m)=>{
   if(year===first&&m<firstMonth||year===last&&m>lastMonth)return [];
   const events=byMonth.get(`${year}-${m}`)||[],future=forecastMonths.get(`${year}-${m}`)||[];
   if(!events.length&&!future.length)return [];
   return [`<div class="calendar-month ${events.length?'has-events':''} ${future.length?'has-forecast':''}"><span>${name}</span>${events.map(e=>`<button type="button" class="past-event ${selected===e.id?'active':''}" data-event="${e.id}" aria-label="Past candidate: ${escape(e.label)}, ${escape(range(e))}, ${escape(states[status(e)]||'Not reviewed')}" title="${escape(e.title)} · ${escape(range(e))}">${escape(e.label)}<small>${escape(range(e))}</small></button>`).join('')}${future.map(m=>`<button type="button" class="forecast-event ${selected===`month-${m.index}`?'active':''}" data-month="${m.index}" aria-label="Forecast month ${m.index+1}: ${escape(range(m))}">Year ahead <small>${escape(range(m))}</small></button>`).join('')}</div>`];
  });
  return months.length?`<div class="calendar-year"><strong>${year}</strong><div class="calendar-months">${months.join('')}</div></div>`:'';
 }).join('');
 $('#life-event-key').innerHTML='<span class="calendar-legend past">● Past candidate</span><span class="calendar-legend future">● Forecast month</span>';
}

function render(){
 $('#life-count-title').textContent=`Your timeline · ${report.events.length} past candidates, ${forecastTimeline?.months.length||0} forecast months.`;
 $('#life-note').textContent=`${isExample?'Example profile · ':''}Past claims and your next year in one calendar. Past dates are solar-month windows, not exact event dates.`;
 $('#life-shortfall').textContent=report.events.length<10?'The top ten distinct claims are shown when available. Exploratory entries have weaker support; mark them as misses if they did not happen.':'';
 $('#life-cards').innerHTML=report.events.map((e,i)=>`<article class="life-card ${selected===e.id?'selected':''}" id="life-card-${e.id}" data-card="${e.id}" ${selected===e.id?'':'hidden'}><div class="life-card-top"><span class="event-number">${String(i+1).padStart(2,'0')}</span><span class="eyebrow">${escape(e.label)} · AGE ${e.age}</span><span class="review-badge" data-badge="${e.id}">${states[status(e)]||'Not reviewed'}</span></div><p class="life-date">${escape(range(e))} · ${e.tier==='stronger'?'Stronger Tajika match':'Exploratory Tajika match'}</p><p class="kp-status">KP timing (partial): ${e.kp.status==='supports'?'supports this event type':e.kp.status==='mixed'?'mixed':'no support'} · ${e.kp.period.maha}/${e.kp.period.bhukti}</p><h3>${escape(e.title)}</h3><p>${escape(e.detail)}</p><div class="match-definition"><strong>Match criteria</strong><p>${escape(e.check)} The event must fall inside the dates above.</p></div><fieldset class="review-options"><legend>Did this happen?</legend>${Object.entries(states).map(([value,label])=>`<button type="button" data-verdict="${value}" data-id="${e.id}" aria-pressed="${status(e)===value}">${label}</button>`).join('')}<button type="button" data-clear="${e.id}" class="clear-review">Clear</button></fieldset><label class="event-note-label">What actually happened? <span>optional, kept in this tab</span><textarea data-note="${e.id}" maxlength="1000" rows="2" placeholder="Event, approximate date, and what matched or did not match">${escape(reviews[e.id]?.note||'')}</textarea></label></article>`).join('');
 const monthIndex=typeof selected==='string'&&selected.startsWith('month-')?Number(selected.slice(6)):NaN;
 if(Number.isInteger(monthIndex)&&forecastTimeline?.months[monthIndex])renderFuture(forecastTimeline.months[monthIndex]);
 else $('#future-detail').hidden=true;
 $('#timeline-prompt').hidden=selected!==null;
 updateSummary();drawCalendar();
}
function renderFuture(m){
 const detail=$('#future-detail');detail.hidden=false;
 detail.innerHTML=`<article class="month-card"><div class="month-top"><span class="eyebrow">FORECAST MONTH ${String(m.index+1).padStart(2,'0')}</span><span>↗</span></div><h3>${escape(new Date(m.start).toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}))}</h3><p class="month-date">${escape(range(m))}</p>${m.mixed?'<p class="mixed-note">A mixed month in this area.</p>':''}<div class="month-good"><h4>Good things</h4><p>${escape(m.good?m.mixed?`There is progress in ${m.good.label.toLowerCase()}, but it is uneven.`:m.good.good:'No clear positive stands out this month.')}</p>${m.good?`<span>${escape(m.good.detailGood)}</span><small class="kp-status">${escape(kpLabel(m.kpGood))}</small>`:''}</div><div class="month-watch"><h4>Watch out</h4><p>${escape(m.watch?m.watch.watch:'No specific warning stands out this month.')}</p>${m.watch?`<span>${escape(m.watch.detailWatch)}</span><small class="kp-status">${escape(kpLabel(m.kpWatch))}</small>`:''}</div></article>`;
}
const kpLabel=k=>`KP timing (partial): ${k.status==='supports'?'supports this theme':k.status==='mixed'?'mixed':'no supporting period'} · ${k.period.maha}/${k.period.bhukti}`;
function revealSelection(target){
 $('#timeline-prompt').hidden=true;
 document.querySelectorAll('[data-card]').forEach(el=>{el.hidden=el.dataset.card!==selected;el.classList.toggle('selected',el.dataset.card===selected);});
 if(target==='past')$('#future-detail').hidden=true;
 drawCalendar();
 const detail=target==='past'?document.getElementById('life-card-'+selected):$('#future-detail');
 detail.setAttribute('tabindex','-1');detail.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});detail.focus({preventScroll:true});
}
function choose(id){selected=id;revealSelection('past');}
function chooseMonth(index){const m=forecastTimeline?.months[index];if(!m)return;selected=`month-${index}`;renderFuture(m);revealSelection('future');}
$('#life-timeline').addEventListener('click',e=>{const past=e.target.closest('[data-event]'),future=e.target.closest('[data-month]');if(past)choose(past.dataset.event);else if(future)chooseMonth(Number(future.dataset.month));});
$('#life-cards').addEventListener('click',e=>{
 const button=e.target.closest('[data-verdict],[data-clear]');if(!button)return;
 const id=button.dataset.id||button.dataset.clear,existing=reviews[id]||{};
 const verdict=button.dataset.verdict;
 reviews[id]={...existing,verdict};
 const card=document.querySelector(`[data-card="${id}"]`);
 card.querySelectorAll('[data-verdict]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.verdict===verdict)));
 card.querySelector('[data-badge]').textContent=states[verdict]||'Not reviewed';
 selected=id;updateSummary();drawCalendar();document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('selected',el.dataset.card===id));
});
$('#life-cards').addEventListener('input',e=>{if(!e.target.matches('[data-note]'))return;const id=e.target.dataset.note;reviews[id]={...reviews[id],note:e.target.value};});
$('#life-export').addEventListener('click',()=>{if(!report)return;const output={...report,exportedAt:new Date().toISOString(),reviews,summary:reviewSummary(report.events,reviews)};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vedik-life-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
