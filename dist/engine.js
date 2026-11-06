// Pure chart data contract: renderers (SVG now, 3D later) consume this module.
export const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const NAKSHATRAS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
export const wrap=x=>((x%360)+360)%360;
export const houseOf=(longitude,asc)=>((Math.floor(wrap(longitude)/30)-Math.floor(wrap(asc)/30)+12)%12)+1;
export function birthInstant(date,time,offset){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw Error('Enter a complete birth date and time.');
 const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number),o=Number(offset);
 const raw=new Date(Date.UTC(y,m-1,d,h,min));
 if(y<1900||y>2100||raw.getUTCMonth()!==m-1||raw.getUTCDate()!==d||h>23||min>59||!Number.isFinite(o)||o< -12||o>14)throw Error('Check your date, time and UTC offset. Supported years: 1900–2100.');
 return new Date(raw.getTime()-o*3600000);
}
export function calculate(input,A){
 const date=birthInstant(input.date,input.time,input.offset),lat=Number(input.lat),lon=Number(input.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>65||Math.abs(lon)>180)throw Error('Enter latitude between −65 and 65, and longitude between −180 and 180.');
 const jd=date.getTime()/86400000+2440587.5,T=(jd-2451545)/36525;
 // Approximate Lahiri precession, intentionally marked unvalidated for production.
 const ayanamsa=23.8530556+(5028.796195*T+1.1054348*T*T)/3600;
 const rad=Math.PI/180,theta=(A.SiderealTime(date)*15+lon)*rad,eps=(23.439291-0.0130042*T)*rad;
 const asc=wrap(Math.atan2(Math.cos(theta),-Math.sin(theta)*Math.cos(eps)-Math.tan(lat*rad)*Math.sin(eps))/rad-ayanamsa);
 const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
 const positions=bodies.map(name=>({name,longitude:wrap(A.Ecliptic(A.GeoVector(name,date,true)).elon-ayanamsa)}));
 const node=wrap(125.04452-1934.136261*T+0.0020708*T*T+T*T*T/450000-ayanamsa);
 positions.push({name:'Rahu',longitude:node},{name:'Ketu',longitude:wrap(node+180)});
 const planets=positions.map(p=>({...p,sign:Math.floor(p.longitude/30),degree:p.longitude%30,house:houseOf(p.longitude,asc)}));
 const moon=planets.find(p=>p.name==='Moon').longitude,nak=Math.floor(moon/(360/27));
 return {version:1,date:date.toISOString(),ascendant:asc,ascSign:Math.floor(asc/30),ayanamsa,planets,nakshatra:NAKSHATRAS[nak],pada:Math.floor((moon%(360/27))/(360/108))+1,method:{zodiac:'sidereal',ayanamsa:'approximate Lahiri',houses:'whole sign',nodes:'mean',validation:'reference validation pending'}};
}
const rules=[
 {id:'career-sun',category:'Career',planet:'Sun',houses:[1,5,9,10],title:'Step into the role with your name on it.',text:'Your strongest work theme is ownership. Choose a responsibility where decisions, visibility and accountability sit with you. Waiting quietly for recognition is the weaker move.',action:'Ask to own one visible outcome from start to finish.'},
 {id:'career-saturn',category:'Career',planet:'Saturn',houses:[3,6,10,11],title:'Build the reputation that outlasts the applause.',text:'Your work reading points toward steady authority. Difficult, useful work is where you can distinguish yourself. A clear specialty will serve you better than chasing every opportunity.',action:'Choose one skill to deepen for the next 90 days.'},
 {id:'career-mercury',category:'Career',planet:'Mercury',houses:[1,2,5,6,10,11],title:'Make your thinking visible.',text:'Your chart’s work theme centers on ideas, communication and problem-solving. Explain what you see clearly and turn that insight into something others can use.',action:'Share one useful proposal, prototype or explanation this week.'},
 {id:'love-venus',category:'Relationships',planet:'Venus',houses:[1,4,5,7,9,12],title:'Let affection become something people can feel.',text:'Connection is a strong theme in your reading. Small, deliberate acts of warmth carry more weight than expecting someone to understand what you have not said.',action:'Make time for an unhurried conversation with someone close.'},
 {id:'love-moon',category:'Relationships',planet:'Moon',houses:[2,4,5,7,8,12],title:'Say what you need before silence speaks for you.',text:'Your relationship reading emphasizes emotional honesty. Name what matters early. A direct conversation gives closeness a better chance than hoping others will read your mind.',action:'Express one need clearly, without blame or hints.'},
 {id:'growth-jupiter',category:'Personal growth',planet:'Jupiter',houses:[1,4,5,7,9,11],title:'Grow into the person others come to for perspective.',text:'Learning and guidance stand out in your reading. Go deeper into a subject you respect, then share what you learn. Your influence can grow through usefulness and generosity.',action:'Find one mentor, or help someone a step behind you.'},
 {id:'growth-mars',category:'Personal growth',planet:'Mars',houses:[1,3,6,10,11],title:'Give your ambition a clear target.',text:'Initiative is a prominent theme. Your energy needs a defined challenge and a finish line. Pick the important task you keep circling and take its first concrete step.',action:'Finish one difficult task before starting another.'},
 {id:'growth-rahu',category:'Personal growth',planet:'Rahu',houses:[3,6,9,10,11],title:'Explore beyond the familiar, with a plan.',text:'Your reading highlights unconventional interests and a willingness to explore. Give a new direction a small, measurable trial before making it your whole identity.',action:'Run a two-week experiment in something that keeps pulling your attention.'}
];
const own={Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10]},exalted={Sun:0,Moon:1,Mars:9,Mercury:5,Jupiter:3,Venus:11,Saturn:6};
export function readings(chart,category='All'){
 return rules.filter(r=>category==='All'||r.category===category).flatMap(r=>{
 const p=chart.planets.find(p=>p.name===r.planet);if(!p||!r.houses.includes(p.house))return [];
 const evidence=[`${p.name} in house ${p.house}`];let score=1;
 if(own[p.name]?.includes(p.sign)){score+=2;evidence.push('Own sign');}
 if(exalted[p.name]===p.sign){score+=2;evidence.push('Exaltation sign');}
 if([1,4,7,10].includes(p.house)){score++;evidence.push('Angular house');}
 return [{...r,score,evidence}];
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3);
}
