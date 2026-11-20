import {useEffect,useLayoutEffect,useRef,useState,type FocusEvent} from 'react';
import {asset,previewAsset,projectPath,projects} from './content';
import {campaignProjects} from './campaigns';
import {processPagePlan,artefactsForProjects,type ProcessStep,type ProcessEntry} from './processContext';
import {advanceRail,readingHold,type RailProgress} from './processRail';
import ProcessArtefacts,{ArtefactPreview} from './ProcessArtefacts';
import type {PortfolioSection} from './portfolioSections';
import steps from '../content/creative-process.json';
import excerpts from '../content/process-assets.json';
import sourceIndex from '../content/process-library-sources.json';

type Step=ProcessEntry;
type Excerpt=typeof excerpts[keyof typeof excerpts];
const excerptFor=(step:Step)=>excerpts[(step.baseId||step.id) as keyof typeof excerpts] as Excerpt;
const sourceFor=(id:string)=>sourceIndex[id as keyof typeof sourceIndex];
type Evidence={document:string;excerpts:{page:number;text:string}[];visuals:{src:string;caption:string}[]};
type OpenNotes={step:Step;evidence:string;library?:boolean};

function ProcessNotes({step:initialStep,initialEvidence,libraryMode=false,onClose}:{step:Step;initialEvidence:string;libraryMode?:boolean;onClose:()=>void}){
 const [step,setStep]=useState(initialStep);
 const dialog=useRef<HTMLDialogElement>(null),excerpt=excerptFor(step);
 const [selection,setSelection]=useState(initialEvidence),[library,setLibrary]=useState<Record<string,Evidence>|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const selected=library?.[selection],source=sourceFor(selection);
 const hasArtefacts=artefactsForProjects(step.projectIds).length>0;
 const relatedProjects=[...projects,...campaignProjects].filter(p=>step.projectIds?.includes(p.id));
 useEffect(()=>{let live=true;setFailed(false);import('../content/process-evidence.json').then(m=>{if(live)setLibrary(m.default)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false}},[retry]);
 useEffect(()=>{const el=dialog.current,prior=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();prior?.focus({preventScroll:true})}},[]);
 return <dialog ref={dialog} className="process-notes" aria-label={step.label+' — production notes'} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onKeyDown={e=>e.stopPropagation()} onClick={e=>{if(e.currentTarget===e.target)onClose()}}>
  <header><span>{step.label} / {step.brand}</span><button onClick={onClose} autoFocus>Close ×</button></header>
  <div className="process-notes-body">{libraryMode&&<nav className="process-document-tabs" aria-label="Full process library">{steps.map(item=><button key={item.id} aria-pressed={step.id===item.id} onClick={()=>{setStep(item);setSelection(item.evidence[0])}}>{item.label}</button>)}</nav>}<p className="process-note-kicker">{libraryMode?'Full process library':'Behind the work on this page'}</p><h2>{step.title}</h2><p>{step.detail}</p>{!libraryMode&&<ProcessArtefacts projectIds={step.projectIds} sections={step.expanded}/>} {step.expanded&&!hasArtefacts&&<div className="process-expanded-sections">{step.expanded.map(part=><section key={part.id}><h3>{part.title}</h3><p>{part.detail}</p></section>)}</div>}
   {relatedProjects.length>0&&<div className="process-related-projects">{relatedProjects.map(p=><a key={p.id} href={projectPath(p.id)}>{p.caseTitle||p.title} ↗</a>)}</div>}<nav className="process-document-tabs" aria-label="Related source documents">{step.evidence.map(id=><button key={id} aria-pressed={selection===id} onClick={()=>setSelection(id)}>{sourceFor(id).title}</button>)}</nav>
   {source&&<section className="process-selected-evidence" aria-label={source.title}><h3>{source.title}</h3><p className="process-source-caption">{source.document.split('/').pop()?.replace(/_/g,' ').replace('.pdf','')} · pages {source.pages.join(', ')}</p>
    {selection===step.evidence[0]&&!selected?.visuals.length&&<figure><img src={asset(excerpt.visual)} alt={step.artifact} decoding="async"/><figcaption>{step.artifact} · {step.brand}</figcaption></figure>}
    {selected?.visuals.map((v,i)=><figure key={v.src}><img src={asset(v.src)} alt={v.caption} loading={i===0?'eager':'lazy'} decoding="async"/><figcaption>{v.caption}</figcaption></figure>)}
    {!selected&&<p role="status">{failed?<><span>These source notes could not load. </span><button onClick={()=>setRetry(retry+1)}>Try again ↗</button></>:'Loading source notes…'}</p>}
    {selected?.excerpts.map(page=><article className="process-source-excerpt" key={page.page}><span>Document excerpt / page {page.page}</span><blockquote>{page.text}</blockquote></article>)}
   </section>}
  </div>
 </dialog>;
}

type PageReading={key:string;title:string;primary:ProcessEntry[];additional:ProcessEntry[];shown:number};
const pageReading=(section?:PortfolioSection):PageReading=>({key:(section?.id||'all')+':'+(section?.items.map(p=>p.id).join(',')||''),title:section?.title||'The work',...processPagePlan(section),shown:0});

export default function CreativeProcess({ready,paused=false,reduced=false,section}:{ready:boolean;paused?:boolean;reduced?:boolean;section?:PortfolioSection}){
 const viewport=useRef<HTMLDivElement>(null),track=useRef<HTMLDivElement>(null);
 const progress=useRef<RailProgress>({offset:0,hold:0}),manual=useRef(false),touchTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [stopped,setStopped]=useState(false),[notes,setNotes]=useState<OpenNotes|null>(null);
 const [reading,setReading]=useState(()=>({current:pageReading(section),outgoing:[] as ProcessEntry[],exitHeight:0}));
 const wanted=pageReading(section),reset=useRef<number|null>(null),bounds=useRef({limit:0,speed:12,hold:9000}),last=useRef(0),revealing=useRef(false);
 const controls=useRef({paused,stopped,reduced,notes:!!notes});controls.current={paused,stopped,reduced,notes:!!notes};
 const current=reading.current,cards=[...current.primary,...current.additional.slice(0,current.shown)];
 const revealMore=()=>{revealing.current=true;progress.current.hold=0;setReading(state=>({...state,current:{...state.current,shown:Math.min(state.current.additional.length,state.current.shown+1)}}))};
 const reveal=useRef(revealMore);reveal.current=revealMore;
 const finish=useRef(()=>{});finish.current=()=>{reset.current=0;setReading(state=>({...state,outgoing:[]}))};
 useEffect(()=>{
  setReading(state=>{
   if(state.current.key===wanted.key)return state;
   const leaving=[...state.current.primary,...state.current.additional.slice(0,state.current.shown)].map((card,i)=>({...card,id:'out-'+(state.outgoing.length+i)+'-'+card.id}));
   const outgoing=[...state.outgoing,...leaving];
   return {current:wanted,outgoing,exitHeight:(viewport.current?.scrollTop||0)+(viewport.current?.clientHeight||0)};
  });
 },[wanted.key]);
 useLayoutEffect(()=>{
  const view=viewport.current,t=track.current;if(!view||!t)return;
  t.style.setProperty('--process-view-height',view.clientHeight+'px');
  if(reset.current!==null){view.scrollTop=reset.current;progress.current={offset:view.scrollTop,hold:0};reset.current=null}
  if(reading.outgoing.length){
   const start=t.querySelector<HTMLElement>('[data-current-page]')?.offsetTop||0;
   progress.current={offset:view.scrollTop,hold:0,transition:{from:view.scrollTop,to:start,elapsed:0}};
   if(reduced)finish.current();
  }
  revealing.current=false;
 },[current.key,reading.outgoing.length,reduced]);
 useLayoutEffect(()=>{
  const view=viewport.current,t=track.current;if(!view||!t)return;
  const measure=()=>{
   t.style.setProperty('--process-view-height',view.clientHeight+'px');
   bounds.current.limit=Math.max(0,view.scrollHeight-view.clientHeight);
   bounds.current.speed=view.clientWidth<180?9:13;
   const lastCards=cards.slice(-2).map(c=>c.title+' '+c.lines.join(' ')).join(' ');
   bounds.current.hold=readingHold(lastCards.split(/\s+/).length);
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(view);observer.observe(t);
  revealing.current=false;
  return()=>observer.disconnect();
 },[current.key,current.shown,reading.outgoing.length]);
 useEffect(()=>{
  if(!ready)return;
  let frame=0,disposed=false;
  const tick=(now:number)=>{
   if(disposed)return;
   const dt=last.current?now-last.current:0;last.current=now;
   const view=viewport.current;
   if(view&&!manual.current&&!document.hidden&&!Object.values(controls.current).some(Boolean)){
    const result=advanceRail(progress.current,dt,bounds.current.limit,bounds.current.speed,bounds.current.hold);
    progress.current=result.progress;view.scrollTop=result.progress.offset;
    if(result.settled)finish.current();
    else if(result.reveal&&!revealing.current)reveal.current();
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{disposed=true;cancelAnimationFrame(frame);last.current=0;clearTimeout(touchTimer.current)};
 },[ready]);
 function readManually(settle=false){
  clearTimeout(touchTimer.current);manual.current=true;
  if(settle&&progress.current.transition)finish.current();
 }
 function resume(){manual.current=false;progress.current={...progress.current,offset:viewport.current?.scrollTop||0,hold:0}}
 function blur(event:FocusEvent<HTMLDivElement>){if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&!event.currentTarget.matches(':hover'))resume()}
 // Once every layer has been read, rest on the last entry rather than repeating it.
 reveal.current=()=>{if(current.shown<current.additional.length)revealMore();else progress.current.hold=0};
 const renderCard=(step:Step,i:number)=>{const excerpt=excerptFor(step);return <article className={'process-card process-compact-card process-tone-'+step.tone} key={step.id}>
  <div className="process-card-index"><span>{String(i+1).padStart(2,'0')}</span><span>{step.brand}</span></div>
  <h3>{step.title}</h3><div className="process-card-lines">{step.lines.map(line=><span key={line}>{line}</span>)}</div>
  {step.showThumbnail&&step.preview&&<span className="process-work-anchor"><img data-project-thumbnail={step.projectIds?.[0]} src={previewAsset(step.preview,320)} alt="" loading="lazy" decoding="async"/><span>The film</span></span>}
  <button className="process-board-trigger" onClick={()=>setNotes({step,evidence:step.evidence[0]||''})} aria-label={'Read '+step.title}><ArtefactPreview ids={step.artifactIds}/><span className="process-board-link">Open the process <span aria-hidden="true">↗</span></span></button>
 </article>};
 return <><aside className="process-rail" aria-label="Creative strategy and production process" data-context={current.key} data-depth={current.shown} data-stopped={stopped}
  onWheelCapture={e=>{e.stopPropagation();readManually(true)}} onPointerMoveCapture={e=>e.stopPropagation()}
  onPointerEnter={e=>{if(e.pointerType==='mouse')readManually()}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!notes)resume()}}>
  <header className="process-rail-head"><div><span className="process-kicker">Behind this page / {current.title}</span><h2>Strategy <i>&</i><br/>the making.</h2></div><button className="process-pause" aria-label={stopped?'Resume process animation':'Pause process animation'} aria-pressed={stopped} onClick={()=>setStopped(!stopped)}>{stopped?'▶':'Ⅱ'}</button></header>
  <div ref={viewport} className="process-scroller" tabIndex={0} aria-label="Process notes. Hover or touch to pause, scroll to read, select a card to open."
   onFocusCapture={e=>{if(e.target.matches(':focus-visible'))readManually()}} onBlurCapture={blur}
   onPointerDown={e=>{if(e.pointerType==='touch')readManually(true)}} onPointerUp={e=>{if(e.pointerType==='touch')touchTimer.current=setTimeout(()=>{if(!controls.current.notes)resume()},8000)}}
   onPointerCancel={e=>{if(e.pointerType==='touch')touchTimer.current=setTimeout(()=>{if(!controls.current.notes)resume()},8000)}}
   onScroll={e=>{e.stopPropagation();const offset=e.currentTarget.scrollTop;if(!progress.current.transition&&Math.abs(offset-progress.current.offset)>2)readManually();if(manual.current)progress.current.offset=offset}}>
   <div ref={track} className="process-track">{reading.outgoing.length>0&&<div className="process-run process-outgoing" style={{height:reading.exitHeight,overflow:'hidden'}} aria-hidden="true" inert>{reading.outgoing.map(renderCard)}</div>}<div className="process-run" data-current-page>{cards.map(renderCard)}{current.shown<current.additional.length&&<button className="process-more" onClick={revealMore}>More behind this page ↓</button>}</div></div>
  </div><footer><span className="process-desktop-hint">Hover to read · Scroll for more</span><span className="process-touch-hint">Touch to read · Tap to open</span><button className="process-library-button" onClick={()=>setNotes({step:steps[0],evidence:steps[0].evidence[0],library:true})}>All notes ↗</button></footer>
 </aside>{notes&&<ProcessNotes step={notes.step} initialEvidence={notes.evidence} libraryMode={notes.library} onClose={()=>{setNotes(null);if(!viewport.current?.matches(':hover'))resume()}}/>}</>;
}
