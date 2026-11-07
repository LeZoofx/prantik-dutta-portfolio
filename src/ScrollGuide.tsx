import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import './scroll-guide.css';

const beatLength=2000;
const navigationKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home',' ']);
const ease=(from:number,to:number,time:number)=>{
 const t=Math.max(0,Math.min(1,(time-from)/(to-from)));
 return t*t*(3-2*t);
};

function Glove(){
 const shade=useId();
 return <svg className="guide-glove" viewBox="0 0 54 61" aria-hidden="true">
  <defs><linearGradient id={shade} x1="0" y1="0" x2="1" y2="1">
   <stop stopColor="#fffef1"/><stop offset=".52" stopColor="#ececdf"/><stop offset="1" stopColor="#9aaea8"/>
  </linearGradient></defs>
  <path d="M17 52c-2-3-3-8-5-12L5 29c-3-5 2-9 6-6l7 7V9c0-7 10-8 10-1v15c3-5 9-4 10 0 4-4 9-2 9 3 4-1 6 2 5 7l-3 12c-1 4-3 6-7 9Z"
   fill={`url(#${shade})`} stroke="#354945" strokeWidth="1.8" strokeLinejoin="round"/>
  <path d="m17 49 26 2 1 7-27 1Z" fill="#abc8bc" stroke="#354945" strokeWidth="1.8" strokeLinejoin="round"/>
  <path d="M21 12v12m8 6-1 9m8-11-2 10m8-9-2 8M15 32c5 2 7 6 8 10" fill="none" stroke="#7f938a" strokeWidth="1.45" strokeLinecap="round"/>
 </svg>;
}

export default function ScrollGuide({root,mobile,automatic,entry,open,reduced,onClose,onPagePreview,onActiveChange}:{
 root:RefObject<HTMLDivElement|null>;
 mobile:boolean;
 automatic:boolean;
 entry?:{current:boolean};
 open:boolean;
 reduced:boolean;
 onClose:()=>void;
 onPagePreview:(amount:number)=>void;
 onActiveChange:(active:boolean)=>void;
}){
 const [preview,setPreview]=useState(false);
 const layer=useRef<HTMLElement>(null);
 const stopDemo=useRef(()=>{});
 const visible=open||(automatic&&preview);
 const close=useCallback(()=>{
  stopDemo.current();
  if(entry)entry.current=false;
  setPreview(false);
  if(open)onClose();
 },[entry,onClose,open]);

 useEffect(()=>{
  if(open||!automatic){
   if(open&&entry)entry.current=false;
   setPreview(false);
   return;
  }
  if(!entry?.current)return;
  function show(){
   if(!entry?.current||document.hidden)return;
   entry.current=false;
   setPreview(true);
  }
  show();
  document.addEventListener('visibilitychange',show);
  return()=>document.removeEventListener('visibilitychange',show);
 },[automatic,entry,open]);

 useEffect(()=>{
  const container=root.current;
  if(!container||(!visible&&!entry?.current))return;
  const abort=new AbortController();
  const options={capture:true,passive:true,signal:abort.signal};
  const interrupt=()=>{close();abort.abort()};
  container.addEventListener('wheel',event=>{
   if(!event.ctrlKey&&!event.metaKey&&(event.deltaX||event.deltaY))interrupt();
  },options);
  container.addEventListener('pointerdown',event=>{
   if(!(event.target as Element|null)?.closest?.('.scroll-guide-toggle'))interrupt();
  },options);
  container.addEventListener('click',event=>{
   const control=(event.target as Element|null)?.closest?.('.depth-topbar button,.depth-index,.depth-navigation button');
   if(control&&!control.classList.contains('scroll-guide-toggle'))interrupt();
  },options);
  window.addEventListener('keydown',event=>{
   if(event.key==='Escape'||navigationKeys.has(event.key)&&event.target===container.querySelector('.depth-scroll'))interrupt();
  },options);
  window.addEventListener('resize',interrupt,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&visible)interrupt()},options);
  return()=>abort.abort();
 },[close,entry,root,visible]);

 useLayoutEffect(()=>{
  const container=root.current,cue=layer.current;
  const gallery=container?.querySelector<HTMLElement>('.zoom-world[data-active=true] .depth-gallery');
  const focal=gallery?.querySelector<HTMLElement>('.slot-0 .depth-film-frame');
  if(!visible||!container||!cue)return;
  const bounds=container.getBoundingClientRect(),frame=focal?.getBoundingClientRect()??bounds;
  const x=Math.max(110,Math.min(bounds.width-76,frame.left-bounds.left+frame.width*.59));
  const y=Math.max(54,Math.min(bounds.height-120,frame.top-bounds.top+frame.height*.68));
  const dragX=Math.min(96,bounds.width*.18,x-76),dragY=Math.min(94,bounds.height*.15);
  const next=gallery?.querySelector<HTMLElement>('.slot-1');
  const focus=gallery?.querySelector<HTMLElement>('.slot-0');
  const cardEffects:Animation[]=[];
  if(!reduced&&focus?.animate){
   const options:KeyframeAnimationOptions={duration:1000,fill:'both'};
   cardEffects.push(focus.animate([{translate:'0px 0px'},{translate:`-${dragX}px 0px`}],options));
   if(next){
    const side=next.getBoundingClientRect();
    const approach=Math.max(-dragX,Math.min(dragX,(frame.left+frame.width/2-side.left-side.width/2)*.32));
    cardEffects.push(next.animate([{translate:'0px 0px',scale:'1'},{translate:`${approach}px 0px`,scale:'1.08'}],options));
   }
   for(const effect of cardEffects){effect.pause();effect.currentTime=0}
  }

  let animation=0,start:number|undefined,playing=true,lastPage=0;
  onActiveChange(true);
  function stop(){
   if(!playing)return;
   playing=false;
   cancelAnimationFrame(animation);
   cardEffects.forEach(effect=>effect.cancel());
   if(lastPage)onPagePreview(0);
   onActiveChange(false);
  }
  stopDemo.current=stop;
  function draw(now:number){
   start??=now;
   const elapsed=now-start;
   if(elapsed>=beatLength*2){close();return}
   const page=elapsed>=beatLength,time=elapsed%beatLength;
   const drag=reduced?0:ease(430,1030,time)-ease(1220,1650,time);
   const enter=reduced?1:ease(0,380,time),leave=reduced?0:ease(1670,1980,time);
   const contact=reduced?1:ease(320,460,time)-ease(1280,1550,time);
   const handX=x+(page?0:-dragX*drag)+(1-enter)*(page?28:bounds.width-x+60);
   const handY=y-(page?dragY*drag:0)+(1-enter)*(page?bounds.height-y+60:24)+18*leave;
   cue!.dataset.axis=page?'page':'exhibit';
   cue!.style.setProperty('--guide-tip-x',handX+'px');
   cue!.style.setProperty('--guide-tip-y',handY+'px');
   cue!.style.setProperty('--guide-visible',String(enter*(1-leave)));
   cue!.style.setProperty('--guide-contact',String(contact*(1-leave)));
   for(const effect of cardEffects)effect.currentTime=page?0:drag*1000;
   const amount=page?drag*.38:0;
   if(amount!==lastPage){lastPage=amount;onPagePreview(amount)}
   animation=requestAnimationFrame(draw);
  }
  animation=requestAnimationFrame(draw);
  return stop;
 },[close,onActiveChange,onPagePreview,reduced,root,visible]);

 if(!visible)return null;
 return <aside ref={layer} id="explore-scroll-guide" className="scroll-guide" data-preview={!open} data-axis="exhibit" aria-label="Explore scroll guide">
  <div className="guide-contact" aria-hidden="true"/>
  <div className="guide-pointer" aria-hidden="true"><Glove/></div>
  <div className="guide-label" aria-hidden="true">
   <span className="guide-exhibit"><b>↔</b> Next exhibit</span>
   <span className="guide-page"><b>↕</b> Next page</span>
  </div>
  <p className="sr-only">{mobile?'Swipe':'Scroll'} left or right over the videos for the next exhibit. {mobile?'Swipe':'Scroll'} up or down for the next page.</p>
 </aside>;
}
