import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const paging=data(compile('../src/scenePaging.ts'));
const stub=`
import {ScenePager,swipePages} from '${paging}';
const f=()=>globalThis.mobileFixture;
const depsSame=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const useRef=value=>{const h=f(),i=h.index++;return h.hooks[i]??(h.hooks[i]={current:value})};
const useState=value=>{const h=f(),i=h.index++;if(!(i in h.hooks))h.hooks[i]=value;return [h.hooks[i],next=>{const v=typeof next==='function'?next(h.hooks[i]):next;if(!Object.is(v,h.hooks[i])){h.hooks[i]=v;h.dirty=true}}]};
const useMemo=(fn,deps)=>{const h=f(),i=h.index++,old=h.hooks[i];if(!old||!depsSame(old.deps,deps))h.hooks[i]={deps,value:fn()};return h.hooks[i].value};
const effect=(fn,deps,layout)=>{const h=f(),i=h.index++,old=h.hooks[i];if(!old||!depsSame(old.deps,deps)){h.hooks[i]={deps,cleanup:old?.cleanup};h[layout?'layout':'effects'].push(()=>{h.hooks[i].cleanup?.();h.hooks[i].cleanup=fn()})}};
const useEffect=(fn,deps)=>effect(fn,deps,false),useLayoutEffect=(fn,deps)=>effect(fn,deps,true);
const _jsx=(type,props,key)=>({type,props,key}),_jsxs=_jsx;
const memo=x=>x,lazy=()=>()=>null,Suspense=()=>null;
const empty=()=>null;
const BrandControls=empty,ResultsRibbon=empty,JourneyPlayer=empty,ExpandCue=empty,KineticName=empty,KineticType=empty,SceneAccents=empty,ClientMarquee=empty,PosterType=empty,KineticCopy=empty,Scene=empty,PlaybackToggle=empty,CreativeProcess=empty;
const asset=x=>x,previewAsset=x=>x,previewSrcSet=()=>'',href=()=>'/work/',projectPath=x=>'/work/'+x,platformLabel=()=> 'YouTube',brandFor=()=> 'Brand';
const showcase=[{id:'p0',title:'Project 0'}],positioning={eyebrow:'Creative producer'},posterCopy={selected:[]};
const portfolioCategories=[{id:'selected',label:'Highlights'},{id:'trailers',label:'Film'}];
const buildSections=()=>f().sections,usePerformance=()=>f().performance,listenMedia=()=>()=>{};
const NativeSceneScroll=class{constructor(){throw new Error('Desktop scroll controller used on mobile')}};
const NativeSceneAnimator={supported:()=>false};
`;
const source=compile('../src/Universe.tsx').replace(/^import .*;\n/gm,'');
const {default:Universe}=await import(data(stub+source));
class Node extends EventTarget{
 constructor(name=''){super();this.name=name;this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.clientWidth=390;this.clientHeight=740;this.inert=false}
 querySelector(selector){return this.parts?.[selector]||null}
 querySelectorAll(){return []}
}
function fixture(t){
 const names=['mobileFixture','window','document','navigator','performance','matchMedia','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight','setInterval','clearInterval'];
 const saved=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 const doc=new Node(),win=new Node(),frames=new Map();doc.hidden=false;doc.fonts=new Node();let clock=100,id=0;
 const h={index:0,hooks:[],layout:[],effects:[],dirty:false,tree:null,refs:new Map(),nodes:new Map(),performance:{ready:true,quality:'balanced',autoplay:false,maxPlayers:1,mediaReady:true,reportFrame:()=>{},toggleAutoplay:()=>{}},sections:Array.from({length:9},(_,i)=>({id:'scene-'+i,title:'Scene '+i,category:i?'trailers':'selected',offset:i,theme:0,art:'liquid',layout:0,items:[{id:'p0',title:'Project 0',provider:'youtube'}]}))};
 const globals={mobileFixture:h,window:win,document:doc,navigator:{connection:{}},performance:{now:()=>clock},matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),innerWidth:390,innerHeight:844,setInterval:()=>0,clearInterval:()=>{}};
 win.performance=globals.performance;
 Object.entries(globals).forEach(([n,v])=>Object.defineProperty(globalThis,n,{value:v,writable:true,configurable:true}));
 function render(){
  h.index=0;h.dirty=false;h.layout=[];h.effects=[];h.tree=Universe({header:null,projects:h.sections[0].items,onProject:()=>{},onIndex:()=>{},onProcess:()=>{},paused:false,reduced:false,mobile:true});
  const refs=new Map(),worlds=[];
  function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return}const p=node.props||{};
   if(p.ref){const key=(p.className||'')+':'+(node.key??'');let el=h.nodes.get(key);if(!el){el=new Node(p.className);h.nodes.set(key,el)}refs.set(key,{ref:p.ref,el});if(p.className?.startsWith('zoom-world '))worlds.push({el,p});}
   visit(p.children);
  }visit(h.tree);
  for(const [key,old] of h.refs)if(!refs.has(key)&&typeof old.ref==='function')old.ref(null);
  for(const {ref,el} of refs.values())typeof ref==='function'?ref(el):ref.current=el;
  h.root=[...refs.values()].find(x=>x.el.name.includes('depth-journey')).el;
  h.scroller=[...refs.values()].find(x=>x.el.name==='depth-scroll').el;
  h.root.parts={'.depth-stage':new Node(),'.depth-landscape':new Node(),'.depth-worlds':new Node()};
  h.worlds=worlds;h.refs=refs;h.layout.forEach(fn=>fn());h.effects.forEach(fn=>fn());
 }
 const flush=()=>{let guard=0;while(h.dirty){assert.ok(++guard<20,'Render loop did not settle');render()}};
 render();flush();
 function tick(ms){const end=clock+ms;while(clock<end){clock+=16;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(clock));flush()}}
 function pointer(type,y,time){const e=new Event(type);Object.defineProperties(e,{pointerType:{value:'touch'},isPrimary:{value:true},pointerId:{value:1},clientX:{value:195},clientY:{value:y},timeStamp:{value:time}});h.scroller.dispatchEvent(e);flush()}
 function swipe(distance=90,duration=220){pointer('pointerdown',650,clock);pointer('pointermove',650-distance,clock+duration*.7);pointer('pointerup',650-distance,clock+duration);tick(1600)}
 tick(32);
 t.after(()=>{h.hooks.forEach(v=>v?.cleanup?.());for(const [name,desc] of Object.entries(saved))desc?Object.defineProperty(globalThis,name,desc):delete globalThis[name]});
 return {h,tick,swipe};
}
function visible(h,page){assert.equal(Number(h.root.dataset.position),page);assert.equal(h.root.dataset.moving,'false');const selected=h.worlds.find(w=>w.p['data-active']);assert.ok(selected,'No active mobile scene was mounted');assert.equal(selected.p['data-depth-index'],((page%9)+9)%9);assert.equal(selected.el.style.opacity,'1.000');assert.equal(selected.el.style.visibility,'visible')}
test('mobile remains visible after eight consecutive swipes',t=>{const {h,swipe}=fixture(t);for(let i=1;i<=8;i++){swipe();visible(h,i)}});
test('fast mobile swipes retain their intermediate scenes and finish visible',t=>{const {h,swipe}=fixture(t);swipe(650,180);visible(h,2);swipe(650,180);visible(h,4)});
test('mobile survives reverse swipes and wraparound',t=>{const {h,swipe}=fixture(t);swipe(-90);visible(h,-1);swipe();visible(h,0);swipe();visible(h,1);swipe(-90);visible(h,0)});
test('locked mobile stylesheet retains the approved source blocks',()=>{
 const css=readFileSync(new URL('../src/mobile-locked.css',import.meta.url),'utf8');
 const baselines={"mobile-focus.css": "f689a421a5ee6fed6cfafbc961b3a6299aae955351409f5b76b709b8c04a2135", "creative-refinements.css": "eb959ef12300c7289e428007964db323c652a9ccf65c425b0b51e1f6a198cbfb", "adaptive-performance.css": "28d6ace22cbf028d25cf5cc180560037614e58b931ef16a7aacd0af2819d778d"};
 for(const [file,hash] of Object.entries(baselines)){const restored=css.split("/* Approved "+file+" */\n")[1].split(/\n\/\* (?:Approved|Restore)/)[0].trimEnd();assert.equal(createHash("sha256").update(restored).digest("hex"),hash,file+" differs from the approved source");}
 assert.ok(readFileSync(new URL('../src/idle-motion.css',import.meta.url),'utf8').startsWith('@media (min-width:700px)'));
});
