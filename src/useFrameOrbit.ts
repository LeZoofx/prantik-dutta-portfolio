import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {JourneyMotion} from './journeyData';
type Box={x:number;y:number;width:number;height:number;frameTop:number;angle:number;filter:string;stack:string;front:boolean};

function measureCard(card:HTMLElement,body:HTMLElement):Box{
 const style=getComputedStyle(card);
 let frameTop=0;
 for(let node=body.querySelector<HTMLElement>('.depth-film-frame');node&&node!==body;node=node.offsetParent as HTMLElement|null){
  frameTop+=node.offsetTop;
 }
 return {x:card.offsetLeft,y:card.offsetTop,width:card.offsetWidth,height:card.offsetHeight,frameTop,
  angle:parseFloat(style.rotate)||0,filter:getComputedStyle(body).filter,stack:style.zIndex==='auto'?'0':style.zIndex,front:card.classList.contains('slot-0')};
}

function rotatePoint(x:number,y:number,angle:number){
 const radians=angle*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
 return {x:x*c-y*s,y:x*s+y*c};
}

function mediaOrigin(box:Box){
 const cx=box.width/2,cy=box.height/2;
 const rotated=rotatePoint(-cx,box.frameTop-cy,box.angle);
 return {x:box.x+cx+rotated.x,y:box.y+cy+rotated.y};
}
export default function useFrameOrbit(count:number,enabled:boolean,motion:JourneyMotion,playing=false,automatic=true){
 const gallery=useRef<HTMLDivElement>(null),[turn,setTurn]=useState(0),[settledTurn,setSettledTurn]=useState(0),before=useRef(new Map<string,Box>()),animations=useRef<Animation[]>([]),duration=useRef(2200),request=useRef<(step:number)=>void>(()=>{});
 useEffect(()=>{
  const el=gallery.current;if(!el)return;
  let timer:ReturnType<typeof setTimeout>|undefined,deadline:ReturnType<typeof setTimeout>|undefined,pressed=false,started=0,remaining=playing?20000:3200,fallback=false,pending=0;
  const pause=()=>{clearTimeout(timer);clearTimeout(deadline);deadline=undefined;if(started){remaining=Math.max(0,remaining-(performance.now()-started));started=0}for(const a of animations.current)if(a.playState==='running')a.pause()};
  const resume=()=>{
   if(!enabled||count<2||document.hidden||motion.scrolling||pressed&&!pending)return;
   for(const a of animations.current)if(a.playState==='paused')a.play();
   if(animations.current.length||before.current.size||started)return;
   if(pending){const step=Math.sign(pending);pending-=step;begin(step,true);return}
   if(!automatic||pressed)return;
   // The focus clock starts when the main preview is ready, not
   // while scripts/iframes are still loading. Blocked providers retain a facade.
   if(playing&&!fallback&&!el.querySelector('.slot-0 [data-player-state=playing],.slot-0 .instagram-player.embed-loaded')){
    if(!deadline)deadline=setTimeout(()=>{deadline=undefined;fallback=true;resume()},10000);return;
   }
   clearTimeout(deadline);deadline=undefined;started=performance.now();timer=setTimeout(rotate,remaining);
  };
  const down=()=>{pressed=true;pause()},up=()=>{pressed=false;resume()};
  const moving=(event:Event)=>{if((event as CustomEvent<boolean>).detail)pause();else resume()};
  const visibility=()=>{if(document.hidden)pause();else resume()};
  function begin(step:number,manual=false){
   before.current=new Map(Array.from(el!.querySelectorAll<HTMLElement>('.depth-film')).map(card=>[card.dataset.film!,measureCard(card,card.querySelector<HTMLElement>('.depth-film-body')!)]));
   duration.current=manual?700:2200;
   setTurn(value=>((value+step)%count+count)%count);
  }
  request.current=step=>{
   if(!enabled||count<2||document.hidden||!step||!Number.isFinite(step))return;
   pending=Math.max(-3,Math.min(3,pending+Math.trunc(step)));pause();started=0;remaining=playing?20000:3200;fallback=false;
   // Finish the current curve without cancelling/restarting it. Changing rate
   // through WAAPI synchronizes the compositor's existing playback position.
   for(const a of animations.current){
    const length=Number(a.effect?.getTiming().duration)||2200,left=Math.max(0,length-Number(a.currentTime||0));
    a.updatePlaybackRate?.(Math.max(a.playbackRate||1,Math.min(8,left/280)));if(a.playState==='paused')a.play();
   }
   resume();
  };
  const manual=(event:Event)=>request.current(Number((event as CustomEvent<number>).detail));
  function rotate(){
   started=0;remaining=playing?20000:3200;fallback=false;
   if(!enabled||!el||document.hidden||pressed||motion.scrolling||Math.abs(motion.velocity)>.025||Math.abs(motion.target-motion.position)>.015||el.querySelector(':focus-visible')||animations.current.length){resume();return}
   begin(1);
  }
  window.addEventListener('portfolio-motion',moving);window.addEventListener('portfolio-rest',resume);document.addEventListener('visibilitychange',visibility);
  el.addEventListener('portfolio-video-ready',resume);el.addEventListener('portfolio-orbit-rest',resume);el.addEventListener('focusout',resume);
  el.addEventListener('portfolio-orbit-step',manual);
  el.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  if(enabled&&document.documentElement.dataset.previews==='ready')resume();else pause();
  return()=>{pause();request.current=()=>{};window.removeEventListener('portfolio-motion',moving);window.removeEventListener('portfolio-rest',resume);document.removeEventListener('visibilitychange',visibility);el.removeEventListener('portfolio-video-ready',resume);el.removeEventListener('portfolio-orbit-rest',resume);el.removeEventListener('portfolio-orbit-step',manual);el.removeEventListener('focusout',resume);el.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)};
 },[count,enabled,motion,playing,automatic]);
 useLayoutEffect(()=>{
  const el=gallery.current;if(!el||!before.current.size)return;
  if(!motion.reduced)el.dataset.orbiting='true';
  const targets=Array.from(el.querySelectorAll<HTMLElement>('.depth-film')).map(card=>{
   const body=card.querySelector<HTMLElement>('.depth-film-body')!;
   return {card,body,old:before.current.get(card.dataset.film!),next:measureCard(card,body)};
  });
  const options:KeyframeAnimationOptions={duration:duration.current,easing:'cubic-bezier(.36,.02,.24,1)',fill:'both'};
  const crossing=.56,seamCards:HTMLElement[]=[];
  animations.current=[];
  for(const {card,body,old,next} of targets){
   if(!old||!body?.animate||!old.width||!next.width||motion.reduced)continue;
   const scale=old.width/next.width,rotation=old.angle-next.angle;
   const from=mediaOrigin(old),to=mediaOrigin(next);
   const shift=rotatePoint(from.x-to.x,from.y-to.y,-next.angle);
   const rotatedTop=rotatePoint(0,next.frameTop*scale,rotation);
   const dx=shift.x-rotatedTop.x,dy=shift.y+next.frameTop-rotatedTop.y;
   const handoff=old.front!==next.front;
   const direction=Math.sign(next.x-old.x)||1;

   // Align the rotated media edge on frame one, then carry it through the depth arc.
   const poses=[0,.23,crossing,.79,1].map(progress=>{
    const arc=progress===1?0:Math.sin(Math.PI*progress),rest=1-progress;
    const x=dx*rest+direction*14*arc,y=dy*rest-24*arc;
    const z=(next.front?36:old.front?-38:-20)*arc,tilt=(next.front?-7:7)*direction*arc;
    return {offset:progress,transform:`translate3d(${x}px,${y}px,${z}px) rotateY(${tilt}deg) rotateZ(${rotation*rest}deg) scale(${1+(scale-1)*rest})`};
   });
   animations.current.push(body.animate(poses.map((pose,index)=>({
    ...pose,
    ...(index===0?{filter:old.filter,opacity:1}:index===poses.length-1?{filter:next.filter,opacity:1}:{}),
    ...(pose.offset===crossing&&handoff?{opacity:old.front ? .62 : .93}:{}),
   })),options));
   if(old.stack!==next.stack)animations.current.push(card.animate([
    {zIndex:old.stack,easing:'steps(1,end)'},{zIndex:next.stack,offset:crossing},{zIndex:next.stack},
   ],options));
   if(handoff){
    const media=body.querySelector<HTMLElement>('.depth-media-surface,.campaign-tile');
    const glint=body.querySelector<HTMLElement>('.depth-film-seam');
    if(media?.animate&&window.CSS?.supports('mask-image','linear-gradient(black,transparent)')){
     card.dataset.orbitSeam='true';
     seamCards.push(card);
     animations.current.push(media.animate([
      {maskSize:'calc(100% + 32px) 100%'},
      {maskSize:'100% 100%',offset:crossing},
      {maskSize:'calc(100% + 32px) 100%'},
     ],options));
    }
    if(glint?.animate)animations.current.push(glint.animate([
     {opacity:0,transform:`translateX(${-direction*5}px)`},
     {opacity:.42,transform:'translateX(0)',offset:crossing},
     {opacity:0,transform:`translateX(${direction*5}px)`},
    ],options));
   }
   body.querySelectorAll<HTMLElement>('.depth-film-label,.depth-caption,.frame-expand-cue').forEach(label=>{
    animations.current.push(label.animate([{transform:`scale(${1/scale})`},{transform:'scale(1)'}],options));
   });
  }
  const world=el.closest<HTMLElement>('.zoom-world');if(world){world.dataset.layoutVersion=String(turn);world.dispatchEvent(new Event('portfolio-layout',{bubbles:true}))}
  el.dataset.orbitTurn=String(turn);const group=animations.current;
  // Media changes follow actual animation completion, including any tab/scroll pause.
  Promise.all(group.map(a=>a.finished)).then(()=>{if(animations.current!==group)return;setSettledTurn(turn);el.dataset.orbitSettled=String(turn);group.forEach(a=>a.cancel());seamCards.forEach(card=>delete card.dataset.orbitSeam);delete el.dataset.orbiting;animations.current=[];el.dispatchEvent(new Event('portfolio-orbit-rest'))}).catch(()=>{});
  if(document.hidden||motion.scrolling||!enabled)group.forEach(a=>a.pause());
  before.current.clear();
 },[turn]);
 useEffect(()=>()=>{animations.current.forEach(a=>a.cancel());animations.current=[]},[]);
 return {gallery,turn,settledTurn,advance:(step:number)=>request.current(step)};
}
