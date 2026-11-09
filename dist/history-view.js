import {reviewSummary} from './history.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const range=e=>`${date(e.start)} – ${date(new Date(+e.end-1))}`;
let worker=null,report=null,reviews={},selected=null,identity=null,isExample=false;
const states={match:'Matches',miss:'Doesn’t match',unsure:'Not sure'};
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
 if(data.type==='complete'){report=data.report;selected=report.events[0]?.id||null;$('#life-progress').hidden=true;$('#life-content').hidden=false;$('#life-export').disabled=false;render();active.terminate();worker=null;}
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
 const first=new Date(report.birth).getUTCFullYear()+12,last=new Date(report.asOf).getUTCFullYear();
 if(first>last){$('#life-timeline').innerHTML='<p class="empty">The past calendar begins at age 12.</p>';$('#life-event-key').innerHTML='';return;}
 const byMonth=new Map();
 for(const e of report.events){const midpoint=new Date((+new Date(e.start)+ +new Date(e.end))/2),key=`${midpoint.getUTCFullYear()}-${midpoint.getUTCMonth()}`;byMonth.set(key,[...(byMonth.get(key)||[]),e]);}
 const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 $('#life-timeline').innerHTML=Array.from({length:last-first+1},(_,i)=>{
  const year=first+i;
  return `<div class="calendar-year"><strong>${year}</strong><div class="calendar-months">${monthNames.map((name,m)=>{const events=byMonth.get(`${year}-${m}`)||[];const beforeTwelve=year===first&&m<new Date(report.birth).getUTCMonth();return `<div class="calendar-month ${events.length?'has-events':''} ${beforeTwelve?'before-twelve':''}"><span>${beforeTwelve?'—':name}</span>${events.map(e=>`<button type="button" data-event="${e.id}" aria-label="${escape(e.label)}, ${escape(range(e))}, ${escape(states[status(e)]||'Not reviewed')}" title="${escape(e.title)} · ${escape(range(e))}">${escape(e.label)}<small>${escape(range(e))}</small></button>`).join('')}</div>`;}).join('')}</div></div>`;
 }).join('');
 $('#life-event-key').innerHTML=report.events.map((e,i)=>`<button type="button" data-jump="${e.id}"><span>${String(i+1).padStart(2,'0')}</span> ${new Date(e.start).getUTCFullYear()} · ${escape(e.label)}</button>`).join('');
}

function render(){
 $('#life-count-title').textContent=report.events.length?`${report.events.length} major turning-point candidates.`:'No major turning point clears the current rules.';
 $('#life-note').textContent=`${isExample?'Example profile · ':''}Age 12 to ${date(report.asOf)}. Solar-month date windows are estimates, not exact event dates. Check each claim against your actual history.`;
 $('#life-shortfall').textContent=report.events.length<10?'Only qualifying major events are shown. Fewer than ten means the engine found fewer than ten; it does not fill the calendar with age-based milestones.':'';
 $('#life-cards').innerHTML=report.events.map((e,i)=>`<article class="life-card ${selected===e.id?'selected':''}" id="life-card-${e.id}" data-card="${e.id}"><div class="life-card-top"><span class="event-number">${String(i+1).padStart(2,'0')}</span><span class="eyebrow">${escape(e.label)} · AGE ${e.age}</span><span class="review-badge" data-badge="${e.id}">${states[status(e)]||'Not reviewed'}</span></div><p class="life-date">${escape(range(e))}</p><h3>${escape(e.title)}</h3><p>${escape(e.detail)}</p><div class="match-definition"><strong>Strict match criteria</strong><p>${escape(e.check)} The event must fall inside the dates above.</p></div><fieldset class="review-options"><legend>Did this happen?</legend>${Object.entries(states).map(([value,label])=>`<button type="button" data-verdict="${value}" data-id="${e.id}" aria-pressed="${status(e)===value}">${label}</button>`).join('')}<button type="button" data-clear="${e.id}" class="clear-review">Clear</button></fieldset><label class="event-note-label">What actually happened? <span>optional, kept in this tab</span><textarea data-note="${e.id}" maxlength="1000" rows="2" placeholder="Event, approximate date, and what matched or did not match">${escape(reviews[e.id]?.note||'')}</textarea></label></article>`).join('');
 updateSummary();drawCalendar();
}
function choose(id,scroll=true){selected=id;document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('selected',el.dataset.card===id));drawCalendar();if(scroll){const card=document.getElementById('life-card-'+id);card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});card.setAttribute('tabindex','-1');card.focus({preventScroll:true});}}
$('#life-event-key').addEventListener('click',e=>{const button=e.target.closest('[data-jump]');if(button)choose(button.dataset.jump);});
$('#life-timeline').addEventListener('click',e=>{const point=e.target.closest('[data-event]');if(point)choose(point.dataset.event);});
$('#life-timeline').addEventListener('keydown',e=>{const point=e.target.closest('[data-event]');if(point&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose(point.dataset.event);}});
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
