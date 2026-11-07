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
function drawTimeline(){
 if(!report.events.length){$('#life-timeline').innerHTML='<p class="empty">No qualifying events to plot. The engine does not have enough support for a major-event claim in this profile.</p>';$('#life-event-key').innerHTML='';return;}
 const width=Math.max(900,report.events.length*105+170),left=145,right=width-45;
 const start=+new Date(report.birth),end=+new Date(report.asOf),x=event=>left+(((+new Date(event.start)+ +new Date(event.end))/2-start)/(end-start))*(right-left);
 const rowY=event=>({forward:70,neutral:145,setback:220})[reviews[event.id]?.impact]??315;
 // Stagger points inside each categorical band so adjacent years remain clickable.
 const y=event=>rowY(event)+(report.events.indexOf(event)%2?17:-17);
 const labels=[['Step forward',70],['No major change',145],['Setback',220],['Not rated',315]];
 const ticks=Array.from({length:6},(_,i)=>{const t=start+(end-start)*i/5;return {x:left+(right-left)*i/5,label:new Date(t).getUTCFullYear()};});
 const paths=report.events.slice(1).map((e,i)=>{const prev=report.events[i];return reviews[e.id]?.impact&&reviews[prev.id]?.impact?`<line x1="${x(prev)}" y1="${y(prev)}" x2="${x(e)}" y2="${y(e)}" stroke="#b8bfa7" stroke-width="2"/>`:'';}).join('');
 const marks=report.events.map((e,i)=>{const cx=x(e),cy=y(e),verdict=status(e),color=verdict==='match'?'#3c684a':verdict==='miss'?'#b45732':verdict==='unsure'?'#a08039':'#7c8176';return `<g class="life-point ${selected===e.id?'selected':''}" data-event="${e.id}" role="button" tabindex="0" aria-label="Event ${i+1}, ${escape(e.title)}, ${escape(range(e))}, ${escape(states[verdict]||'Not reviewed')}"><title>${escape(e.title)} · ${escape(range(e))}</title><circle cx="${cx}" cy="${cy}" r="${selected===e.id?21:17}" fill="#fbfaf5" stroke="${color}" stroke-width="${selected===e.id?3:2}"/><text x="${cx}" y="${cy+4}" text-anchor="middle" fill="${color}" font-size="12">${i+1}</text><text x="${cx}" y="${cy+(i%2?-30:38)}" text-anchor="middle" fill="#72796b" font-size="10">Age ${e.age}</text></g>`;}).join('');
 $('#life-event-key').innerHTML=report.events.map((e,i)=>`<button type="button" data-jump="${e.id}"><span>${String(i+1).padStart(2,'0')}</span> ${new Date(e.start).getUTCFullYear()} · ${escape(e.label)}</button>`).join('');
 $('#life-timeline').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 390" style="min-width:${width}px" role="group" aria-label="Life event timeline from birth to today. Vertical positions show your own impact ratings, not astrological scores.">${labels.map(([label,cy])=>`<text x="0" y="${cy+4}" fill="#74796c" font-size="11">${label}</text><line x1="${left}" x2="${right}" y1="${cy}" y2="${cy}" stroke="#dcded1" stroke-dasharray="${cy===315?'3 5':'0'}"/>`).join('')}${ticks.map(t=>`<line x1="${t.x}" x2="${t.x}" y1="45" y2="335" stroke="#e9e7dc"/><text x="${t.x}" y="365" text-anchor="middle" fill="#74796c" font-size="11">${t.label}</text>`).join('')}${paths}${marks}</svg>`;
}
function render(){
 $('#life-count-title').textContent=report.events.length?`${report.events.length} major turning-point candidates.`:'No major turning point clears the current rules.';
 $('#life-note').textContent=`${isExample?'Example profile · ':''}Birth to ${date(report.asOf)}. Only major highs and lows. These are unverified event candidates, not known facts.`;
 $('#life-shortfall').textContent=report.events.length<10?'No school milestones, routine raises, ordinary bills or everyday work pressure. Fewer than ten is intentional: no generic filler.':'';
 $('#life-cards').innerHTML=report.events.map((e,i)=>`<article class="life-card ${selected===e.id?'selected':''}" id="life-card-${e.id}" data-card="${e.id}"><div class="life-card-top"><span class="event-number">${String(i+1).padStart(2,'0')}</span><span class="eyebrow">${escape(e.label)} · AGE ${e.age}</span><span class="review-badge" data-badge="${e.id}">${states[status(e)]||'Not reviewed'}</span></div><p class="life-date">${escape(range(e))}</p><h3>${escape(e.title)}</h3><p>${escape(e.detail)}</p><div class="match-definition"><strong>Strict match criteria</strong><p>${escape(e.check)} The event must fall inside the dates above.</p></div><fieldset class="review-options"><legend>Did this happen?</legend>${Object.entries(states).map(([value,label])=>`<button type="button" data-verdict="${value}" data-id="${e.id}" aria-pressed="${status(e)===value}">${label}</button>`).join('')}<button type="button" data-clear="${e.id}" class="clear-review">Clear</button></fieldset><label class="impact-label">What was its impact on your life?<select data-impact="${e.id}" ${status(e)!=='match'?'disabled':''}><option value="">Not rated</option><option value="forward">Step forward</option><option value="neutral">No major change</option><option value="setback">Setback</option></select></label><label class="event-note-label">What actually happened? <span>optional, kept in this tab</span><textarea data-note="${e.id}" maxlength="1000" rows="2" placeholder="Event, approximate date, and what matched or did not match">${escape(reviews[e.id]?.note||'')}</textarea></label></article>`).join('');
 for(const e of report.events){const select=document.querySelector(`[data-impact="${e.id}"]`);select.value=reviews[e.id]?.impact||'';}
 updateSummary();drawTimeline();
}
function choose(id,scroll=true){selected=id;document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('selected',el.dataset.card===id));drawTimeline();if(scroll){const card=document.getElementById('life-card-'+id);card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});card.setAttribute('tabindex','-1');card.focus({preventScroll:true});}}
$('#life-event-key').addEventListener('click',e=>{const button=e.target.closest('[data-jump]');if(button)choose(button.dataset.jump);});
$('#life-timeline').addEventListener('click',e=>{const point=e.target.closest('[data-event]');if(point)choose(point.dataset.event);});
$('#life-timeline').addEventListener('keydown',e=>{const point=e.target.closest('[data-event]');if(point&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose(point.dataset.event);}});
$('#life-cards').addEventListener('click',e=>{
 const button=e.target.closest('[data-verdict],[data-clear]');if(!button)return;
 const id=button.dataset.id||button.dataset.clear,existing=reviews[id]||{};
 const verdict=button.dataset.verdict;
 reviews[id]={...existing,verdict,impact:verdict==='match'?existing.impact:undefined};
 const card=document.querySelector(`[data-card="${id}"]`);
 card.querySelectorAll('[data-verdict]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.verdict===verdict)));
 card.querySelector('[data-badge]').textContent=states[verdict]||'Not reviewed';
 const impact=card.querySelector('[data-impact]');impact.disabled=verdict!=='match';impact.value=reviews[id].impact||'';
 selected=id;updateSummary();drawTimeline();document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('selected',el.dataset.card===id));
});
$('#life-cards').addEventListener('change',e=>{if(!e.target.matches('[data-impact]'))return;const id=e.target.dataset.impact;if(reviews[id]?.verdict!=='match')return;reviews[id].impact=e.target.value||undefined;drawTimeline();});
$('#life-cards').addEventListener('input',e=>{if(!e.target.matches('[data-note]'))return;const id=e.target.dataset.note;reviews[id]={...reviews[id],note:e.target.value};});
$('#life-export').addEventListener('click',()=>{if(!report)return;const output={...report,exportedAt:new Date().toISOString(),reviews,summary:reviewSummary(report.events,reviews)};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vedik-life-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
