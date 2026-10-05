import {nativeSnapPage,recenterPage} from './scenePaging';

type Options={scroller:HTMLElement;root:HTMLElement;total:number;reduced:()=>boolean;paused:()=>boolean;moving:(value:boolean)=>void;invalidate:()=>void};

// The browser owns wheel input, momentum and mandatory snap for the entire
// gesture. Observing scrollend must never manufacture a second page advance.
export class NativeSceneScroll {
 private height=1;private initialized=false;private correction:number|null=null;
 private fallbackTimer:ReturnType<typeof setTimeout>|undefined;
 private readonly scrollEnd:boolean;
 constructor(private o:Options){
  this.scrollEnd='onscrollend' in o.scroller;
  o.scroller.addEventListener('scroll',this.scroll,{passive:true});
  o.scroller.addEventListener('scrollend',this.end);
  document.addEventListener('visibilitychange',this.visibility);
 }
 get position(){return this.page-this.o.total}
 private get page(){return this.o.scroller.scrollTop/this.height}
 private clear(){clearTimeout(this.fallbackTimer)}
 private fallback(){if(!this.scrollEnd){this.clear();this.fallbackTimer=setTimeout(()=>this.settle(),180)}}
 private scroll=()=>{
  if(this.o.paused()||document.hidden)return;
  this.o.moving(true);this.o.invalidate();this.fallback();
 };
 private end=()=>this.settle();
 private settle(){
  if(document.hidden||this.o.paused())return;
  this.clear();
  const page=nativeSnapPage(this.page,this.o.total*3);
  if(Math.abs(this.o.scroller.scrollTop-page*this.height)>.75){
   // Recovery only rounds an unfinished stop. It cannot add another page.
   // Native snap normally finishes exactly; this covers older implementations.
   if(this.correction!==page){this.correction=page;this.o.scroller.scrollTo({top:page*this.height,behavior:this.o.reduced()?'instant':'smooth'});this.fallback()}
   return;
  }
  this.correction=null;
  const centered=recenterPage(page,this.o.total);
  if(centered!==page)this.o.scroller.scrollTo({top:centered*this.height,behavior:'instant'});
  this.o.moving(false);this.o.invalidate();
 }
 resize(){
  const height=Math.max(1,this.o.scroller.clientHeight);
  if(this.initialized&&height===this.height)return;
  const page=this.initialized?Math.round(this.page):this.o.total;
  this.clear();this.correction=null;this.height=height;this.initialized=true;
  this.o.root.style.setProperty('--page-height',height+'px');
  this.o.scroller.scrollTo({top:page*height,behavior:'instant'});this.o.invalidate();
 }
 navigate(position:number){
  this.clear();this.correction=null;this.o.moving(true);
  const page=Math.max(0,Math.min(this.o.total*3-1,this.o.total+position));
  this.o.scroller.scrollTo({top:page*this.height,behavior:this.o.reduced()?'instant':'smooth'});
  this.o.invalidate();
  if(Math.abs(this.page-page)<.001)this.settle();else this.fallback();
 }
 freeze(){
  this.clear();this.correction=null;
  const page=recenterPage(Math.round(this.page),this.o.total);
  this.o.scroller.scrollTo({top:page*this.height,behavior:'instant'});this.o.moving(false);
 }
 private visibility=()=>{if(document.hidden)this.freeze();else this.o.invalidate()};
 destroy(){this.clear();this.o.scroller.removeEventListener('scroll',this.scroll);this.o.scroller.removeEventListener('scrollend',this.end);document.removeEventListener('visibilitychange',this.visibility)}
}
