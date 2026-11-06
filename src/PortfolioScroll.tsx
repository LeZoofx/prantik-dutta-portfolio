import {lazy,Suspense,useEffect,useMemo,useRef,useState,type CSSProperties,type MouseEvent} from 'react';
import {href,previewAsset,previewSrcSet,projectPath,platformLabel,selectEmbeds,type Project} from './content';
import {buildSections,brandFor,contextFor,portfolioCategories,type PortfolioCategory,type WorkSort} from './portfolioSections';
import BrandControls from './BrandControls';
import PlaybackToggle from './PlaybackToggle';
import {CampaignControls,CampaignIndex} from './CampaignCollection';
import {usePerformance} from './Performance';

const Player=lazy(()=>import('./JourneyPlayer'));
const pageSize=9;
const ratioOf=(project:Project)=>project.aspect||16/9;
const workName=(project:Project)=>project.title.split(' | ')[0].replace(/\s*\(Official.*$/i,'').replace(/\s*- Official Trailer$/i,'');

export default function PortfolioScroll({projects,onProject,onIndex,paused=false}:{
 projects:Project[];onProject:(project:Project)=>void;onIndex:()=>void;paused?:boolean;
}){
 const {mediaReady,maxPlayers,autoplay:playing}=usePerformance();
 const [category,setCategory]=useState<PortfolioCategory>('selected');
 const [brand,setBrand]=useState('all'),[sort,setSort]=useState<WorkSort>('curated');
 const [limit,setLimit]=useState(pageSize),[visible,setVisible]=useState<string[]>([]),[muted,setMuted]=useState(true);
 const grid=useRef<HTMLDivElement>(null);
 const sections=useMemo(()=>buildSections(projects,'curated'),[projects]);
 const matching=useMemo(()=>buildSections(projects,sort,brand),[projects,sort,brand]);
 const brandItems=useMemo(()=>sections.filter(section=>section.category===category).flatMap(section=>section.items),[sections,category]);
 const items=useMemo(()=>[...new Map(matching.filter(section=>section.category===category).flatMap(section=>section.items.map(project=>[project.id,project] as const))).values()],[matching,category]);
 const shown=items.slice(0,limit),context=contextFor(category);
 const formats=[
  {name:'Landscape',portrait:false,items:shown.filter(project=>ratioOf(project)>=1)},
  {name:'Portrait',portrait:true,items:shown.filter(project=>ratioOf(project)<1)},
 ].filter(format=>format.items.length);

 useEffect(()=>{
  const root=grid.current;
  setVisible([]);
  if(!playing||paused||!root||!window.IntersectionObserver)return;
  const observer=new IntersectionObserver(entries=>setVisible(previous=>{
   const next=new Set(previous);
   for(const entry of entries){
    const id=(entry.target as HTMLElement).dataset.projectId!;
    if(entry.isIntersecting)next.add(id);else next.delete(id);
   }
   return [...next];
  }),{threshold:.25});
  root.querySelectorAll<HTMLElement>('[data-project-id]').forEach(card=>observer.observe(card));
  return()=>observer.disconnect();
 },[playing,paused,items,limit]);

 const playable=playing&&mediaReady&&!paused?selectEmbeds(items.filter(project=>visible.includes(project.id)),maxPlayers):[];
 function open(event:MouseEvent<HTMLAnchorElement>,project:Project){
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onProject(project);
 }
 function choose(category:PortfolioCategory){
  setCategory(category);setBrand('all');setLimit(pageSize);
 }

 return <section className="overview-work" id="portfolio-selected-0" aria-labelledby="overview-work-heading">
  <header className="overview-work-header">
   <div><p className="mono">THE PORTFOLIO</p><h2 id="overview-work-heading">Selected work.</h2></div>
   <a href={href('work/')} onClick={event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onIndex();}}}>Open work index ↗</a>
  </header>
  <div className="overview-work-controls">
   <nav aria-label="Portfolio categories">
    {portfolioCategories.map(item=><button type="button" key={item.id} aria-pressed={category===item.id} onClick={()=>choose(item.id)}>{item.label}</button>)}
   </nav>
   <div className="overview-work-tools">
    {category==='brands'?<CampaignControls brand={brand} sort={sort} onBrand={setBrand} onSort={setSort}/>:<>
     <BrandControls projects={brandItems} brand={brand} sort={sort} onBrand={value=>{setBrand(value);setLimit(pageSize);}} onSort={value=>{setSort(value);setLimit(pageSize);}}/>
     <PlaybackToggle/>
     {playing&&<button className="overview-sound" type="button" onClick={()=>setMuted(!muted)} aria-pressed={!muted}>{muted?'Sound off':'Sound on'}</button>}
    </>}
   </div>
  </div>
  <p className="overview-work-focus">{context.focus}</p>
  {category==='brands'?<CampaignIndex brand={brand} query="" sort={sort} onProject={onProject}/>:<>
   <div ref={grid}>
    {formats.map(format=><div key={format.name} className="overview-work-format">
     {formats.length>1&&<p className="overview-format-label">{format.name}</p>}
     <div className="overview-work-grid" data-format={format.portrait?'portrait':'landscape'}>
      {format.items.map(project=>{
       const name=workName(project),playingHere=playable.includes(project.id),ratio=ratioOf(project);
       const poster=project.poster?<img src={previewAsset(project.poster)} srcSet={previewSrcSet(project.poster)} sizes={format.portrait?'230px':'(max-width:699px) 94vw, (max-width:1050px) 45vw, 30vw'} alt="" loading="lazy" decoding="async"/>:<span className="overview-work-placeholder">{name}</span>;
       return <article key={project.id} className="overview-work-card" data-project-id={project.id} style={{'--work-ratio':ratio} as CSSProperties}>
        <div className="overview-work-media">
         {playingHere?<Suspense fallback={poster}><Player project={project} enabled muted={muted||playable[0]!==project.id} playing onOpen={()=>onProject(project)}/></Suspense>:
          <a href={projectPath(project.id)} aria-label={'Watch '+name} onClick={event=>open(event,project)}>{poster}<span className="overview-watch" aria-hidden="true">↗</span></a>}
        </div>
        <div className="overview-work-meta"><span>{brandFor(project)||context.title}</span><span>{platformLabel(project)}</span></div>
        <h3><a href={projectPath(project.id)} onClick={event=>open(event,project)}>{name}</a></h3>
       </article>;
      })}
     </div>
    </div>)}
    {!items.length&&<p className="empty-message">No work matches this filter. <button onClick={()=>setBrand('all')}>Clear filter</button></p>}
   </div>
   {items.length>limit&&<button className="overview-more" type="button" onClick={()=>setLimit(limit+pageSize)}>Show more {context.title.toLowerCase()} ↓</button>}
  </>}
 </section>;
}
