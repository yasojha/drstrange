// An editorial summary of return-chart signals, not a measured life outcome.
export function buildDashboard(future,windows){
 const top=type=>windows.groups[type]?.find(e=>e.rank===1)||null;
 const series=future.annualSeries.filter(p=>p.to>future.from&&p.from<future.to).sort((a,b)=>+a.from-+b.from);
 const best=(key)=>series.length?[...series].sort((a,b)=>b[key]-a[key])[0]:null;
 return {marriage:top('marriage'),children:windows.groups.children||[],income:top('income'),business:top('business'),stability:best('income'),series};
}
export function lineChart(series,key,label){
 const points=series.map((p,i)=>({year:p.year,value:p[key],x:36+i*42})),max=Math.max(3,...points.map(p=>Math.abs(p.value))),toY=v=>80-v/max*48;
 const poly=points.map(p=>`${p.x},${toY(p.value).toFixed(1)}`).join(' '),width=Math.max(320,points.length*42+32);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<svg viewBox="0 0 ${width} 146" role="img" aria-label="${escape(label)} by solar return year. Values are relative astrological signals, not actual outcomes."><line x1="30" y1="80" x2="${width-10}" y2="80" stroke="#c9cdbc" stroke-dasharray="4 4"/><polyline points="${poly}" fill="none" stroke="${key==='income'?'#3c7456':'#63799a'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<g><circle cx="${p.x}" cy="${toY(p.value).toFixed(1)}" r="4" fill="${key==='income'?'#3c7456':'#63799a'}"><title>${p.year}: relative signal ${p.value.toFixed(1)}</title></circle><text x="${p.x}" y="132" text-anchor="middle" font-size="10" fill="#727b70">${p.year}</text></g>`).join('')}</svg>`;
}
