export type RailProgress={offset:number;hold:number;transition?:{from:number;to:number;elapsed:number}};
export function advanceRail(progress:RailProgress,elapsed:number,limit:number,speed:number,readHold:number){
 const dt=Math.min(80,Math.max(0,elapsed));
 if(progress.transition){
  const next=Math.min(680,progress.transition.elapsed+dt),t=next/680,eased=1-Math.pow(1-t,3);
  return {progress:{offset:progress.transition.from+(progress.transition.to-progress.transition.from)*eased,hold:0,...(t<1?{transition:{...progress.transition,elapsed:next}}:{})},settled:t===1,reveal:false};
 }
 const offset=Math.min(limit,progress.offset+speed*dt/1000),hold=offset>=limit-1?progress.hold+dt:0;
 return {progress:{offset,hold},settled:false,reveal:hold>=readHold};
}
export const readingHold=(words:number)=>Math.max(6500,Math.min(18000,words/3*1000));
