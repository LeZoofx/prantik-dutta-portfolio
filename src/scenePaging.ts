// Native scroll snap chooses the destination; this only repairs an unfinished rest position.
export function nativeSnapPage(position:number,count:number){
 return Math.max(0,Math.min(count-1,Math.round(position)));
}
export function recenterPage(page:number,total:number){return total+((page%total)+total)%total}

// Page transactions never depend on the duration of a wheel stream or on an easing epsilon.
export class ScenePager {
 position=0;target=0;
 private from=0;private to=0;private started=0;private duration=380;private active=false;
 get moving(){return this.active}
 private begin(time:number){
  if(this.position===this.target){this.active=false;return}
  this.from=this.position;this.to=this.position+Math.sign(this.target-this.position);
  this.started=time;this.active=true;
 }
 advance(step:number,time:number){
  if(!step)return;
  this.sample(time);
  const direction=Math.sign(step);
  if(this.active&&direction!==Math.sign(this.to-this.from)){
   // Reversal also ends on a whole page, never at the current fractional position.
   this.from=this.position;this.to=direction>0?Math.ceil(this.position):Math.floor(this.position);
   this.target=this.to+direction*(Math.abs(step)-1);this.started=time;
  }else{this.target+=Math.trunc(step);if(!this.active)this.begin(time)}
 }
 navigate(target:number,time:number){
  this.sample(time);this.target=Math.round(target);this.from=this.position;this.to=this.target;
  if(Math.abs(this.to-this.from)>3)this.from=this.position=this.to-Math.sign(this.to-this.from)*.85;
  this.started=time;this.active=this.position!==this.target;
 }
 sample(time:number,reduced=false){
  if(reduced){this.position=this.target;this.active=false;return this.position}
  while(this.active&&time>=this.started+this.duration){
   const nextTime=this.started+this.duration;this.position=this.to;this.begin(nextTime);
  }
  if(this.active){const u=Math.max(0,Math.min(1,(time-this.started)/this.duration));this.position=this.from+(this.to-this.from)*(u*u*(3-2*u))}
  return this.position;
 }
 settle(){this.position=this.active?this.to:Math.round(this.position);this.target=this.position;this.active=false;return this.position}
}

export function swipePages(distance:number,duration:number,height:number){
 if(Math.abs(distance)<28)return 0;
 const strong=Math.abs(distance)>height*.62&&Math.abs(distance)/Math.max(80,duration)>1.35;
 return Math.sign(distance)*(strong?Math.min(3,1+Math.floor(Math.abs(distance)/(height*.62))):1);
}
