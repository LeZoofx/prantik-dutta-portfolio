import {lazy,Suspense,useState,type MouseEvent} from 'react';
import {previewAsset,previewSrcSet,projectPath,type Project} from './content';
import {campaignFor,campaignItems,campaignMedia,campaignPreviews,campaignProjects,campaignBrands,filterCampaigns,type Campaign} from './campaigns';
import './campaigns.css';
const Evidence=lazy(()=>import('./CampaignEvidence'));

export function CampaignControls({brand,onBrand,sort,onSort}:{brand:string;onBrand:(v:string)=>void;sort:string;onSort:(v:'curated'|'brand')=>void}){
 return <div className="portfolio-tools"><label><span className="sr-only">Filter campaign brand or collaborator</span><select className="brand-sort" value={brand} onChange={e=>onBrand(e.target.value)}><option value="all">All brands</option>{campaignBrands.map(b=><option key={b}>{b}</option>)}</select></label><label><span className="sr-only">Sort campaigns</span><select className="brand-sort" value={sort} onChange={e=>onSort(e.target.value as 'curated'|'brand')}><option value="curated">Curated order</option><option value="brand">Brand A–Z</option></select></label></div>;
}

function activate(event:MouseEvent,onOpen:()=>void){if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpen()}}
function Thumb({project,onOpen}:{project:Project;onOpen:(p:Project)=>void}){
 return <a className={'campaign-thumb'+(project.provider==='image'?' is-artwork':'')} href={projectPath(project.id)} onClick={e=>activate(e,()=>onOpen(project))} aria-label={(project.provider==='image'?'View ':'Watch ')+project.title}>
  <span className="campaign-thumb-image">{project.poster?<img src={previewAsset(project.poster,320)} srcSet={previewSrcSet(project.poster)} sizes="(max-width:699px) 35vw, 22vw" alt="" loading="lazy" decoding="async"/>:<span className="campaign-thumb-fallback">{project.title}</span>}<span className="campaign-thumb-icon" aria-hidden="true">{project.provider==='image'?'↗':project.provider==='external'?'↗':'▶'}</span></span>
  <span className="campaign-thumb-title">{project.title}</span>
 </a>;
}

export function CampaignTile({id,onProject}:{id:string;onProject:(p:Project)=>void}){
 const c=campaignFor(id);if(!c)return null;
 const project=campaignProjects.find(p=>p.id===id)!;
 return <div className="campaign-tile" data-campaign={id}>
  <a className="campaign-tile-intro" href={projectPath(id)} onClick={e=>activate(e,()=>onProject(project))}><span className="campaign-kind">{c.kind}</span><strong>{c.title}</strong><span className="campaign-tile-scope">{c.scope.slice(0,3).join(' / ')}</span></a>
  <div className="campaign-mini-grid">{campaignPreviews(c).map(p=><Thumb key={p.id} project={p} onOpen={onProject}/>)}</div>
  <a className="campaign-open" href={projectPath(id)} onClick={e=>activate(e,()=>onProject(project))}><span>Explore collection · {campaignItems(c).length} {campaignItems(c).length===1?'asset':'assets'}</span><span aria-hidden="true">↗</span></a>
 </div>;
}

export function CampaignIndex({brand,query,sort,onProject}:{brand:string;query:string;sort:string;onProject:(p:Project)=>void}){
 const list=filterCampaigns(brand,query,sort);
 return list.length?<div className="campaign-index">{list.map(c=><article className="campaign-index-card" key={c.id}><CampaignTile id={c.id} onProject={onProject}/><p>{c.summary}</p><ul className="campaign-scope">{c.scope.map(s=><li key={s}>{s}</li>)}</ul><p className="campaign-index-series">{c.sections.map(s=>s.title).join(' / ')}</p></article>)}</div>:<p className="empty-message" role="status">No collections match that search.</p>;
}

export function CampaignDetail({campaign,onProject}:{campaign:Campaign;onProject:(p:Project)=>void}){
 const [notes,setNotes]=useState(false);
 return <div className="campaign-detail"><p className="campaign-kind">{campaign.kind} · {[campaign.brand,...campaign.collaborators].join(' / ')}</p><p className="campaign-summary">{campaign.summary}</p><ul className="campaign-scope">{campaign.scope.map(s=><li key={s}>{s}</li>)}</ul>
  {campaign.sections.map(section=><section className="campaign-series" key={section.title} aria-label={section.title}><h2>{section.title}</h2>{section.note&&<p>{section.note}</p>}<div className="campaign-asset-grid">{section.projectIds.map(id=>{const p=campaignMedia(id);return p?<figure key={id}><Thumb project={p} onOpen={onProject}/>{p.provider==='image'&&<figcaption>{p.status==='planning-study'?'Planning study':'Supplied artwork reference'}</figcaption>}{p.provider==='external'&&<a className="campaign-source" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Open original episode ↗</a>}</figure>:null})}</div></section>)}
  {!!campaign.evidence.length&&<details className="campaign-notes" onToggle={e=>setNotes(e.currentTarget.open)}><summary>Research, direction & production notes</summary>{notes&&<Suspense fallback={<p>Opening notes…</p>}><Evidence ids={campaign.evidence}/></Suspense>}</details>}
 </div>;
}
