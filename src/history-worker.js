import './vendor/astronomy.js';
import {buildLifeHistory} from './history.js';
import {buildLongTermForecast} from './long-term.js';
import {buildLifeWindows} from './windows.js';
self.onmessage=({data})=>{
 try{const report=buildLifeHistory(data.input,self.Astronomy,{asOf:new Date(data.asOf),onProgress:p=>self.postMessage({type:'progress',...p})});const future=buildLongTermForecast(data.input,self.Astronomy,{start:new Date(data.forecastStart),location:data.location,onProgress:p=>self.postMessage({type:'future-progress',...p})});const windows=buildLifeWindows(data.input,self.Astronomy,{asOf:new Date(data.asOf),location:data.location,onProgress:p=>self.postMessage({type:'window-progress',...p})});self.postMessage({type:'complete',report,future,windows});}
 catch(error){self.postMessage({type:'error',message:error.message});}
};
