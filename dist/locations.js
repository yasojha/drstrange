import {readProfiles,captureProfile,saveProfile,deleteProfile,readPresetProfiles} from './profiles.js';
// Coordinates are city centres, not hospital-level positions.
export const places = [
 ['Delhi','New Delhi','Delhi',28.6139,77.209],
 ['Bikaner','Bikaner','Rajasthan',28.0229,73.3119],
 ['Jaipur','Jaipur','Rajasthan',26.9124,75.7873],
 ['Jodhpur','Jodhpur','Rajasthan',26.2389,73.0243],
 ['Udaipur','Udaipur','Rajasthan',24.5854,73.7125],
 ['Ajmer','Ajmer','Rajasthan',26.4499,74.6399],
 ['Mumbai','Mumbai','Maharashtra',19.076,72.8777],
 ['Pune','Pune','Maharashtra',18.5204,73.8567],
 ['Bengaluru','Bengaluru','Karnataka',12.9716,77.5946],
 ['Kolkata','Kolkata','West Bengal',22.5726,88.3639],
 ['Chennai','Chennai','Tamil Nadu',13.0827,80.2707],
 ['Hyderabad','Hyderabad','Telangana',17.385,78.4867],
 ['Ahmedabad','Ahmedabad','Gujarat',23.0225,72.5714],
 ['Lucknow','Lucknow','Uttar Pradesh',26.8467,80.9462],
 ['Noida','Noida','Uttar Pradesh',28.5355,77.391],
 ['Gurugram','Gurugram','Haryana',28.4595,77.0266],
 ['Chandigarh','Chandigarh','Chandigarh',30.7333,76.7794],
 ['Bhopal','Bhopal','Madhya Pradesh',23.2599,77.4126],
 ['Patna','Patna','Bihar',25.5941,85.1376],
 ['Kochi','Kochi','Kerala',9.9312,76.2673]
];
export function setupLocations(form, onProfileSelected) {
 const $=s=>document.querySelector(s), city=$('#city'), state=$('#birth-state'), status=$('#location-status');
 for(const name of [...new Set(places.map(p=>p[2]))].sort()) state.add(new Option(name,name));
 function render(preferred='') {
  city.replaceChildren();
  for(const p of places.filter(p=>!state.value||p[2]===state.value)) city.add(new Option(`${p[1]}, ${p[2]}, India`,p[0]));
  city.add(new Option('Other place / enter coordinates','custom'));
  if(preferred&&[...city.options].some(o=>o.value===preferred))city.value=preferred;
 }
 function select() {
  const p=places.find(p=>p[0]===city.value);
  if(p){form.elements.lat.value=p[3];form.elements.lon.value=p[4];form.elements.offset.value=5.5;status.textContent=`${p[1]}, ${p[2]}, India · City centre coordinates selected.`;}
  else {$('#location-details').open=true;status.textContent='Enter the birthplace coordinates and its UTC offset on the birth date.';}
 }
 render('Delhi');
 state.addEventListener('change',()=>{render();select();});
 city.addEventListener('change',select);
 for(const key of ['lat','lon'])form.elements[key].addEventListener('input',()=>{city.value='custom';status.textContent='Custom birthplace coordinates. Check the UTC offset at birth.';});
 const selector=$('#profile-select'),profileName=$('#profile-name');
 const details=$('#birth-details'), editButton=$('#edit-birth-details');
 const deleteButton=$('#delete-profile'), locationButton=$('#use-current-location');
 let locationRequest=0;
 let presets={}, saved={};
 function refresh(preferred=selector.value) {
  try { saved=readProfiles(localStorage); } catch { saved={}; }
  selector.replaceChildren(new Option('Enter details manually',''));
  for(const [source, profiles, label] of [['preset',presets,'Built-in profiles'],['saved',saved,'Saved on this browser']]){
   const names=Object.keys(profiles).sort((a,b)=>a.localeCompare(b));
   if(!names.length)continue;
   const group=document.createElement('optgroup');
   group.label=label;
   for(const name of names)group.append(new Option(name,source+':'+name));
   selector.append(group);
  }
  if([...selector.options].some(option=>option.value===preferred))selector.value=preferred;
  updateProfileButtons();
 }
 function updateProfileButtons(){
  deleteButton.disabled=!selector.value.startsWith('saved:');
 }
 selector.addEventListener('change',applySelectedProfile);
 editButton.addEventListener('click',()=>{
  selector.value='';
  applySelectedProfile();
  form.elements.name.focus();
 });
 refresh();
 readPresetProfiles().then(profiles=>{presets=profiles;refresh();});
 $('#save-my-details').addEventListener('click',()=>{
  if(!form.reportValidity())return;
  const name=profileName.value.trim()||form.elements.name.value.trim()||selector.selectedOptions[0]?.textContent;
  if(!name||!profileName.value.trim()&&!form.elements.name.value.trim()&&!selector.value){
   status.textContent='Give this profile a name.';
   return;
  }
  try{saveProfile(localStorage,name,captureProfile(form));refresh('saved:'+name);profileName.value=name;lockDetails(true);status.textContent=`Saved “${name}” on this device.`;}
  catch{status.textContent='Could not save this profile. Check browser storage settings.';}
 });
 function lockDetails(locked){
  details.disabled=locked;
  editButton.hidden=!locked;
 }
 function applySelectedProfile(){
  ++locationRequest;
  locationButton.disabled=false;
  lockDetails(false);
  updateProfileButtons();
  if(!selector.value){
   status.textContent='You can edit the birth details below.';
   return;
  }
  const source=selector.value.startsWith('preset:')?presets:saved;
  const name=selector.value.slice(selector.value.indexOf(':')+1);
  if(!Object.hasOwn(source,name))return;
  const profile=source[name];
  const place=places.find(p=>p[0]===profile.city);
  state.value=place?.[2]||'';render(place?.[0]||'custom');
  for(const key of ['name','gender','date','time','returnLat','returnLon'])form.elements[key].value=profile[key]??'';
  form.elements.lat.value=profile.lat??place?.[3]??'';
  form.elements.lon.value=profile.lon??place?.[4]??'';
  form.elements.offset.value=profile.offset??(place?5.5:'');
  form.elements.returnLocation.value=profile.returnLocation==='custom'?'custom':'birth';
  $('#return-location').dispatchEvent(new Event('change'));
  $('#location-details').open=!place;
  profileName.value=name;
  if([...details.elements].some(control=>control.validity&&!control.validity.valid)){
   status.textContent=`Loaded “${name}”. Complete the birth details below.`;
   return;
  }
  lockDetails(true);
  status.textContent=`Loaded “${name}”. Birth details are locked.`;
  onProfileSelected();
 }
 deleteButton.addEventListener('click',()=>{
  if(!selector.value.startsWith('saved:'))return;
  const name=selector.value.slice('saved:'.length);
  try{deleteProfile(localStorage,name);refresh('');profileName.value='';lockDetails(false);status.textContent=`Deleted “${name}” from this device.`;}
  catch{status.textContent='Could not delete this profile. Check browser storage settings.';}
 });
 locationButton.addEventListener('click',()=>{
  if(!navigator.geolocation){status.textContent='Location is unavailable in this browser. Select a city or enter coordinates.';return;}
  const request=++locationRequest;locationButton.disabled=true;status.textContent='Waiting for your location permission…';
  navigator.geolocation.getCurrentPosition(position=>{
   if(request!==locationRequest)return;
   locationButton.disabled=false;
   const {latitude,longitude,accuracy}=position.coords;
   if(Math.abs(latitude)>65){status.textContent='This chart engine supports latitudes from 65° south to 65° north. Your location is outside that range.';return;}
   state.value='';render('custom');form.elements.lat.value=latitude.toFixed(6);form.elements.lon.value=longitude.toFixed(6);$('#location-details').open=true;
   status.textContent=`Current position selected (approximately ${Math.round(accuracy)} m accuracy). Use it only if this is your birthplace. Check the UTC offset at birth; GPS does not provide historical time zones.`;
  },error=>{if(request!==locationRequest)return;locationButton.disabled=false;status.textContent=error.code===1?'Location permission was denied. Select a city or enter coordinates instead.':'Could not get your location. Select a city or enter coordinates instead.';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
 });
}
