// Bounds for the shared calendar. Earlier years have no reason to be shown.
export function calendarBounds(events,forecast,asOf){
 const firstEvent=events.reduce((earliest,e)=>!earliest||+e.start<+earliest?e.start:earliest,null);
 const first=firstEvent||forecast?.from,last=forecast?.events.at(-1)?.end||forecast?.from||asOf;
 if(!first||!last)return null;
 const start=new Date(first),end=new Date(last);
 return {startYear:start.getUTCFullYear(),startMonth:start.getUTCMonth(),endYear:end.getUTCFullYear(),endMonth:end.getUTCMonth(),first:start,last:end};
}
