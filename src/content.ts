import site from '../content/site.json';
import projectData from '../content/projects.json';
export type Category = 'youtube' | 'trailers' | 'short-form' | 'events' | 'brands' | 'ai';
export type Project = {
  id: string; title: string; caseTitle?: string; category: Category; provider: 'youtube'|'instagram'|'drive'|'image'|'external';
  sourceUrl: string; embedUrl?: string; poster?: string; image?: string;
  description?: string; disclosure?: string; role?: string; featured?: boolean;
  aspect?: number; additionalCategories?: Category[]; addedToPortfolio?: boolean; order: number; status?: string; videoSource?: string; duration?: number;
};
export const projects = projectData as Project[];
export {site};
export const categories: {id:Category;label:string;short:string;route:string}[] = [
 {id:'trailers',label:'Film',short:'FILM',route:'videos'},
 {id:'youtube',label:'YouTube',short:'YOUTUBE',route:'social'},
 {id:'short-form',label:'Short form',short:'SHORT FORM',route:'social-short-format'},
 {id:'events',label:'Live & comedy',short:'LIVE',route:'stand-up-events'},
 {id:'brands',label:'Campaigns',short:'CAMPAIGNS',route:'brands'},
 {id:'ai',label:'AI',short:'AI',route:'ai'},
];
export const asset = (path: string|undefined) => path ? (/^https?:/.test(path) ? path : import.meta.env.BASE_URL + path.replace(/^\//,'')) : '';
export const previewAsset=(path:string|undefined,width=640)=>path?.startsWith('media/')&&!path.endsWith('.svg')?asset('previews/'+path.slice(path.lastIndexOf('/')+1).replace(/\.[^.]+$/,'')+'-'+width+'.webp'):asset(path);
export const previewSrcSet=(path:string|undefined)=>path?.startsWith('media/')&&!path.endsWith('.svg')?[320,640,960].map(width=>previewAsset(path,width)+' '+width+'w').join(', '):undefined;
export const href = (path='') => import.meta.env.BASE_URL + path.replace(/^\//,'');
export const projectPath = (id:string) => href('work/'+id+'/');

export function platformLabel(project:Project):string {
 const host=new URL(project.sourceUrl).hostname.replace(/^www\./,'');
 if(host==='instagram.com')return 'Instagram';
 if(host==='youtube.com'||host==='youtu.be'||host==='youtube-nocookie.com')return 'YouTube';
 if(host==='drive.google.com')return 'Google Drive';
 return project.provider==='image'?'Image':'Project';
}

export function selectEmbeds(items:Project[],limit:number){
 const eligible=items.filter(p=>p.videoSource||p.provider==='youtube'||p.provider==='instagram'),chosen=eligible.slice(0,limit),instagram=eligible.find(p=>p.provider==='instagram');
 if(instagram&&!chosen.some(p=>p.provider==='instagram')&&chosen.length)chosen[chosen.length-1]=instagram;
 return chosen.map(p=>p.id);
}
