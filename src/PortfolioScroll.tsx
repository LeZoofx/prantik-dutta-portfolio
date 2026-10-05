import {lazy,Suspense,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {asset,previewAsset,previewSrcSet,projectPath,platformLabel,selectEmbeds,type Project} from './content';
import {buildSections,brandFor,type PortfolioSection,type WorkSort} from './portfolioSections';
import BrandControls from './BrandControls';
import KineticName from './KineticName';
import KineticType from './KineticType';
import PosterType,{KineticCopy} from './PosterType';
import SceneAccents from './SceneAccents';
import ExpandCue from './ExpandCue';
import {posterCopy} from './artStyles';
import {usePerformance,listenMedia} from './Performance';
import './portfolio-scroll.css';
import PlaybackToggle from './PlaybackToggle';
const Player=lazy(()=>import('./JourneyPlayer'));
const themes=['glass','mass','cut','desktop','afterimage','editorial'];
const shortTitle=(p:Project)=>p.title.split(' | ')[0].replace(/\s*\(Official.*$/i,'').replace(/\s*- Official Trailer$/i,'');
type Props={projects:Project[];onProject:(p:Project)=>void;onIndex:()=>void;paused?:boolean;reduced:boolean;simple?:boolean;immersive?:boolean;onSection?:(section:PortfolioSection,index:number,progress:number)=>void;onDiscover?:(project:Project)=>void};
export default function PortfolioScroll({projects,onProject,onIndex,paused=false,reduced,simple=false,immersive=false,onSection,onDiscover}:Props){
 const {mediaReady,maxPlayers,autoplay:playing}=usePerformance();
 const [settled,setSettled]=useState(-1);
 const [brand,setBrand]=useState('all'),[sort,setSort]=useState<WorkSort>('curated');
 const sections=useMemo(()=>buildSections(projects,sort,brand),[projects,sort,brand]);
 const root=useRef<HTMLDivElement>(null),elements=useRef<(HTMLElement|null)[]>([]),sectionCallback=useRef(onSection);sectionCallback.current=onSection;
 const [active,setActive]=useState(-1),[muted,setMuted]=useState(true),[compact,setCompact]=useState(false),[saveData,setSaveData]=useState(false);
 const [visible,setVisible]=useState<string[]>([]);const candidates=useRef(new Map<string,{ratio:number;top:number}>());
 const activeRef=useRef(-1),scrollProgress=useRef(0);
 useEffect(()=>{const m=matchMedia('(max-width: 699px)');const sync=()=>setCompact(m.matches);sync();const stop=listenMedia(m,sync);setSaveData(!!(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData);return stop},[]);
 useEffect(()=>{
  const board=root.current;if(!board||!window.IntersectionObserver)return;const scroller=board.closest<HTMLElement>('.portfolio-scroller'),viewport=scroller||null;
  const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)candidates.current.set(entry.target.id,{ratio:entry.intersectionRatio,top:entry.boundingClientRect.top});else candidates.current.delete(entry.target.id)});const best=[...candidates.current.entries()].sort((a,b)=>b[1].ratio-a[1].ratio)[0];const next=best?sections.findIndex(s=>'portfolio-'+s.id===best[0]):-1;activeRef.current=next;setActive(next);if(next>=0)sectionCallback.current?.(sections[next],next,scrollProgress.current)}, {root:viewport,threshold:[0,.08,.2,.35,.5,.7,.9]});
  elements.current.forEach(el=>el&&sectionObserver.observe(el));

  const cardObserver=new IntersectionObserver(entries=>setVisible(old=>{const next=new Set(old);entries.forEach(entry=>entry.isIntersecting?next.add((entry.target as HTMLElement).dataset.projectId!):next.delete((entry.target as HTMLElement).dataset.projectId!));return [...next]}),{root:viewport,threshold:.18});
  board.querySelectorAll<HTMLElement>('.portfolio-card').forEach(el=>cardObserver.observe(el));
  let raf=0;const target=scroller||window;const update=()=>{raf=0;const index=activeRef.current;if(index<0)return;const rect=elements.current[index]!.getBoundingClientRect(),height=scroller?.clientHeight||innerHeight;const progress=Math.max(-1,Math.min(1,(height*.35-rect.top)/Math.max(height,rect.height)));scrollProgress.current=progress;board.style.setProperty('--scroll-offset',String(progress));sectionCallback.current?.(sections[index],index,progress)};const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};target.addEventListener('scroll',onScroll,{passive:true});return()=>{sectionObserver.disconnect();cardObserver.disconnect();target.removeEventListener('scroll',onScroll);cancelAnimationFrame(raf);candidates.current.clear()};
 },[sections,simple]);
 useEffect(()=>{setSettled(-1);if(!mediaReady||active<0)return;const timer=setTimeout(()=>setSettled(active),650);return()=>clearTimeout(timer)},[active,mediaReady]);
 const playable=useMemo(()=>{if(!playing||paused||!mediaReady||settled!==active)return [];return selectEmbeds(visible.map(id=>projects.find(p=>p.id===id)!).filter(Boolean).sort((a,b)=>{const near=sections[active]?.items.map(p=>p.id)||[];return Number(near.includes(b.id))-Number(near.includes(a.id))}),Math.min(compact?2:3,maxPlayers))},[visible,active,paused,playing,compact,projects,sections,mediaReady,maxPlayers,settled]);
 function jump(index:number){elements.current[index]?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}
 const nav=sections.filter((s,i)=>sections.findIndex(x=>x.category===s.category)===i);
 return <div className={'portfolio-scroll'+(immersive?' is-immersive':'')+(simple?' is-simple':'')} ref={root}>
  <div className="portfolio-controls"><nav aria-label="Portfolio categories">{nav.map(s=><button key={s.id} aria-current={sections[active]?.category===s.category?'location':undefined} onClick={()=>jump(sections.indexOf(s))}>{s.category==='selected'?'Highlights':s.category==='youtube'?'YouTube':s.category==='short-form'?'Short form':s.category==='events'?'Live & comedy':s.category==='brands'?'Campaigns':'Film'}</button>)}</nav><BrandControls projects={projects} brand={brand} onBrand={setBrand} sort={sort} onSort={setSort}/><PlaybackToggle/><button className="portfolio-index" onClick={onIndex}>All work ↗</button></div>
  {sections.map((section,index)=><section id={'portfolio-'+section.id} key={section.id} ref={el=>{elements.current[index]=el}} className={'portfolio-cluster layout-'+section.layout+' tone-'+themes[section.theme]+(active===index?' is-current':'')} aria-labelledby={'heading-'+section.id} data-art={section.art}>{active===index&&<SceneAccents theme={section.theme} art={section.art}/>}
   <div className="cluster-heading"><div>{index===0&&immersive&&<h1><KineticName/></h1>}<h2 id={'heading-'+section.id}><KineticType text={section.title} variant={section.theme}/></h2>{section.offset===0&&<><PosterType lines={posterCopy[section.category]} art={section.art} className="category-poster"/><p className="category-focus"><KineticCopy text={section.focus}/></p></>}</div>{!simple&&<button className="cluster-discovery" aria-label={'Discover '+section.items[0].title} onPointerEnter={e=>{if(e.pointerType==='mouse')e.currentTarget.dataset.hover='true'}} onPointerLeave={e=>{delete e.currentTarget.dataset.hover}} onAnimationEnd={e=>{if(e.currentTarget.dataset.hover)onDiscover?.(section.items[0])}} onClick={()=>onDiscover?.(section.items[0])}><span aria-hidden="true">✳</span></button>}</div>
   <div className="cluster-grid">{section.items.map((p,i)=><article key={p.id} className={'portfolio-card'+((p.aspect||16/9)<1?' is-portrait':'')+(playable.includes(p.id)?' is-live':'')} data-project-id={p.id} style={{'--film-ratio':p.aspect||16/9,'--card-order':i,'--card-angle':((i%3)-1)*2.5+'deg'} as CSSProperties}>
    <p className="portfolio-brand"><span><KineticCopy text={brandFor(p)||section.title}/></span><span className="platform-tag">{platformLabel(p)}</span></p>{section.theme===3&&<div className="portfolio-windowbar"><span><KineticCopy text={shortTitle(p)}/></span><span aria-hidden="true">_ □</span></div>}
    <div className="portfolio-media">{(active===index&&playable.includes(p.id))?<Suspense fallback={<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={p.title}/>}><Player project={p} enabled={playable.includes(p.id)} muted={muted||p.id!==playable[0]} playing={playing&&!paused} onOpen={()=>onProject(p)}/></Suspense>:<a href={projectPath(p.id)} className="portfolio-poster" onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onProject(p)}}} aria-label={'Open '+p.title}>{p.poster?<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={p.title} loading="lazy" decoding="async"/>:<span className="portfolio-type-poster">{shortTitle(p)}</span>}<span className="portfolio-play" aria-hidden="true">{p.provider==='image'?'↗':'▶'}</span></a>}<ExpandCue title={shortTitle(p)} onOpen={()=>onProject(p)}/></div>
    <a href={projectPath(p.id)} className="portfolio-caption" onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onProject(p)}}}><span><KineticCopy text={shortTitle(p)}/></span><span aria-hidden="true">↗</span></a>
   </article>)}</div>
  </section>)}
  <div className="portfolio-end"><button onClick={()=>jump(0)}>Back to selected work ↑</button><button onClick={onIndex}>Open work index ↗</button></div>
  {!simple&&active>=0&&<div className="portfolio-playback"><span>{sections[active]?.title}</span><button onClick={()=>setMuted(!muted)} aria-pressed={!muted}>{muted?'Sound off':'Sound on'}</button><PlaybackToggle/><button className="portfolio-next" onClick={()=>jump((Math.max(0,active)+1)%sections.length)} aria-label="Next portfolio section">↓</button></div>}
 </div>;
}
