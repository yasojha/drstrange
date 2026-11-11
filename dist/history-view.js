import {reviewSummary} from './history.js';
import {calendarBounds} from './timeline.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const range=e=>`${date(e.start)} – ${date(new Date(+e.end-1))}`;
let worker=null,report=null,futureReport=null,windowsReport=null,reviews={},selected=null,identity=null,isExample=false;
let drawerTimer=null,drawerScroll=0;
const states={match:'Matches',miss:'Doesn’t match',unsure:'Not sure'};
export function startLifeHistory(input,example,location){
 closeDrawer(true);
 const today=new Date(),key=JSON.stringify([input.date,input.time,input.offset,input.lat,input.lon,today.toISOString().slice(0,10),input.forecastStart,location]);isExample=example;
 if(key===identity&&report){render();return;}
 worker?.terminate();worker=null;report=null;futureReport=null;windowsReport=null;reviews={};selected=null;identity=key;
 $('#headlines').innerHTML='';$('#forecast-range').textContent='';
 $('#life-content').hidden=true;$('#life-progress').hidden=false;$('#life-progress').textContent='Calculating your timeline…';$('#life-export').disabled=true;
 try{
 worker=new Worker(new URL('./history-worker.js',import.meta.url),{type:'module'});const active=worker;
 active.onmessage=({data})=>{if(active!==worker)return;
 if(data.type==='progress')$('#life-progress').textContent=`Checking major turning points · ${data.completed} of ${data.total}`;
 if(data.type==='future-progress')$('#life-progress').textContent=`Checking the next ten years · ${data.completed} of ${data.total}`;
 if(data.type==='window-progress')$('#life-progress').textContent=`Ranking life windows · ${data.completed} of ${data.total}`;
 if(data.type==='error'){showError(data.message);active.terminate();worker=null;}
 if(data.type==='complete'){report=data.report;futureReport=data.future;windowsReport=data.windows;selected=null;$('#life-progress').hidden=true;$('#life-content').hidden=false;$('#life-export').disabled=false;render();active.terminate();worker=null;}
 };
 active.onerror=()=>{if(active!==worker)return;showError('The timeline calculation could not finish. Submit your details again to retry.');active.terminate();worker=null;};
 active.postMessage({input:{date:input.date,time:input.time,offset:input.offset,lat:input.lat,lon:input.lon},asOf:today.toISOString(),forecastStart:input.forecastStart+'T00:00:00Z',location});
 }catch{showError('This browser could not start the timeline calculation.');}
}
function showError(message){$('#life-progress').hidden=false;$('#life-progress').textContent=message;}
function status(e){return reviews[e.id]?.verdict;}
function updateSummary(){
 const s=reviewSummary(report.events,reviews);
 $('#life-summary').innerHTML=[['Matches',s.matches],['Doesn’t match',s.misses],['Not sure',s.unsure],['Not reviewed',s.unreviewed]].map(([name,n])=>`<div><strong>${n}</strong><span>${name}</span></div>`).join('');
 $('#life-review-progress').textContent=`${s.total-s.unreviewed} of ${s.total} reviewed. This is your assessment, not a measured accuracy score.`;
}
function drawCalendar(){
 const bounds=calendarBounds([...report.events,...(windowsReport?.events||[])],futureReport,report.asOf);
 if(!bounds){$('#life-timeline').innerHTML='<p class="empty">No dated reading is available.</p>';return;}
 const {startYear:first,startMonth:firstMonth,endYear:last,endMonth:lastMonth}=bounds;
 $('#calendar-range').textContent=`${date(bounds.first)} → ${date(futureReport?new Date(+futureReport.to-1):bounds.last)}`;
 const byMonth=new Map();
 for(const e of report.events){const midpoint=new Date((+new Date(e.start)+ +new Date(e.end))/2),key=`${midpoint.getUTCFullYear()}-${midpoint.getUTCMonth()}`;byMonth.set(key,[...(byMonth.get(key)||[]),e]);}
 const futureEvents=new Map();
 for(const event of [...(futureReport?.events||[]),...(windowsReport?.events||[])]){const midpoint=new Date((+new Date(event.start)+ +new Date(event.end))/2),key=`${midpoint.getUTCFullYear()}-${midpoint.getUTCMonth()}`;futureEvents.set(key,[...(futureEvents.get(key)||[]),event]);}
 const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 $('#life-timeline').innerHTML=Array.from({length:last-first+1},(_,i)=>{
  const year=first+i;
  const months=monthNames.flatMap((name,m)=>{
   if(year===first&&m<firstMonth||year===last&&m>lastMonth)return [];
   const events=byMonth.get(`${year}-${m}`)||[],future=futureEvents.get(`${year}-${m}`)||[];
   if(!events.length&&!future.length)return [];
   return [`<div class="calendar-month ${events.length?'has-events':''} ${future.length?'has-forecast':''}"><span>${name}</span>${events.map(e=>`<button type="button" class="past-event ${selected===e.id?'active':''}" data-event="${e.id}" aria-label="Past candidate: ${escape(e.label)}, ${escape(range(e))}, ${escape(states[status(e)]||'Not reviewed')}" title="${escape(e.title)} · ${escape(range(e))}">${escape(e.label)}<small>${escape(range(e))}</small></button>`).join('')}${future.map(event=>`<button type="button" class="forecast-event ${selected===event.id?'active':''}" data-future="${escape(event.id)}" aria-label="Future candidate: ${escape(event.label)}, ${escape(range(event))}">${escape(event.label)}${event.rank?` · #${event.rank} ${escape(event.strength)}`:''}<small>${escape(range(event))}</small></button>`).join('')}</div>`];
  });
  return months.length?`<div class="calendar-year"><strong>${year}</strong><div class="calendar-months">${months.join('')}</div></div>`:'';
 }).join('');
 $('#life-event-key').innerHTML='<span class="calendar-legend past">● Past candidate</span><span class="calendar-legend future">● Future candidate</span><span class="calendar-legend future">● Ranked life window</span>';
}

function render(){
 $('#life-count-title').textContent=`Your timeline · ${report.events.length} past candidates, ${futureReport?.events.length||0} future turning points, ${windowsReport?.events.length||0} ranked life windows.`;
 $('#life-note').textContent=`${isExample?'Example profile · ':''}Major past and next-ten-year candidates in one calendar. Dates are approximate windows, not exact event days.`;
 $('#life-shortfall').textContent=report.events.length<10?'The top ten distinct claims are shown when available. Exploratory entries have weaker support; mark them as misses if they did not happen.':'';
 $('#life-cards').innerHTML=report.events.map((e,i)=>`<article class="life-card ${selected===e.id?'selected':''}" id="life-card-${e.id}" data-card="${e.id}" ${selected===e.id?'':'hidden'}><div class="life-card-top"><span class="event-number">${String(i+1).padStart(2,'0')}</span><span class="eyebrow">${escape(e.label)} · AGE ${e.age}</span><span class="review-badge" data-badge="${e.id}">${states[status(e)]||'Not reviewed'}</span></div><p class="life-date">${escape(range(e))} · ${e.tier==='stronger'?'Stronger Tajika match':'Exploratory Tajika match'}</p><p class="kp-status">KP timing (partial): ${e.kp.status==='supports'?'supports this event type':e.kp.status==='mixed'?'mixed':'no support'} · ${e.kp.period.maha}/${e.kp.period.bhukti}</p><h3>${escape(e.title)}</h3><p>${escape(e.detail)}</p><div class="match-definition"><strong>Match criteria</strong><p>${escape(e.check)} The event must fall inside the dates above.</p></div><fieldset class="review-options"><legend>Did this happen?</legend>${Object.entries(states).map(([value,label])=>`<button type="button" data-verdict="${value}" data-id="${e.id}" aria-pressed="${status(e)===value}">${label}</button>`).join('')}<button type="button" data-clear="${e.id}" class="clear-review">Clear</button></fieldset><label class="event-note-label">What actually happened? <span>optional, kept in this tab</span><textarea data-note="${e.id}" maxlength="1000" rows="2" placeholder="Event, approximate date, and what matched or did not match">${escape(reviews[e.id]?.note||'')}</textarea></label></article>`).join('');
 const futureEvent=[...(futureReport?.events||[]),...(windowsReport?.events||[])].find(e=>e.id===selected);
 if(futureEvent)renderFuture(futureEvent);
 else $('#future-detail').hidden=true;
 $('#timeline-prompt').hidden=selected!==null;
 renderHeadlines();updateSummary();drawCalendar();
}
function renderHeadlines(){
 if(!futureReport)return;
 $('#forecast-range').textContent=`${date(futureReport.from)} – ${date(new Date(+futureReport.to-1))}`;
 $('#reading-note').textContent=`${isExample?'Example profile · ':''}Selected major turning points, not a monthly forecast. Astrological hypotheses, not established facts.`;
 $('#headlines').innerHTML=futureReport.headlines.length?futureReport.headlines.map((event,i)=>`<article class="headline"><span class="headline-number">${String(i+1).padStart(2,'0')}</span><div><div class="headline-meta"><span class="${event.kind==='watch'?'watch-tag':'good-tag'}">${event.kind==='watch'?'WATCH OUT':'GOOD THINGS'}</span><span>${escape(event.label)}</span></div><h3>${escape(event.title)}</h3><p>${escape(event.detail)}</p><p class="kp-status">KP timing (partial): ${escape(event.kp.status)}</p></div><span class="headline-date">${escape(range(event))}</span></article>`).join(''):'<p class="empty">No major turning point cleared the current signal threshold. The ten-year span is still shown below.</p>';
}
function renderFuture(event){
 const detail=$('#future-detail');detail.hidden=false;
 detail.innerHTML=`<article class="month-card"><div class="month-top"><span class="eyebrow">${escape(event.label)} · ${event.rank?`#${event.rank} · ${escape(event.strength)} relative signal`:event.tier==='stronger'?'Stronger Tajika match':'Exploratory Tajika match'}</span></div><h3>${escape(event.title)}</h3><p class="month-date">${escape(range(event))}</p><p>${escape(event.detail)}</p><p class="kp-status">KP timing (partial): ${event.kp.status==='supports'?'supports this event type':event.kp.status==='mixed'?'mixed':'no supporting period'} · ${escape(event.kp.period.maha)}/${escape(event.kp.period.bhukti)}</p><div class="match-definition"><strong>What this would mean</strong><p>${escape(event.check||'This is a relative astrological window, not a confirmed outcome or exact date.')}</p></div></article>`;
}
function revealSelection(target){
 $('#timeline-prompt').hidden=true;
 document.querySelectorAll('[data-card]').forEach(el=>{el.hidden=el.dataset.card!==selected;el.classList.toggle('selected',el.dataset.card===selected);});
 if(target==='past')$('#future-detail').hidden=true;
 drawCalendar();
 const detail=target==='past'?document.getElementById('life-card-'+selected):$('#future-detail');
 if(matchMedia('(max-width:760px)').matches){openDrawer(detail,target);return;}
 detail.setAttribute('tabindex','-1');detail.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});detail.focus({preventScroll:true});
}
function openDrawer(detail,target){
 const dialog=$('#mobile-detail');
 clearTimeout(drawerTimer);
 if(!dialog.open){drawerScroll=window.scrollY;dialog.showModal();}
 $('#drawer-title').textContent=target==='past'?'Past prediction':'Future turning point';
 const article=detail.matches('article')?detail:detail.querySelector('article');
 if(!article)return;
 $('#drawer-content').replaceChildren(article.cloneNode(true));
 requestAnimationFrame(()=>dialog.classList.add('is-visible'));
 $('#drawer-close').focus({preventScroll:true});
}
function closeDrawer(immediate=false){
 const dialog=$('#mobile-detail');if(!dialog.open)return;
 clearTimeout(drawerTimer);dialog.classList.remove('is-visible');
 const finish=()=>{dialog.close();$('#drawer-content').replaceChildren();if(!immediate){
  const opener=document.querySelector(`[data-future="${selected}"], [data-event="${selected}"]`);
  opener?.focus({preventScroll:true});window.scrollTo({top:drawerScroll,behavior:'instant'});
 }};
 if(immediate||matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
 else drawerTimer=setTimeout(finish,240);
}
$('#drawer-close').addEventListener('click',()=>closeDrawer());
$('#mobile-detail').addEventListener('cancel',e=>{e.preventDefault();closeDrawer();});
$('#mobile-detail').addEventListener('click',e=>{if(e.target.id==='mobile-detail')closeDrawer();});
matchMedia('(max-width:760px)').addEventListener('change',e=>{if(!e.matches)closeDrawer(true);});
function choose(id){selected=id;revealSelection('past');}
function chooseFuture(id){const event=[...(futureReport?.events||[]),...(windowsReport?.events||[])].find(e=>e.id===id);if(!event)return;selected=id;renderFuture(event);revealSelection('future');}
$('#life-timeline').addEventListener('click',e=>{const past=e.target.closest('[data-event]'),future=e.target.closest('[data-future]');if(past)choose(past.dataset.event);else if(future)chooseFuture(future.dataset.future);});
function reviewClick(e){
 const button=e.target.closest('[data-verdict],[data-clear]');if(!button)return;
 const id=button.dataset.id||button.dataset.clear,existing=reviews[id]||{};
 const verdict=button.dataset.verdict;
 reviews[id]={...existing,verdict};
 document.querySelectorAll(`[data-card="${id}"]`).forEach(card=>{
  card.querySelectorAll('[data-verdict]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.verdict===verdict)));
  card.querySelector('[data-badge]').textContent=states[verdict]||'Not reviewed';
 });
 selected=id;updateSummary();drawCalendar();document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('selected',el.dataset.card===id));
}
function reviewInput(e){if(!e.target.matches('[data-note]'))return;const id=e.target.dataset.note;reviews[id]={...reviews[id],note:e.target.value};document.querySelectorAll(`[data-note="${id}"]`).forEach(note=>{if(note!==e.target)note.value=e.target.value;});}
for(const container of [$('#life-cards'),$('#drawer-content')]){container.addEventListener('click',reviewClick);container.addEventListener('input',reviewInput);}
$('#life-export').addEventListener('click',()=>{if(!report)return;const output={...report,exportedAt:new Date().toISOString(),reviews,summary:reviewSummary(report.events,reviews)};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vedik-life-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

$('#audit-download').addEventListener('click',()=>{if(!futureReport)return;const url=URL.createObjectURL(new Blob([JSON.stringify(futureReport,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vedik-ten-year-calculations.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
