import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import './scroll-guide.css';

const previewSeen='portfolio-gesture-guide-v3-seen';
const previewDuration=5400;
const navigationKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home',' ']);

function rememberPreview(){
 try{sessionStorage.setItem(previewSeen,'1')}catch{}
}

export default function ScrollGuide({root,mobile,automatic,open,reduced,onClose}:{
 root:RefObject<HTMLDivElement|null>;
 mobile:boolean;
 automatic:boolean;
 open:boolean;
 reduced:boolean;
 onClose:()=>void;
}){
 const [preview,setPreview]=useState(false);
 const [position,setPosition]=useState<{left:number;top:number;width:number}|null>(null);
 const used=useRef(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const visible=open||(automatic&&preview);

 useEffect(()=>{
  if(open){used.current=true;rememberPreview();}
  if(!automatic){setPreview(false);return;}
  if(used.current)return;
  try{if(sessionStorage.getItem(previewSeen)){used.current=true;return;}}catch{}
  function prepare(){
   if(used.current)return;
   clearTimeout(timer.current);
   if(document.hidden)return;
   timer.current=setTimeout(()=>{
    if(used.current||document.hidden)return;
    used.current=true;
    rememberPreview();
    setPreview(true);
    timer.current=setTimeout(()=>setPreview(false),previewDuration);
   },1600);
  }
  prepare();
  document.addEventListener('visibilitychange',prepare);
  return()=>{
   clearTimeout(timer.current);
   document.removeEventListener('visibilitychange',prepare);
  };
 },[automatic,open]);

 useEffect(()=>{
  const container=root.current;
  if(!container||(!open&&(!automatic||(used.current&&!preview))))return;
  const abort=new AbortController();
  const options={capture:true,passive:true,signal:abort.signal};
  let start:{id:number;x:number;y:number}|undefined;
  function dismiss(){
   clearTimeout(timer.current);
   used.current=true;
   rememberPreview();
   setPreview(false);
   if(open)onClose();
   abort.abort();
  }
  container.addEventListener('wheel',event=>{
   if(!event.ctrlKey&&!event.metaKey&&(event.deltaX||event.deltaY))dismiss();
  },options);
  container.addEventListener('pointerdown',event=>{
   start=event.isPrimary&&event.pointerType==='touch'?{id:event.pointerId,x:event.clientX,y:event.clientY}:undefined;
  },options);
  container.addEventListener('pointermove',event=>{
   if(start?.id===event.pointerId&&Math.max(Math.abs(event.clientX-start.x),Math.abs(event.clientY-start.y))>=24)dismiss();
  },options);
  container.addEventListener('pointerup',()=>{start=undefined;},options);
  container.addEventListener('pointercancel',()=>{start=undefined;},options);
  container.addEventListener('keydown',event=>{
   if(navigationKeys.has(event.key)&&event.target===container.querySelector('.depth-scroll'))dismiss();
  },options);
  container.addEventListener('click',event=>{
   const control=(event.target as Element|null)?.closest?.('.depth-topbar button, .depth-index, .depth-navigation button');
   if(control&&!control.classList.contains('scroll-guide-toggle'))dismiss();
  },options);
  return()=>abort.abort();
 },[automatic,onClose,open,preview,root]);

 useLayoutEffect(()=>{
  if(!visible)return;
  const container=root.current;
  const stage=container?.querySelector('.depth-stage');
  if(!container||!stage)return;
  const gallery=container.querySelector('.zoom-world[data-active=true] .depth-gallery');
  const footer=container.querySelector('.depth-bottom');
  function measure(){
   const bounds=container!.getBoundingClientRect(),area=(gallery||stage)!.getBoundingClientRect();
   const width=Math.max(0,Math.min(286,bounds.width-24));
   const left=Math.max(width/2+12,Math.min(bounds.width-width/2-12,area.left-bounds.left+area.width/2));
   const y=area.top-bounds.top+area.height*.58;
   const bottom=(footer?.getBoundingClientRect().top??bounds.bottom)-bounds.top;
   const top=Math.min(Math.max(y,90),Math.max(90,bottom-50));
   setPosition({left,top,width});
  }
  measure();
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):undefined;
  for(const element of [container,stage,gallery,footer])if(element)observer?.observe(element);
  window.addEventListener('resize',measure);
  return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
 },[root,mobile,visible]);

 if(!visible||!position)return null;
 return <aside id="explore-scroll-guide" className="scroll-guide" data-preview={!open}
  data-reduced={reduced} key={open?'manual':'preview'} style={position} aria-label="Explore scroll guide">
  <p>{mobile?'Swipe over the videos':'Scroll over the videos'}</p>
  <div className="scroll-guide-cue" data-axis="horizontal">
   <span className="scroll-guide-arrow" aria-hidden="true">↔</span>
   <span className="scroll-guide-reel" aria-hidden="true"><span><i/><i/><i/><i/></span></span>
   <span><b>{mobile?'Swipe sideways':'Scroll sideways'}</b><small>Browse videos</small></span>
  </div>
  <div className="scroll-guide-cue" data-axis="vertical">
   <span className="scroll-guide-arrow" aria-hidden="true">↕</span>
   <span className="scroll-guide-reel" aria-hidden="true"><span><i/><i/></span></span>
   <span><b>{mobile?'Swipe up or down':'Scroll up or down'}</b><small>Change pages</small></span>
  </div>
  {!mobile&&<small className="scroll-guide-wheel">Shift + wheel also browses videos</small>}
 </aside>;
}
