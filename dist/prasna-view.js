import {SIGNS} from './engine.js';
import {northIndianChart} from './kundali-chart.js';
import {places} from './locations.js';
import {lostItemReading} from './prasna.js';

const $=selector=>document.querySelector(selector);
const form=$('#prasna-form');
const city=form.elements.city;
const timing=form.elements.timing;

for(const [key,name,state] of places){
 city.add(new Option(`${name}, ${state}, India`,key),city.options[city.options.length-1]);
}

function showFields(){
 const custom=city.value==='custom';
 const earlier=timing.value==='earlier';
 const coordinates=$('#question-coordinates');
 const dateTime=$('#question-time');
 coordinates.hidden=coordinates.disabled=!custom;
 dateTime.hidden=dateTime.disabled=!earlier;
 $('#question-offset').hidden=form.elements.offset.disabled=!custom;
 $('#question-ist').hidden=custom;
}
city.addEventListener('change',showFields);
timing.addEventListener('change',showFields);
showFields();

function showChecklist(steps){
 $('#prasna-checklist').replaceChildren(...steps.map(step=>{
  const item=document.createElement('li');
  const label=document.createElement('label');
  const checkbox=document.createElement('input');
  checkbox.type='checkbox';
  label.append(checkbox,step);
  item.append(label);
  return item;
 }));
}

form.addEventListener('submit',event=>{
 event.preventDefault();
 const fields=Object.fromEntries(new FormData(form));
 const place=places.find(([key])=>key===fields.city);
 const location=place ? {lat:place[3],lon:place[4],offset:5.5}
  : {lat:fields.lat,lon:fields.lon,offset:fields.offset};
 try{
  const {chart,instant,clue,steps}=lostItemReading({...fields,...location},window.Astronomy);
  const placeLabel=place ? place[1]+`, ${place[2]}` : `${location.lat}°, ${location.lon}°`;
  const questionTime=new Intl.DateTimeFormat('en-IN',{
   dateStyle:'medium',
   timeStyle:'short',
   timeZone:place?'Asia/Kolkata':'UTC'
  }).format(instant);
  $('#prasna-result-title').textContent=fields.name.trim();
  $('#prasna-clue').textContent=clue.title;
  $('#prasna-clue-detail').textContent=clue.detail;
  showChecklist(steps);
  $('#prasna-context').textContent=`${placeLabel} · ${questionTime} ${place?'IST':'UTC'} · ${SIGNS[chart.ascSign]} rising`;
  $('#prasna-chart').innerHTML=northIndianChart(chart,{
   title:'North Indian Prasna Kundali',
   label:'North Indian question chart with the clue planet’s house highlighted.',
   selected:[clue.ruler.house]
  });
  $('#prasna-placement').textContent=`Moon in ${clue.moonSign}. Highlighted: ${clue.ruler.name} in ${clue.sign}, house ${clue.ruler.house}.`;
  $('#prasna-error').textContent='';
  $('#prasna-placeholder').hidden=true;
  $('#prasna-result').hidden=false;
  $('#prasna-result-title').focus();
 }catch(error){
  $('#prasna-error').textContent=error.message;
 }
});
