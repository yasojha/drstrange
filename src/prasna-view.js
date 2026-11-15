import './vendor/astronomy.js';
import {SIGNS} from './engine.js';
import {northIndianChart} from './kundali-chart.ts';
import {places} from './locations.js';
import {lostItemReading} from './prasna.js';
import {questionTypes,topicQuestionReading} from './prasna-questions.js';

const $=selector=>document.querySelector(selector);
const form=$('#prasna-form');
const type=form.elements.type;
const city=form.elements.city;
const timing=form.elements.timing;
const locationButton=$('#prasna-use-location');
const locationStatus=$('#prasna-location-status');
let locationRequest=0;

for(const [key,rule] of Object.entries(questionTypes)){
 type.add(new Option(rule.label,key));
}

for(const [key,name,state] of places){
 city.add(new Option(`${name}, ${state}, India`,key),city.options[city.options.length-1]);
}

function showQuestionFields(){
 const lost=type.value==='lost';
 const lostFields=$('#prasna-lost-fields');
 const topicFields=$('#prasna-topic-fields');
 lostFields.hidden=lostFields.disabled=!lost;
 topicFields.hidden=topicFields.disabled=lost;
 if(!lost)form.elements.question.placeholder=questionTypes[type.value].example;
}
type.addEventListener('change',()=>{
 showQuestionFields();
 $('#prasna-error').textContent='';
 $('#prasna-result').hidden=true;
 $('#prasna-placeholder').hidden=false;
});
showQuestionFields();

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
function clearLocationRequest(){
 locationRequest++;
 locationButton.disabled=false;
 locationStatus.textContent='';
}
city.addEventListener('change',()=>{
 clearLocationRequest();
 showFields();
});
timing.addEventListener('change',showFields);
for(const field of [form.elements.lat,form.elements.lon])field.addEventListener('input',clearLocationRequest);
showFields();

locationButton.addEventListener('click',()=>{
 const fallback='Choose a city or enter coordinates.';
 if(!navigator.geolocation){
  locationStatus.textContent=`Location is unavailable in this browser. ${fallback}`;
  return;
 }
 const request=++locationRequest;
 locationButton.disabled=true;
 locationStatus.textContent='Getting your current location…';
 navigator.geolocation.getCurrentPosition(({coords})=>{
  if(request!==locationRequest)return;
  locationButton.disabled=false;
  if(Math.abs(coords.latitude)>65){
   locationStatus.textContent='The chart supports locations between 65° south and 65° north.';
   return;
  }
  city.value='custom';
  form.elements.lat.value=coords.latitude.toFixed(6);
  form.elements.lon.value=coords.longitude.toFixed(6);
  timing.value='now';
  showFields();
  locationStatus.textContent='Current location selected.';
 },error=>{
  if(request!==locationRequest)return;
  locationButton.disabled=false;
  const message=error.code===1?'Location permission was denied.':'Could not get your location.';
  locationStatus.textContent=`${message} ${fallback}`;
 },{timeout:15000,maximumAge:0});
});

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

function showLostResult(reading,fields){
 const {clue,assessment}=reading;
 const rows=[
  ['Misplaced or taken?',assessment.status],
  ['If taken, what kind of access?',assessment.access],
  ['Home or elsewhere?',assessment.area],
  ['Will it turn up?',assessment.recovery]
 ];
 $('#prasna-loss-summary').replaceChildren(...rows.filter(([,entry])=>entry).map(([label,entry])=>{
  const row=document.createElement('div');
  const term=document.createElement('dt');
  const definition=document.createElement('dd');
  const headline=document.createElement('strong');
  const detail=document.createElement('p');
  term.textContent=label;
  headline.textContent=entry.title;
  detail.textContent=entry.detail;
  definition.append(headline,detail);
  row.append(term,definition);
  return row;
 }));
 $('#prasna-result-label').textContent='LOST ITEM READING';
 $('#prasna-result-title').textContent=fields.name.trim();
 $('#prasna-clue').textContent=clue.title;
 $('#prasna-clue-detail').textContent=clue.detail;
 $('#prasna-reading-note').textContent='These are symbolic clues. Use what you can verify to decide where to search.';
 $('#prasna-placement').textContent=`Moon in ${clue.moonSign}. Highlighted: ${clue.ruler.name} in ${clue.sign}, house ${clue.ruler.house}.`;
 showChecklist(reading.steps);
 return [clue.ruler.house];
}

function showTopicResult(reading,type){
 $('#prasna-result-label').textContent=questionTypes[type].label;
 $('#prasna-result-title').textContent=reading.text;
 $('#prasna-clue').textContent=reading.headline;
 $('#prasna-clue-detail').textContent=reading.reason;
 $('#prasna-reading-note').textContent='Traditional interpretation. The chart can’t verify the outcome or promise a date.';
 $('#prasna-action').textContent=reading.next;
 $('#prasna-placement').textContent=`Houses with the main planets checked: ${reading.selected.join(', ')}.`;
 $('#prasna-evidence').replaceChildren(...reading.evidence.map((entry,i)=>{
  const item=document.createElement('li');
  item.textContent=`${i===0?'Main check':'Supporting check'} · ${entry}`;
  return item;
 }));
 return reading.selected;
}

form.addEventListener('submit',event=>{
 event.preventDefault();
 const fields=Object.fromEntries(new FormData(form));
 const place=places.find(([key])=>key===fields.city);
 const location=place ? {lat:place[3],lon:place[4],offset:5.5}
  : {lat:fields.lat,lon:fields.lon,offset:fields.offset};
 try{
  const lost=fields.type==='lost';
  const read=lost?lostItemReading:topicQuestionReading;
  const reading=read({...fields,...location},window.Astronomy);
  const {chart,instant}=reading;
  const selected=lost?showLostResult(reading,fields):showTopicResult(reading,fields.type);
  $('#prasna-loss-summary').hidden=!lost;
  $('#prasna-search-steps').hidden=!lost;
  $('#prasna-next-step').hidden=lost;
  $('#prasna-lost-method').hidden=!lost;
  $('#prasna-topic-method').hidden=lost;
  const placeLabel=place ? place[1]+`, ${place[2]}` : `${location.lat}°, ${location.lon}°`;
  const clock=place ? {zone:'Asia/Kolkata',label:'IST'}
   : fields.timing==='now' ? {zone:undefined,label:'device time'} : {zone:'UTC',label:'UTC'};
  const questionTime=new Intl.DateTimeFormat('en-IN',{
   dateStyle:'medium',timeStyle:'short',timeZone:clock.zone
  }).format(instant);
  $('#prasna-context').textContent=`${placeLabel} · ${questionTime} ${clock.label} · ${SIGNS[chart.ascSign]} rising`;
  $('#prasna-chart').innerHTML=northIndianChart(chart,{
   title:'North Indian Prasna Kundali',
   label:'North Indian question chart with the main placements highlighted.',
   selected
  });
  $('#prasna-error').textContent='';
  $('#prasna-placeholder').hidden=true;
  $('#prasna-result').hidden=false;
  $('#prasna-result-title').focus();
 }catch(error){
  $('#prasna-error').textContent=error.message;
 }
});
