import {lazy,Suspense,useState,type MouseEvent} from 'react';
import {previewAsset,previewSrcSet,projectPath,type Project} from './content';
import {campaignFor,campaignItems,campaignMedia,campaignPreviews,campaignProjects,campaignBrands,filterCampaignFamilies,type Campaign} from './campaigns';
import KineticType from './KineticType';
import {KineticCopy} from './PosterType';
import './campaigns.css';
const Evidence=lazy(()=>import('./CampaignEvidence'));

export function CampaignControls({brand,onBrand,sort,onSort}:{brand:string;onBrand:(v:string)=>void;sort:string;onSort:(v:'curated'|'brand')=>void}){
 return <div className="portfolio-tools"><label><span className="sr-only">Filter campaign brand or collaborator</span><select className="brand-sort" value={brand} onChange={e=>onBrand(e.target.value)}><option value="all">All brands</option>{campaignBrands.map(b=><option key={b}>{b}</option>)}</select></label><label><span className="sr-only">Sort campaigns</span><select className="brand-sort" value={sort} onChange={e=>onSort(e.target.value as 'curated'|'brand')}><option value="curated">Portfolio hierarchy</option><option value="brand">Brand A–Z</option></select></label></div>;
}
function activate(event:MouseEvent,onOpen:()=>void){if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpen()}}
function Thumb({project,onOpen}:{project:Project;onOpen:(p:Project)=>void}){
 return <a className={'campaign-thumb'+(project.provider==='image'?' is-artwork':'')} href={projectPath(project.id)} onClick={e=>activate(e,()=>onOpen(project))} aria-label={(project.provider==='image'?'View ':'Watch ')+project.title}>
  <span className="campaign-thumb-image">{project.poster?<img src={previewAsset(project.poster,320)} srcSet={previewSrcSet(project.poster)} sizes="(max-width:699px) 35vw, 22vw" alt="" loading="lazy" decoding="async"/>:<span className="campaign-thumb-fallback">{project.title}</span>}<span className="campaign-thumb-icon" aria-hidden="true">{project.provider==='image'||project.provider==='external'?'↗':'▶'}</span></span>
  <span className="campaign-thumb-title">{project.title}</span>
 </a>;
}
export function CampaignTile({id,onProject}:{id:string;onProject:(p:Project)=>void}){
 const c=campaignFor(id);if(!c)return null;
 const project=campaignProjects.find(p=>p.id===id)!,previews=campaignPreviews(c),cover=previews[0],items=campaignItems(c),films=items.filter(p=>p.provider!=='image').length;
 return <div className="campaign-tile" data-campaign={id}>
  <div className="campaign-contact-sheet">
   <a className={'campaign-cover'+((cover?.aspect||16/9)<1?' portrait-cover':'')} href={projectPath(id)} aria-label={'Explore '+c.title} onClick={e=>activate(e,()=>onProject(project))}>{cover?.poster&&<img src={previewAsset(cover.poster)} srcSet={previewSrcSet(cover.poster)} sizes="(max-width:699px) 65vw, 40vw" alt="" loading="lazy" decoding="async"/>}<span className="campaign-cover-cue" aria-hidden="true">↗</span></a>
   <a className="campaign-stamp" href={projectPath(id)} onClick={e=>activate(e,()=>onProject(project))}>{films?films+(films===1?' film':' films'):items.length+' studies'}<span aria-hidden="true"> ↗</span></a>
   <div className="campaign-photo-stack">{previews.slice(1,3).map(p=><Thumb key={p.id} project={p} onOpen={onProject}/>)}</div>
  </div>
  <a className="campaign-tile-title" href={projectPath(id)} onClick={e=>activate(e,()=>onProject(project))}><span className="campaign-kind">{c.kind}</span><strong><KineticCopy text={c.title}/></strong><span className="campaign-tile-arrow" aria-hidden="true">↗</span></a>
 </div>;
}
export function CampaignIndex({brand,query,sort,onProject}:{brand:string;query:string;sort:string;onProject:(p:Project)=>void}){
 const families=filterCampaignFamilies(brand,query,sort);
 return families.length?<div className="campaign-index">{families.map((family,i)=><section className={'campaign-family'+(family.collections.length===1?' single-collection':'')} key={family.id} data-art={family.art} aria-labelledby={'campaign-family-'+family.id}>
  <header className="campaign-family-heading"><p className="campaign-family-number">{String(i+1).padStart(2,'0')} / {family.level}</p><h3 id={'campaign-family-'+family.id}><KineticType text={family.title} variant={family.theme}/></h3><p>{family.summary}</p><span className="campaign-family-line" aria-hidden="true">↘</span></header>
  <div className="campaign-family-grid">{family.collections.map(c=><article className="campaign-index-card" key={c.id}><CampaignTile id={c.id} onProject={onProject}/><p className="campaign-index-intro">{c.summary}</p><p className="campaign-index-series">{c.sections.map(s=>s.title).join(' / ')}</p></article>)}</div>
 </section>)}</div>:<p className="empty-message" role="status">No collections match that search.</p>;
}
export function CampaignDetail({campaign,onProject}:{campaign:Campaign;onProject:(p:Project)=>void}){
 const [notes,setNotes]=useState(false);
 return <div className="campaign-detail"><p className="campaign-kind">{campaign.kind} · {[campaign.brand,...campaign.collaborators].join(' / ')}</p><p className="campaign-summary">{campaign.summary}</p><ul className="campaign-scope">{campaign.scope.map(s=><li key={s}>{s}</li>)}</ul>
  {campaign.sections.map((section,i)=><section className="campaign-series" key={section.title} aria-label={section.title}><div className="campaign-series-heading"><span>{String(i+1).padStart(2,'0')}</span><h2>{section.title}</h2></div>{section.note&&<p>{section.note}</p>}<div className="campaign-asset-grid">{section.projectIds.map(id=>{const p=campaignMedia(id);return p?<figure key={id}><Thumb project={p} onOpen={onProject}/>{p.provider==='image'&&<figcaption>{p.status==='planning-study'?'Planning study':'Supplied artwork reference'}</figcaption>}{p.provider==='external'&&<a className="campaign-source" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Open original episode ↗</a>}</figure>:null})}</div></section>)}
  {!!campaign.evidence.length&&<details className="campaign-notes" onToggle={e=>setNotes(e.currentTarget.open)}><summary>Research, direction & production notes</summary>{notes&&<Suspense fallback={<p>Opening notes…</p>}><Evidence ids={campaign.evidence}/></Suspense>}</details>}
 </div>;
}
