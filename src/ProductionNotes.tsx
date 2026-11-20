import {useEffect,useRef,useState} from 'react';
import {cueRange,type AIAnnotation,type AICue} from './aiWork';

type Props={annotation:AIAnnotation;current?:AICue;time:number;playing:boolean;open:boolean;selected?:AICue;onOpen:()=>void;onClose:()=>void;onSelect:(cue:AICue)=>void;onResume?:()=>void};
export default function ProductionNotes({annotation,current,time,playing,open,selected,onOpen,onClose,onSelect,onResume}:Props){
 const [pulse,setPulse]=useState(0),attention=useRef({count:0,last:-Infinity});
 useEffect(()=>{
  if(!playing||open||time<5||attention.current.count>=3||time-attention.current.last<15)return;
  attention.current={count:attention.current.count+1,last:time};setPulse(n=>n+1);
 },[time,playing,open]);
 return <section className="production-notes" aria-label="Inside this film" onKeyDown={e=>{if(e.key==='Escape'&&open){e.stopPropagation();onClose()}}}>
  <button className="production-notes-toggle" aria-expanded={open} onClick={open?onClose:onOpen}>
   <span key={pulse} className={'production-notes-dot'+(pulse&&!open?' invite':'')} aria-hidden="true"/>
   <span><strong>Inside this film <small>{annotation.cues.length} notes</small></strong><span className="production-notes-current">{current?.title||annotation.label}</span></span>
   <span className="production-notes-sign" aria-hidden="true">{open?'−':'+'}</span>
  </button>
  {open&&<div className="production-notes-content">
   <p className="production-notes-intro">{annotation.description}</p>
   {selected&&<article className="production-note-reading"><span className="production-note-time">{cueRange(selected)}</span><h3>{selected.title}</h3><p>{selected.detail}</p></article>}
   <div className="production-notes-actions">{onResume&&<button onClick={onResume}>Resume film</button>}<button onClick={onClose}>Close notes</button></div>
   <nav className="production-notes-chapters" aria-label="Production moments">{annotation.cues.map(c=><button key={c.start+c.title} aria-current={selected===c?'true':undefined} onClick={()=>onSelect(c)}><span>{cueRange(c)}</span><strong>{c.title}</strong></button>)}</nav>
  </div>}
 </section>;
}
