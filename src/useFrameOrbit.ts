import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {JourneyMotion} from './journeyData';
type Box={x:number;y:number;width:number;angle:number;filter:string};
export default function useFrameOrbit(count:number,enabled:boolean,motion:JourneyMotion,playing=false){
 const gallery=useRef<HTMLDivElement>(null),[turn,setTurn]=useState(0),[settledTurn,setSettledTurn]=useState(0),before=useRef(new Map<string,Box>()),animations=useRef<Animation[]>([]);
 useEffect(()=>{
  const el=gallery.current;if(!el)return;
  let timer:ReturnType<typeof setTimeout>|undefined,deadline:ReturnType<typeof setTimeout>|undefined,pressed=false,started=0,remaining=playing?60000:7800,fallback=false;
  const pause=()=>{clearTimeout(timer);clearTimeout(deadline);deadline=undefined;if(started){remaining=Math.max(0,remaining-(performance.now()-started));started=0}for(const a of animations.current)if(a.playState==='running')a.pause()};
  const resume=()=>{
   if(!enabled||count<2||document.hidden||motion.scrolling||pressed)return;
   for(const a of animations.current)if(a.playState==='paused')a.play();
   if(animations.current.length||started)return;
   // The 60-second focus clock starts when the main preview is ready, not
   // while scripts/iframes are still loading. Blocked providers retain a facade.
   if(playing&&!fallback&&!el.querySelector('.slot-0 [data-player-state=playing],.slot-0 .instagram-player.embed-loaded')){
    if(!deadline)deadline=setTimeout(()=>{deadline=undefined;fallback=true;resume()},10000);return;
   }
   clearTimeout(deadline);deadline=undefined;started=performance.now();timer=setTimeout(rotate,remaining);
  };
  const down=()=>{pressed=true;pause()},up=()=>{pressed=false;resume()};
  const moving=(event:Event)=>{if((event as CustomEvent<boolean>).detail)pause();else resume()};
  const visibility=()=>{if(document.hidden)pause();else resume()};
  function rotate(){
   started=0;remaining=playing?60000:7800;fallback=false;
   if(!enabled||!el||document.hidden||pressed||motion.scrolling||Math.abs(motion.velocity)>.025||Math.abs(motion.target-motion.position)>.015||el.querySelector(':focus-visible')||animations.current.length){resume();return}
   before.current=new Map(Array.from(el.querySelectorAll<HTMLElement>('.depth-film')).map(card=>[card.dataset.film!,{x:card.offsetLeft,y:card.offsetTop,width:card.offsetWidth,angle:parseFloat(getComputedStyle(card).rotate)||0,filter:getComputedStyle(card.querySelector('.depth-film-body')!).filter}]));
   setTurn(value=>(value+1)%count);
  }
  window.addEventListener('portfolio-motion',moving);window.addEventListener('portfolio-rest',resume);document.addEventListener('visibilitychange',visibility);
  el.addEventListener('portfolio-video-ready',resume);el.addEventListener('portfolio-orbit-rest',resume);el.addEventListener('focusout',resume);
  el.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  if(enabled&&document.documentElement.dataset.previews==='ready')resume();else pause();
  return()=>{pause();window.removeEventListener('portfolio-motion',moving);window.removeEventListener('portfolio-rest',resume);document.removeEventListener('visibilitychange',visibility);el.removeEventListener('portfolio-video-ready',resume);el.removeEventListener('portfolio-orbit-rest',resume);el.removeEventListener('focusout',resume);el.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)};
 },[count,enabled,motion,playing]);
 useLayoutEffect(()=>{
  const el=gallery.current;if(!el||!before.current.size)return;
  const moves=Array.from(el.querySelectorAll<HTMLElement>('.depth-film')).map(card=>({card,body:card.querySelector<HTMLElement>('.depth-film-body')!,old:before.current.get(card.dataset.film!),x:card.offsetLeft,y:card.offsetTop,width:card.offsetWidth,angle:parseFloat(getComputedStyle(card).rotate)||0}));
  const targets=moves.map(move=>({...move,filter:getComputedStyle(move.body).filter}));
  animations.current=[];
  for(const {card,body,old,x,y,width,angle,filter} of targets){
   if(!old||!body?.animate||!width)continue;
   const dx=old.x-x,dy=old.y-y,scale=old.width/width,rotation=old.angle-angle,incoming=card.classList.contains('slot-0');
   animations.current.push(body.animate([
    {transform:`translate3d(${dx}px,${dy}px,0) rotateZ(${rotation}deg) scale(${scale})`,filter:old.filter},
    {offset:.5,transform:`translate3d(${dx*.47+(incoming?-30:30)}px,${dy*.47-35}px,${incoming?55:-65}px) rotateY(${incoming?-11:11}deg) rotateZ(${rotation*.47}deg) scale(${scale+(1-scale)*.53})`,filter:incoming?'blur(.7px) brightness(.92)':'blur(1.7px) brightness(.72)'},
    {transform:'translate3d(0,0,0) rotateY(0deg) rotateZ(0deg) scale(1)',filter}
   ],{duration:2200,easing:'cubic-bezier(.4,0,.2,1)'}));
   body.querySelectorAll<HTMLElement>('.depth-film-label,.depth-caption,.frame-expand-cue').forEach(label=>{
    animations.current.push(label.animate([{transform:`scale(${1/scale})`},{offset:.5,transform:`scale(${1/(scale+(1-scale)*.53)})`},{transform:'scale(1)'}],{duration:2200,easing:'cubic-bezier(.4,0,.2,1)'}));
   });
  }
  const world=el.closest<HTMLElement>('.zoom-world');if(world){world.dataset.layoutVersion=String(turn);world.dispatchEvent(new Event('portfolio-layout',{bubbles:true}))}
  const group=animations.current;
  // Media changes follow actual animation completion, including any tab/scroll pause.
  Promise.all(group.map(a=>a.finished)).then(()=>{if(animations.current!==group)return;setSettledTurn(turn);group.forEach(a=>a.cancel());animations.current=[];el.dispatchEvent(new Event('portfolio-orbit-rest'))}).catch(()=>{});
  if(document.hidden||motion.scrolling||!enabled)group.forEach(a=>a.pause());
  before.current.clear();
 },[turn]);
 useEffect(()=>()=>{animations.current.forEach(a=>a.cancel());animations.current=[]},[]);
 return {gallery,turn,settledTurn};
}
