import collection from '../content/ai-collection.json';
export const aiCollection=collection;
export const isAIWork=(id:string)=>collection.includes(id);
export const leastFeaturedAI='social-short-format-11';
export type AICue={start:number;end?:number;point?:boolean;kind:'ai'|'real'|'graphics'|'reference'|'transition';title:string;detail:string};
export type AIAnnotation={label:string;description:string;cues:AICue[]};
export const timecode=(time:number)=>{const seconds=Math.max(0,Math.floor(time));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')};
export function activeCues(cues:AICue[],time:number,duration:number){
 return cues.filter(c=>time>=c.start&&time<(c.point?c.start+5:c.end??duration));
}
export function cueRange(cue:AICue){return timecode(cue.start)+(cue.point?'':cue.end!==undefined?'–'+timecode(cue.end):'–end')}
// Small-screen marker targets share lanes; the chapter list remains a full-size alternative.
export function markerLanes(cues:AICue[],duration:number){
 const ends:number[]=[];return cues.map(cue=>{const x=cue.start/Math.max(1,duration)*100;let lane=ends.findIndex(end=>x-end>=4);if(lane<0)lane=ends.length;ends[lane]=x;return {cue,lane,x}});
}
