export const PROFILE_KEY='vedik-profiles-v2';
export const LEGACY_KEY='vedik-saved-birth-profile-v1';
const fields=['name','date','time','city','lat','lon','offset','returnLocation','returnLat','returnLon'];
export function readProfiles(storage){
 try{
  const saved=JSON.parse(storage.getItem(PROFILE_KEY));
  if(saved&&typeof saved==='object'&&!Array.isArray(saved))return Object.fromEntries(Object.entries(saved).filter(([name,p])=>name.length<=60&&p&&typeof p==='object'&&p.date&&p.time));
  const legacy=JSON.parse(storage.getItem(LEGACY_KEY));
  if(legacy?.date&&legacy?.time){const migrated={'My profile':legacy};storage.setItem(PROFILE_KEY,JSON.stringify(migrated));return migrated;}
 }catch{}
 return {};
}
export function captureProfile(form){return Object.fromEntries(fields.map(k=>[k,form.elements[k]?.value||'']));}
export function saveProfile(storage,name,profile){
 const label=name.trim().slice(0,60);if(!label)throw Error('Give this profile a name.');
 const profiles=readProfiles(storage);profiles[label]=profile;storage.setItem(PROFILE_KEY,JSON.stringify(profiles));return profiles;
}
export function deleteProfile(storage,name){const profiles=readProfiles(storage);delete profiles[name];storage.setItem(PROFILE_KEY,JSON.stringify(profiles));return profiles;}
