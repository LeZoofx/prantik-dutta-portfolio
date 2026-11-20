import steps from '../content/creative-process.json';
import profiles from '../content/process-contexts.json';
import campaigns from '../content/campaigns.json';
import artefacts from '../content/process-artefacts.json';
import type {PortfolioSection} from './portfolioSections';

export type ProcessStep=typeof steps[number]&{baseId?:string;preview?:string;projectIds?:string[];contextTitle?:string};
type Profile={label?:string;campaigns:string[];projects:string[];cards:{base:string;title:string;lines:string[];detail:string;evidence:string[]}[]};
const catalogue=profiles as Record<string,Profile>;

// Match the actual page lineup, including campaign collections and brand filters.
// Never substitute the whole category for the items currently on this page.
export function processForPage(section?:PortfolioSection,focusedCampaignId?:string):ProcessStep[]{
 if(!section)return steps;
 const focus=section.items.find(p=>p.id===focusedCampaignId);
 const items=focus?[focus]:section.items;
 const matches=new Map<string,typeof items>();
 const unmatched:typeof items=[];
 for(const item of items){
  const direct=Object.entries(catalogue).find(([,p])=>p.projects.includes(item.id));
  const related=campaigns.filter(c=>c.id===item.id||(section.category!=='ai'&&c.sections.some(s=>s.projectIds.includes(item.id))));
  const key=direct?.[0]||Object.entries(catalogue).find(([,p])=>related.some(c=>p.campaigns.includes(c.id)))?.[0]||(section.category==='trailers'?'film':section.category==='events'?'live':undefined);
  if(key)matches.set(key,[...(matches.get(key)||[]),item]);else unmatched.push(item);
 }
 const cards:ProcessStep[]=[];
 for(const [key,projects] of matches){
  const names=catalogue[key].label||[...new Set(projects.flatMap(p=>{
   const campaign=campaigns.find(c=>c.id===p.id||c.sections.some(s=>s.projectIds.includes(p.id)));
   return campaign?[campaign.brand]:key==='kofuku'?['Kofuku']:key==='pisa'?['My original AI film']:[p.caseTitle||p.title];
  }))].join(' / ');
  catalogue[key].cards.forEach((card,index)=>{
   const base=steps.find(step=>step.id===card.base)!;
   cards.push({...base,...card,id:key+'-'+index,baseId:base.id,brand:names,detail:card.detail.replaceAll('{names}',names),artifact:'The thinking behind this work',preview:projects[index%projects.length].poster,projectIds:projects.map(p=>p.id),contextTitle:names});
  });
 }
 // Work without a reconstructed production record keeps its own published context.
 for(const project of unmatched){
  const campaign=campaigns.find(c=>c.id===project.id||(section.category!=='ai'&&c.sections.some(s=>s.projectIds.includes(project.id))));
  const base=steps.find(s=>s.id===(section.category==='ai'?'ai':'strategy'))!;
  cards.push({...base,id:'project-'+project.id,baseId:base.id,title:project.caseTitle||project.title,lines:campaign?campaign.scope.slice(0,2):[project.description,project.role,project.disclosure].filter((line):line is string=>!!line).slice(0,2),detail:campaign?[campaign.summary,...campaign.scope].join(' '):[project.description,project.role].filter(Boolean).join(' '),brand:campaign?.brand||'On this page',artifact:'Explore this project',evidence:campaign?.evidence||[],preview:project.poster,projectIds:[project.id]});
 }
 return cards;
}

export type ProcessArtefact=typeof artefacts[number];
export type ProcessEntry=ProcessStep&{expanded?:ProcessStep[];compact?:boolean;artifactIds?:string[];showThumbnail?:boolean};
const artefactPriority=(kind:string)=>/Character|Storyboard|Editorial board|Animation direction|Visual direction/.test(kind)?0:/deck/.test(kind)?2:1;
export const artefactsForProjects=(ids:string[]=[])=>artefacts.filter(a=>a.projectIds.some(id=>ids.includes(id))).sort((a,b)=>artefactPriority(a.kind)-artefactPriority(b.kind));
export const artefactById=(id:string)=>artefacts.find(a=>a.id===id);
// One concise introduction per visible video/collection. Deeper themes are
// withheld until the first reading pass is complete, without repeating copies.
export function processPagePlan(section?:PortfolioSection){
 if(!section)return {primary:steps as ProcessEntry[],additional:[] as ProcessEntry[]};
 const primary:ProcessEntry[]=[],additional:ProcessEntry[]=[];
 const used=new Set<string>();
 const pick=(ids:string[],count:number)=>{const available=artefactsForProjects(ids).filter(a=>!used.has(a.id));const chosen=available.slice(0,count);chosen.forEach(a=>used.add(a.id));return chosen.map(a=>a.id)};
 const deeper=new Map<string,ProcessEntry>();
 for(const item of section.items){
  const detail=processForPage({...section,items:[item]});
  const first=detail[0];if(!first)continue;
  const campaign=campaigns.find(c=>c.id===item.id);
  const intro=campaign?.summary||item.description||item.disclosure||'';
  const role=campaign?.scope.slice(0,2).join(' · ')||item.role;
  primary.push({...first,id:'intro-'+item.id,title:item.caseTitle||item.title,lines:[intro,role].filter((s):s is string=>!!s),detail:intro||first.detail,evidence:[...new Set(detail.flatMap(c=>c.evidence))],preview:item.poster,projectIds:[item.id],expanded:detail,compact:true,showThumbnail:true,artifactIds:pick([item.id],2)});
  for(const card of detail.slice(1)){
   const key=card.id+':'+card.brand;
   const existing=deeper.get(key);
   if(existing)existing.projectIds=[...new Set([...(existing.projectIds||[]),item.id])];
   else deeper.set(key,{...card,projectIds:[item.id],expanded:detail,compact:true});
  }
 }
 for(const entry of deeper.values())additional.push({...entry,preview:undefined,showThumbnail:false,artifactIds:pick(entry.projectIds||[],2)});
 return {primary,additional};
}
