type TimelineConstructor=new(options:{source:Element;axis:string})=>AnimationTimeline;
export type SceneExit={element:HTMLElement;x:number;y:number;tile:number;film:boolean};
const smooth=(a:number,b:number,value:number)=>{const n=Math.max(0,Math.min(1,(value-a)/(b-a)));return n*n*(3-2*n)};
const clamp=(n:number)=>Math.max(-1.6,Math.min(1.6,n));

// Same camera/dispersal curve as the original artwork, sampled once. Supported
// browsers interpolate it on their scroll timeline, independently of React/media.
export function scenePose(index:number,delta:number,low:boolean,light=false){
 const travel=clamp(delta),focus=smooth(.06,1.1,Math.abs(travel));
 const depth=220*(1-Math.exp(1.75*travel)),projection=1200/(1200-depth);
 return {
  // A flat projection of the same camera curve is inexpensive but preserves
  // scene separation. A fixed 0.965 scale made buffered text overlap at rest.
  transform:light?`translate3d(${travel*Math.sin(index*1.9)*24*projection}px,${travel*Math.cos(index*1.3)*12*projection}px,0) scale(${projection})`:`translate3d(${travel*Math.sin(index*1.9)*24}px,${travel*Math.cos(index*1.3)*12}px,${depth}px) rotateY(${travel*Math.sin(index+1)*3}deg) rotateZ(${travel*Math.cos(index+2)}deg)`,
  opacity:delta<0?1-smooth(.52,.94,-delta):1-smooth(.86,1.5,delta),
  filter:`blur(${focus*(light?2:low?4:8)}px) brightness(${1-focus*.58})`,
 };
}
export function timelineFrames(center:number,total:number,pose:(delta:number)=>Keyframe){
 const span=total*3-1;
 const deltas=[...new Set([0,...Array.from({length:41},(_,i)=>1.6-i*.07)])].sort((a,b)=>b-a);
 return [{...pose(center),offset:0},...deltas.map(delta=>({...pose(delta),offset:(center-delta)/span})).filter(frame=>frame.offset>0&&frame.offset<1),{...pose(center-span),offset:1}];
}
export class NativeSceneAnimator {
 private timeline:AnimationTimeline;
 private records=new Map<HTMLElement,{key:string;animations:Animation[]}>();
 static supported(){return typeof (window as unknown as {ScrollTimeline?:TimelineConstructor}).ScrollTimeline==='function'}
 constructor(source:HTMLElement){const Timeline=(window as unknown as {ScrollTimeline:TimelineConstructor}).ScrollTimeline;this.timeline=new Timeline({source,axis:'block'})}
 private install(element:HTMLElement,key:string,create:()=>{element:HTMLElement;frames:Keyframe[]}[]){
  const record=this.records.get(element);if(record?.key===key)return;
  const specs=create(),previous=record?.animations||[];
  const animations=specs.map((spec,i)=>{
   const animation=previous[i],effect=animation?.effect as KeyframeEffect|null;
   // Font/layout updates change geometry, not animation lifetime or progress.
   if(effect?.target===spec.element){effect.setKeyframes(spec.frames);return animation}
   animation?.cancel();
   return spec.element.animate(spec.frames,{timeline:this.timeline,fill:'both',easing:'linear'});
  });
  previous.slice(specs.length).forEach(a=>a.cancel());
  this.records.set(element,{key,animations});
 }
 private frames(element:HTMLElement,frames:Keyframe[]){return {element,frames}}
 plane(layer:HTMLElement,index:number,center:number,total:number,exits:SceneExit[],version:string,low:boolean,light=false){
  this.install(layer,`${center}/${total}/${version}/${low}/${light}`,()=>[
   this.frames(layer,timelineFrames(center,total,delta=>scenePose(index,delta,low,light))),
   ...exits.map(({element,x,y,film})=>this.frames(element,timelineFrames(center,total,delta=>{
    const spread=(Math.exp(-1.6*clamp(delta))-1)/(Math.exp(1.44)-1);
    return film?{transform:`translate3d(${spread*x}px,${spread*y}px,0)`}:{translate:`${spread*x}px ${spread*y}px`};
   }))),
  ]);
 }
 backdrop(layer:HTMLElement,center:number,total:number){
  this.install(layer,`${center}/${total}`,()=>[this.frames(layer,timelineFrames(center,total,delta=>({
   opacity:delta>0?smooth(.22,.75,1-delta):1-smooth(.22,.75,-delta),
   transform:`scale(${1-clamp(delta)*.035})`,
  })))]);
 }
 prune(){for(const [element,record] of this.records)if(!element.isConnected){record.animations.forEach(a=>a.cancel());this.records.delete(element)}}
 destroy(){for(const record of this.records.values())record.animations.forEach(a=>a.cancel());this.records.clear()}
}
