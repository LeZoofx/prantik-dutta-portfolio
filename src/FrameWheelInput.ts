import {WheelGestures,type WheelEventData,type WheelEventState} from 'wheel-gestures';
import {gestureAxis,type GestureAxis} from './scenePaging';
import {WheelSceneIntent} from './WheelSceneIntent';

type Options={scroller:HTMLElement;step:(value:number)=>void;page:(value:number)=>void;paused:()=>boolean};

export function isScrollControl(target:EventTarget|null){
 return !!(target as Element|null)?.closest?.('.depth-topbar,.depth-toolbar,.depth-bottom,.process-scroller,.ai-note,.ai-controls,input,select,textarea,[contenteditable=true]');
}

// Classify the physical gesture once, then project its deltas onto that axis.
// A second listener must not interpret a diagonal or its momentum as a page.
export class FrameWheelInput{
 private axis:GestureAxis|undefined;
 private lastTime=-Infinity;
 private lastMagnitude=0;
 private direction=0;
 private pending:WheelEventState[]=[];
 private classifyTimer:ReturnType<typeof setTimeout>|undefined;
 private decisionTimer:ReturnType<typeof setTimeout>|undefined;
 private intent=new WheelSceneIntent();
 private readonly gestures=WheelGestures({preventWheelAction:false,reverseSign:false});
 private readonly off:()=>void;
 constructor(private o:Options){
  this.off=this.gestures.on('wheel',state=>this.consume(state));
  o.scroller.addEventListener('wheel',this.wheel,{capture:true,passive:false});
  document.addEventListener('visibilitychange',this.reset);
 }
 private route(state:WheelEventState,axis:GestureAxis){
  const index=axis==='x'?0:1;
  const delta=state.axisDelta[index],direction=Math.sign(delta);
  if(direction&&direction!==this.direction&&Math.abs(delta)<Math.abs(state.axisDelta[1-index]))return;
  if(Math.abs(delta)>=8)this.direction=direction;
  const project=(value:WheelEventState['axisDelta']):WheelEventState['axisDelta']=>[0,value[index],0];
  const projected={...state,axisDelta:project(state.axisDelta),axisVelocity:project(state.axisVelocity),axisMovement:project(state.axisMovement),axisMovementProjection:project(state.axisMovementProjection)};
  if(!this.intent.consume(projected,0))return;
  clearTimeout(this.decisionTimer);
  this.decisionTimer=setTimeout(()=>{
   this.decisionTimer=undefined;
   const length=axis==='x'?this.o.scroller.clientWidth:this.o.scroller.clientHeight;
   const step=this.intent.decide(length);
   if(step&&!this.o.paused()&&!document.hidden)(axis==='x'?this.o.step:this.o.page)(step);
  },44);
 }
 private classify(force=false){
  const [x,y]=this.pending.reduce(([dx,dy],state)=>[dx+state.axisDelta[0],dy+state.axisDelta[1]],[0,0]);
  const axis=gestureAxis(x,y,force?4:10,force);
  if(!axis){if(force)this.pending=[];return}
  clearTimeout(this.classifyTimer);this.classifyTimer=undefined;
  this.axis=axis;
  this.direction=Math.sign(axis==='x'?x:y);
  for(const state of this.pending)this.route(state,axis);
  this.pending=[];
 }
 private consume(state:WheelEventState){
  if(state.isEnding){if(this.axis)this.route(state,this.axis);return}
  const [x,y]=state.axisDelta,ax=Math.abs(x),ay=Math.abs(y),magnitude=Math.max(ax,ay);
  if(!magnitude)return;
  const time=state.event.timeStamp,gap=time-this.lastTime;
  const momentum=state.isMomentum||(state.event as WheelEventData&{momentum?:boolean}).momentum;
  const proposed=gestureAxis(x,y,8);
  const other=this.axis==='x'?ax:ay;
  // Only a fresh impulse after a pause can change axes. Small or diagonal
  // tails stay on their original axis even if their larger component changes.
  if(!momentum&&(gap>420||this.axis&&proposed&&proposed!==this.axis&&gap>=90&&
   other<magnitude*.6&&(magnitude>this.lastMagnitude*1.2||gap>=150&&other<1)))this.reset();
  this.lastTime=time;this.lastMagnitude=magnitude;
  if(this.axis){this.route(state,this.axis);return}
  if(momentum)return;
  this.pending.push(state);
  this.classify();
  if(!this.axis&&this.classifyTimer===undefined)this.classifyTimer=setTimeout(()=>{
   this.classifyTimer=undefined;
   this.classify(true);
  },32);
 }
 private wheel=(event:WheelEvent)=>{
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||document.hidden||this.o.paused()||isScrollControl(event.target))return;
  const x=event.shiftKey?event.deltaX||event.deltaY:event.deltaX,y=event.shiftKey?0:event.deltaY;
  if(x||y)event.preventDefault();
  if(event.shiftKey&&this.axis==='y')this.reset();
  const sample:WheelEventData&{momentum?:boolean}={deltaX:x,deltaY:y,deltaZ:event.deltaZ,deltaMode:event.deltaMode,timeStamp:event.timeStamp,momentum:(event as WheelEvent&{momentum?:boolean}).momentum};
  this.gestures.feedWheel(sample);
 };
 cancelPending(){
  clearTimeout(this.classifyTimer);this.classifyTimer=undefined;this.pending=[];
  clearTimeout(this.decisionTimer);this.decisionTimer=undefined;this.intent.cancel();
 }
 private reset=()=>{
  this.cancelPending();this.axis=undefined;this.direction=0;this.lastTime=-Infinity;this.lastMagnitude=0;this.intent=new WheelSceneIntent();
 };
 destroy(){this.reset();this.off();this.gestures.disconnect();this.o.scroller.removeEventListener('wheel',this.wheel,true);document.removeEventListener('visibilitychange',this.reset)}
}
