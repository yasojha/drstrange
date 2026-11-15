import {SIGNS} from './engine.js';

const polygons=['220,20 320,120 220,220 120,120','20,20 220,20 120,120','20,20 120,120 20,220','20,220 120,120 220,220 120,320','20,220 120,320 20,420','20,420 120,320 220,420','220,220 320,320 220,420 120,320','220,420 320,320 420,420','420,420 320,320 420,220','220,220 320,120 420,220 320,320','420,220 320,120 420,20','420,20 320,120 220,20'];
const centers=[[220,120],[120,53],[55,120],[120,220],[55,320],[120,388],[220,320],[320,388],[385,320],[320,220],[385,120],[320,53]];

type ChartForDrawing = {
 ascSign: number;
 planets: readonly { house: number; name: string }[];
};

type ChartDrawingOptions = {
 title: string;
 label: string;
 topics?: readonly string[];
 selected?: readonly number[];
};

export function northIndianChart(
 chart: ChartForDrawing,
 {title,label,topics,selected=[]}: ChartDrawingOptions
) {
 const interactive=Boolean(topics);
 const cells=polygons.map((points,i)=>{
  const [x,y]=centers[i];
  const house=i+1;
  const sign=(chart.ascSign+i)%12;
  const planets=chart.planets.filter(planet=>planet.house===house);
  const rows=[];
  for(let j=0;j<planets.length;j+=3){
   rows.push(planets.slice(j,j+3).map(planet=>planet.name.slice(0,2)).join(' · '));
  }
  const names=planets.map(planet=>planet.name).join(', ')||'no planets';
  const attributes=topics
   ? `role="button" tabindex="0" data-house="${house}" aria-label="House ${house}: ${topics[i]}, ${SIGNS[sign]}, ${names}"`
   : '';
  return `<g ${attributes} class="${selected.includes(house)?'selected':''}"><polygon class="cell" points="${points}"/><text class="sign-label" text-anchor="middle" x="${x}" y="${y-16}">${sign+1}</text>${rows.map((row,j)=>`<text class="planet-label" text-anchor="middle" x="${x}" y="${y+3+j*14}">${row}</text>`).join('')}${i===0?`<text class="asc-label" text-anchor="middle" x="${x}" y="${y+45}">LAGNA</text>`:''}</g>`;
 });
 return `<svg class="kundali" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 440" role="${interactive?'group':'img'}" aria-label="${label}"><title>${title}</title><rect x="12" y="12" width="416" height="416" rx="2" fill="none" stroke="#d6d1bb"/>${cells.join('')}</svg>`;
}
