import {useState,type CSSProperties} from 'react';
import {previewAsset,previewSrcSet,projectPath,projects,type Project} from './content';
import showcase from '../content/overview-showcase.json';
import overview from '../content/overview.json';
import KineticName from './KineticName';
import ClientMarquee from './ClientMarquee';
import {ResultsRibbon} from './Results';
import AIAccess from './AIAccess';

const curated=showcase.flatMap(item=>{
 const project=projects.find(p=>p.id===item.id);
 return project?[{...item,project}]:[];
});
if(!curated.length)curated.push(...projects.slice(0,7).map(project=>({id:project.id,title:project.title.split(' | ')[0],label:project.category,project})));

export default function HomeIntro({onOpen,onFun,onAI,onCampaigns}:{
 onOpen:(project:Project)=>void;onFun:()=>void;onAI:()=>void;onCampaigns:()=>void;
}){
 const [index,setIndex]=useState(0);
 const {project,title,label}=curated[index];
 const ratio=project.aspect||16/9;
 return <>
  <section className="home-intro overview-hero" data-art="liquid" aria-label="Prantik Dutta introduction">
   <div className="intro-identity">
    <p className="intro-kicker">{overview.eyebrow}</p>
    <h1><KineticName/></h1>
    <p className="overview-hero-lead">I build the story. I make it worth watching.</p>
    <p className="overview-intro">{overview.intro}</p>
    <div className="overview-hero-tags"><a href="#overview-expertise">Retention specialist</a><a href="#overview-expertise">Photorealistic AI direction</a></div>
    <div className="overview-hero-actions">
     <a className="overview-primary" href="#portfolio-selected-0">Browse work ↓</a>
     <button type="button" onClick={onFun}>Explore in 3D ↗</button>
    </div>
    <div className="overview-hero-shortcuts"><AIAccess onClick={onAI}/><AIAccess destination="campaigns" onClick={onCampaigns}/></div>
   </div>
   <div className="showcase-deck overview-feature" aria-label="Featured films">
    <div className="overview-feature-label"><span>SELECTED FILM</span><span>{String(index+1).padStart(2,'0')} / {curated.length}</span></div>
    <div className="deck-stage" style={{'--feature-ratio':ratio} as CSSProperties}>
     <a className="deck-front" href={projectPath(project.id)} aria-label={'Watch '+title} onClick={event=>{
      if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpen(project);}
     }}>
      <img src={previewAsset(project.poster)} srcSet={previewSrcSet(project.poster)} sizes={ratio<1?'235px':'(max-width:699px) 94vw, 47vw'} alt="" decoding="async" fetchPriority={index===0?'high':'auto'}/>
      <span className="deck-play" aria-hidden="true">↗</span>
     </a>
    </div>
    <div className="deck-caption">
     <div><span>{label}</span><h2>{title}</h2></div>
     <button type="button" className="overview-next-film" onClick={()=>setIndex((index+1)%curated.length)} disabled={curated.length<2}>Next film →</button>
    </div>
   </div>
   <ResultsRibbon overview compact/>
  </section>
  <ClientMarquee compact/>
 </>;
}
