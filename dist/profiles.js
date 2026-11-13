export const PROFILE_KEY='vedik-profiles-v2';
export const LEGACY_KEY='vedik-saved-birth-profile-v1';
const fields=['name','gender','date','time','city','lat','lon','offset','returnLocation','returnLat','returnLon'];
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

// The owner-private Site may supply its own asset. Public source has no presets.
export async function readPresetProfiles(fetchAsset = fetch) {
 try {
  const response = await fetchAsset(new URL('./private-presets.json', import.meta.url));
  if (!response.ok) return {};
  const presets = await response.json();
  if (!presets || typeof presets !== 'object' || Array.isArray(presets)) return {};
  return Object.fromEntries(Object.entries(presets).filter(([name, profile]) =>
   name && typeof profile?.date === 'string' && typeof profile?.time === 'string'));
 } catch {
  return {};
 }
}
