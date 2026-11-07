import type {Category,Project} from './content';
import {artSequence,type ArtStyle} from './artStyles';
import brandData from '../content/project-brands.json';
import positioning from '../content/positioning.json';
import showcase from '../content/showcase.json';
import {aiCollection} from './aiWork';
import {campaignFor,campaignProjects,filterCampaignGroups} from './campaigns';
export type PortfolioCategory=Category|'selected';
export type PortfolioSection={id:string;category:PortfolioCategory;title:string;summary:string;focus:string;items:Project[];theme:number;layout:number;offset:number;art:ArtStyle;copy?:string[];groupId?:string};
export type WorkSort='curated'|'brand';
const metadata=brandData as Record<string,{brand:string;collaborator?:string}>;
export const brandFor=(p:Project)=>campaignFor(p.id)?.brand||metadata[p.id]?.brand||'';
export const collaboratorFor=(p:Project)=>campaignFor(p.id)?.collaborators.join(' / ')||metadata[p.id]?.collaborator||'';
export const brandOptions=(projects:Project[])=>[...new Set(projects.flatMap(p=>[brandFor(p),collaboratorFor(p)]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
export const matchesBrand=(p:Project,brand:string)=>brand==='all'||brandFor(p)===brand||collaboratorFor(p)===brand;
export const sortProjects=(projects:Project[],sort:WorkSort)=>sort==='brand'?[...projects].sort((a,b)=>(brandFor(a)||'zzz').localeCompare(brandFor(b)||'zzz')||a.order-b.order):projects;
export const portfolioCategories:{id:PortfolioCategory;label:string;theme:number}[]=[
 {id:'selected',label:'Highlights',theme:0},{id:'trailers',label:'Film',theme:1},{id:'youtube',label:'YouTube',theme:5},{id:'short-form',label:'Short form',theme:3},{id:'events',label:'Live & comedy',theme:4},{id:'brands',label:'Campaigns',theme:2},{id:'ai',label:'AI',theme:5}
];
export const contextFor=(category:PortfolioCategory)=>positioning.categories[category];
export function buildSections(projects:Project[],sort:WorkSort='curated',brand='all',size=6):PortfolioSection[]{
 const filtered=projects.filter(p=>matchesBrand(p,brand)),sections:PortfolioSection[]=[];let legacyCount=0;
 for(const group of portfolioCategories){
  let source=group.id==='selected'?showcase.filter(item=>item.highlight!==false).map(item=>filtered.find(p=>p.id===item.id)).filter((p):p is Project=>!!p):group.id==='ai'?aiCollection.map(id=>filtered.find(p=>p.id===id)).filter((p):p is Project=>!!p):filtered.filter(p=>p.category===group.id||p.additionalCategories?.includes(group.id as Category));
  const campaignShorts=group.id==='short-form'?source.filter(p=>p.category==='brands'):[];
  if(group.id==='short-form')source=source.filter(p=>p.category!=='brands').sort((a,b)=>{const rank=(p:Project)=>p.id==='social-short-format-02'?-1:p.provider==='youtube'?0:p.id.startsWith('social-short-format')?1:2;return rank(a)-rank(b)});
  const extras=group.id==='selected'?source.filter(p=>showcase.find(item=>item.id===p.id)?.rotation):group.id==='short-form'?source.filter(p=>p.id==='ai-character-motion'):[];
  const opening=source.filter(p=>!extras.includes(p));
  const list=sortProjects(opening.length?opening:source,sort),context=contextFor(group.id),pageSize=group.id==='ai'&&size>=6?Math.max(1,list.length):size,pages=Math.ceil(list.length/pageSize);
  const addPage=(start:number,items:Project[])=>sections.push({id:group.id+'-'+start,category:group.id,title:context.title,summary:context.summary,focus:context.focus,items,theme:group.id==='brands'?[2,1,2,5,2][Math.floor(start/size)%5]:group.id==='short-form'?[3,4,3,2,3,4][Math.floor(start/size)%6]:group.id==='youtube'?[5,0,5,1,5][Math.floor(start/size)%5]:group.theme,layout:(legacyCount+Math.floor(start/pageSize)+group.theme)%6,offset:start,art:artSequence[group.id][Math.floor(start/size)%artSequence[group.id].length]});
  for(let start=0;start<list.length;start+=pageSize){
   const items=[...list.slice(start,start+pageSize),...(opening.length?sortProjects(extras,sort).filter((_,i)=>group.id==='short-form'?start+pageSize>=list.length:i%pages===Math.floor(start/size)):[])];
   addPage(start,items);
  }
  // New campaign clips follow the existing Short form scenes so shared links
  // keep pointing to the same lineups on desktop and mobile.
  const campaignList=sortProjects(campaignShorts,sort);
  for(let start=0;start<campaignList.length;start+=pageSize){
   addPage(pages*pageSize+start,campaignList.slice(start,start+pageSize));
  }
  const legacy=source.filter(p=>!p.addedToPortfolio&&(group.id==='selected'||group.id==='ai'||p.category===group.id)),legacyOpening=legacy.filter(p=>!extras.includes(p));
  legacyCount+=Math.ceil((legacyOpening.length||legacy.length)/(group.id==='ai'&&size>=6?Math.max(1,legacy.length):size));
 }
 // Replace only Campaigns after the original scene layouts have been assigned.
 // Other chapters keep their existing items, layout, art and animation indices.
 const grouped:PortfolioSection[]=[];
 for(const group of filterCampaignGroups(brand,'',sort)){
  const collections=group.collections.map(c=>campaignProjects.find(p=>p.id===c.id)!);
  const pages=Math.ceil(collections.length/size);
  const count=Math.floor(collections.length/pages),extra=collections.length%pages;
  let start=0;
  for(let page=0;page<pages;page++){
   const end=start+count+Number(page<extra);
   grouped.push({id:'brands-'+group.id+'-'+start,category:'brands',title:group.title,summary:group.summary,focus:group.level,items:collections.slice(start,end),theme:group.theme,layout:sections.find(s=>s.category==='brands')?.layout??2,offset:start,art:group.art,copy:group.copy,groupId:group.id});
   start=end;
  }
 }
 const result=sections.filter(s=>s.category!=='brands');
 const insert=result.findIndex(s=>s.category==='ai');
 result.splice(insert<0?result.length:insert,0,...grouped);
 return result;
}
