import steps from '../content/creative-process.json';
import profiles from '../content/process-contexts.json';
import campaigns from '../content/campaigns.json';
import type {PortfolioSection} from './portfolioSections';

export type ProcessStep=typeof steps[number]&{baseId?:string;preview?:string;projectIds?:string[];contextTitle?:string};
type Profile={campaigns:string[];projects:string[];cards:{base:string;title:string;lines:string[];detail:string;evidence:string[]}[]};
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
  const names=[...new Set(projects.flatMap(p=>{
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
