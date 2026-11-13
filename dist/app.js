import {setupLocations} from './locations.js';
import {captureProfile} from './profiles.js';
import {calculate,SIGNS} from './engine.js';
import {startLifeHistory} from './history-view.js';
import {renderFamilyCheck} from './family-view.js';
const $=s=>document.querySelector(s),form=$('#birth-form');
let chart,example=true,selected=1;
const now=new Date();$('#forecast-start').value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
const topics=['Self & identity','Values & resources','Courage & communication','Home & belonging','Creativity & learning','Work & routines','Partnerships','Change & depth','Beliefs & exploration','Work & contribution','Community & aspirations','Rest & inner life'];
const polygons=['220,20 320,120 220,220 120,120','20,20 220,20 120,120','20,20 120,120 20,220','20,220 120,120 220,220 120,320','20,220 120,320 20,420','20,420 120,320 220,420','220,220 320,320 220,420 120,320','220,420 320,320 420,420','420,420 320,320 420,220','220,220 320,120 420,220 320,320','420,220 320,120 420,20','420,20 320,120 220,20'];
const centers=[[220,120],[120,53],[55,120],[120,220],[55,320],[120,388],[220,320],[320,388],[385,320],[320,220],[385,120],[320,53]];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function drawChart(){
 const cells=polygons.map((points,i)=>{const [x,y]=centers[i],p=chart.planets.filter(p=>p.house===i+1),sign=(chart.ascSign+i)%12+1;const rows=[];for(let j=0;j<p.length;j+=3)rows.push(p.slice(j,j+3).map(p=>p.name.slice(0,2)).join(' · '));return `<g role="button" tabindex="0" data-house="${i+1}" aria-label="House ${i+1}: ${esc(topics[i])}, ${SIGNS[sign-1]}, ${p.map(p=>p.name).join(', ')||'no planets'}" class="${selected===i+1?'selected':''}"><polygon class="cell" points="${points}"/><text class="sign-label" text-anchor="middle" x="${x}" y="${y-16}">${sign}</text>${rows.map((row,j)=>`<text class="planet-label" text-anchor="middle" x="${x}" y="${y+3+j*14}">${row}</text>`).join('')}${i===0?`<text class="asc-label" text-anchor="middle" x="${x}" y="${y+45}">LAGNA</text>`:''}</g>`});
 $('#chart').innerHTML=`<svg class="kundali" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 440" role="group" aria-label="North Indian birth chart. Houses fixed, sign numbers change with ascendant."><title>North Indian kundali</title><rect x="12" y="12" width="416" height="416" rx="2" fill="none" stroke="#d6d1bb"/>${cells.join('')}</svg>`;
 document.querySelectorAll('[data-house]').forEach(el=>{const select=()=>{selected=Number(el.dataset.house);drawChart();showHouse();$('#chart').querySelector(`[data-house="${selected}"]`).focus({preventScroll:true});};el.addEventListener('click',select);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});});
}
function showHouse(){const p=chart.planets.filter(p=>p.house===selected);$('#house-detail').textContent=`House ${selected} · ${topics[selected-1]} · ${SIGNS[(chart.ascSign+selected-1)%12]}. ${p.length?p.map(p=>p.name).join(', '):'No planets here. An empty house does not mean this area of life is absent.'}`;}
function update(isExample){
 const input={...captureProfile(form),...Object.fromEntries(new FormData(form))};const next=calculate(input,window.Astronomy);const location=input.returnLocation==='custom'?{lat:input.returnLat,lon:input.returnLon}:{lat:input.lat,lon:input.lon};if(input.returnLocation==='custom'&&(!input.returnLat.trim()||!input.returnLon.trim()))throw Error('Enter your current coordinates.');const forecastStart=new Date(input.forecastStart+'T00:00:00Z');if(!Number.isFinite(+forecastStart)||forecastStart<next.date||forecastStart.getUTCFullYear()>2089)throw Error('Choose a forecast start after birth and before 2090.');chart=next;example=isExample;selected=1;
 $('#chart-title').textContent=isExample?'A moment, mapped.':input.name.trim()?`${input.name.trim()}’s kundali`:'Your moment, mapped.';
 const date=new Date(input.date+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 $('#chart-subtitle').textContent=`${isExample?'Example chart · ':''}${date}, ${input.time} · ${input.city==='custom'?`${input.lat}°, ${input.lon}°`:$('#city').selectedOptions[0].textContent}`;
 const moon=chart.planets.find(p=>p.name==='Moon');$('#chart-stats').innerHTML=[['RISING SIGN',SIGNS[chart.ascSign]],['MOON SIGN',SIGNS[moon.sign]],['BIRTH STAR',chart.nakshatra]].map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
 $('#planet-table').innerHTML=chart.planets.map(p=>`<tr><td>${p.name}</td><td>${SIGNS[p.sign]}</td><td>${p.degree.toFixed(2)}°</td><td>${p.house}</td></tr>`).join('');drawChart();showHouse();renderFamilyCheck(chart,JSON.stringify([isExample,input.name,chart.date,input.lat,input.lon]));startLifeHistory(input,isExample,location);
}
$('#return-location').addEventListener('change',()=>{const custom=$('#return-location').value==='custom';$('#return-coordinates').hidden=!custom;form.elements.returnLat.required=custom;form.elements.returnLon.required=custom;});
function calculateFromForm(scrollToChart=false){
 try{
  update(false);
  $('#form-error').textContent='';
  if(scrollToChart&&innerWidth<760)$('#chart-title').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){
  $('#form-error').textContent=error.message;
 }
}
form.addEventListener('submit',event=>{
 event.preventDefault();
 calculateFromForm(true);
});
setupLocations(form,()=>{
 if(form.reportValidity())calculateFromForm();
});
for(const id of ['about-open','method-open'])$('#'+id).addEventListener('click',()=>$('#about').showModal());$('#about-close').addEventListener('click',()=>$('#about').close());
$('#download').addEventListener('click',()=>{const svg=$('#chart svg').cloneNode(true);svg.querySelectorAll('[tabindex]').forEach(n=>n.removeAttribute('tabindex'));const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='.cell{fill:#faf8ef;stroke:#aaa88c;stroke-width:1.2}.sign-label{font:11px sans-serif;fill:#7f846f}.planet-label{font:600 12px sans-serif;fill:#3b503d}.asc-label{font:9px sans-serif;fill:#ae633f}';svg.prepend(style);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download='vedik-kundali.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{update(true);}catch(e){$('#form-error').textContent='The chart engine could not load. Please refresh the page.';console.error(e);}
