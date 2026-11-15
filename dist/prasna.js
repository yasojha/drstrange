import {birthInstant,chartAt,SIGNS,wrap} from './engine.js';

export const rulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

// Everyday search prompts inspired by the sign imagery in Prasna Marga II, chapter 29.
const placesBySign=[
 ['An open spot near the way out','Check the shoe rack, bags near the door and open surfaces along the route you took.'],
 ['A low shelf or a spot near the floor','Check under a bench, next to a floor mat and in low storage baskets.'],
 ['A shared table or a place you set things down','Check the dining table, reception counter and desks used by more than one person.'],
 ['A spot near water','Check beside the kitchen or bathroom sink, near a water bottle and around the laundry area.'],
 ['A dark, recessed spot','Use a torch to check the back of a cupboard, under a seat and behind large furniture.'],
 ['A utility shelf or a cupboard near water','Check the laundry shelf, bathroom cabinet and any trays or organisers you handled.'],
 ['A shop counter or a stop along your route','Call the last shop or venue you visited and check the bag you carried there.'],
 ['A narrow gap or a hidden pocket','Check between cushions, under car seats and inside small zipped compartments.'],
 ['A place used for outdoor gear','Check the bag, shoe rack or storage shelf you use for outings, sports or the gym.'],
 ['A low spot near a wet area','Check around the utility floor, near a doormat or beside a bucket you used.'],
 ['Near a container or water jug','Check beside reusable bottles, storage bins and trays where small things collect.'],
 ['Near a tap, tank or other water source','Check the counter around the tap, your water dispenser or a shelf beside an aquarium.']
];

const checklists={
 keys:[
  'Empty the pockets and every compartment of the bag or jacket you last used.',
  'Check the lock, entry table and seat gaps in the last vehicle you used.'
 ],
 phone:[
  'Call the phone. Use Apple Find My or Google Find Hub if it was set up.',
  'Check charging spots, seat gaps and the last place you took the phone out.'
 ],
 documents:[
  'Flip through every section of the last folder or envelope you used.',
  'Call the last office, shop or venue where you showed the document.'
 ],
 jewellery:[
  'Check the tray, pouch or drawer where you take off jewellery.',
  'Check clothing cuffs, towel folds and the floor around the last place you changed.'
 ],
 other:[
  'Empty the bag and pockets you were using when you last had the item.',
  'Retrace that route in order. Call the lost-and-found at any stops.'
 ]
};

export function questionInstant({timing,date,time,offset},now=new Date()){
 if(timing==='now')return now;
 if(!date||!time)throw Error('Enter the date and time you asked the question.');
 if(offset===''||offset==null)throw Error('Enter the UTC offset where you asked.');
 const instant=birthInstant(date,time,offset);
 if(instant>now)throw Error('Choose a question time that has already passed.');
 return instant;
}

export function searchClue(chart){
 // Use the Moon as the reference in this simplified reading.
 const moon=chart.planets.find(planet=>planet.name==='Moon');
 const secondSign=(moon.sign+1)%12;
 const ruler=chart.planets.find(planet=>planet.name===rulers[secondSign]);
 const [title,detail]=placesBySign[ruler.sign];
 return {title,detail,moonSign:SIGNS[moon.sign],ruler,sign:SIGNS[ruler.sign]};
}

export const signedAngle=angle=>wrap(angle+180)-180;

export function prasnaAspect(from,to){
 const signAngle=signedAngle((to.sign-from.sign)*30);
 const angle=Math.abs(signAngle);
 if(![0,60,90,120,180].includes(angle))return null;
 const offset=signedAngle(to.longitude-from.longitude-signAngle);
 return Math.abs(offset)<=6?{angle,offset}:null;
}

function ascendantRuler(chart,house){
 const name=rulers[(chart.ascSign+house-1)%12];
 return chart.planets.find(planet=>planet.name===name);
}

function linked(from,to){
 return from.name!==to.name&&Boolean(prasnaAspect(from,to));
}

// Prasna Marga II, chapter 29. The existing place clue uses the Moon in place of a calculated Arudha.
function takingPattern(chart,item){
 const familiar=linked(item,ascendantRuler(chart,3));
 const outside=linked(item,ascendantRuler(chart,6));
 if(familiar&&outside)return 'mixed';
 if(familiar)return 'familiar';
 if(outside)return 'outside';
 return 'none';
}

function lossStatus(pattern,evidence){
 if(evidence==='direct')return {
  title:'You reported direct evidence it was taken.',
  detail:'Use the footage, witness account or other direct evidence to trace where it went.'
 };
 if(evidence==='signs')return {
  title:'Possible theft. Verify the signs.',
  detail:'Keep a record of what you observed and check for a witness or footage. A sign of disturbance alone leaves the cause open.'
 };
 if(pattern!=='none')return {
  title:'Unclear. Search and verify.',
  detail:'A traditional taking pattern appears. It can also be an item someone moved, so check where it was last seen and look for direct evidence.'
 };
 return {
  title:'Start with misplacement.',
  detail:'This chart has no clear taking pattern. Check places you set things down, including the bags and rooms you used last.'
 };
}

function accessClue(pattern,evidence){
 if(evidence!=='direct')return null;
 if(pattern==='familiar')return {
  title:'Familiar access is the stronger symbolic clue.',
  detail:'Check how the item was accessed in the places you regularly use, such as a household or shared workspace. The chart can’t identify a person or establish their relationship to you.'
 };
 if(pattern==='outside')return {
  title:'Outside access is the stronger symbolic clue.',
  detail:'Check visitor or venue records where available. The chart can’t identify a person or establish their relationship to you.'
 };
 return {
  title:'Insider or outsider is unclear.',
  detail:'Use records and observations to work out who had access.'
 };
}

function searchArea(chart,item,lastLocation,evidence){
 if(lastLocation==='home')return {
  title:'Start inside your home.',
  detail:'That’s the last place you’re sure you had it. Check the surfaces, rooms and bags on the route you took from there.'
 };
 if(lastLocation==='away')return {
  title:'Start away from home.',
  detail:'Contact the last venue or vehicle operator and retrace the trip from the last confirmed sighting.'
 };
 if(evidence==='direct')return {
  title:'Start where it was taken.',
  detail:'Use the last verified sighting and any footage or records to trace where the item went next.'
 };
 if(item.house===4)return {
  title:'Check inside your home first.',
  detail:'The chart’s main item clue falls in the house associated with home. Check where you unpacked or changed clothes.'
 };
 if([9,12].includes(item.house))return {
  title:'Check places away from home first.',
  detail:'The main item clue falls in a house associated with being away. Retrace the last outing and call any venue you visited.'
 };
 // The distance cue is separate from the home-or-away cue.
 if(item.sign%3===1)return {
  title:'Check near where you last had it.',
  detail:'The traditional distance cue points nearby. Inside versus outside is unclear.'
 };
 if(item.sign%3===0)return {
  title:'Widen the search to your recent route.',
  detail:'The traditional distance cue points farther out. Inside versus outside is unclear.'
 };
 return {
  title:'Check both home and nearby stops.',
  detail:'The chart gives no clear indoor or outside lead. Check the places you passed between the last sighting and when you noticed it missing.'
 };
}

function recoveryClue(chart){
 const moon=chart.planets.find(planet=>planet.name==='Moon');
 const sun=chart.planets.find(planet=>planet.name==='Sun');
 const benefics=chart.planets.filter(planet=>['Jupiter','Venus'].includes(planet.name));
 const gain=benefics.find(planet=>planet.house===11);
 const nearFull=Math.abs(signedAngle(moon.longitude-sun.longitude-180))<=6;
 const moonSupport=moon.house===1&&nearFull
  ? benefics.find(planet=>[0,60,120].includes(prasnaAspect(planet,moon)?.angle))
  : undefined;
 const difficulty=chart.planets.find(planet=>planet.house===1&&['Mars','Saturn'].includes(planet.name));
 if((gain||moonSupport)&&difficulty)return {
  title:'Recovery signals are mixed.',
  detail:'The chart shows both a supportive recovery sign and a delay or obstacle. Keep following leads you can verify.'
 };
 if(gain||moonSupport)return {
  title:'The reading favours recovery.',
  detail:gain?`${gain.name} is in the traditional house of gains.`:`A near-full Moon is supported by ${moonSupport.name}.`
 };
 if(difficulty)return {
  title:'Recovery may take more effort.',
  detail:'The chart shows an obstacle and no clear recovery signal. That leaves the outcome open.'
 };
 return {
  title:'Recovery is unclear.',
  detail:'The chart gives no clear indication of whether or when it will turn up.'
 };
}

export function lostItemAssessment(chart,item,{lastLocation,theftEvidence}={}){
 const pattern=takingPattern(chart,item);
 return {
  status:lossStatus(pattern,theftEvidence),
  access:accessClue(pattern,theftEvidence),
  area:searchArea(chart,item,lastLocation,theftEvidence),
  recovery:recoveryClue(chart)
 };
}

export function castQuestion({lat,lon,...timing},astronomy,now=new Date()){
 if(lat===''||lon===''||lat==null||lon==null)throw Error('Enter both location coordinates.');
 const instant=questionInstant(timing,now);
 return {instant,chart:chartAt(instant,lat,lon,astronomy)};
}

export function lostItemReading({name,category,lastSeen,lastLocation,theftEvidence,...input},astronomy,now=new Date()){
 if(!name.trim())throw Error('Enter the name of the missing item.');
 const {chart,instant}=castQuestion(input,astronomy,now);
 const clue=searchClue(chart);
 const assessment=lostItemAssessment(chart,clue.ruler,{lastLocation,theftEvidence});
 const firstStep=lastSeen.trim()
  ? `Start where you last had it: ${lastSeen.trim().replace(/[.!?]$/,'')}.`
  : 'Recall the last confirmed sighting and what you did immediately afterwards.';
 const evidenceStep=theftEvidence==='direct'||theftEvidence==='signs'
  ? ['Save any records of what happened and ask the venue or building staff how they handle missing property.']
  : [];
 return {chart,instant,clue,assessment,steps:[firstStep,...evidenceStep,...(checklists[category]??checklists.other)]};
}
