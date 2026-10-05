import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {chooseQuality,MediaQueue,type Quality} from './capabilities';
type Connection=EventTarget&{saveData?:boolean;effectiveType?:string;downlink?:number;rtt?:number};
type Device=Navigator&{deviceMemory?:number;connection?:Connection};
type Experience={autoplay:boolean;toggleAutoplay:()=>void;quality:Quality;ready:boolean;mediaReady:boolean;playbackReady:boolean;maxPlayers:number;reportFrame:(ms:number)=>void};
const noop=()=>{};
const Context=createContext<Experience>({autoplay:false,toggleAutoplay:noop,quality:'balanced',ready:false,mediaReady:false,playbackReady:false,maxPlayers:0,reportFrame:noop});
const mediaQueue=new MediaQueue(1100);
export function usePerformance(){return useContext(Context)}
export function useVideoPermit(wanted:boolean,priority=0){
 const {mediaReady}=usePerformance(),[permit,setPermit]=useState(false);
 useEffect(()=>{setPermit(false);if(!wanted||!mediaReady)return;let mounted=true;const release=mediaQueue.request(value=>{if(mounted)setPermit(value)},priority);return()=>{mounted=false;release()}},[wanted,mediaReady,priority]);
 return wanted&&permit;
}
export function listenMedia(query:MediaQueryList,callback:()=>void){if(query.addEventListener){query.addEventListener('change',callback);return()=>query.removeEventListener('change',callback)}query.addListener(callback);return()=>query.removeListener(callback)}
function detect(){const n=navigator as Device;return chooseQuality({supported:!!(window.IntersectionObserver&&window.ResizeObserver&&typeof Element.prototype.animate==='function'&&window.CSS?.supports('transform-style','preserve-3d')),coarse:matchMedia('(pointer:coarse)').matches,memory:n.deviceMemory,cores:n.hardwareConcurrency,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,...n.connection&&{saveData:n.connection.saveData,effectiveType:n.connection.effectiveType,downlink:n.connection.downlink,rtt:n.connection.rtt}})}
export function PerformanceProvider({children}:{children:ReactNode}){
 const [autoplay,setAutoplay]=useState(false);
 const toggleAutoplay=useCallback(()=>setAutoplay(value=>!value),[]);
 const [quality,setQuality]=useState<Quality>('balanced'),[ready,setReady]=useState(false),[mediaReady,setMediaReady]=useState(false),[playbackReady,setPlaybackReady]=useState(false);
 const tier=useRef(quality);tier.current=quality;const ceiling=useRef<Quality>('full'),tally=useRef({count:0,slow:0,badWindows:0});
 const reportFrame=useCallback((ms:number)=>{
  if(document.hidden||ms<4||ms>250)return;const b=tally.current;b.count++;if(ms>34)b.slow++;
  if(b.count>=45){b.badWindows=b.slow/b.count>.28?b.badWindows+1:0;if(b.badWindows>=2){const next=tier.current==='full'?'balanced':'simple';ceiling.current=next;setQuality(next);b.badWindows=0}b.count=b.slow=0}
 },[]);
 const capacity=quality==='simple'?1:2;
 const policy=useRef({capacity,ready});policy.current={capacity,ready};
 const refresh=useRef(()=>{});
 useEffect(()=>{
  let disposed=false,frame=0,deadline:ReturnType<typeof setTimeout>;
  const n=navigator as Device;
  const sync=()=>{const detected=detect(),order:Quality[]=['simple','balanced','full'];setQuality(order[Math.min(order.indexOf(detected),order.indexOf(ceiling.current))])};
  sync();const stopMotion=listenMedia(matchMedia('(prefers-reduced-motion: reduce)'),sync);n.connection?.addEventListener?.('change',sync);
  // Wait for the initial type metrics and primary poster, not third-party players.
  // The prerendered shell and native scroll remain available during this phase.
  const poster=document.querySelector<HTMLImageElement>('.zoom-world[data-active=true] .depth-poster img');
  const assets=Promise.allSettled([document.fonts?.ready??Promise.resolve(),poster?.decode?.()??Promise.resolve()]);
  Promise.race([assets,new Promise<void>(resolve=>{deadline=setTimeout(resolve,1000)})]).then(()=>{
   if(disposed)return;clearTimeout(deadline);frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(disposed)return;setReady(true);document.documentElement.classList.add('ui-ready')})});
  });
  const nav=window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  if(!n.connection&&nav&&nav.responseEnd-nav.requestStart>2500){ceiling.current='simple';setQuality('simple')}
  return()=>{disposed=true;clearTimeout(deadline);cancelAnimationFrame(frame);stopMotion();n.connection?.removeEventListener?.('change',sync)};
 },[]);
 useEffect(()=>{
  const html=document.documentElement;
  let moving=false,admit=false,resumeTimer:ReturnType<typeof setTimeout>|undefined,overviewTimer:ReturnType<typeof setTimeout>|undefined,idle:number|undefined;
  const cancel=()=>{clearTimeout(resumeTimer);if(idle!==undefined)window.cancelIdleCallback?.(idle);idle=undefined};
  const configure=()=>mediaQueue.configure(policy.current.capacity,!policy.current.ready||document.hidden||moving||!admit);
  const resume=()=>{
   cancel();configure();
   if(!policy.current.ready||document.hidden||moving)return;
   resumeTimer=setTimeout(()=>{
    const run=()=>{if(document.hidden||moving)return;admit=true;setMediaReady(true);setPlaybackReady(true);html.dataset.previews='ready';configure();window.dispatchEvent(new Event('portfolio-rest'))};
    if('requestIdleCallback' in window)idle=window.requestIdleCallback(run,{timeout:900});else run();
   },700);
  };
  const motion=(event:Event)=>{
   moving=(event as CustomEvent<boolean>).detail;html.classList.toggle('is-scrolling',moving);admit=false;
   if(moving){cancel();configure()}else resume();
  };
  const scroll=()=>{
   // Explore has an explicit motion owner; observing its native scroll here too
   // caused two competing idle timers and repeated decoder admissions.
   if(html.dataset.mode==='fun')return;
   moving=true;admit=false;html.classList.add('is-scrolling');cancel();configure();clearTimeout(overviewTimer);
   overviewTimer=setTimeout(()=>{moving=false;html.classList.remove('is-scrolling');resume()},180);
  };
  const visibility=()=>{
   cancel();clearTimeout(overviewTimer);moving=false;admit=false;html.classList.remove('is-scrolling');html.classList.toggle('page-hidden',document.hidden);
   setPlaybackReady(false);html.dataset.previews='warming';configure();
   if(!document.hidden)resume();
  };
  refresh.current=()=>{configure();resume()};visibility();
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pageshow',visibility);window.addEventListener('scroll',scroll,{capture:true,passive:true});window.addEventListener('portfolio-motion',motion);
  return()=>{cancel();clearTimeout(overviewTimer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pageshow',visibility);window.removeEventListener('scroll',scroll,true);window.removeEventListener('portfolio-motion',motion);mediaQueue.configure(0,true)};
 },[]);
 useEffect(()=>{document.documentElement.dataset.quality=quality;refresh.current()},[quality,ready]);
 const maxPlayers=mediaReady?capacity:0;
 const value=useMemo(()=>({autoplay,toggleAutoplay,quality,ready,mediaReady,playbackReady,maxPlayers,reportFrame}),[autoplay,toggleAutoplay,quality,ready,mediaReady,playbackReady,maxPlayers,reportFrame]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
