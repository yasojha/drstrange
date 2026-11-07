import './vendor/astronomy.js';
import {buildLifeHistory} from './history.js';
self.onmessage=({data})=>{
 try{const report=buildLifeHistory(data.input,self.Astronomy,{asOf:new Date(data.asOf),onProgress:p=>self.postMessage({type:'progress',...p})});self.postMessage({type:'complete',report});}
 catch(error){self.postMessage({type:'error',message:error.message});}
};
