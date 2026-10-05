import {Suspense,lazy,memo,useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {asset,previewAsset,previewSrcSet,href,projectPath,platformLabel,type Project} from './content';
import {buildSections,brandFor,portfolioCategories,type PortfolioSection,type WorkSort} from './portfolioSections';
import type {JourneyMotion} from './journeyData';
import BrandControls from './BrandControls';
import {ResultsRibbon} from './Results';
import JourneyPlayer from './JourneyPlayer';
import KineticName from './KineticName';
import KineticType from './KineticType';
import SceneAccents from './SceneAccents';
import ClientMarquee from './ClientMarquee';
import PosterType,{KineticCopy} from './PosterType';
import {posterCopy} from './artStyles';
import showcase from '../content/showcase.json';
import positioning from '../content/positioning.json';
import {usePerformance,listenMedia} from './Performance';
import useFrameOrbit from './useFrameOrbit';
import './journey.css';
import './depth-journey.css';
import Scene from './JourneyScene';
import {ScenePager,swipePages} from './scenePaging';
import {NativeSceneScroll} from './NativeSceneScroll';
import {NativeSceneAnimator,type SceneExit} from './NativeSceneAnimator';
import PlaybackToggle from './PlaybackToggle';
const SecretPlayer=lazy(()=>import('./SecretPlayer'));
const themes=['glass','mass','cut','desktop','afterimage','editorial'];
const modulo=(n:number,total:number)=>((n%total)+total)%total;
const smooth=(a:number,b:number,value:number)=>{const n=Math.max(0,Math.min(1,(value-a)/(b-a)));return n*n*(3-2*n)};
const title=(p:Project)=>p.title.split(' | ')[0].replace(/\s*\(Official.*$/i,'').replace(/\s*- Official Trailer$/i,'');
function Discovery({project,onReveal,theme,motion}:{project:Project;onReveal:(p:Project)=>void;theme:number;motion:JourneyMotion}){
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{const cancel=()=>clearTimeout(timer.current);window.addEventListener('portfolio-motion',cancel);return()=>{cancel();window.removeEventListener('portfolio-motion',cancel)}},[]);
 return <button className={'depth-discovery discovery-object-'+theme} aria-label={'Discover '+title(project)} onPointerEnter={e=>{if(e.pointerType==='mouse'&&!motion.scrolling&&Math.abs(motion.target-motion.position)<.001)timer.current=setTimeout(()=>{if(!motion.scrolling&&Math.abs(motion.target-motion.position)<.001)onReveal(project)},800)}} onPointerLeave={()=>clearTimeout(timer.current)} onClick={()=>onReveal(project)}><span className="discovery-solid" aria-hidden="true">{Array.from({length:6},(_,i)=><i key={i}/>)}</span></button>
}
function DepthWorld({section,active,autoplay,compact,paused,playing,muted,onProject,onDiscover,onProcess,motion,rotate}:{motion:JourneyMotion;rotate:boolean;section:PortfolioSection;active:boolean;autoplay:boolean;compact:boolean;paused:boolean;playing:boolean;muted:boolean;onProject:(p:Project)=>void;onDiscover:(p:Project)=>void;onProcess:()=>void}){
 const {maxPlayers,ready,quality}=usePerformance();
 const {gallery,turn,settledTurn:playTurn}=useFrameOrbit(section.items.length,active&&rotate&&!paused&&ready,motion,playing);
 // Keep outgoing players alive until their movement finishes; retained frames never restart.
 const ordered=[...section.items.slice(playTurn),...section.items.slice(0,playTurn)];
 const playable=ordered.filter(p=>p.provider==='youtube'||p.provider==='instagram').slice(0,Math.min(compact?2:3,maxPlayers)).map(p=>p.id);
 return <><SceneAccents theme={section.theme} art={section.art}/><div className="depth-heading">{section.category==='selected'&&section.offset===0?<><p className="depth-specialty"><KineticCopy text={positioning.eyebrow}/></p><h1><KineticName/></h1><PosterType lines={posterCopy.selected} art={section.art} className="depth-poster-copy"/><button className="process-link" onClick={onProcess}>How I lead a project ↗</button></>:<><p className="depth-specialty"><KineticCopy text={section.focus}/></p><h2><KineticType text={section.title} variant={section.theme}/></h2><PosterType lines={posterCopy[section.category]} art={section.art} className="depth-poster-copy"/></>}</div>
 <div className="depth-type-field" aria-hidden="true"><KineticType text={section.category==='selected'?'CREATE':section.title.toUpperCase()} variant={section.theme}/></div>
 <div className="depth-gallery" ref={gallery}>{section.items.map((p,i)=><article data-film={p.id} className={'depth-film slot-'+modulo(i-turn,section.items.length)+((p.aspect||16/9)<1?' portrait-film':'')} key={p.id} style={{'--film-ratio':p.aspect||16/9,'--tile':i} as CSSProperties}>
  <div className="depth-film-body"><div className="depth-film-float"><div className="depth-film-label"><span><KineticCopy text={brandFor(p)||section.title}/></span><span className="depth-platform">{platformLabel(p)} <i aria-hidden="true">{section.theme===3?'_ □':'↗'}</i></span></div>
  <div className="depth-film-frame"><div className="depth-media-surface" inert>{active&&ready&&playing&&!paused&&(p.provider==='instagram'||p.provider==='youtube')?<JourneyPlayer project={p} enabled={autoplay&&playable.includes(p.id)} muted={muted||p.id!==playable[0]} playing={playing&&(quality==='full'||p.id===playable[0])} onOpen={()=>onProject(p)}/>:<a className="depth-poster" href={projectPath(p.id)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onProject(p)}}} aria-label={'Watch '+title(p)}>{p.poster?<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={title(p)} loading={active?'eager':'lazy'} fetchPriority={active&&i===0?'high':'low'} decoding="async"/>:<span>{title(p)}</span>}<span className="depth-play" aria-hidden="true">▶</span></a>}</div><a className="depth-video-hitarea" href={projectPath(p.id)} aria-label={'Expand video: '+title(p)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onProject(p)}}}><span className="frame-expand-cue" aria-hidden="true"><span className="expand-corners">⤢</span><span>Expand</span></span></a></div>
  <a className="depth-caption" href={projectPath(p.id)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onProject(p)}}}><KineticCopy text={title(p)}/><span aria-hidden="true">↗</span></a>
 </div></div></article>)}</div>
 <Discovery project={section.items[Math.min(2,section.items.length-1)]} onReveal={onDiscover} theme={section.theme} motion={motion}/>
 <div className="depth-registration" aria-hidden="true"><i/><i/><i/><i/></div></>;
}
const MemoDepthWorld=memo(DepthWorld);
export default function Universe({header,projects,onProject,onIndex,onProcess,paused,reduced}:{header:ReactNode;projects:Project[];onProject:(p:Project)=>void;onIndex:()=>void;onProcess:()=>void;paused:boolean;reduced:boolean}){
 const performance=usePerformance(),playing=performance.autoplay;
 const [rotate,setRotate]=useState(true);
 const [brand,setBrand]=useState('all'),[sort,setSort]=useState<WorkSort>('curated'),[compact,setCompact]=useState(false),[saveData,setSaveData]=useState(false);
 const sections=useMemo(()=>buildSections(projects,sort,brand,compact?3:6),[projects,sort,brand,compact]);
 const total=sections.length,root=useRef<HTMLDivElement>(null),scroll=useRef<HTMLDivElement>(null),worldRefs=useRef(new Map<number,HTMLDivElement>()),backdropRefs=useRef(new Map<number,HTMLDivElement>());
 const [chapter,setChapter]=useState(0),[playChapter,setPlayChapter]=useState(0),[base,setBase]=useState(0),[flight,setFlight]=useState<number[]>([]),[secret,setSecret]=useState<Project|null>(null),[muted,setMuted]=useState(true),[shuffle,setShuffle]=useState(0),[held,setHeld]=useState(false);
 const motion=useMemo<JourneyMotion>(()=>({position:0,target:0,pointerX:0,pointerY:0,velocity:0,time:0,active:true,low:false,reduced:false,invalidate:()=>{}}),[]);
 const settings=useRef({paused,reduced,secret:!!secret,quality:performance.quality});settings.current={paused,reduced,secret:!!secret,quality:performance.quality};motion.active=!paused&&!secret;motion.reduced=reduced;motion.low=performance.quality!=='full';
 const wake=useRef(()=>{}),bindPlanes=useRef(()=>{}),navigate=useRef<(index:number)=>void>(()=>{}),current=useRef(0);
 const section=sections[modulo(chapter,total)]||sections[0];
 const availableCategories=portfolioCategories.filter(category=>sections.some(s=>s.category===category.id));
 const nextCategory=availableCategories[(availableCategories.findIndex(category=>category.id===section.category)+1)%availableCategories.length];
 const shuffleProject=projects.find(p=>p.id===showcase[shuffle%showcase.length].id)||projects[0];
 useEffect(()=>{const mq=matchMedia('(max-width:699px)');const sync=()=>setCompact(mq.matches);sync();const stop=listenMedia(mq,sync);const n=navigator as Navigator&{connection?:{saveData?:boolean};deviceMemory?:number};setSaveData(!!n.connection?.saveData);return stop},[motion]);
 useEffect(()=>{if(!performance.ready||reduced||held||paused||section.category!=='selected')return;const timer=setInterval(()=>{if(!document.hidden&&!motion.scrolling)setShuffle(i=>(i+1+Math.floor(Math.random()*(showcase.length-1)))%showcase.length)},1700);return()=>clearInterval(timer)},[reduced,held,paused,performance.ready,section.category,motion]);
 useEffect(()=>{
  const scroller=scroll.current,outer=root.current;if(!scroller||!outer||!total)return;
  let raf=0,last=0,px=0,py=0,lastBase=-1,lastChapter=-1,scrolling=false;
  motion.position=0;motion.target=0;current.current=0;setChapter(0);setPlayChapter(0);setBase(0);setFlight([]);
  const stage=outer.querySelector<HTMLElement>('.depth-stage')!;
  let width=scroller.clientWidth,height=stage.clientHeight,pageHeight=scroller.clientHeight;
  const native=!matchMedia('(pointer:coarse)').matches||innerWidth>=700;
  outer.dataset.native=String(native);
  const pager=new ScenePager(),landscape=outer.querySelector<HTMLElement>('.depth-landscape');
  const nativeController=native?new NativeSceneScroll({scroller,root:outer,total,reduced:()=>settings.current.reduced,paused:()=>settings.current.paused||settings.current.secret,moving:markMoving,invalidate:start,prepare:(from,to)=>{
   const first=Math.round(from),direction=Math.sign(to-first),count=Math.min(total,Math.abs(to-first)+1);
   setFlight(Array.from({length:count},(_,i)=>modulo(first+i*direction,total)));
  }}):null;
  const animator=native&&NativeSceneAnimator.supported()?new NativeSceneAnimator(scroller):null;
  const worlds=outer.querySelector<HTMLElement>('.depth-worlds');
  let accelerated=false;
  let written=new WeakMap<HTMLElement,Map<string,string>>();
  function write(el:HTMLElement,name:string,value:string){let values=written.get(el);if(!values){values=new Map();written.set(el,values)}if(values.get(name)!==value){el.style.setProperty(name,value);values.set(name,value)}}
  let layouts=new WeakMap<HTMLDivElement,{width:number;height:number;version:string;exits:SceneExit[]}>();
  function prepare(layer:HTMLDivElement){
   const version=layer.dataset.layoutVersion||'',cached=layouts.get(layer);
   if(cached?.width===width&&cached.height===height&&cached.version===version)return cached.exits;
   const exits=Array.from(layer.querySelectorAll<HTMLElement>('.depth-film,.depth-heading,.depth-discovery,.depth-type-field')).map(element=>{
    let x=element.offsetWidth/2,y=element.offsetHeight/2,node:HTMLElement|null=element;
    while(node&&node!==layer){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent as HTMLElement|null}
    x+=layer.offsetLeft;y+=layer.offsetTop;let dx=x-width/2,dy=y-height/2;
    if(Math.hypot(dx/width,dy/height)<.08){dx=width*.25;dy=height*.08}
    const length=Math.hypot(dx,dy),vx=dx/length,vy=dy/length;
    const edgeX=Math.abs(vx)<.001?Infinity:((vx>0?width+element.offsetWidth*.75:-element.offsetWidth*.75)-x)/vx;
    const edgeY=Math.abs(vy)<.001?Infinity:((vy>0?height+element.offsetHeight*.75:-element.offsetHeight*.75)-y)/vy;
    const distance=Math.max(0,Math.min(edgeX,edgeY))+80;
    return {element,x:vx*distance,y:vy*distance,tile:Number(element.style.getPropertyValue('--tile'))||0,film:element.classList.contains('depth-film')};
   });layouts.set(layer,{width,height,version,exits});return exits;
  }
  // Bind every rendering path in the commit's layout phase, including the
  // lightweight mode and browsers without ScrollTimeline. No resting-pose flash.
  bindPlanes.current=()=>paintPlanes(nativeController?.position??motion.position);
  function markMoving(value:boolean){motion.scrolling=value;if(value===scrolling)return;scrolling=value;outer!.dataset.moving=String(value);window.dispatchEvent(new CustomEvent('portfolio-motion',{detail:value}))}
  function paintPlanes(position:number){
   const p=modulo(position,total),nextBase=Math.floor(p),nextChapter=modulo(Math.round(p),total);
   // All layout reads happen before writes, only when a scene/layout actually changes.
   const planes=Array.from(worldRefs.current,([index,layer])=>({index,layer,exits:prepare(layer)}));
   const useTimeline=!!animator&&!settings.current.reduced;
   if(accelerated&&!useTimeline){animator?.destroy();written=new WeakMap()}
   accelerated=useTimeline;outer!.dataset.motionEngine=accelerated?'scroll-timeline':'raf';
   const centerFor=(index:number)=>index+Math.round((position+total-index)/total)*total;
   const ambience=smooth(.22,.75,p%1);
   backdropRefs.current.forEach((layer,index)=>{
    if(accelerated)animator!.backdrop(layer,centerFor(index),total);
    else{write(layer,'opacity',(index===nextBase?1-ambience:index===modulo(nextBase+1,total)?ambience:0).toFixed(3));write(layer,'transform',`translate3d(${(motion.pointerX*5).toFixed(2)}px,${(motion.pointerY*3).toFixed(2)}px,0) scale(${(1+(p%1)*.035).toFixed(3)})`)}
   });
   if(worlds)write(worlds,'transform',accelerated?`translate3d(${motion.pointerX*7}px,${-motion.pointerY*5}px,0) rotateY(${motion.pointerX*.6}deg)`:'none');
   if(landscape)write(landscape,'transform',`translate3d(${(motion.pointerX*7).toFixed(2)}px,${(motion.pointerY*3).toFixed(2)}px,0)`);
   animator?.prune();
   for(const {index,layer,exits} of planes){
    let delta=index-p;delta-=Math.round(delta/total)*total;const nearest=index===nextChapter;
    if(accelerated){
     animator!.plane(layer,index,centerFor(index),total,exits,`${width}/${height}/${layer.dataset.layoutVersion||''}`,motion.low,settings.current.quality==='simple');
     write(layer,'visibility','visible');write(layer,'pointer-events',nearest?'auto':'none');
     if(layer.inert===nearest)layer.inert=!nearest;write(layer,'z-index',String(Math.round(100-delta*10)));
     continue;
    }
    const opacity=settings.current.reduced?(nearest?1:0):delta<0?1-smooth(.52,.94,-delta):1-smooth(.86,1.5,delta);
    const light=settings.current.quality==='simple',travel=settings.current.reduced?0:Math.max(-1.6,Math.min(1.6,delta));
    const departure=(Math.exp(-1.6*travel)-1)/(Math.exp(1.44)-1),depth=220*(1-Math.exp(1.75*travel));
    const x=travel*Math.sin(index*1.9)*24+motion.pointerX*7,y=travel*Math.cos(index*1.3)*12-motion.pointerY*5;
    const projection=1200/(1200-depth);
    write(layer,'transform',light?`translate3d(${(x*projection).toFixed(2)}px,${(y*projection).toFixed(2)}px,0) scale(${projection.toFixed(4)})`:`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${depth.toFixed(2)}px) rotateY(${(settings.current.reduced?0:travel*Math.sin(index+1)*3+motion.pointerX*.6).toFixed(2)}deg) rotateZ(${(settings.current.reduced?0:travel*Math.cos(index+2)).toFixed(2)}deg)`);
    const focus=settings.current.reduced?0:smooth(.06,1.1,Math.abs(travel));
    // Quantized focus, scoped to the plane: no inherited variables invalidating every glyph.
    write(layer,'filter',`blur(${Math.round(focus*(light?2:motion.low?4:8)*2)/2}px) brightness(${(1-Math.round(focus*12)/12*.58).toFixed(2)})`);
    write(layer,'opacity',opacity.toFixed(3));write(layer,'visibility',opacity<.01?'hidden':'visible');write(layer,'pointer-events',nearest?'auto':'none');
    if(layer.inert===nearest)layer.inert=!nearest;write(layer,'z-index',String(Math.round(100-delta*10)));
    const spread=departure;
    for(const {element,x:ex,y:ey,tile,film} of exits){
     if(film)write(element,'transform',`translate3d(${(spread*ex+motion.pointerX*tile*1.3).toFixed(2)}px,${(spread*ey-motion.pointerY*tile).toFixed(2)}px,0)`);
     else write(element,'translate',`${(spread*ex).toFixed(2)}px ${(spread*ey).toFixed(2)}px`);
    }
   }
  }
  function draw(t:number){
   raf=0;if(document.hidden){markMoving(false);return}
   const elapsed=last?t-last:16,dt=Math.min(.05,Math.max(elapsed/1000,.001));last=t;
   if(native&&(settings.current.paused||settings.current.secret))nativeController?.freeze();
   const prior=motion.position,travelling=native?scrolling:pager.moving;
   if(travelling&&elapsed<250)performance.reportFrame(elapsed);
   if(nativeController){const raw=nativeController.position;motion.position=Math.abs(raw-Math.round(raw))<.001?Math.round(raw):raw;motion.target=nativeController.target}
   else{motion.position=settings.current.paused||settings.current.secret?pager.settle():pager.sample(t,settings.current.reduced);motion.target=pager.target}
   motion.velocity=(motion.position-prior)/dt;
   const response=1-Math.exp(-12*dt);motion.pointerX+=(px-motion.pointerX)*response;motion.pointerY+=(py-motion.pointerY)*response;motion.time=t/1000;
   const p=modulo(motion.position,total),nextChapter=modulo(Math.round(p),total),nextBase=native&&scrolling?Math.max(0,lastBase):nextChapter;
   current.current=nextChapter;
   if(!travelling&&(nextBase!==lastBase||nextChapter!==lastChapter)){
    lastBase=nextBase;lastChapter=nextChapter;current.current=nextChapter;
    // Neighbouring planes are already mounted. Never flush React effects inside a frame.
    setBase(nextBase);setChapter(nextChapter);
   }
   paintPlanes(motion.position);
   const moving=native?scrolling:pager.moving;markMoving(moving);
   if(!moving){setPlayChapter(nextChapter);setFlight(value=>value.length?[]:value)}
   outer!.dataset.position=motion.position.toFixed(4);outer!.dataset.target=String(motion.target);
   if((moving&&!accelerated)||Math.abs(px-motion.pointerX)+Math.abs(py-motion.pointerY)>.01)raf=requestAnimationFrame(draw);
   else motion.velocity=0;
  }
  function start(){if(!raf&&!document.hidden)raf=requestAnimationFrame(draw)}wake.current=start;
  function advance(step:number){if(!step||settings.current.paused||settings.current.secret)return;pager.advance(step,window.performance.now());motion.target=pager.target;markMoving(true);start()}
  function resize(){
   nativeController?.resize();
   width=scroller!.clientWidth;pageHeight=scroller!.clientHeight;height=stage.clientHeight;
   if(!native)outer!.style.setProperty('--page-height',pageHeight+'px');
   layouts=new WeakMap();start();
  }
  const fontLayout=()=>{layouts=new WeakMap();worldRefs.current.forEach(layer=>{layer.dataset.layoutVersion=String(window.performance.now())});start()};
  document.fonts?.addEventListener('loadingdone',fontLayout);
  let touch:{x:number;y:number;time:number;committed:number;id:number}|null=null,suppressClickUntil=0;
  function down(event:PointerEvent){if(native||event.pointerType!=='touch'||!event.isPrimary||settings.current.paused||settings.current.secret)return;touch={x:event.clientX,y:event.clientY,time:event.timeStamp,committed:0,id:event.pointerId}}
  function moveTouch(event:PointerEvent){if(!touch||event.pointerId!==touch.id)return;const distance=touch.y-event.clientY;if(Math.abs(distance)<28||Math.abs(distance)<Math.abs(touch.x-event.clientX))return;if(!touch.committed){touch.committed=Math.sign(distance);advance(touch.committed)}suppressClickUntil=event.timeStamp+400}
  function up(event:PointerEvent){if(!touch||touch.id!==event.pointerId)return;const pages=swipePages(touch.y-event.clientY,event.timeStamp-touch.time,height);if(pages&&Math.sign(pages)===touch.committed)advance(pages-touch.committed);else if(!touch.committed)advance(pages);touch=null}
  const cancelTouch=()=>{touch=null},click=(event:MouseEvent)=>{if(event.timeStamp<suppressClickUntil){event.preventDefault();event.stopPropagation()}};
  navigate.current=(index:number)=>{
   const position=nativeController?nativeController.position:motion.position,dest=modulo(index,total),origin=modulo(position,total);
   let distance=dest-origin;if(distance>total/2)distance-=total;if(distance< -total/2)distance+=total;
   const target=Math.round(position+distance);
   if(nativeController){nativeController.navigate(target);return}
   pager.navigate(target,window.performance.now());motion.position=pager.position;motion.target=pager.target;markMoving(pager.moving);start();
  };
  const pointer=(event:PointerEvent)=>{if(settings.current.reduced||event.pointerType==='touch')return;px=event.clientX/width*2-1;py=1-((event.clientY-(innerHeight-height))/height)*2;start()},leave=()=>{px=py=0;start()},home=()=>navigate.current(0);
  const observer=window.ResizeObserver?new ResizeObserver(resize):null;observer?.observe(scroller);window.addEventListener('resize',resize);resize();
  scroller.addEventListener('pointerdown',down,{passive:true});scroller.addEventListener('pointermove',moveTouch,{passive:true});scroller.addEventListener('pointerup',up,{passive:true});scroller.addEventListener('pointercancel',cancelTouch);scroller.addEventListener('click',click,true);
  const visibility=()=>{cancelAnimationFrame(raf);raf=0;last=0;motion.velocity=0;if(!document.hidden)start()};
  outer.addEventListener('pointermove',pointer,{passive:true});outer.addEventListener('portfolio-layout',start);outer.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visibility);window.addEventListener('portfolio-home',home);start();
  return()=>{bindPlanes.current=()=>{};nativeController?.destroy();animator?.destroy();observer?.disconnect();window.removeEventListener('resize',resize);document.fonts?.removeEventListener('loadingdone',fontLayout);cancelAnimationFrame(raf);markMoving(false);scroller.removeEventListener('pointerdown',down);scroller.removeEventListener('pointermove',moveTouch);scroller.removeEventListener('pointerup',up);scroller.removeEventListener('pointercancel',cancelTouch);scroller.removeEventListener('click',click,true);outer.removeEventListener('pointermove',pointer);outer.removeEventListener('portfolio-layout',start);outer.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('portfolio-home',home)};
 },[motion,sections,total,performance.reportFrame]);
 useLayoutEffect(()=>{bindPlanes.current();wake.current()},[base,chapter,flight,paused,reduced,secret,performance.ready,performance.quality]);
 const visible=[...new Set([modulo(base-1,total),base,modulo(base+1,total),...flight])];
 return <div ref={root} className={'journey depth-journey'+(reduced?' reduced-depth':'')} data-paused={paused||!!secret} data-ready={performance.ready} data-playing={playing&&!paused&&!secret} data-quality={performance.quality} data-theme={themes[section.theme]} data-category={section.category} data-art={section.art}>
  <div ref={scroll} className="depth-scroll" tabIndex={0} aria-label="Scroll through the portfolio in 3D" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(['PageDown','ArrowRight','ArrowDown',' '].includes(e.key)){e.preventDefault();navigate.current(current.current+1)}if(['PageUp','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();navigate.current(current.current-1)}if(e.key==='Home'){e.preventDefault();navigate.current(0)}}}>
   <div className="depth-track" style={{'--native-pages':total*3} as CSSProperties}><div className="depth-page">{header}<div className="depth-stage">
    <div className="depth-atmosphere" aria-hidden="true">{visible.map(index=><div key={sections[index].id} ref={el=>{if(el)backdropRefs.current.set(index,el);else backdropRefs.current.delete(index)}} className={'depth-backdrop backdrop-'+sections[index].art} style={{opacity:index===0?1:0}}><Scene art={sections[index].art}/></div>)}</div>
    <div className="depth-landscape" aria-hidden="true"><div className="depth-floor"/><div className="depth-horizon"/>{Array.from({length:8},(_,i)=><div className={'lowpoly-pillar pillar-'+i} key={i} style={{'--pillar':i} as CSSProperties}><i/><i/><i/></div>)}</div>

    <div className="depth-worlds">{visible.map(index=><div ref={el=>{if(el)worldRefs.current.set(index,el);else worldRefs.current.delete(index)}} key={sections[index].id} className={'zoom-world zoom-tone-'+themes[sections[index].theme]+' zoom-layout-'+sections[index].layout} inert={index!==chapter} data-active={index===chapter} data-depth-index={index} data-section={sections[index].id} data-art={sections[index].art} aria-label={sections[index].title} style={{opacity:index===0?1:0}}><div className="depth-portal" aria-hidden="true"/><MemoDepthWorld motion={motion} rotate={rotate&&!reduced} section={sections[index]} active={index===playChapter} autoplay={playing&&performance.mediaReady} compact={compact} paused={paused||!!secret} muted={muted} playing={playing} onProject={onProject} onDiscover={setSecret} onProcess={onProcess}/></div>)}</div>
  <div className="depth-topbar"><nav aria-label="Portfolio categories">{portfolioCategories.map(c=>{const index=sections.findIndex(s=>s.category===c.id);return <button key={c.id} aria-current={section.category===c.id?'location':undefined} disabled={index<0} onClick={()=>navigate.current(index)}>{c.label}</button>})}</nav><a className="depth-index" href={href('work/')} onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onIndex()}}}>All work ↗</a></div>
  {!performance.ready&&<div className="depth-loading" role="status">Loading previews<span aria-hidden="true"/></div>}
  <div className="depth-toolbar"><BrandControls projects={projects} brand={brand} onBrand={setBrand} sort={sort} onSort={setSort}/><PlaybackToggle/>{section.category==='selected'&&<button className="depth-shuffle" onMouseEnter={()=>setHeld(true)} onMouseLeave={()=>setHeld(false)} onFocus={()=>setHeld(true)} onBlur={()=>setHeld(false)} onClick={()=>onProject(shuffleProject)} aria-label={'Open '+title(shuffleProject)}><img key={shuffleProject.id} src={previewAsset(shuffleProject.poster,320)} alt=""/><span>{showcase[shuffle%showcase.length].title}</span><i aria-hidden="true">⇄</i></button>}</div>
  <div className="depth-bottom"><ClientMarquee compact/><ResultsRibbon compact/><div className="depth-navigation"><div><button aria-label="Previous scene" onClick={()=>navigate.current(current.current-1)}>←</button><span>{section.title}</span><button aria-label="Next scene" onClick={()=>navigate.current(current.current+1)}>→</button></div><button className="depth-next-category depth-scroll-hint" onClick={()=>navigate.current(sections.findIndex(s=>s.category===nextCategory.id))} aria-label={'Explore '+nextCategory.label}><span>Next up</span><strong>{nextCategory.label}</strong><i aria-hidden="true">↗</i></button><div><button onClick={()=>setRotate(!rotate)} aria-pressed={rotate}>{rotate?'Rotation on':'Rotation off'}</button><button onClick={()=>setMuted(!muted)} aria-pressed={!muted}>{muted?'Sound off':'Sound on'}</button></div></div></div>
   </div></div></div>
  </div>
  {secret&&!paused&&<Suspense fallback={null}><SecretPlayer project={secret} kind={['aperture','film','ticket','window','frame','aperture'][section.theme]} onClose={()=>setSecret(null)} onOpen={()=>{setSecret(null);onProject(secret)}}/></Suspense>}
 </div>;
}
