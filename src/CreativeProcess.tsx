import {useEffect,useRef,useState,type FocusEvent} from 'react';
import {asset} from './content';
import steps from '../content/creative-process.json';
import excerpts from '../content/process-assets.json';
import sourceIndex from '../content/process-library-sources.json';

type Step=typeof steps[number];
type Excerpt=typeof excerpts[keyof typeof excerpts];
const excerptFor=(step:Step)=>excerpts[step.id as keyof typeof excerpts] as Excerpt;
const sourceFor=(id:string)=>sourceIndex[id as keyof typeof sourceIndex];
type Evidence={document:string;excerpts:{page:number;text:string}[];visuals:{src:string;caption:string}[]};
type OpenNotes={step:Step;evidence:string};

function ProcessNotes({step,initialEvidence,onClose}:{step:Step;initialEvidence:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),excerpt=excerptFor(step);
 const [selection,setSelection]=useState(initialEvidence),[library,setLibrary]=useState<Record<string,Evidence>|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const selected=library?.[selection],source=sourceFor(selection);
 useEffect(()=>{let live=true;setFailed(false);import('../content/process-evidence.json').then(m=>{if(live)setLibrary(m.default)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false}},[retry]);
 useEffect(()=>{const el=dialog.current,prior=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();prior?.focus({preventScroll:true})}},[]);
 return <dialog ref={dialog} className="process-notes" aria-label={step.label+' — production notes'} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.currentTarget===e.target)onClose()}}>
  <header><span>{step.label} / {step.brand}</span><button onClick={onClose} autoFocus>Close ×</button></header>
  <div className="process-notes-body"><p className="process-note-kicker">Creative strategy / production / post</p><h2>{step.title}</h2><p>{step.detail}</p>
   <nav className="process-document-tabs" aria-label="Related source documents">{step.evidence.map(id=><button key={id} aria-pressed={selection===id} onClick={()=>setSelection(id)}>{sourceFor(id).title}</button>)}</nav>
   <section className="process-selected-evidence" aria-label={source.title}><h3>{source.title}</h3><p className="process-source-caption">{source.document.split('/').pop()?.replace(/_/g,' ').replace('.pdf','')} · pages {source.pages.join(', ')}</p>
    {selection===step.evidence[0]&&!selected?.visuals.length&&<figure><img src={asset(excerpt.visual)} alt={step.artifact} decoding="async"/><figcaption>{step.artifact} · {step.brand}</figcaption></figure>}
    {selected?.visuals.map((v,i)=><figure key={v.src}><img src={asset(v.src)} alt={v.caption} loading={i===0?'eager':'lazy'} decoding="async"/><figcaption>{v.caption}</figcaption></figure>)}
    {!selected&&<p role="status">{failed?<><span>These source notes could not load. </span><button onClick={()=>setRetry(retry+1)}>Try again ↗</button></>:'Loading source notes…'}</p>}
    {selected?.excerpts.map(page=><article className="process-source-excerpt" key={page.page}><span>Document excerpt / page {page.page}</span><blockquote>{page.text}</blockquote></article>)}
   </section>
  </div>
 </dialog>;
}

export default function CreativeProcess({ready,paused=false,reduced=false}:{ready:boolean;paused?:boolean;reduced?:boolean}){
 const viewport=useRef<HTMLDivElement>(null),track=useRef<HTMLDivElement>(null),animation=useRef<Animation|null>(null);
 const manual=useRef(false),touchTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [stopped,setStopped]=useState(false),[notes,setNotes]=useState<OpenNotes|null>(null);
 const controls=useRef({paused,stopped,reduced,notes:!!notes});controls.current={paused,stopped,reduced,notes:!!notes};
 const duration=steps.length*18000;
 function sync(){const a=animation.current;if(!a)return;if(manual.current||document.hidden||Object.values(controls.current).some(Boolean))a.pause();else a.play()}
 function readManually(){
  clearTimeout(touchTimer.current);if(manual.current)return;
  const view=viewport.current,t=track.current,a=animation.current;if(!view||!t)return;
  const offset=a?(Number(a.currentTime||0)%duration)/duration*(t.offsetHeight/2):view.scrollTop;
  manual.current=true;a?.pause();view.dataset.manual='true';view.scrollTop=offset;
 }
 function resume(){
  const view=viewport.current,t=track.current,a=animation.current;if(!view||!t||!manual.current)return;
  if(!a){manual.current=false;return}
  const height=t.offsetHeight/2,offset=height?view.scrollTop%height:0;
  if(a)a.currentTime=height?offset/height*duration:0;
  manual.current=false;view.dataset.manual='false';view.scrollTop=0;sync();
 }
 function blur(event:FocusEvent<HTMLDivElement>){if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&!event.currentTarget.matches(':hover'))resume()}
 useEffect(()=>{
  if(!ready||reduced||!track.current?.animate)return;
  const a=track.current.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(0,-50%,0)'}],{duration,iterations:Infinity,easing:'linear'});
  animation.current=a;sync();document.addEventListener('visibilitychange',sync);
  return()=>{a.cancel();animation.current=null;clearTimeout(touchTimer.current);document.removeEventListener('visibilitychange',sync)};
 },[ready,reduced,duration]);
 useEffect(sync,[paused,stopped,notes]);
 return <><aside className="process-rail" aria-label="Creative strategy and production process" data-stopped={stopped}
  onPointerEnter={e=>{if(e.pointerType==='mouse')readManually()}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!notes)resume()}}>
  <header className="process-rail-head"><div><span className="process-kicker">From the first question</span><h2>Strategy <i>&</i><br/>the making.</h2></div><button className="process-pause" aria-label={stopped?'Resume process animation':'Pause process animation'} aria-pressed={stopped} onClick={()=>setStopped(!stopped)}>{stopped?'▶':'Ⅱ'}</button></header>
  <div ref={viewport} className="process-scroller" tabIndex={0} aria-label="Process notes. Hover or touch to pause, scroll to read, select a card to open." data-manual="false"
   onFocusCapture={e=>{if(e.target.matches(':focus-visible'))readManually()}} onBlurCapture={blur}
   onPointerDown={e=>{if(e.pointerType==='touch')readManually()}} onPointerUp={e=>{if(e.pointerType==='touch')touchTimer.current=setTimeout(()=>{if(!controls.current.notes)resume()},8000)}}
   onPointerCancel={e=>{if(e.pointerType==='touch')touchTimer.current=setTimeout(()=>{if(!controls.current.notes)resume()},8000)}}
   onScroll={()=>{const view=viewport.current,t=track.current;if(!reduced&&animation.current&&manual.current&&view&&t&&view.scrollTop>=t.offsetHeight/2)view.scrollTop-=t.offsetHeight/2}}>
   <div ref={track} className="process-track">{[0,1].map(copy=><div className="process-run" key={copy} aria-hidden={copy===1?true:undefined}>{steps.map((step,i)=>{const excerpt=excerptFor(step);return <article className={'process-card process-tone-'+step.tone} key={step.id}>
    <div className="process-card-index"><span>{String(i+1).padStart(2,'0')}</span><span>{step.label}</span><span aria-hidden="true">↗</span></div>
    <h3>{step.title}</h3><div className="process-card-lines">{step.lines.map(line=><span key={line}>{line}</span>)}</div>
    <button className="process-proof" tabIndex={copy===1?-1:0} onClick={()=>setNotes({step,evidence:step.evidence[0]})} aria-label={'Open '+step.label.toLowerCase()+' notes'}><img src={asset(excerpt.preview)} width={excerpt.previewWidth} height={excerpt.previewHeight} alt={step.artifact} loading="lazy" fetchPriority="low" decoding="async"/><span>{step.artifact}<i>Open notes ↗</i></span></button>
    <div className="process-evidence-links">{step.evidence.map(id=><button key={id} tabIndex={copy===1?-1:0} onClick={()=>setNotes({step,evidence:id})} aria-label={'Open '+sourceFor(id).title}>{sourceFor(id).title}<span aria-hidden="true">↗</span></button>)}</div>
    <div className="process-stages" aria-label={step.tags.join(' to ')}>{step.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p className="process-card-brand">{step.brand}</p>
   </article>})}</div>)}</div>
  </div><footer><span className="process-desktop-hint">Hover to read · Scroll to explore</span><span className="process-touch-hint">Touch to read · Tap to open</span><i aria-hidden="true">↑</i></footer>
 </aside>{notes&&<ProcessNotes step={notes.step} initialEvidence={notes.evidence} onClose={()=>{setNotes(null);if(!viewport.current?.matches(':hover'))resume()}}/>}</>;
}
