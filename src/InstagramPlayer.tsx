import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {asset,previewAsset,previewSrcSet,type Project} from './content';
import {useVideoPermit} from './Performance';
export function instagramEmbed(project:Project){const match=new URL(project.sourceUrl).pathname.match(/^\/(?:p|reel|reels|tv)\/([\w-]+)/);return match?'https://www.instagram.com/p/'+match[1]+'/embed/':project.embedUrl||''}
export default function InstagramPlayer({project,enabled,playing,onOpen,explicit=false}:{project:Project;enabled:boolean;playing:boolean;explicit?:boolean;onOpen?:()=>void}){
 const root=useRef<HTMLDivElement>(null),[scale,setScale]=useState(1),[loaded,setLoaded]=useState(false),[requested,setRequested]=useState(false);
 const permitted=useVideoPermit(!explicit&&(enabled||requested)&&playing);
 const width=400,height=Math.round(width/(project.aspect||9/16)+120),src=instagramEmbed(project),mount=!!src&&(explicit||permitted);
 useEffect(()=>{const el=root.current;if(!el)return;const resize=()=>setScale(Math.min(el.clientWidth/width,el.clientHeight/height));resize();if(!window.ResizeObserver){window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)}const o=new ResizeObserver(resize);o.observe(el);return()=>o.disconnect()},[height]);
 useEffect(()=>{setLoaded(false);setRequested(false)},[project.id]);
 useEffect(()=>{if(loaded&&mount)root.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}))},[loaded,mount]);

 return <div className={'instagram-player'+(loaded&&mount?' embed-loaded':'')} ref={root} style={{'--ig-scale':scale} as CSSProperties}>
  {project.poster&&<img loading="lazy" decoding="async" className="instagram-poster" src={previewAsset(project.poster)} srcSet={previewSrcSet(project.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={project.title}/>}
  {mount?<iframe key={src} src={src} title={project.title+' — Instagram video'} width={width} height={height} style={{width,height}} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={()=>setLoaded(true)}/>:<button className="instagram-load" onClick={()=>setRequested(true)} aria-label={'Play Instagram video: '+project.title}>▶<span>Play video</span></button>}
  {mount&&!loaded&&<span className="instagram-loading">Loading Instagram…</span>}
  {onOpen&&<button className="film-expand" aria-label={'Expand video: '+project.title} onClick={onOpen}><span aria-hidden="true">⤢</span><span className="expand-label">Expand</span></button>}
 </div>;
}
