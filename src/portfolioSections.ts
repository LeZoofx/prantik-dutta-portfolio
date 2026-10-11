import type {Category,Project} from './content';
import {artSequence,type ArtStyle} from './artStyles';
import brandData from '../content/project-brands.json';
import positioning from '../content/positioning.json';
import showcase from '../content/showcase.json';
export type PortfolioCategory=Category|'selected';
export type PortfolioSection={id:string;category:PortfolioCategory;title:string;summary:string;focus:string;items:Project[];theme:number;layout:number;offset:number;art:ArtStyle};
export type WorkSort='curated'|'brand';
const metadata=brandData as Record<string,{brand:string;collaborator?:string}>;
export const brandFor=(p:Project)=>metadata[p.id]?.brand||'';
export const collaboratorFor=(p:Project)=>metadata[p.id]?.collaborator||'';
export const brandOptions=(projects:Project[])=>[...new Set(projects.flatMap(p=>[brandFor(p),collaboratorFor(p)]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
export const matchesBrand=(p:Project,brand:string)=>brand==='all'||brandFor(p)===brand||collaboratorFor(p)===brand;
export const sortProjects=(projects:Project[],sort:WorkSort)=>sort==='brand'?[...projects].sort((a,b)=>(brandFor(a)||'zzz').localeCompare(brandFor(b)||'zzz')||a.order-b.order):projects;
export const portfolioCategories:{id:PortfolioCategory;label:string;theme:number}[]=[
 {id:'selected',label:'Highlights',theme:0},{id:'trailers',label:'Film',theme:1},{id:'youtube',label:'YouTube',theme:5},{id:'short-form',label:'Short form',theme:3},{id:'events',label:'Live & comedy',theme:4},{id:'brands',label:'Campaigns',theme:2}
];
export const contextFor=(category:PortfolioCategory)=>positioning.categories[category];
export function buildSections(projects:Project[],sort:WorkSort='curated',brand='all',size=6):PortfolioSection[]{
 const filtered=projects.filter(p=>matchesBrand(p,brand)),sections:PortfolioSection[]=[];
 for(const group of portfolioCategories){
  let source=group.id==='selected'?showcase.filter(item=>item.highlight!==false).map(item=>filtered.find(p=>p.id===item.id)).filter((p):p is Project=>!!p):filtered.filter(p=>p.category===group.id);
  if(group.id==='short-form')source=[...source].sort((a,b)=>{const rank=(p:Project)=>p.id==='social-short-format-02'?-1:p.provider==='youtube'?0:p.id.startsWith('social-short-format')?1:2;return rank(a)-rank(b)});
  const extras=group.id==='selected'?source.filter(p=>showcase.find(item=>item.id===p.id)?.rotation):[];
  const opening=source.filter(p=>!extras.includes(p));
  const list=sortProjects(opening.length?opening:source,sort),context=contextFor(group.id),pages=Math.ceil(list.length/size);
  for(let start=0;start<list.length;start+=size){
   const items=[...list.slice(start,start+size),...(opening.length?sortProjects(extras,sort).filter((_,i)=>i%pages===Math.floor(start/size)):[])];
   sections.push({id:group.id+'-'+start,category:group.id,title:context.title,summary:context.summary,focus:context.focus,items,theme:group.id==='brands'?[2,1,2,5,2][Math.floor(start/size)%5]:group.id==='short-form'?[3,4,3,2,3,4][Math.floor(start/size)%6]:group.id==='youtube'?[5,0,5,1,5][Math.floor(start/size)%5]:group.theme,layout:(sections.length+group.theme)%6,offset:start,art:artSequence[group.id][Math.floor(start/size)%artSequence[group.id].length]});
  }
 }
 return sections;
}
