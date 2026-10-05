import type {WheelEventState} from 'wheel-gestures';

// Gesture boundaries/momentum come from wheel-gestures. Ending events never
// advance a page; deliberate movement only updates this gesture's destination.
export class WheelSceneIntent {
 private origin=0;private direction=0;private committed=0;private started=0;private distance=0;private peak=0;private samples=0;
 consume(state:WheelEventState,target:number,height:number):number|null{
  if(state.isEnding)return null;
  const delta=state.axisDelta[1],direction=Math.sign(delta);
  if(!direction||Math.abs(delta)<Math.abs(state.axisDelta[0]))return null;
  const reversal=this.direction!==0&&direction!==this.direction&&Math.abs(delta)>=8;
  if(state.isStart||reversal){this.origin=target;this.direction=direction;this.committed=0;this.started=state.event.timeStamp;this.distance=0;this.peak=0;this.samples=0}
  if(state.isMomentum&&!reversal)return null;
  this.distance+=Math.abs(delta);this.peak=Math.max(this.peak,Math.abs(state.axisVelocity[1]));this.samples++;
  if(this.distance<8)return null;
  // Only the early part of a fast flick can request extra pages. Slow long
  // drags and the momentum tail cannot add an unsolicited second transition.
  const fast=this.samples>=3&&state.event.timeStamp-this.started<=180&&this.peak>=Math.max(10,height*.016)&&this.distance>=height*.85;
  const pages=fast?Math.min(3,1+Math.floor(this.distance/(height*.85))):1;
  if(pages<=this.committed)return null;
  this.committed=pages;return this.origin+this.direction*pages;
 }
}
