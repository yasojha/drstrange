import {birthInstant,chartAt,SIGNS} from './engine.js';

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

export function castQuestion({lat,lon,...timing},astronomy,now=new Date()){
 if(lat===''||lon===''||lat==null||lon==null)throw Error('Enter both location coordinates.');
 const instant=questionInstant(timing,now);
 return {instant,chart:chartAt(instant,lat,lon,astronomy)};
}

export function lostItemReading({name,category,lastSeen,...input},astronomy,now=new Date()){
 if(!name.trim())throw Error('Enter the name of the missing item.');
 const {chart,instant}=castQuestion(input,astronomy,now);
 const firstStep=lastSeen.trim()
  ? `Start where you last had it: ${lastSeen.trim()}.`
  : 'Recall the last confirmed sighting and what you did immediately afterwards.';
 return {chart,instant,clue:searchClue(chart),steps:[firstStep,...(checklists[category]??checklists.other)]};
}
