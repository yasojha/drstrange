import test from 'node:test';import assert from 'node:assert/strict';
import {readProfiles,saveProfile,deleteProfile,captureProfile,LEGACY_KEY} from '../dist/profiles.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('named profiles save, switch, overwrite and delete without mixing data',()=>{
 const storage=memory(),one={date:'1990-01-01',time:'12:00',city:'Delhi',lat:'28.61',lon:'77.2',offset:'5.5'},two={date:'1992-05-04',time:'09:20',city:'custom',lat:'12',lon:'74',offset:'5.5'};
 saveProfile(storage,'A',one);saveProfile(storage,'B',two);assert.deepEqual(readProfiles(storage),{A:one,B:two});
 saveProfile(storage,'A',{...one,time:'13:00'});assert.equal(readProfiles(storage).A.time,'13:00');assert.equal(readProfiles(storage).B.time,'09:20');
 deleteProfile(storage,'A');assert.deepEqual(readProfiles(storage),{B:two});
});
test('old single profile migrates on the same device',()=>{const storage=memory();storage.setItem(LEGACY_KEY,JSON.stringify({date:'1990-01-01',time:'12:00'}));assert.equal(readProfiles(storage)['My profile'].date,'1990-01-01');});
test('capture includes coordinates and return location',()=>{const form={elements:{date:{value:'2000-01-01'},time:{value:'08:00'},returnLocation:{value:'custom'},returnLat:{value:'40'},returnLon:{value:'-73'},lat:{value:'20'},lon:{value:'70'},offset:{value:'5.5'}}};const profile=captureProfile(form);assert.equal(profile.returnLocation,'custom');assert.equal(profile.returnLat,'40');assert.equal(profile.lon,'70');});
