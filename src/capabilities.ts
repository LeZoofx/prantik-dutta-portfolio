export const mobileLayout='(max-width:699px), (max-width:1024px) and (pointer:coarse)';
export type Quality='full'|'balanced'|'simple';
export function initialExperience(path:string,requested:string|null=null):'normal'|'fun'{
 if(requested==='normal'||requested==='overview')return 'normal';
 if(requested==='fun'||requested==='explore')return 'fun';
 return path.replace(/\/$/,'')===''?'fun':'normal';
}
export type Capabilities={supported:boolean;saveData?:boolean;effectiveType?:string;downlink?:number;rtt?:number;memory?:number;cores?:number;reduced?:boolean;coarse?:boolean};
export function chooseQuality(c:Capabilities):Quality{
 if(!c.supported||c.reduced||c.saveData||['slow-2g','2g','3g'].includes(c.effectiveType||'')||(c.downlink!==undefined&&c.downlink<1.5)||(c.rtt||0)>650||(c.memory!==undefined&&c.memory<=2)||(c.cores!==undefined&&c.cores<=2))return 'simple';
 if(c.coarse||(c.memory!==undefined&&c.memory<=4)||(c.cores!==undefined&&c.cores<=4)||(!c.memory&&!c.cores)||(c.downlink!==undefined&&c.downlink<4))return 'balanced';
 return 'full';
}

// One shared queue prevents several sections from creating players in the same frame.
export class MediaQueue {
 private entries=new Map<symbol,{grant:(v:boolean)=>void;active:boolean;priority:number}>();
 private limit=0;private paused=true;private timer:ReturnType<typeof setTimeout>|undefined;private lastStart=-Infinity;
 constructor(private gap=850,private now=()=>Date.now(),private later=(fn:()=>void,ms:number)=>setTimeout(fn,ms),private cancel=(timer:ReturnType<typeof setTimeout>)=>clearTimeout(timer)){}
 configure(limit:number,paused=false){this.limit=limit;this.paused=paused;let count=0;for(const entry of this.entries.values())if(entry.active&&++count>limit){entry.active=false;entry.grant(false)}this.pump()}
 request(grant:(v:boolean)=>void,priority=0){const key=Symbol();this.entries.set(key,{grant,priority,active:false});this.pump();return()=>{this.entries.delete(key);this.pump()}}
 private pump(){
  if(this.timer!==undefined){this.cancel(this.timer);this.timer=undefined}
  if(this.paused||[...this.entries.values()].filter(x=>x.active).length>=this.limit)return;
  const next=[...this.entries.values()].filter(x=>!x.active).sort((a,b)=>b.priority-a.priority)[0];if(!next)return;
  const wait=this.gap-(this.now()-this.lastStart);
  if(wait>0){this.timer=this.later(()=>{this.timer=undefined;this.pump()},wait);return}
  next.active=true;this.lastStart=this.now();next.grant(true);this.pump();
 }
}
