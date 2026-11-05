import type {Project} from './content';
import projectData from '../content/projects.json';
import collectionData from '../content/campaigns.json';
import assetData from '../content/campaign-assets.json';
import labelData from '../content/campaign-labels.json';
import familyData from '../content/campaign-families.json';
import type {ArtStyle} from './artStyles';

export type Campaign={id:string;title:string;brand:string;kind:string;summary:string;scope:string[];collaborators:string[];evidence:string[];sections:{title:string;projectIds:string[];note?:string}[]};
export type CampaignFamily={id:string;title:string;level:string;summary:string;copy:string[];art:ArtStyle;theme:number;collectionIds:string[]};
export const campaignFamilies=familyData as CampaignFamily[];
const catalogue=collectionData as Campaign[];
export const campaigns=campaignFamilies.flatMap(f=>f.collectionIds.map(id=>catalogue.find(c=>c.id===id)!));
export const campaignFamilyFor=(id:string)=>campaignFamilies.find(f=>f.collectionIds.includes(id));
export const campaignAssets=assetData as Project[];
const labels=labelData as Record<string,string>;
const media=new Map([...projectData,...assetData].map(p=>[p.id,p as Project]));
export const campaignFor=(id:string)=>campaigns.find(c=>c.id===id);
export const campaignMedia=(id:string):Project|undefined=>{const p=media.get(id);return p?{...p,title:labels[id]||p.title}:undefined};
export const campaignItems=(c:Campaign)=>[...new Set(c.sections.flatMap(s=>s.projectIds))].map(campaignMedia).filter((p):p is Project=>!!p);
// Every subgroup gets a preview before a second asset from the same subgroup.
export function campaignPreviews(c:Campaign,limit=4){
 const ids=[...new Set([...c.sections.map(s=>s.projectIds[0]),...c.sections.flatMap(s=>s.projectIds)])];
 return ids.map(campaignMedia).filter((p):p is Project=>!!p?.poster).slice(0,limit);
}
export const campaignProjects:Project[]=campaigns.map((c,i)=>({id:c.id,title:c.title,category:'brands',provider:'external',sourceUrl:'https://lezoofx.github.io/prantik-dutta-portfolio/brands/',poster:campaignPreviews(c,1)[0]?.poster,aspect:1.45,order:i,description:c.summary,role:c.scope.join(' · ')}));
export const campaignBrands=[...new Set(campaigns.flatMap(c=>[c.brand,...c.collaborators]))].sort((a,b)=>a.localeCompare(b));
export function filterCampaigns(brand='all',query='',sort='curated'){
 const q=query.trim().toLocaleLowerCase();
 const list=campaigns.filter(c=>(brand==='all'||[c.brand,...c.collaborators].includes(brand))&&(!q||[c.title,c.brand,c.kind,c.summary,...c.scope,...c.collaborators,...c.sections.map(s=>s.title),...campaignItems(c).map(p=>p.title)].join(' ').toLocaleLowerCase().includes(q)));
 return sort==='brand'?[...list].sort((a,b)=>a.brand.localeCompare(b.brand)||a.title.localeCompare(b.title)):list;
}
export function filterCampaignFamilies(brand='all',query='',sort='curated'){
 const list=filterCampaigns(brand,query,sort);
 const families=campaignFamilies.map(f=>({...f,collections:list.filter(c=>f.collectionIds.includes(c.id))})).filter(f=>f.collections.length);
 return sort==='brand'?[...families].sort((a,b)=>a.title.localeCompare(b.title)):families;
}
