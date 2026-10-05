import type {WheelEventState} from 'wheel-gestures';

// Library start/end timers are advisory: a late wheel event can be the same
// physical gesture. Preserve its envelope until fresh input is evident.
export class WheelSceneIntent {
 private origin=0;private direction=0;private committed=false;private requested=false;
 private distance=0;private peak=0;private samples=0;private projection=0;
 private lastTime=-Infinity;private lastDelta=0;private envelope=0;private tail=false;private falls=0;private rises=0;private renewal=0;
 consume(state:WheelEventState,target:number):boolean{
  if(state.isEnding){if(this.committed)this.tail=true;return false}
  const delta=state.axisDelta[1],direction=Math.sign(delta),magnitude=Math.abs(delta);
  if(!direction||magnitude<Math.abs(state.axisDelta[0]))return false;
  if((state.event as WheelEvent&{momentum?:boolean}).momentum===true){this.tail=true;this.lastTime=state.event.timeStamp;this.lastDelta=magnitude;return false}
  const gap=state.event.timeStamp-this.lastTime;
  this.falls=magnitude<this.lastDelta?this.falls+1:0;
  if(state.isMomentum||this.falls>=3&&magnitude<this.envelope*.45)this.tail=true;
  const reversal=this.direction!==0&&direction!==this.direction&&magnitude>=8;
  const weak=magnitude<=Math.max(48,this.envelope*.5);
  // Never trust an isStart created by the detector's short inertia timeout.
  // Fresh deliberate impulses or several rising samples reopen the gesture.
  const fresh=!this.direction||reversal||gap>420||
   (state.isStart&&!weak)||
   (this.committed&&this.samples===1&&gap>=100&&magnitude>=60)||
   (this.committed&&this.tail&&magnitude>=Math.max(24,this.lastDelta*2.5)&&!weak);
  if(this.committed&&!fresh&&this.tail){
   if(magnitude>=this.lastDelta+1){this.rises++;this.renewal+=magnitude}else{this.rises=0;this.renewal=0}
  }
  const renewed=this.committed&&this.tail&&this.rises>=3&&this.renewal>=24;
  if(fresh||renewed){
   this.origin=target;this.direction=direction;this.committed=this.requested=false;
   this.distance=this.peak=this.samples=this.projection=this.envelope=0;
   this.tail=false;this.falls=this.rises=this.renewal=0;
  }
  this.lastTime=state.event.timeStamp;this.lastDelta=magnitude;this.envelope=Math.max(this.envelope,magnitude);
  if(this.committed||state.isMomentum&&!fresh&&!renewed)return false;
  this.distance+=magnitude;this.peak=Math.max(this.peak,Math.abs(state.axisVelocity[1]));this.samples++;
  this.projection=Math.max(this.projection,Math.abs(state.axisMovementProjection[1]));
  if(this.requested||this.distance<8)return false;
  this.requested=true;return true;
 }
 decide(height:number):number|null{
  if(!this.requested||this.committed)return null;
  this.committed=true;
  const fast=this.samples>=3&&this.peak>=Math.max(10,height*.016)&&this.distance>=height*.2;
  const pages=fast?Math.min(3,Math.max(2,Math.round(this.projection/height))):1;
  return this.origin+this.direction*pages;
 }
 cancel(){this.committed=true;this.requested=false}
}
