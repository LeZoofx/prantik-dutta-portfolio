import {WheelGestures,type WheelEventData,type WheelEventState} from 'wheel-gestures';
import {WheelSceneIntent} from './WheelSceneIntent';

type Options={scroller:HTMLElement;step:(value:number)=>void;paused:()=>boolean};
// Only the horizontal gesture is claimed. Vertical events keep their existing
// owner; momentum and diagonal tails cannot leak into a second page gesture.
export class FrameWheelInput{
 private axis:'x'|'y'|null=null;private lastTime=-Infinity;private cross=0;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private intent=new WheelSceneIntent();
 private readonly gestures=WheelGestures({preventWheelAction:false,reverseSign:false});
 private readonly off:()=>void;
 constructor(private o:Options){
  this.off=this.gestures.on('wheel',state=>this.consume(state));
  o.scroller.addEventListener('wheel',this.wheel,{capture:true,passive:false});
  document.addEventListener('visibilitychange',this.reset);
 }
 private consume(state:WheelEventState){
  if(state.isEnding){if(this.axis==='x')this.intent.consume(state,0);return}
  const [x,y]=state.axisDelta,ax=Math.abs(x),ay=Math.abs(y),magnitude=Math.max(ax,ay),gap=state.event.timeStamp-this.lastTime;
  if(!magnitude)return;const previousAxis=this.axis,proposed=ax>ay*1.15?'x':'y';
  const freshAxis=!state.isMomentum&&magnitude>=Math.max(8,this.cross*(gap>=90?1.5:2.5))&&magnitude>Math.min(ax,ay)*2;
  if(!this.axis||gap>420||proposed!==this.axis&&freshAxis)this.axis=proposed;
  if(previousAxis&&previousAxis!==this.axis){clearTimeout(this.timer);this.timer=undefined;this.intent=new WheelSceneIntent()}
  if(previousAxis!==this.axis||gap>420)this.cross=0;
  if(proposed===this.axis)this.cross=Math.max(this.cross,this.axis==='x'?ay:ax);
  this.lastTime=state.event.timeStamp;
  if(this.axis!=='x')return;
  const horizontal:WheelEventState={...state,axisDelta:[0,x,0],axisVelocity:[0,state.axisVelocity[0],0],axisMovement:[0,state.axisMovement[0],0],axisMovementProjection:[0,state.axisMovementProjection[0],0]};
  if(!this.intent.consume(horizontal,0))return;
  clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=undefined;const step=this.intent.decide(this.o.scroller.clientWidth);if(step&&!this.o.paused()&&!document.hidden)this.o.step(step)},44);
 }
 private wheel=(event:WheelEvent)=>{
  if(event.ctrlKey||event.metaKey||document.hidden||this.o.paused()||(event.target as Element|null)?.closest?.('.depth-topbar,.depth-toolbar,.depth-bottom,.ai-note,.ai-controls,input,select,textarea,[contenteditable=true]'))return;
  const shift=event.shiftKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX);
  const sample:WheelEventData&{momentum?:boolean}={deltaX:shift?event.deltaY:event.deltaX,deltaY:shift?0:event.deltaY,deltaZ:event.deltaZ,deltaMode:event.deltaMode,timeStamp:event.timeStamp,momentum:(event as WheelEvent&{momentum?:boolean}).momentum};
  this.gestures.feedWheel(sample);
  if(this.axis==='x'){event.preventDefault();event.stopImmediatePropagation()}
 };
 private reset=()=>{clearTimeout(this.timer);this.timer=undefined;this.axis=null;this.lastTime=-Infinity;this.cross=0;this.intent.cancel()};
 destroy(){this.reset();this.off();this.gestures.disconnect();this.o.scroller.removeEventListener('wheel',this.wheel,true);document.removeEventListener('visibilitychange',this.reset)}
}
