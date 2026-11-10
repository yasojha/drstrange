import './vendor/astronomy.js';
import {buildLifeHistory} from './history.js';
import {buildLongTermForecast} from './long-term.js';
self.onmessage=({data})=>{
 try{const report=buildLifeHistory(data.input,self.Astronomy,{asOf:new Date(data.asOf),onProgress:p=>self.postMessage({type:'progress',...p})});const future=buildLongTermForecast(data.input,self.Astronomy,{start:new Date(data.forecastStart),location:data.location,onProgress:p=>self.postMessage({type:'future-progress',...p})});self.postMessage({type:'complete',report,future});}
 catch(error){self.postMessage({type:'error',message:error.message});}
};
