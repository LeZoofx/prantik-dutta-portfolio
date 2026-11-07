import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const paging=data(compile('../src/scenePaging.ts'));
const stub=`
import {gestureAxis,ScenePager,swipePages} from '${paging}';
import {sceneIndex} from '${data(compile('../src/sceneLinks.ts'))}';
const f=()=>globalThis.mobileFixture;
const depsSame=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const useRef=value=>{const h=f(),i=h.index++;return h.hooks[i]??(h.hooks[i]={current:value})};
const useState=value=>{const h=f(),i=h.index++;if(!(i in h.hooks))h.hooks[i]=typeof value==='function'?value():value;return [h.hooks[i],next=>{const v=typeof next==='function'?next(h.hooks[i]):next;if(!Object.is(v,h.hooks[i])){h.hooks[i]=v;h.dirty=true}}]};
const useMemo=(fn,deps)=>{const h=f(),i=h.index++,old=h.hooks[i];if(!old||!depsSame(old.deps,deps))h.hooks[i]={deps,value:fn()};return h.hooks[i].value};
const effect=(fn,deps,layout)=>{const h=f(),i=h.index++,old=h.hooks[i];if(!old||!depsSame(old.deps,deps)){h.hooks[i]={deps,cleanup:old?.cleanup};h[layout?'layout':'effects'].push(()=>{h.hooks[i].cleanup?.();h.hooks[i].cleanup=fn()})}};
const useEffect=(fn,deps)=>effect(fn,deps,false),useLayoutEffect=(fn,deps)=>effect(fn,deps,true);
const _jsx=(type,props,key)=>({type,props,key}),_jsxs=_jsx;
const useId=()=>':glove:',memo=x=>x,useCallback=(fn,deps)=>useMemo(()=>fn,deps),lazy=()=>()=>null,Suspense=()=>null;
const empty=()=>null;
const BrandControls=empty,ResultsRibbon=empty,JourneyPlayer=empty,ExpandCue=empty,KineticName=empty,KineticType=empty,SceneAccents=empty,ClientMarquee=empty,PosterType=empty,KineticCopy=empty,Scene=empty,PlaybackToggle=empty,CreativeProcess=empty,AIAccess=empty;
const asset=x=>x,previewAsset=x=>x,previewSrcSet=()=>'',href=()=>'/work/',projectPath=x=>'/work/'+x,platformLabel=()=> 'YouTube',brandFor=()=> 'Brand';
const showcase=[{id:'p0',title:'Project 0'}],positioning={eyebrow:'Creative producer'},posterCopy={selected:[]};
const portfolioCategories=[{id:'selected',label:'Highlights'},{id:'trailers',label:'Film'}];
const buildSections=()=>f().sections,usePerformance=()=>f().performance,listenMedia=()=>()=>{};
const NativeSceneScroll=class{constructor(){throw new Error('Desktop scroll controller used on mobile')}};
const FrameWheelInput=class{cancelPending(){} destroy(){}};
const isScrollControl=()=>false;
const NativeSceneAnimator={supported:()=>false};
const isAIWork=()=>false,leastFeaturedAI='',campaignFor=()=>undefined,CampaignTile=empty,CampaignControls=empty,ScrollGuide=empty,ExploreOpening=empty;
`;
const source=compile('../src/Universe.tsx').replace(/^import .*;\n/gm,'');
const {default:Universe}=await import(data(stub+source));
class Node extends EventTarget{
 constructor(name=''){super();this.name=name;this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.clientWidth=390;this.clientHeight=740;this.inert=false}
 querySelector(selector){return this.parts?.[selector]||null}
 querySelectorAll(){return []}
}
function fixture(t,initialScene){
 const names=['mobileFixture','window','document','navigator','performance','matchMedia','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight','setInterval','clearInterval'];
 const saved=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 const doc=new Node(),win=new Node(),frames=new Map();doc.hidden=false;doc.fonts=new Node();let clock=100,id=0;
 const h={index:0,hooks:[],layout:[],effects:[],dirty:false,tree:null,refs:new Map(),nodes:new Map(),orbitSteps:[],published:[],performance:{ready:true,quality:'balanced',autoplay:false,maxPlayers:1,mediaReady:true,reportFrame:()=>{},toggleAutoplay:()=>{}},sections:Array.from({length:9},(_,i)=>({id:'scene-'+i,title:'Scene '+i,category:i?'trailers':'selected',offset:i,theme:0,art:'liquid',layout:0,items:[{id:'p0',title:'Project 0',provider:'youtube'}]}))};
 const globals={mobileFixture:h,window:win,document:doc,navigator:{connection:{}},performance:{now:()=>clock},matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),innerWidth:390,innerHeight:844,setInterval:()=>0,clearInterval:()=>{}};
 win.performance=globals.performance;
 Object.entries(globals).forEach(([n,v])=>Object.defineProperty(globalThis,n,{value:v,writable:true,configurable:true}));
 function render(){
  h.index=0;h.dirty=false;h.layout=[];h.effects=[];h.tree=Universe({header:null,projects:h.sections[0].items,onProject:()=>{},onIndex:()=>{},onProcess:()=>{},initialScene,onSceneSettled:id=>h.published.push(id),paused:false,reduced:false,mobile:true});
  const refs=new Map(),worlds=[];
  function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return}const p=node.props||{};
   if(p.ref){const key=(p.className||'')+':'+(node.key??'');let el=h.nodes.get(key);if(!el){el=new Node(p.className);h.nodes.set(key,el)}refs.set(key,{ref:p.ref,el});if(p.className?.startsWith('zoom-world ')){worlds.push({el,p});if(!el.parts){const gallery=new Node('gallery');gallery.addEventListener('portfolio-orbit-step',e=>h.orbitSteps.push({page:p['data-depth-index'],step:e.detail}));el.parts={'.depth-gallery':gallery}}}}
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
 function pointer(type,y,time,x=195){const e=new Event(type);Object.defineProperties(e,{pointerType:{value:'touch'},isPrimary:{value:true},pointerId:{value:1},clientX:{value:x},clientY:{value:y},timeStamp:{value:time}});h.scroller.dispatchEvent(e);flush()}
 function swipe(distance=90,duration=220){pointer('pointerdown',650,clock);pointer('pointermove',650-distance,clock+duration*.7);pointer('pointerup',650-distance,clock+duration);tick(1600)}
 function horizontal(distance=90,duration=220,drift=0){pointer('pointerdown',450,clock,310);pointer('pointermove',450-drift,clock+duration*.7,310-distance);pointer('pointerup',450-drift,clock+duration,310-distance);tick(1600)}
 tick(32);
 t.after(()=>{h.hooks.forEach(v=>v?.cleanup?.());for(const [name,desc] of Object.entries(saved))desc?Object.defineProperty(globalThis,name,desc):delete globalThis[name]});
 return {h,tick,swipe,horizontal,pointer,get clock(){return clock}};
}
function visible(h,page){assert.equal(Number(h.root.dataset.position),page);assert.equal(h.root.dataset.moving??'false','false');const selected=h.worlds.find(w=>w.p['data-active']);assert.ok(selected,'No active mobile scene was mounted');assert.equal(selected.p['data-depth-index'],((page%9)+9)%9);assert.equal(selected.el.style.opacity,'1.000');assert.equal(selected.el.style.visibility,'visible')}
test('mobile remains visible after eight consecutive swipes',t=>{const {h,swipe}=fixture(t);for(let i=1;i<=8;i++){swipe();visible(h,i)}});
test('fast mobile swipes retain their intermediate scenes and finish visible',t=>{const {h,swipe}=fixture(t);swipe(650,180);visible(h,2);swipe(650,180);visible(h,4)});
test('the outgoing phone scene defocuses continuously during a page swipe',t=>{
 const {h,pointer,tick,clock}=fixture(t);
 pointer('pointerdown',650,clock);
 pointer('pointermove',560,clock+16);
 const blur=[];
 for(let frame=0;frame<19;frame++){
  tick(16);
  const outgoing=h.worlds.find(world=>world.p['data-depth-index']===0);
  blur.push(Number(outgoing.el.style.filter.match(/blur\(([\d.]+)/)[1]));
 }
 assert.ok(blur.every((value,index)=>index===0||value>=blur[index-1]));
 assert.ok(new Set(blur).size>8,'Blur should vary through intermediate depths');
 assert.ok(blur.some(value=>Math.abs(value*2-Math.round(value*2))>.03),'Focus should not snap to half-pixel increments');
});
test('mobile survives reverse swipes and wraparound',t=>{const {h,swipe}=fixture(t);swipe(-90);visible(h,-1);swipe();visible(h,0);swipe();visible(h,1);swipe(-90);visible(h,0)});
test('filtering from a later mobile chapter to one collection never renders a missing scene',t=>{
 const {h,swipe,tick}=fixture(t);for(let i=0;i<5;i++)swipe();visible(h,5);
 h.sections=[{...h.sections[0],items:[...h.sections[0].items]}];h.dirty=true;tick(64);visible(h,0);
 assert.ok(h.worlds.every(w=>w.p['data-depth-index']===0));
});
test('left/right mobile swipes browse the current videos without changing pages',t=>{const {h,horizontal,swipe}=fixture(t);horizontal();visible(h,0);horizontal(-90);visible(h,0);assert.deepEqual(h.orbitSteps,[{page:0,step:1},{page:0,step:-1}]);swipe();visible(h,1);horizontal();assert.deepEqual(h.orbitSteps.at(-1),{page:1,step:1});visible(h,1)});
test('a horizontal diagonal stays horizontal and suppresses the following video click',t=>{const f=fixture(t),{h,pointer,tick}=f;const start=f.clock;pointer('pointerdown',450,start,310);pointer('pointermove',420,start+90,210);pointer('pointerup',420,start+150,210);const click=new Event('click',{cancelable:true});Object.defineProperty(click,'timeStamp',{value:start+170});h.scroller.dispatchEvent(click);assert.equal(click.defaultPrevented,true);tick(1600);visible(h,0);assert.deepEqual(h.orbitSteps,[{page:0,step:1}])});
test('a vertical diagonal cannot turn into horizontal browsing halfway through',t=>{const f=fixture(t),{h,pointer,tick}=f;const start=f.clock;pointer('pointerdown',600,start,250);pointer('pointermove',550,start+60,245);pointer('pointermove',540,start+100,160);pointer('pointerup',540,start+200,160);tick(1600);visible(h,1);assert.deepEqual(h.orbitSteps,[])});
test('a short near-diagonal resolves on release and the following tap stays available',t=>{
 const f=fixture(t),{h,pointer,tick}=f,start=f.clock;
 pointer('pointerdown',500,start,240);
 pointer('pointermove',471,start+60,209);
 pointer('pointerup',471,start+100,209);
 pointer('pointerdown',471,start+135,209);
 pointer('pointerup',471,start+165,209);
 const click=new Event('click',{cancelable:true});h.scroller.dispatchEvent(click);
 assert.equal(click.defaultPrevented,false);
 tick(900);visible(h,0);assert.deepEqual(h.orbitSteps,[{page:0,step:1}]);
});
test('a video swipe queued during a page reversal is delivered when the original page settles',t=>{
 const f=fixture(t),{h,pointer,tick}=f;
 function gesture(dx,dy){
  const now=f.clock;
  pointer('pointerdown',500,now,250);
  pointer('pointermove',500-dy,now+16,250-dx);
  pointer('pointerup',500-dy,now+22,250-dx);
 }
 gesture(0,90);tick(64);gesture(0,-90);tick(32);gesture(90,0);
 assert.deepEqual(h.orbitSteps,[]);
 tick(900);visible(h,0);assert.deepEqual(h.orbitSteps,[{page:0,step:1}]);
});
test('a guide page preview moves the actual canvas without committing a route',t=>{
 const {h,tick}=fixture(t,'scene-3');
 function preview(node){
  if(Array.isArray(node))return node.map(preview).find(Boolean);
  if(node?.props)return node.props.onPagePreview||preview(node.props.children);
 }
 const nudge=preview(h.tree),active=h.worlds.find(w=>w.p['data-active']).el;
 const initial=active.style.transform;
 nudge(.38);tick(32);
 assert.notEqual(active.style.transform,initial);
 assert.equal(Number(h.root.dataset.position),3);
 assert.deepEqual(h.published,['scene-3']);
 nudge(0);tick(32);assert.equal(active.style.transform,initial);visible(h,3);
});
test('locked mobile stylesheet retains the approved source blocks',()=>{
 const css=readFileSync(new URL('../src/mobile-locked.css',import.meta.url),'utf8');
 const baselines={"mobile-focus.css": "f689a421a5ee6fed6cfafbc961b3a6299aae955351409f5b76b709b8c04a2135", "creative-refinements.css": "eb959ef12300c7289e428007964db323c652a9ccf65c425b0b51e1f6a198cbfb", "adaptive-performance.css": "28d6ace22cbf028d25cf5cc180560037614e58b931ef16a7aacd0af2819d778d"};
 for(const [file,hash] of Object.entries(baselines)){const restored=css.split("/* Approved "+file+" */\n")[1].split(/\n\/\* (?:Approved|Restore)/)[0].trimEnd();assert.equal(createHash("sha256").update(restored).digest("hex"),hash,file+" differs from the approved source");}
 assert.ok(readFileSync(new URL('../src/idle-motion.css',import.meta.url),'utf8').startsWith('@media (min-width:700px)'));
});

test('mobile opens a linked scene and publishes only the settled vertical destination',t=>{
 const {h,swipe,horizontal}=fixture(t,'scene-3');
 visible(h,3);assert.deepEqual(h.published,['scene-3']);
 horizontal();visible(h,3);assert.deepEqual(h.published,['scene-3']);
 swipe(650,180);visible(h,5);assert.deepEqual(h.published,['scene-3','scene-5']);
});


test('the glove leads two partial moves, yields to input and replays on a new linked scene',async t=>{
 const component=compile('../src/ScrollGuide.tsx').replace(/^import .*;\n/gm,'');
 const {default:Guide}=await import(data(stub.replace(',ScrollGuide=empty','')+component));
 const h={index:0,hooks:[],effects:[],layout:[],dirty:false},frames=new Map(),pages=[],effects=[],active=[];
 const box={left:0,top:0,width:390,height:740};
 const cue=new Node(),focus={
  getBoundingClientRect:()=>({left:75,top:210,width:240,height:140}),
  animate:(keyframes)=>{const effect={keyframes,pause(){},cancel(){this.cancelled=true}};effects.push(effect);return effect},
 };
 const gallery={querySelector:selector=>selector.startsWith('.slot-0')?focus:null};
 const root=Object.assign(new EventTarget(),{getBoundingClientRect:()=>box,querySelector:()=>gallery});
 const doc=Object.assign(new EventTarget(),{hidden:false});
 let id=0;
 const globals={mobileFixture:h,window:new EventTarget(),document:doc,sessionStorage:{getItem:()=> '1'},
  requestAnimationFrame:callback=>{frames.set(++id,callback);return id},cancelAnimationFrame:n=>frames.delete(n),
 };
 const saved=Object.fromEntries(Object.keys(globals).map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.entries(globals).forEach(([name,value])=>Object.defineProperty(globalThis,name,{value,writable:true,configurable:true}));
 t.after(()=>{h.hooks.forEach(value=>value?.cleanup?.());for(const [name,desc] of Object.entries(saved))desc?Object.defineProperty(globalThis,name,desc):delete globalThis[name]});
 const props={root:{current:root},mobile:true,entry:{current:true},automatic:false,open:false,reduced:false,onClose:()=>{},onActiveChange:value=>active.push(value),onPagePreview:amount=>pages.push(amount)};
 function render(){
  let view;
  do{
   Object.assign(h,{index:0,layout:[],effects:[],dirty:false});
   view=Guide(props);
   if(view)view.props.ref.current=cue;
   h.layout.forEach(effect=>effect());h.effects.forEach(effect=>effect());
  }while(h.dirty);
  return view;
 }
 function sample(time){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time));}
 assert.equal(render(),null);
 assert.equal(props.entry.current,true,'The guide waits for the opening');
 props.automatic=true;
 assert.equal(render().props['data-preview'],true);
 sample(0);sample(1030);
 assert.equal(cue.dataset.axis,'exhibit');
 assert.equal(effects[0].currentTime,1000);
 assert.equal(cue.style['--guide-contact'],'1');
 sample(3030);
 assert.equal(cue.dataset.axis,'page');
 assert.equal(effects[0].currentTime,0);
 assert.equal(pages.at(-1),.38);
 const wheel=new Event('wheel',{cancelable:true});
 Object.defineProperty(wheel,'deltaY',{value:100});
 root.dispatchEvent(wheel);
 assert.equal(wheel.defaultPrevented,false);
 assert.equal(pages.at(-1),0);
 assert.equal(effects[0].cancelled,true);
 assert.deepEqual(active,[true,false]);
 assert.equal(render(),null);
 assert.equal(frames.size,0);
 assert.equal(render(),null,'Changing the scene in the same visit does not replay the guide');
 props.open=true;
 assert.equal(render().props['data-preview'],false,'Manual replay remains available');
 h.hooks.forEach(value=>value?.cleanup?.());
 h.hooks=[];props.open=false;props.entry={current:true};doc.hidden=true;
 assert.equal(render(),null,'A newly linked scene waits while its tab is hidden');
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));
 assert.equal(render().props['data-preview'],true,'A fresh scene shows the guide despite the old session flag');
});

test('mobile shared videos close into Explore and in-site videos use their return history',async t=>{
 const source=compile('../src/App.tsx').replace(/^import .*;\n/gm,'').replaceAll('import.meta.env.BASE_URL',"'/'");
 const appStub=stub.replace('import {sceneIndex}', 'import {sceneIndex,scenePath,sceneId}')
  .replace("href=()=>'/work/'", "href=(path='')=>'/'+path.replace(/^\\//,'')")+ `
 const _Fragment=Symbol(),Universe=empty,OverviewTop=empty,ProjectReach=empty;
 const projects=[{id:'clip',title:'Clip',category:'ai',provider:'youtube'}],categories=[],campaignAssets=[],campaignProjects=[];
 const site={title:'Portfolio'},artSequence={ai:['liquid']},campaignFamilyFor=empty,collaboratorFor=empty;
 const initialExperience=path=>path==='/'?'fun':'normal',mobileLayout='phone';
 const useVideoConsent=()=>({prompt:false});
 class Component{}
 `;
 const {default:App}=await import(data(appStub+source));
 const h={index:0,hooks:[],layout:[],effects:[],dirty:false,performance:{ready:true,quality:'balanced'}};
 const document={documentElement:{dataset:{}},querySelector:()=>null};
 const history={state:null,backs:0,replaceState(state,_,path){this.state=state;globalThis.location=new URL(path,location)},pushState(state,_,path){this.replaceState(state,_,path)},back(){this.backs++}};
 const globals={mobileFixture:h,document,history,window:new EventTarget(),location:new URL('https://example.test/work/clip/'),matchMedia:query=>({matches:query==='phone'})};
 const saved=Object.fromEntries(Object.keys(globals).map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 for(const [name,value] of Object.entries(globals))Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
 const reset=()=>{h.hooks.forEach(value=>value?.cleanup?.());h.hooks=[];};
 t.after(()=>{reset();for(const [name,desc] of Object.entries(saved))desc?Object.defineProperty(globalThis,name,desc):delete globalThis[name]});
 function render(initialPath){
  let tree,renders=0;
  do{
   assert.ok(++renders<10);
   Object.assign(h,{index:0,layout:[],effects:[],dirty:false});
   tree=App({initialPath});
   h.effects.forEach(effect=>effect());
  }while(h.dirty);
  return tree;
 }
 function find(node,predicate){
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node))return node.map(child=>find(child,predicate)).find(Boolean);
  return predicate(node.props)?node:find(node.props.children,predicate);
 }
 const overlay=tree=>find(tree,p=>p?.className?.includes('project-overlay'));
 overlay(render('/work/clip/')).props.onClose();
 const explore=render('/work/clip/');
 assert.equal(location.pathname,'/');
 assert.equal(document.documentElement.dataset.mode,'fun');
 assert.equal(overlay(explore),undefined);
 assert.equal(history.backs,0);
 find(explore,p=>p?.guideEntry).props.onProject({id:'clip',title:'Clip',category:'ai',provider:'youtube'});
 overlay(render('/work/clip/')).props.onClose();
 assert.equal(history.backs,1,'An in-site overlay still returns to its previous entry');

 reset();
 history.replaceState({},'','/explore/ai-0/');
 const direct=find(render('/explore/ai-0/'),p=>p?.guideEntry).props;
 assert.equal(direct.initialScene,'ai-0');
 assert.equal(direct.guideEntry.current,true,'A fresh deep link has a pending guide');
});
