import {useEffect,useRef,useState,type FocusEvent} from 'react';
import {asset} from './content';
import steps from '../content/creative-process.json';
import excerpts from '../content/process-assets.json';

type Step=typeof steps[number];
type Excerpt=typeof excerpts[keyof typeof excerpts];
const excerptFor=(step:Step)=>excerpts[step.id as keyof typeof excerpts] as Excerpt;

function ProcessNotes({step,onClose}:{step:Step;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),excerpt=excerptFor(step);
 useEffect(()=>{const el=dialog.current,prior=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();prior?.focus({preventScroll:true})}},[]);
 return <dialog ref={dialog} className="process-notes" aria-label={step.label+' — production notes'} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.currentTarget===e.target)onClose()}}>
  <header><span>{step.label} / {step.brand}</span><button onClick={onClose} autoFocus>Close ×</button></header>
  <div className="process-notes-body"><p className="process-note-kicker">Creative strategy / production / post</p><h2>{step.title}</h2><p>{step.detail}</p>
   <figure><img src={asset(excerpt.visual)} alt={step.artifact} decoding="async"/><figcaption>{step.artifact} · {step.brand}</figcaption></figure>
   {excerpt.visual!==excerpt.proof&&<figure><img src={asset(excerpt.proof)} alt={step.label+' document excerpt, page '+excerpt.page} loading="lazy" decoding="async"/><figcaption>{excerpt.document.split('/').pop()?.replace(/_/g,' ').replace('.pdf','')} · page {excerpt.page}</figcaption></figure>}
  </div>
 </dialog>;
}

export default function CreativeProcess({ready,paused=false,reduced=false}:{ready:boolean;paused?:boolean;reduced?:boolean}){
 const viewport=useRef<HTMLDivElement>(null),track=useRef<HTMLDivElement>(null),animation=useRef<Animation|null>(null);
 const manual=useRef(false),touchTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [stopped,setStopped]=useState(false),[notes,setNotes]=useState<Step|null>(null);
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
    <button className="process-proof" tabIndex={copy===1?-1:0} onClick={()=>setNotes(step)} aria-label={'Open '+step.label.toLowerCase()+' notes'}><img src={asset(excerpt.preview)} width={excerpt.previewWidth} height={excerpt.previewHeight} alt={step.artifact} loading="lazy" fetchPriority="low" decoding="async"/><span>{step.artifact}<i>Open notes ↗</i></span></button>
    <div className="process-stages" aria-label={step.tags.join(' to ')}>{step.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p className="process-card-brand">{step.brand}</p>
   </article>})}</div>)}</div>
  </div><footer><span className="process-desktop-hint">Hover to read · Scroll to explore</span><span className="process-touch-hint">Touch to read · Tap to open</span><i aria-hidden="true">↑</i></footer>
 </aside>{notes&&<ProcessNotes step={notes} onClose={()=>{setNotes(null);if(!viewport.current?.matches(':hover'))resume()}}/>}</>;
}
