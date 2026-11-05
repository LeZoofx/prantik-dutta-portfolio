import sources from '../content/process-library-sources.json';
import evidence from '../content/process-evidence.json';
type Evidence={document:string;excerpts:{page:number;text:string}[];visuals:{src:string;caption:string}[]};
export default function CampaignEvidence({ids}:{ids:string[]}){
 return <div className="campaign-evidence">{ids.map(id=>{const source=sources[id as keyof typeof sources],entry=evidence[id as keyof typeof evidence] as Evidence;return source&&entry?<section key={id}><h3>{source.title}</h3><p className="campaign-evidence-source">{source.document.split('/').pop()?.replace(/_/g,' ').replace('.pdf','')}</p>{entry.excerpts.slice(0,2).map(excerpt=><blockquote key={excerpt.page}><span>Production document · page {excerpt.page}</span>{excerpt.text}</blockquote>)}</section>:null})}</div>;
}
