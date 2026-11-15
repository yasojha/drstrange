import {chartAt} from './engine.js';
import {castQuestion,prasnaAspect,rulers,signedAngle} from './prasna.js';

export const questionTypes={
 interview:{
  label:'Job or interview',
  example:'Will my final interview turn into a job offer?',
  main:[1,10], support:['Moon',10],
  subject:'you and the role',
  headlines:['The reading leans toward an offer.','The reading points to a hurdle before an offer.','The reading gives no clear offer signal.'],
  next:'Ask the recruiter what’s left in the process and when they expect a decision.'
 },
 'job-change':{
  label:'Job change',
  example:'Will the new role give me more ownership than my current role?',
  main:[1,7], support:[1,10], compare:true,
  subject:'you and the prospective employer',
  headlines:['The reading favours exploring the new role.','The reading points to friction with the new role.','The reading gives no clear edge to the new role.'],
  next:'Ask who owns the decisions, what you can ship independently, and what success looks like in the first 90 days.'
 },
 marriage:{
  label:'Marriage proposal',
  example:'Will this marriage proposal move to a formal yes?',
  main:[1,7], support:['Moon',7],
  subject:'the two people considering the proposal',
  headlines:['The reading leans toward the proposal moving forward.','The reading points to an obstacle before agreement.','The reading gives no clear sign of agreement.'],
  next:'Ask whether both people want to take the next step and what each still needs to decide.'
 },
 travel:{
  label:'Travel or relocation',
  example:'Will my planned move to Bengaluru go ahead?',
  main:[1,9], support:['Moon',9],
  subject:'you and the planned journey',
  headlines:['The reading leans toward the trip or move going ahead.','The reading points to a hurdle in the travel plan.','The reading gives no clear sign the plan will go ahead.'],
  next:'Identify the one thing the plan depends on, such as leave, paperwork or a confirmed place to stay.'
 },
 purchase:{
  label:'Home or vehicle',
  example:'Will the deal for the flat I’m looking at close?',
  main:[1,4], support:[1,11],
  subject:'you and the property or vehicle',
  headlines:['The reading leans toward the deal moving forward.','The reading points to a hurdle before the deal closes.','The reading gives no clear closing signal.'],
  next:'Ask the seller which documents, inspection or approval still stand between you and closing.'
 },
 business:{
  label:'Business or client',
  example:'Will the client sign the proposal we sent?',
  main:[1,7], support:[7,11],
  subject:'you and the prospective client or partner',
  headlines:['The reading leans toward the deal moving forward.','The reading points to another round of negotiation.','The reading gives no clear agreement signal.'],
  next:'Find out who signs off and ask what is still open on scope, budget or timing.'
 },
 payment:{
  label:'Pending payment',
  example:'Will the client clear the overdue invoice?',
  main:[2,8], support:[7,2],
  subject:'your funds and the payer’s funds',
  headlines:['The reading leans toward the payment coming through.','The reading points to a hurdle before payment.','The reading gives no clear payment signal.'],
  next:'Send the invoice number and due date. Ask for the scheduled payment date and whether anything is blocking it.'
 },
 dispute:{
  label:'Dispute settlement',
  example:'Will we reach a settlement through negotiation?',
  main:[1,7], support:[7,'Jupiter'],
  subject:'the two sides in the dispute',
  headlines:['The reading favours a negotiated resolution.','The reading points to resistance in the talks.','The reading gives no clear settlement signal.'],
  next:'Write down the one term still in dispute and ask what would make it acceptable to both sides.'
 }
};

const aspects={
 0:{name:'conjunction',supportive:null},
 60:{name:'sextile',supportive:true},
 90:{name:'square',supportive:false},
 120:{name:'trine',supportive:true},
 180:{name:'opposition',supportive:false}
};
const exactTolerance=0.05;

function getPlanet(chart,house){
 const name=typeof house==='string'?house:rulers[(chart.ascSign+house-1)%12];
 return chart.planets.find(planet=>planet.name===name);
}

// Follow the exact angle in the direction implied by the signs, including wrap at Aries.
function contact(chart,later,pair){
 const [from,to]=pair.map(house=>getPlanet(chart,house));
 const base={from,to};
 if(from.name===to.name)return {...base,phase:'shared'};
 const geometry=prasnaAspect(from,to);
 if(!geometry)return {...base,phase:'none'};
 const {angle,offset:orb}=geometry;
 const aspect=aspects[angle];
 const nextLongitude=name=>later.planets.find(planet=>planet.name===name).longitude;
 const change=signedAngle(nextLongitude(to.name)-nextLongitude(from.name)-(to.longitude-from.longitude));
 let phase='steady';
 if(Math.abs(orb)<=exactTolerance)phase='exact';
 else if(Math.abs(change)>0.0001)phase=orb*change<0?'applying':'separating';
 return {...base,phase,aspect,orb:Math.abs(orb)};
}

function signal(contact){
 if(contact.phase!=='applying'&&contact.phase!=='exact')return 'none';
 if(contact.aspect.supportive===null)return 'none';
 return contact.aspect.supportive?'opening':'friction';
}

function describeContact({from,to,phase,aspect,orb}){
 const names=`${from.name} and ${to.name}`;
 if(phase==='shared')return `${from.name} represents both sides of this check.`;
 if(phase==='none')return `${names} have no aspect within 6° in this reading.`;
 return `${names} · ${phase} ${aspect.name} · ${orb.toFixed(2)}° from exact.`;
}

function unclearReason(rule,main,secondary){
 if(rule.compare&&secondary==='opening')return 'The current role has the clearer supporting signal in this chart.';
 if(secondary==='opening')return 'There is a supporting signal, but the main connection is inconclusive.';
 if(main.phase==='separating')return `The main chart connection between ${rule.subject} is moving apart.`;
 if(main.phase==='shared')return 'One planet represents both sides, so this method has no separate connection to judge.';
 if(main.aspect?.name==='conjunction')return 'The main planets are close together, but that alone leaves the result open.';
 return `The chart lacks a clear active connection between ${rule.subject}.`;
}

export function interpretQuestion(type,chart,later){
 if(!Object.hasOwn(questionTypes,type))throw Error('Choose a supported question type.');
 const rule=questionTypes[type];
 const main=contact(chart,later,rule.main);
 const support=contact(chart,later,rule.support);
 const primary=signal(main);
 const repeated=[main.from.name,main.to.name].sort().join() === [support.from.name,support.to.name].sort().join();
 const secondary=repeated&&!rule.compare?'none':signal(support);
 // For job changes a supportive current role competes with a supportive new role.
 const conflict=primary!=='none'&&secondary!=='none'&&(rule.compare?primary===secondary:primary!==secondary);
 const outcome=conflict?'mixed':primary;
 const headline=outcome==='mixed'?'The reading is mixed.':rule.headlines[{opening:0,friction:1,none:2}[outcome]];
 const reason=outcome==='mixed'
  ? rule.compare?'The current and prospective roles show comparable signals.':'The main and supporting chart signals point in different directions.'
  : {
    opening:`The main chart connection between ${rule.subject} is supportive.`,
    friction:`The main chart connection between ${rule.subject} points to resistance.`,
    none:unclearReason(rule,main,secondary)
   }[outcome];
 const evidence=[describeContact(main)];
 if(!repeated)evidence.push(describeContact(support));
 else if(rule.compare)evidence.push('The same two planets represent both role checks.');
 return {
  headline,reason,next:rule.next,outcome,evidence,
  selected:[...new Set([main.from.house,main.to.house])]
 };
}

export function topicQuestionReading({type,question,...input},astronomy,now=new Date()){
 const text=question.trim();
 if(!text)throw Error('Enter the question you want to ask.');
 const {instant,chart}=castQuestion(input,astronomy,now);
 const oneHourLater=new Date(+instant+3600000);
 const later=chartAt(oneHourLater,input.lat,input.lon,astronomy);
 return {chart,instant,text,...interpretQuestion(type,chart,later)};
}
