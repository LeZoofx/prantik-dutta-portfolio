import {useEffect,useState} from 'react';
import overview from '../content/overview.json';
import positioning from '../content/positioning.json';
import {projectPath,site} from './content';
import KineticType from './KineticType';
import PosterType,{KineticCopy} from './PosterType';
import './overview.css';

export function OverviewApproach(){
 return <section className="work-context" aria-labelledby="overview-expertise">
  <div className="context-heading">
   <p>STRATEGY / PRODUCTION / POST</p>
   <h2 id="overview-expertise">What I do best.</h2>
   <span>I work with brands, producers and creators who need someone to shape the idea and see it through the edit.</span>
  </div>
  <div className="overview-specialties">
   {overview.specialties.map(specialty=><article key={specialty.label}>
    <p className="context-brand">{specialty.label}</p>
    <h3>{specialty.title}</h3>
    <p>{specialty.description}</p>
    <p className="overview-scope">{specialty.scope}</p>
    <ul>{specialty.links.map(link=><li key={link.id}><a href={projectPath(link.id)}>{link.label} <span aria-hidden="true">↗</span></a></li>)}</ul>
   </article>)}
  </div>
  <h3 className="overview-case-heading">From the brief to the cut.</h3>
  <div className="context-stories">
   {overview.cases.map(work=><article key={work.id}>
    <p className="context-brand">{work.brand}</p>
    <h4><a href={projectPath(work.id)}>{work.title} <span aria-hidden="true">↗</span></a></h4>
    <p>{work.description}</p>
   </article>)}
  </div>
 </section>;
}

export function About(){
 return <section className="about-section" id="about" data-art="brutal">
  <div className="section-top">
   <h2><KineticType text="Behind the frame." variant={1}/></h2>
   <span className="mono"><KineticCopy text="PRANTIK DUTTA / MUMBAI"/></span>
  </div>
  <div className="about-copy">
   <PosterType lines={['Creative strategy.','Video editing.','Post supervision.']} className="about-role"/>
   <div className="overview-about-copy">{overview.about.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>
   <div className="discipline-list">{positioning.disciplines.map((discipline,index)=><div key={discipline}>
    <span className="mono">{String(index+1).padStart(2,'0')}</span><KineticCopy text={discipline}/>
   </div>)}</div>
  </div>
  <div className="overview-experience">
   <h3>Roles and experience</h3>
   <ol>
    {overview.experience.map(job=><li key={job.company}>
     <p className="mono">{job.period}</p>
     <h4>{job.company}</h4>
     <p className="overview-job-role">{job.role}</p>
     <p>{job.detail}</p>
    </li>)}
   </ol>
   <a className="text-link" href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
  </div>
 </section>;
}


export function OverviewTop(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const sync=()=>setVisible(window.scrollY>320);
  sync();
  window.addEventListener('scroll',sync,{passive:true});
  return()=>window.removeEventListener('scroll',sync);
 },[]);
 return <button className="overview-top-button" type="button" hidden={!visible} onClick={event=>{
  if(event.detail===0)document.querySelector<HTMLElement>('.site-header .brand')?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
 }}><span aria-hidden="true">↑</span> Back to top</button>;
}
