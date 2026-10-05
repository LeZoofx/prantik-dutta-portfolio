import {WheelGestures} from 'wheel-gestures';
import {WheelSceneIntent} from './WheelSceneIntent';
import {nativeSnapPage,recenterPage} from './scenePaging';

type Options={scroller:HTMLElement;root:HTMLElement;total:number;reduced:()=>boolean;paused:()=>boolean;moving:(value:boolean)=>void;invalidate:()=>void};

// One destination owner. Wheel default scrolling and CSS snap are disabled;
// the browser animates a single smooth scroll to a whole-page destination.
export class NativeSceneScroll {
 private height=1;private initialized=false;private destination=0;private travelling=false;
 private fallbackTimer:ReturnType<typeof setTimeout>|undefined;
 private readonly scrollEnd:boolean;private readonly gestures=WheelGestures({preventWheelAction:false,reverseSign:false});
 private readonly intent=new WheelSceneIntent();private readonly off:()=>void;
 constructor(private o:Options){
  this.scrollEnd='onscrollend' in o.scroller;
  this.off=this.gestures.on('wheel',state=>{const target=this.intent.consume(state,this.destination,this.height);if(target!==null)this.go(target)});
  o.scroller.addEventListener('wheel',this.wheel,{passive:false});
  o.scroller.addEventListener('scroll',this.scroll,{passive:true});
  o.scroller.addEventListener('scrollend',this.end);
  document.addEventListener('visibilitychange',this.visibility);
 }
 get position(){return this.page-this.o.total}
 get target(){return this.destination-this.o.total}
 get moving(){return this.travelling}
 private get page(){return this.o.scroller.scrollTop/this.height}
 private clear(){clearTimeout(this.fallbackTimer)}
 private fallback(){if(!this.scrollEnd){this.clear();this.fallbackTimer=setTimeout(()=>this.settle(),180)}}
 private wheel=(event:WheelEvent)=>{
  if(event.ctrlKey||event.metaKey||this.o.paused()||document.hidden||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();this.gestures.feedWheel(event);
 };
 private scroll=()=>{
  if(this.o.paused()||document.hidden)return;
  this.o.moving(true);this.o.invalidate();this.fallback();
 };
 private end=()=>this.settle();
 private settle(){
  if(document.hidden||this.o.paused())return;
  this.clear();
  // An intermediate scrollend from an interrupted old animation is stale.
  // It must not round the new transition or start another animation.
  if(this.travelling&&Math.abs(this.page-this.destination)>.001)return;
  const page=this.travelling?this.destination:nativeSnapPage(this.page,this.o.total*3);
  if(Math.abs(this.page-page)>.001){this.go(page);return}
  this.travelling=false;
  const centered=recenterPage(page,this.o.total);this.destination=centered;
  if(centered!==page)this.o.scroller.scrollTo({top:centered*this.height,behavior:'instant'});
  this.o.moving(false);this.o.invalidate();
 }
 private go(page:number){
  page=Math.max(0,Math.min(this.o.total*3-1,Math.round(page)));
  if(this.travelling&&page===this.destination)return;
  this.clear();this.destination=page;this.travelling=true;this.o.moving(true);
  this.o.scroller.scrollTo({top:page*this.height,behavior:this.o.reduced()?'instant':'smooth'});
  this.o.invalidate();
  if(Math.abs(this.page-page)<.001)this.settle();else this.fallback();
 }
 resize(){
  const height=Math.max(1,this.o.scroller.clientHeight);
  if(this.initialized&&height===this.height)return;
  const page=this.initialized?Math.round(this.page):this.o.total;
  this.clear();this.height=height;this.initialized=true;this.destination=page;this.travelling=false;
  this.o.root.style.setProperty('--page-height',height+'px');
  this.o.scroller.scrollTo({top:page*height,behavior:'instant'});this.o.invalidate();
 }
 navigate(position:number){this.go(this.o.total+position)}
 freeze(){
  this.clear();this.travelling=false;
  const page=recenterPage(Math.round(this.page),this.o.total);this.destination=page;
  this.o.scroller.scrollTo({top:page*this.height,behavior:'instant'});this.o.moving(false);
 }
 private visibility=()=>{if(document.hidden)this.freeze();else this.o.invalidate()};
 destroy(){this.clear();this.off();this.gestures.disconnect();this.o.scroller.removeEventListener('wheel',this.wheel);this.o.scroller.removeEventListener('scroll',this.scroll);this.o.scroller.removeEventListener('scrollend',this.end);document.removeEventListener('visibilitychange',this.visibility)}
}
