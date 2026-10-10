import {Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode, type MouseEvent} from 'react';
import {asset,previewAsset,previewSrcSet, categories, href, projects, projectPath, site, platformLabel, type Project} from './content';
import HomeIntro from './HomeIntro';
import {usePerformance,listenMedia} from './Performance';
import PortfolioScroll from './PortfolioScroll';
import KineticName from './KineticName';
import {WorkContext,ProjectReach} from './Results';
import PosterType,{KineticCopy} from './PosterType';
import KineticType from './KineticType';
import {artSequence} from './artStyles';
import InstagramPlayer from './InstagramPlayer';
import BrandControls from './BrandControls';
import showcase from '../content/showcase.json';
import positioning from '../content/positioning.json';
import {brandFor,collaboratorFor,matchesBrand,sortProjects,contextFor,type WorkSort} from './portfolioSections';
import Universe from './Universe';
import {initialExperience} from './capabilities';
import {requestVideoConsent,useVideoConsent,withdrawVideoConsent} from './videoConsent';
const VideoPrivacy=lazy(()=>import('./VideoPrivacy'));
const ProcessSample=lazy(()=>import('./ProcessSample'));
const route=(p:string)=>p.replace(import.meta.env.BASE_URL,'/').replace(/\/+$/,'')||'/';
const categoryFor=(p:string)=>categories.find(c=>'/'+c.route===route(p))?.id||'all';
const projectFor=(p:string)=>projects.find(x=>'/work/'+x.id===route(p));
const label=(id:string)=>categories.find(c=>c.id===id)?.label||id;
const pad=(n:number)=>String(n).padStart(2,'0');

class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function Card({p,i,onOpen,featured=false}:{p:Project;i:number;onOpen:(p:Project)=>void;featured?:boolean}){
 return <a href={projectPath(p.id)} data-art={artSequence[p.category][i%artSequence[p.category].length]} className={'work-card'+(featured?' featured-card':'')} onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();onOpen(p);}}}>
 <div className="card-image">{p.poster?<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={p.title} loading="lazy" decoding="async"/>:<div className="type-poster" aria-hidden="true"><span>{label(p.category)}</span><b>▶</b></div>}<span className="card-open" aria-hidden="true">{p.provider==='image'?'↗':'▶'}</span></div>
 <div className="card-meta"><span><KineticCopy text={brandFor(p)||label(p.category)}/></span><span>{platformLabel(p)}</span></div><h3><KineticCopy text={p.title}/></h3></a>;
}
function Index({onOpen,filter,setFilter}:{onOpen:(p:Project)=>void;filter:string;setFilter:(v:string)=>void}){
 const [query,setQuery]=useState(''),[brand,setBrand]=useState('all'),[sort,setSort]=useState<WorkSort>('curated');
 const list=sortProjects(projects.filter(p=>(filter==='all'||(filter==='selected'?showcase.some(s=>s.id===p.id):p.category===filter))&&matchesBrand(p,brand)&&(!query||[p.title,p.description,p.disclosure,brandFor(p),collaboratorFor(p)].join(' ').toLowerCase().includes(query.toLowerCase()))),sort);
 return <section className="work-index" id="work" aria-labelledby="work-title"><div className="section-top"><h2 id="work-title"><KineticType text="All work" variant={2}/></h2><span className="mono">STRATEGY / PRODUCTION / POST / PERFORMANCE</span></div>
 <div className="index-tools"><div className="filter-list" role="group" aria-label="Filter work"><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All work</button><button aria-pressed={filter==='selected'} onClick={()=>setFilter('selected')}>Highlights</button>{categories.map(c=><button key={c.id} aria-pressed={filter===c.id} onClick={()=>setFilter(c.id)}>{c.label}</button>)}</div><BrandControls projects={projects} brand={brand} onBrand={setBrand} sort={sort} onSort={setSort}/><label className="search-label"><span className="sr-only">Search projects</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a project or brand"/></label></div>
 {list.length?<div className="work-grid">{list.map((p,i)=><Card key={p.id} p={p} i={i} onOpen={onOpen}/>)}</div>:<p className="empty-message">No work matches that search. <button onClick={()=>{setQuery('');setFilter('all');setBrand('all')}}>Clear filters</button></p>}</section>;
}
function About(){return <section className="about-section" id="about" data-art="brutal"><div className="section-top"><h2><KineticType text="Behind the frame." variant={1}/></h2><span className="mono"><KineticCopy text="PRANTIK DUTTA / MUMBAI"/></span></div><div className="about-copy"><PosterType lines={['Creative strategy.','Creative production.','Post supervision.']} className="about-role"/><PosterType lines={positioning.aboutLines} className="about-manifesto"/><div className="discipline-list">{positioning.disciplines.map((d,i)=><div key={d}><span className="mono">{pad(i+1)}</span><KineticCopy text={d}/></div>)}</div><a className="text-link" href={site.linkedin} target="_blank" rel="noopener noreferrer"><KineticCopy text="LinkedIn ↗"/></a></div></section>}
function Contact({motionPaused,onMotionChange}:{motionPaused:boolean;onMotionChange:()=>void}){return <section className="contact-section" id="contact" data-art="sigil"><p className="mono"><KineticCopy text="HAVE SOMETHING IN MIND?"/></p><h2><KineticType text="Let’s make it matter." variant={4}/></h2><a className="contact-email" href={'mailto:'+site.email}><KineticCopy text={site.email}/><span>↗</span></a><div className="contact-bottom"><a href={'https://wa.me/'+site.phone.replace(/\D/g,'')} target="_blank" rel="noopener noreferrer"><KineticCopy text="WhatsApp ↗"/></a><a href={'tel:'+site.phone}><KineticCopy text={site.phone}/></a><KineticCopy text={site.location}/></div><div className="site-notices"><a href={asset('privacy.html')} target="_blank" rel="noopener noreferrer">Privacy & accessibility ↗</a><button onClick={withdrawVideoConsent}>Reset video choice</button><button aria-pressed={motionPaused} onClick={onMotionChange}>{motionPaused?'Resume motion':'Pause motion'}</button></div></section>}
function Media({p}:{p:Project}){
 const {ready}=usePerformance(),{allowed}=useVideoConsent();
 const [active,setActive]=useState(false),[loaded,setLoaded]=useState(false),stage=useRef<HTMLDivElement>(null);
 useEffect(()=>{setActive(ready&&allowed&&(p.provider==='youtube'||p.provider==='instagram'));setLoaded(false)},[p.id,ready,allowed]);
 let embed=p.embedUrl||'';
 if(p.provider==='youtube'){const id=embed.match(/embed\/([^?\/]+)/)?.[1];if(id)embed='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0&cc_load_policy=1';}
 const provider=platformLabel(p)==='Project'?'original source':platformLabel(p);
 return <div className="project-media"><div ref={stage} className={'media-stage'+((p.aspect||1.778)<1?' vertical':'')} style={{aspectRatio:String(p.aspect||1.778)}}>{p.provider==='instagram'&&active?<InstagramPlayer project={p} enabled playing explicit/>:p.provider==='image'?<img src={asset(p.image||p.poster)} alt={p.title}/>:active&&embed?<><iframe src={embed} title={p.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={()=>setLoaded(true)}/>{!loaded&&<p className="player-loading">Opening player…</p>}</>:<button className="media-facade" onClick={()=>{if(embed)void requestVideoConsent().then(ok=>{if(ok)setActive(true)});else window.open(p.sourceUrl,'_blank','noopener,noreferrer')}} aria-label={'Play '+p.title}>{p.poster&&<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt=""/>}<span className="play-disc">▶</span><span className="play-label">{embed?'PLAY FILM':'OPEN PROJECT'}</span></button>}<button className="exit-fullscreen" onClick={()=>{stage.current?.classList.remove('media-theatre');if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})}}>Exit fullscreen ×</button></div><div className="media-actions"><button className="native-fullscreen" onClick={()=>{const el=stage.current;if(el?.requestFullscreen)void el.requestFullscreen().catch(()=>{});else el?.classList.toggle('media-theatre')}}>⤢ Fullscreen</button></div>{p.provider!=='image'&&<a className="source-link" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Open on {provider} ↗</a>}</div>;
}
function Overlay({children,title,onClose,className=''}:{children:ReactNode;title:string;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const prior=document.activeElement as HTMLElement;if(el.showModal){el.removeAttribute('open');el.showModal()}const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;prior?.focus?.({preventScroll:true})}},[]);
 return <dialog open ref={ref} className={'overlay '+className} aria-label={title} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="overlay-inner"><div className="overlay-top"><span className="mono">{title}</span><button className="close-button" onClick={onClose} autoFocus>Close <span aria-hidden="true">×</span></button></div>{children}</div></dialog>;
}
export default function App({initialPath}:{initialPath:string}){
 const [path,setPath]=useState(route(initialPath)),[selected,setSelected]=useState<Project|undefined>(projectFor(initialPath)),[filter,setFilter]=useState(categoryFor(initialPath));
 const [mode,setMode]=useState<'normal'|'fun'>(()=>initialExperience(route(initialPath))),[panel,setPanel]=useState<'index'|'about'|'contact'|'process'|null>(null),[systemReduced,setReduced]=useState(false),[manualReduced,setManualReduced]=useState(false),[mobile,setMobile]=useState(false);
 const privacy=useVideoConsent(),reduced=systemReduced||manualReduced;
 useEffect(()=>{document.documentElement.dataset.motionPaused=String(manualReduced);return()=>{delete document.documentElement.dataset.motionPaused}},[manualReduced]);
 const performance=usePerformance(),light=performance.ready&&performance.quality==='simple',simple=mobile||light;
 const experience=mode;
 const previousPath=useRef('/'),initialFocus=useRef<HTMLElement|null>(null);
 
 useEffect(()=>{
  const phone=matchMedia('(max-width:699px), (max-width:1024px) and (pointer:coarse)');const syncPhone=()=>setMobile(phone.matches);syncPhone();const stopPhone=listenMedia(phone,syncPhone);
  const mq=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(mq.matches);sync();const stopMotion=listenMedia(mq,sync);
  setMode(initialExperience(route(initialPath),new URLSearchParams(location.search).get('mode')));
  const pop=()=>{const p=route(location.pathname);setPath(p);setSelected(projectFor(p));setPanel(null);setFilter(categoryFor(p));setMode(initialExperience(p,new URLSearchParams(location.search).get('mode')))};window.addEventListener('popstate',pop);
  return()=>{stopPhone();stopMotion();window.removeEventListener('popstate',pop)};
 },[]);
 useEffect(()=>{
  const root=document.querySelector('[data-app=portfolio]');if(!root||!window.IntersectionObserver)return;
  const targets=experience==='fun'?'.client-marquee,.results-ribbon':'.kinetic-copy,.kinetic-type,.type-poster-copy,.client-marquee,.results-ribbon,.home-intro,.opening-contact-strip';
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('type-in-view',entry.isIntersecting)},{threshold:.04});
  const register=(node:Element,remove=false)=>{const visit=(el:Element)=>remove?observer.unobserve(el):observer.observe(el);if(node.matches(targets))visit(node);node.querySelectorAll(targets).forEach(visit)};
  register(root);const changes=new MutationObserver(records=>{for(const record of records){for(const node of record.removedNodes)if(node instanceof Element)register(node,true);for(const node of record.addedNodes)if(node instanceof Element)register(node)}});
  changes.observe(root,{childList:true,subtree:true});return()=>{observer.disconnect();changes.disconnect()};
 },[experience]);
 useEffect(()=>{document.documentElement.dataset.mode=experience;return()=>{delete document.documentElement.dataset.mode}},[experience]);
 useEffect(()=>{document.title=selected?selected.title+' — '+site.title:site.title},[selected]);
 function setExperience(v:'normal'|'fun'){setMode(v);setPanel(null);const u=new URL(location.href);if(v==='normal')u.searchParams.set('mode','overview');else if(path==='/')u.searchParams.delete('mode');else u.searchParams.set('mode','fun');history.replaceState({},'',u)}
 function openProject(p:Project){initialFocus.current=document.activeElement as HTMLElement;previousPath.current=path;setSelected(p);history.pushState({portfolio:true},'',projectPath(p.id)+(experience==='fun'?'?mode=fun':''))}
 function closeProject(){setSelected(undefined);setPath(previousPath.current);history.replaceState({},'',href(previousPath.current.replace(/^\//,''))+(experience==='fun'?'?mode=fun':''));initialFocus.current?.focus({preventScroll:true})}
 function navigate(e:MouseEvent,pathName:string){if(e.metaKey||e.ctrlKey)return;e.preventDefault();if(experience==='fun'){setPanel(pathName==='about'?'about':pathName==='contact'?'contact':'index');return}setPath('/'+pathName);setSelected(undefined);setFilter(categoryFor('/'+pathName));history.pushState({},'',href(pathName+'/'));window.scrollTo({top:0})}
 const isHome=path==='/';
 const header=<header className="site-header"><a className="brand" href={href()} aria-label="Prantik Dutta home" onClick={e=>{e.preventDefault();setPath('/');setSelected(undefined);setPanel(null);setMode('fun');history.pushState({},'',href());window.scrollTo(0,0);if(experience==='fun')window.dispatchEvent(new Event('portfolio-home'))}}><span className="brand-monogram">P<span>/</span>D</span><span className="brand-name"><KineticName compact/></span></a><nav aria-label="Main navigation"><a href={href('work/')} onClick={e=>navigate(e,'work')}>Work</a><a href={href('about/')} onClick={e=>navigate(e,'about')}>About</a><a href={href('contact/')} onClick={e=>navigate(e,'contact')}>Contact ↗</a></nav><div className="mode-switch" role="group" aria-label="Website experience"><button aria-pressed={experience==='normal'} onClick={()=>setExperience('normal')}>Overview</button><button aria-pressed={experience==='fun'} onClick={()=>setExperience('fun')}>Explore <span aria-hidden="true">✳</span></button></div></header>;
 return <div data-app="portfolio" data-mobile={mobile} data-light={light}><a className="skip-link" href="#main">Skip to content</a>{(experience==='normal'||mobile)&&header}
 {experience==='normal'?<main id="main">
 {isHome&&<><HomeIntro onProcess={()=>setPanel('process')} onOpen={openProject} onFun={()=>setExperience('fun')} reduced={reduced} simple={simple}/>
 {!simple&&<WorkContext/>}<PortfolioScroll simple={simple} projects={projects} onProject={openProject} onIndex={()=>setPanel('index')} reduced={reduced} paused={!!selected||!!panel||privacy.prompt} onDiscover={openProject}/>{simple&&<WorkContext/>}<section className="process-teaser"><span className="mono">RESEARCH / DIRECTION / PRODUCTION / POST</span><h2><KineticType text="How I lead a project." variant={1}/></h2><p><KineticCopy text="A working development sample: the research, treatment, shot plan, team brief and edit decisions."/></p><button onClick={()=>setPanel('process')}>Open the development sample ↗</button></section></>}
 {(path==='/work'||categories.some(c=>'/'+c.route===path)||(selected&&!isHome))&&<Index onOpen={openProject} filter={filter} setFilter={setFilter}/>}
 {(isHome||path==='/about')&&<About/>}{(isHome||path==='/contact')&&<Contact motionPaused={manualReduced} onMotionChange={()=>setManualReduced(v=>!v)}/>}
 {path==='/showreel'&&<section className="simple-page"><p className="mono">SHOWREEL</p><h1>A new cut<br/>is on its way.</h1><p>Explore the individual projects in the meantime.</p><a className="solid-button" href={href('work/')} onClick={e=>navigate(e,'work')}>See the work ↗</a></section>}
 {path==='/404'&&<section className="simple-page"><p className="mono">404 / FRAME NOT FOUND</p><h1>Back to<br/>the work.</h1><a href={href('work/')} className="solid-button">Work index ↗</a></section>}
 </main>:<main id="main" className="fun-main"><SceneBoundary fallback={<div className="scene-loading"><p>Prantik Dutta’s portfolio</p><button onClick={()=>setExperience('normal')}>Explore the work ↗</button></div>}><Universe mobile={mobile} header={mobile?null:header} onProcess={()=>setPanel('process')} projects={projects} onProject={openProject} onIndex={()=>setPanel('index')} paused={!!selected||!!panel||privacy.prompt} reduced={reduced}/></SceneBoundary></main>}
 {experience==='normal'&&<footer className="footer"><span>© {new Date().getFullYear()} PRANTIK DUTTA</span><span>CREATIVE DIRECTION / PRODUCTION / POST</span><button onClick={()=>window.scrollTo({top:0,behavior:reduced?'instant':'smooth'})}>BACK TO TOP ↑</button></footer>}
 {selected&&<Overlay title={(brandFor(selected)||label(selected.category))} onClose={closeProject} className="project-overlay"><article data-art={artSequence[selected.category][0]}><h1 className="project-title"><KineticType text={selected.title} variant={2}/></h1><Media p={selected}/><ProjectReach id={selected.id}/><div className="project-notes"><div><p className="mono">POST-PRODUCTION</p><p className="project-specialism"><KineticCopy text={contextFor(selected.category).summary}/></p>{brandFor(selected)&&<p className="portfolio-brand">{brandFor(selected)}{collaboratorFor(selected)?' / '+collaboratorFor(selected):''}</p>}</div>{selected.role&&<div><p className="mono">MY ROLE</p><p><KineticCopy text={selected.role}/></p></div>}{selected.description&&<div><p className="mono">CONTEXT</p><p><KineticCopy text={selected.description}/></p></div>}{selected.disclosure&&<div className="disclosure"><p className="mono">ABOUT THE IMAGES</p><p><KineticCopy text={selected.disclosure}/></p></div>}</div><a className="text-link" href={href('work/')} onClick={e=>{e.preventDefault();closeProject();if(experience==='fun')setPanel('index');else{setPath('/work');history.replaceState({},'',href('work/'))}}}>All projects ↗</a></article></Overlay>}
 {panel&&<Overlay title={panel==='index'?'WORK INDEX':panel==='process'?'PROJECT DEVELOPMENT':panel.toUpperCase()} onClose={()=>setPanel(null)}>{panel==='index'?<Index onOpen={p=>{setPanel(null);openProject(p)}} filter={filter} setFilter={setFilter}/>:panel==='process'?<Suspense fallback={<p>Opening development sample…</p>}><ProcessSample/></Suspense>:panel==='about'?<About/>:<Contact motionPaused={manualReduced} onMotionChange={()=>setManualReduced(v=>!v)}/>}</Overlay>}
 {privacy.prompt&&<Suspense fallback={null}><VideoPrivacy/></Suspense>}
 </div>;
}
