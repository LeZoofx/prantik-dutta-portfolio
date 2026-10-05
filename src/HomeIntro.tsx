import {Suspense,lazy,useEffect,useRef,useState} from 'react';
import {asset,previewAsset,previewSrcSet,projects,type Project} from './content';
import showcase from '../content/showcase.json';
import KineticName from './KineticName';
import ClientMarquee from './ClientMarquee';
import PosterType,{KineticCopy} from './PosterType';
import {ResultsRibbon} from './Results';
import positioning from '../content/positioning.json';
const SecretPlayer=lazy(()=>import('./SecretPlayer'));
const curated=showcase.filter(item=>projects.some(p=>p.id===item.id));
if(!curated.length)curated.push(...projects.slice(0,7).map(p=>({id:p.id,title:p.title.split(' | ')[0],label:p.category})));


export default function HomeIntro({onOpen,onFun,onProcess,reduced,simple=false}:{onOpen:(p:Project)=>void;onFun:()=>void;onProcess:()=>void;reduced:boolean;simple?:boolean}){
 const [secret,setSecret]=useState<Project|null>(null),secretTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [index,setIndex]=useState(0),[changing,setChanging]=useState(false),[held,setHeld]=useState(false),[inView,setInView]=useState(true);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),deck=useRef<HTMLDivElement>(null);
 const previous=useRef(-1);
 function shuffle(){if(changing)return;setChanging(true);timer.current=setTimeout(()=>{setIndex(current=>{let choices=curated.map((_,i)=>i).filter(i=>i!==current&&i!==previous.current);if(!choices.length)choices=curated.map((_,i)=>i).filter(i=>i!==current);previous.current=current;return choices.length?choices[Math.floor(Math.random()*choices.length)]:current});setChanging(false)},reduced?0:220)}
 useEffect(()=>{if(reduced||held||!inView||(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData)return;const tick=setInterval(()=>{if(!document.hidden)shuffle()},simple?4200:1700);return()=>clearInterval(tick)},[reduced,held,changing,simple,inView]);
 useEffect(()=>{const el=deck.current;if(!el||!window.IntersectionObserver)return;const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting));observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>()=>{clearTimeout(timer.current);clearTimeout(secretTimer.current)},[]);
 const item=curated[index],p=projects.find(x=>x.id===item.id)!;
 const next=projects.find(x=>x.id===curated[(index+1)%curated.length].id)!;
 return <><ClientMarquee compact/><section className="home-intro" data-art="liquid" aria-label="Selected portfolio" onPointerMove={e=>{if(reduced||simple||e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--home-x',String((e.clientX-r.left)/r.width*2-1));e.currentTarget.style.setProperty('--home-y',String((e.clientY-r.top)/r.height*2-1))}}>
  {<div className="home-floaters" aria-label="Hidden films">{['social-02','videos-04','brands-15'].map((id,i)=><button key={id} className={'floating-art floating-art-'+i} aria-label={'Discover '+projects.find(p=>p.id===id)?.title} onPointerEnter={e=>{if(e.pointerType==='mouse')secretTimer.current=setTimeout(()=>setSecret(projects.find(p=>p.id===id)!),650)}} onPointerLeave={()=>clearTimeout(secretTimer.current)} onClick={()=>setSecret(projects.find(p=>p.id===id)!)}><span className="float-solid">{Array.from({length:6},(_,j)=><i key={j}/>)}</span><span className="float-signal" aria-hidden="true">↗</span></button>)}</div>}
  <div className="intro-identity"><p className="intro-kicker"><KineticCopy text={positioning.eyebrow}/></p><h1><KineticName/></h1><PosterType lines={positioning.openingLines} art="liquid" className="intro-manifesto"/><PosterType lines={positioning.scopeLines} art="liquid" className="intro-skills"/><p className="intro-location"><KineticCopy text="Mumbai. Working everywhere."/></p><button className="journey-entry" onClick={onFun}><span className="entry-prism" aria-hidden="true"><i/><i/><i/></span><span>See the work<small>Film, YouTube & campaigns</small></span><span aria-hidden="true">↗</span></button><button className="process-link" onClick={onProcess}>How I lead a project ↗</button>{simple&&<button className="mobile-discovery" aria-label="Discover a hidden film" onClick={()=>setSecret(projects.find(p=>p.id==='social-02')||projects[0])}><span className="float-solid" aria-hidden="true">{Array.from({length:6},(_,i)=><i key={i}/>)}</span><small>Find a film</small></button>}</div>
  <div className={'showcase-deck'+(changing?' is-shuffling':'')} ref={deck} onPointerEnter={()=>setHeld(true)} onPointerLeave={()=>{setHeld(false);deck.current?.style.setProperty('--deck-x','0deg');deck.current?.style.setProperty('--deck-y','0deg')}} onFocusCapture={()=>setHeld(true)} onBlurCapture={()=>setHeld(false)} onPointerMove={e=>{if(reduced||simple||e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();deck.current?.style.setProperty('--deck-x',`${-(e.clientY-r.top-r.height/2)/r.height*6}deg`);deck.current?.style.setProperty('--deck-y',`${(e.clientX-r.left-r.width/2)/r.width*8}deg`)}}>
   {!simple&&<div className="deck-under" aria-hidden="true"><img src={previewAsset(next.poster)} srcSet={previewSrcSet(next.poster)} sizes="(max-width:699px) 75vw, 42vw" alt="" loading="lazy" decoding="async"/></div>}
   <button className={'deck-front'+((p.aspect||16/9)<1?' portrait-feature':'')} onClick={()=>onOpen(p)} aria-label={'Watch '+item.title}><img key={p.id} src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={item.title} fetchPriority={index===0?"high":"low"} decoding="async"/><span className="deck-play" aria-hidden="true">↗</span></button>
   <div className="deck-caption"><div><span>{item.label}</span><h2><KineticCopy text={item.title}/></h2></div><button className="shuffle-button" onClick={shuffle} aria-label="Shuffle selected work" disabled={curated.length<2}><span aria-hidden="true">⇄</span> Shuffle</button></div>
  </div>
  <ResultsRibbon/>
 </section>{!simple&&<div className="opening-contact-strip" aria-label="All portfolio projects"><div className="contact-strip-title"><span>Films / Campaigns / Digital</span><a href="#portfolio-selected-0">Explore all work ↓</a></div><div className="contact-strip-viewport"><div className="contact-strip-track">{[0,1].map(copy=><div className="contact-strip-run" key={copy} aria-hidden={copy===1?true:undefined}>{projects.map(p=><button key={p.id} onClick={()=>onOpen(p)} tabIndex={copy===1?-1:0} aria-label={p.title}>{p.poster?<img src={previewAsset(p.poster)} srcSet={previewSrcSet(p.poster)} sizes="(max-width:699px) 75vw, 42vw" alt="" loading="lazy"/>:<span>{p.title}</span>}<span className="contact-strip-caption">{p.title.split(' | ')[0]}</span></button>)}</div>)}</div></div></div>}{secret&&<Suspense fallback={null}><SecretPlayer project={secret} kind="aperture" onClose={()=>setSecret(null)} onOpen={()=>onOpen(secret)}/></Suspense>}</>;
}
