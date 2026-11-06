import type {PortfolioSection} from './portfolioSections';

export const scenePath=(id:string)=>'/explore/'+id+'/';

export function sceneId(path:string){
 if(path==='/ai')return 'ai-0';
 return /^\/explore\/([a-z0-9-]+)\/?$/.exec(path)?.[1];
}

// Pagination changes with screen width. A page absent on the current layout
// opens the page that contains its lead project on the other layout.
export function sceneIndex(sections:PortfolioSection[],otherLayout:PortfolioSection[],id?:string){
 const exact=sections.findIndex(section=>section.id===id);
 if(exact>=0)return exact;
 const linked=otherLayout.find(section=>section.id===id);
 if(!linked)return 0;
 const related=sections.findIndex(section=>section.category===linked.category&&
  section.items.some(item=>item.id===linked.items[0]?.id));
 return Math.max(0,related);
}
