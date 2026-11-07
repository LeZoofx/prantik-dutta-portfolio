import {useEffect,type RefObject} from 'react';
import {mobileLayout} from './capabilities';
import './explore-opening.css';

const duration=1400;
const frameOptions:KeyframeAnimationOptions={duration,fill:'both'};
const closeEase='cubic-bezier(.42,.06,.25,1)';
const fold=.34,settle=.88;

export default function ExploreOpening({bar,available,enabled,mobile,onActiveChange}:{
 bar:RefObject<HTMLDivElement|null>;
 available?:{current:boolean};
 enabled:boolean;
 mobile:boolean;
 onActiveChange:(active:boolean)=>void;
}){
 useEffect(()=>{
  if(!enabled||!available?.current||mobile!==matchMedia(mobileLayout).matches||typeof Element.prototype.animate!=='function')return;
  const mode=new URLSearchParams(location.search).get('mode');
  if(mode==='overview'||mode==='normal'||matchMedia('(prefers-reduced-motion: reduce)').matches){
   available.current=false;
   return;
  }
  const events=new AbortController();
  const animations:Animation[]=[];
  let layer:HTMLDivElement|undefined;
  let frame=0;

  function dismiss(){
   events.abort();
   cancelAnimationFrame(frame);
   if(layer){
    layer.remove();
    layer=undefined;
    onActiveChange(false);
   }
   for(const animation of animations)animation.cancel();
  }
  function interrupt(){
   available!.current=false;
   dismiss();
  }
  for(const type of ['wheel','keydown','focusin','resize','pagehide']){
   window.addEventListener(type,interrupt,{capture:true,passive:true,signal:events.signal});
  }

  frame=requestAnimationFrame(()=>{
   const destination=bar.current;
   if(!destination||document.hidden)return dismiss();
   const barBounds=destination.getBoundingClientRect();
   if(!barBounds.width||!barBounds.height)return dismiss();
   available.current=false;
   const controls=[...destination.querySelectorAll<HTMLElement>('nav > button, .depth-index')];
   const targets=controls.map(control=>control.getBoundingClientRect());
   const navBounds=destination.querySelector('nav')!.getBoundingClientRect();
   const surfaceStyle=getComputedStyle(destination);
   layer=document.createElement('div');
   layer.className='explore-opening';
   layer.style.setProperty('--opening-duration',duration+'ms');
   layer.setAttribute('aria-hidden','true');
   // Swallow taps that land on the opening so they cannot reach the live controls.
   const ignorePointer=(event:Event)=>{event.preventDefault();event.stopPropagation();};
   for(const type of ['pointerdown','pointerup','click','auxclick','touchstart','touchend','contextmenu']){
    layer.addEventListener(type,ignorePointer,{passive:false});
   }
   const surface=document.createElement('div');
   surface.className='explore-opening-surface';
   surface.style.backgroundImage=surfaceStyle.backgroundImage;
   const texture=document.createElement('div');
   texture.className='explore-opening-texture';
   surface.append(texture);
   const grid=document.createElement('div');
   grid.className='explore-opening-grid';
   const tiles=controls.map(control=>{
    const tile=document.createElement('span');
    const shortcut=control.classList.contains('ai-access');
    tile.className='explore-opening-tile';
    if(shortcut)tile.dataset.shortcut=control.getAttribute('aria-label')?.includes('Campaigns')?'campaigns':'ai';
    if(control.classList.contains('depth-index'))tile.dataset.index='';
    if(control.hasAttribute('aria-current'))tile.dataset.current='';
    const label=control.querySelector('.ai-access-label')?.textContent||control.textContent;
    tile.textContent=shortcut?'✳  '+label+'  ↗':label;
    grid.append(tile);
    return tile;
   });
   layer.append(surface,grid);
   document.body.append(layer);
   onActiveChange(true);
   const {width,height}=layer.getBoundingClientRect();
   const origins=tiles.map(tile=>tile.getBoundingClientRect());

   // Measure both layouts once and move only compositor properties.
   const surfaceEnd=`translate(${barBounds.left}px,${barBounds.top}px) scale(${barBounds.width/width},${barBounds.height/height})`;
   const collapse=surface.animate([
    {transform:'none',opacity:1},
    {transform:'none',opacity:1,offset:fold,easing:closeEase},
    {transform:surfaceEnd,opacity:1,offset:settle,easing:'ease-out'},
    {transform:surfaceEnd,opacity:0},
   ],frameOptions);
   animations.push(collapse,texture.animate([{opacity:1},{opacity:.92,offset:fold,easing:'ease-in-out'},{opacity:0,offset:settle},{opacity:0}],frameOptions));
   tiles.forEach((tile,index)=>{
    const start=origins[index],target=targets[index];
    const isIndex=controls[index].classList.contains('depth-index');
    const left=isIndex?0:navBounds.left;
    const right=isIndex?width:navBounds.right;
    const centre=Math.max(left,Math.min(right,target.left+target.width/2));
    const deltaX=centre-(start.left+start.width/2);
    const deltaY=(target.top+target.height/2)-(start.top+start.height/2);
    const scale=Math.min(target.width/start.width,target.height/start.height);
    const end=`translate(${deltaX}px,${deltaY}px) scale(${scale})`;
    const pop=tile.dataset.shortcut==='campaigns' ? .035 : tile.dataset.shortcut==='ai' ? .178 : undefined;
    const entrance:Keyframe[]=[{transform:'none',opacity:1}];
    if(pop!==undefined)entrance.push(
     {offset:pop,transform:'none',opacity:1,easing:'ease-out'},
     {offset:pop+.072,transform:'translateY(-4px) scale(1.13)',opacity:1,easing:'ease-in-out'},
     {offset:pop+.14,transform:'none',opacity:1},
    );
    animations.push(tile.animate([
     ...entrance,
     {transform:'none',opacity:1,offset:fold,easing:closeEase},
     {transform:end,opacity:target.left>=left&&target.right<=right?1:0,offset:settle,easing:'ease-out'},
     {transform:end,opacity:0},
    ],frameOptions));
   });
   collapse.onfinish=dismiss;
  });
  return dismiss;
 },[available,bar,enabled,mobile,onActiveChange]);

 return null;
}
