import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const stub=data(`const f=()=>globalThis.orbitLiveFixture;const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
export const useRef=v=>{const h=f(),i=h.index++;return h.hooks[i]??(h.hooks[i]={current:v===null?h.gallery:v})};
export const useState=v=>{const h=f(),i=h.index++;if(!(i in h.hooks))h.hooks[i]=v;return [h.hooks[i],next=>{const value=typeof next==='function'?next(h.hooks[i]):next;if(!Object.is(value,h.hooks[i])){h.hooks[i]=value;h.dirty=true}}]};
const effect=(fn,deps,layout)=>{const h=f(),i=h.index++,old=h.hooks[i];if(!old||!same(old.deps,deps)){h.hooks[i]={deps,cleanup:old?.cleanup};h[layout?'layout':'effects'].push(()=>{h.hooks[i].cleanup?.();h.hooks[i].cleanup=fn()})}};
export const useEffect=(fn,deps)=>effect(fn,deps,false);export const useLayoutEffect=(fn,deps)=>effect(fn,deps,true);`);
const source=ts.transpileModule(readFileSync(new URL('../src/useFrameOrbit.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText.replace("'react'",JSON.stringify(stub));
const {default:useFrameOrbit}=await import(data(source));
function fixture(t,{automatic=false,reduced=false}={}){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:100});
 const names=['window','document','performance','getComputedStyle','orbitLiveFixture'],saved=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 const doc=new EventTarget(),win=new EventTarget(),gallery=new EventTarget();doc.hidden=false;doc.documentElement={dataset:{previews:'ready'}};gallery.dataset={};
 const h={index:0,hooks:[],layout:[],effects:[],dirty:false,gallery,animations:[],enabled:true,automatic,motion:{scrolling:false,velocity:0,target:0,position:0,reduced},api:null};
 class Motion{
  currentTime=0;playbackRate=1;playState='running';cancelled=false;rates=[];
  constructor(frames,options){this.frames=frames;this.options=options;this.effect={getTiming:()=>options};this.finished=new Promise(resolve=>this.finish=()=>{this.playState='finished';resolve()});h.animations.push(this)}
  pause(){this.playState='paused'}play(){this.playState='running'}cancel(){this.cancelled=true;this.playState='idle'}updatePlaybackRate(value){this.rates.push(value);this.playbackRate=value}
 }
 const cards=Array.from({length:4},(_,i)=>{const body={filter:'none',querySelector:()=>null,animate:(frames,options)=>new Motion(frames,options),querySelectorAll:()=>[]};return {dataset:{film:'p'+i},slot:i,offsetLeft:i*100,offsetTop:0,offsetWidth:i?100:300,offsetHeight:100,rotate:'0deg',animate:(frames,options)=>new Motion(frames,options),querySelector:()=>body,classList:{contains:name=>name==='slot-0'&&cards[i].slot===0}}});
 const world={dataset:{},dispatchEvent(){}};gallery.closest=()=>world;gallery.querySelector=selector=>selector===':focus-visible'?null:{};gallery.querySelectorAll=()=>cards;
 Object.assign(globalThis,{window:win,document:doc,performance:{now:()=>Date.now()},getComputedStyle:e=>({rotate:e.rotate||'0deg',filter:e.filter||'none',zIndex:String(e.slot===0?40:15)}),orbitLiveFixture:h});
 function render(){h.index=0;h.dirty=false;h.layout=[];h.effects=[];h.api=useFrameOrbit(4,h.enabled,h.motion,false,h.automatic);cards.forEach((c,i)=>{c.slot=((i-h.api.turn)%4+4)%4;c.offsetLeft=c.slot*100;c.offsetWidth=c.slot?100:300});h.layout.forEach(fn=>fn());h.effects.forEach(fn=>fn())}
 const flush=()=>{let guard=0;while(h.dirty){assert.ok(++guard<20);render()}};
 render();flush();
 const microtasks=async()=>{for(let i=0;i<5;i++){await Promise.resolve();flush()}};
 async function finish(){const group=h.animations.filter(a=>!a.cancelled&&a.playState!=='finished');group.forEach(a=>a.finish());await microtasks()}
 const request=step=>{h.api.advance(step);flush()};
 const tick=ms=>{t.mock.timers.tick(ms);flush()};
 t.after(()=>{h.hooks.forEach(v=>v?.cleanup?.());for(const [name,descriptor] of Object.entries(saved))descriptor?Object.defineProperty(globalThis,name,descriptor):delete globalThis[name]});
 return {h,doc,win,request,tick,finish,flush,microtasks,render};
}
test('manual browsing works with idle rotation off and hands media over only at rest',async t=>{
 const {h,request,finish,tick}=fixture(t);request(1);assert.equal(h.api.turn,1);assert.equal(h.api.settledTurn,0);assert.ok(h.animations.every(a=>a.options.duration===700));
 await finish();assert.equal(h.api.settledTurn,1);tick(60000);assert.equal(h.api.turn,1);
});
test('a manual reversal keeps an in-flight idle curve and its current playback position',async t=>{
 const {h,request,finish,tick}=fixture(t,{automatic:true});tick(3200);const original=h.animations.slice();assert.equal(h.api.turn,1);original.forEach(a=>a.currentTime=800);
 request(-1);assert.equal(h.api.turn,1);assert.ok(original.every(a=>!a.cancelled&&a.currentTime===800&&a.rates.at(-1)>1));
 await finish();assert.equal(h.api.turn,0);assert.equal(h.api.settledTurn,1);assert.ok(h.animations.slice(original.length).every(a=>a.options.duration===700));
 await finish();assert.equal(h.api.settledTurn,0);tick(3199);assert.equal(h.api.turn,0);tick(1);assert.equal(h.api.turn,1);
});
test('successive horizontal requests queue without restarting or cancelling active frames',async t=>{
 const {h,request,finish}=fixture(t);request(1);const first=h.animations.slice();request(2);assert.equal(h.animations.length,first.length);assert.ok(first.every(a=>!a.cancelled));
 await finish();assert.equal(h.api.turn,2);await finish();assert.equal(h.api.turn,3);await finish();assert.equal(h.api.settledTurn,3);
});
test('up/down motion pauses the same orbit and resumes it without another animation owner',async t=>{
 const {h,win,request,finish}=fixture(t);request(1);const group=h.animations.slice();h.motion.scrolling=true;const moving=new Event('portfolio-motion');moving.detail=true;win.dispatchEvent(moving);assert.ok(group.every(a=>a.playState==='paused'));
 h.motion.scrolling=false;const rest=new Event('portfolio-motion');rest.detail=false;win.dispatchEvent(rest);assert.ok(group.every(a=>a.playState==='running'&&!a.cancelled));await finish();assert.equal(h.api.settledTurn,1);
});
test('overlapping frames keep their old stack until the media handoff',async t=>{
 const {h,request,finish}=fixture(t);
 request(1);
 const swaps=h.animations.filter(animation=>animation.frames[0].zIndex);
 const outgoing=h.animations.find(animation=>animation.frames.some(frame=>frame.opacity===.62));
 assert.equal(swaps.length,2);
 assert.ok(swaps.every(({frames})=>frames[0].easing==='steps(1,end)'&&frames[1].offset===.56));
 assert.equal(outgoing.frames.find(frame=>frame.opacity===.62).offset,.56);
 assert.ok(outgoing.frames.every(frame=>frame.transform.includes('rotateY(')));
 await finish();
 assert.equal(h.gallery.dataset.orbiting,undefined);
});
test('manual reverse browsing wraps safely',async t=>{const {h,request,finish}=fixture(t);request(-1);assert.equal(h.api.turn,3);await finish();assert.equal(h.api.settledTurn,3)});
test('reduced-motion browsing changes the video without starting motion effects',async t=>{const {h,request,microtasks}=fixture(t,{reduced:true});request(1);await microtasks();assert.equal(h.animations.length,0);assert.equal(h.api.settledTurn,1)});
