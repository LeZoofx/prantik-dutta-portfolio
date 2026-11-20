import {Fragment,useEffect,useRef,useState,type CSSProperties} from 'react';
import {asset} from './content';
import {artefactById,artefactsForProjects,type ProcessArtefact,type ProcessStep} from './processContext';
import './process-artefacts.css';

export function ArtefactPreview({ids=[]}:{ids?:string[]}){
 const items=ids.map(artefactById).filter((a):a is ProcessArtefact=>!!a);
 return items.length?<span className={'artefact-peek peek-'+items.length} aria-hidden="true">{items.map((a,i)=><span key={a.id} className="artefact-peek-sheet" style={{'--sheet':i} as CSSProperties}><img src={asset(a.preview)} alt="" loading="lazy" decoding="async"/><span>{a.kind}</span></span>)}</span>:null;
}
function ArtefactViewer({items,index,onIndex,onClose}:{items:ProcessArtefact[];index:number;onIndex:(n:number)=>void;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),item=items[index];
 useEffect(()=>{const prior=document.activeElement as HTMLElement|null;ref.current?.showModal();return()=>{ref.current?.close();prior?.focus({preventScroll:true})}},[]);
 function move(delta:number){onIndex((index+delta+items.length)%items.length)}
 return <dialog ref={ref} className="artefact-viewer" aria-label={item.caption} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onClick={e=>{if(e.currentTarget===e.target)onClose()}} onKeyDown={e=>{e.stopPropagation();if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}}>
  <header><span>{item.kind} · {index+1} / {items.length}</span><button onClick={onClose} autoFocus>Close ×</button></header>
  <div className="artefact-viewer-picture"><img src={asset(item.src)} alt={item.caption}/></div>
  <footer><button onClick={()=>move(-1)} aria-label="Previous artefact">←</button><span>{item.caption}</span><button onClick={()=>move(1)} aria-label="Next artefact">→</button></footer>
 </dialog>;
}
export default function ProcessArtefacts({projectIds=[],sections=[]}:{projectIds?:string[];sections?:ProcessStep[]}){
 const items=artefactsForProjects(projectIds),[kind,setKind]=useState('All'),[zoom,setZoom]=useState<number|null>(null);
 const kinds=[...new Set(items.map(a=>a.kind))],visible=kind==='All'?items:items.filter(a=>a.kind===kind),notes=kind==='All'?sections:[];
 const note=(part:ProcessStep,i:number)=><article key={part.id} className="artefact-decision" style={{'--piece':i} as CSSProperties}><span>{part.label}</span><h4>{part.title}</h4><p>{part.detail}</p></article>;
 if(!items.length)return null;
 return <section className="artefact-gallery" aria-label="Production artefacts">
  <div className="artefact-gallery-heading"><span className="process-note-kicker">Inside the production</span><h3>The working wall.</h3><p>{items.length} artefacts · Select a piece to look closer.</p></div>
  {kinds.length>1&&<nav className="artefact-filters" aria-label="Filter production artefacts">{['All',...kinds].map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}>{k}</button>)}</nav>}
  <div className="artefact-wall">{visible.map((a,i)=><Fragment key={a.id}><figure className={'artefact-sheet'+(a.width/a.height>2.1?' artefact-wide':a.width/a.height<.8?' artefact-portrait':'')} style={{'--piece':i%6,'--arrive':Math.min(i,9)} as CSSProperties}>
   <button onClick={()=>setZoom(i)} aria-label={'Inspect '+a.caption}><span className="artefact-sheet-tab">{a.kind}</span><img src={asset(a.preview)} alt={a.caption} loading="lazy" decoding="async" width={a.width} height={a.height}/><span className="artefact-inspect" aria-hidden="true">⤢</span></button><figcaption>{a.caption}</figcaption>
  </figure>{i%2===1&&notes[Math.floor(i/2)]&&note(notes[Math.floor(i/2)],Math.floor(i/2))}</Fragment>)}{notes.slice(Math.floor(visible.length/2)).map((part,i)=>note(part,Math.floor(visible.length/2)+i))}</div>
  {zoom!==null&&<ArtefactViewer items={visible} index={zoom} onIndex={setZoom} onClose={()=>setZoom(null)}/>}
 </section>;
}
