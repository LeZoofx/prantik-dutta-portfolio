import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleURL=(file,replace=s=>s)=>'data:text/javascript;base64,'+Buffer.from(replace(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText)).toString('base64');
const intent=moduleURL('../src/WheelSceneIntent.ts'),paging=moduleURL('../src/scenePaging.ts'),transition=moduleURL('../src/SceneTransition.ts');
const wheel=new URL('../node_modules/wheel-gestures/dist/wheel-gestures.esm.js',import.meta.url).href;
const {FrameWheelInput}=await import(moduleURL('../src/FrameWheelInput.ts',s=>s.replace("'./WheelSceneIntent'",JSON.stringify(intent)).replace("'./scenePaging'",JSON.stringify(paging)).replace("'wheel-gestures'",JSON.stringify(wheel))));
const {NativeSceneScroll}=await import(moduleURL('../src/NativeSceneScroll.ts',s=>s.replace("'./scenePaging'",JSON.stringify(paging)).replace("'./SceneTransition'",JSON.stringify(transition))));
const recorded=name=>JSON.parse(readFileSync(new URL('../node_modules/wheel-gestures/src/test/fixtures/'+name+'.json',import.meta.url))).wheelEvents;
function fixture(t){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:100});
 const saved={document:globalThis.document,performance:globalThis.performance,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;globalThis.performance={now:()=>Date.now()};globalThis.requestAnimationFrame=fn=>setTimeout(()=>fn(Date.now()),16);globalThis.cancelAnimationFrame=clearTimeout;
 class Scroller extends EventTarget{
  clientWidth=800;clientHeight=800;scrollTop=0;onscrollend=null;control=false;
  closest(){return this.control?{}:null}
  scrollTo(o){this.scrollTop=o.top;this.dispatchEvent(new Event('scroll'))}
  wheel(data){const event=new Event('wheel',{cancelable:true});for(const [key,value] of Object.entries({deltaX:0,deltaY:0,deltaZ:0,deltaMode:0,timeStamp:Date.now(),...data}))Object.defineProperty(event,key,{value});this.dispatchEvent(event);return event.defaultPrevented}
 }
 const scroller=new Scroller(),steps=[];let paused=false;
 const vertical=new NativeSceneScroll({scroller,root:{dataset:{},style:{setProperty(){}}},total:15,reduced:()=>false,paused:()=>paused,moving(){},invalidate(){}});vertical.resize();
 const input=new FrameWheelInput({scroller,step:n=>steps.push(n),page:n=>vertical.advance(n),paused:()=>paused});
 const tick=ms=>{for(let left=ms;left>0;left-=Math.min(16,left))t.mock.timers.tick(Math.min(16,left))};
 function replay(name,horizontal=false){const events=recorded(name);let previous=events[0].timeStamp;for(const data of events){tick(Math.max(0,Math.round(data.timeStamp-previous)));previous=data.timeStamp;scroller.wheel({...data,deltaX:horizontal?data.deltaY:data.deltaX,deltaY:horizontal?data.deltaX:data.deltaY,timeStamp:Date.now()})}tick(1200);return Math.sign(events.find(e=>e.deltaY).deltaY)}
 t.after(()=>{input.destroy();vertical.destroy();Object.assign(globalThis,saved)});
 return {scroller,steps,vertical,tick,replay,setPaused:value=>paused=value,doc};
}
for(const name of ['swipe-down-trackpad','swipe-up-trackpad'])test(name+' cycles one video and never changes the page',t=>{
 const {steps,vertical,replay}=fixture(t),direction=replay(name,true);assert.deepEqual(steps,[direction]);assert.equal(vertical.position,0);
});
for(const name of ['swipe-down-fast-trackpad','swipe-up-fast-trackpad'])test(name+' can browse several videos without changing pages',t=>{
 const {steps,vertical,replay}=fixture(t),direction=replay(name,true);assert.deepEqual(steps,[3*direction]);assert.equal(vertical.position,0);
});
test('recorded vertical gestures retain the existing page behavior',t=>{
 const {steps,vertical,replay}=fixture(t),direction=replay('swipe-down-trackpad');assert.deepEqual(steps,[]);assert.equal(vertical.position,(15+direction)%15);
});
test('diagonal and cross-axis momentum cannot create an automatic page scroll',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);
 for(const [deltaX,deltaY] of [[120,8],[80,5],[40,4],[15,8],[2,12],[1,6],[0,3]]){assert.equal(scroller.wheel({deltaX,deltaY}),true);tick(16)}tick(1200);
 assert.deepEqual(steps,[1]);assert.equal(vertical.position,0);
});
test('small vertical jitter at the start of a diagonal video gesture waits for the main motion',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);
 for(const [deltaX,deltaY] of [[1,3],[8,6],[32,25],[28,18],[5,16],[1,4]]){scroller.wheel({deltaX,deltaY});tick(12)}tick(1200);
 assert.deepEqual(steps,[1]);assert.equal(vertical.position,0);
});
test('a reversing cross-axis tail cannot send a second exhibit request',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);
 scroller.wheel({deltaX:85,deltaY:12});tick(48);
 scroller.wheel({deltaX:-12,deltaY:24});tick(900);
 assert.deepEqual(steps,[1]);assert.equal(vertical.position,0);
});
test('a page gesture survives sideways drift and a near-diagonal gesture always resolves',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);
 for(const [deltaX,deltaY] of [[4,5],[8,14],[18,23],[36,12],[26,2]]){scroller.wheel({deltaX,deltaY});tick(12)}tick(1000);
 assert.deepEqual(steps,[]);assert.equal(vertical.position,1);
 scroller.wheel({deltaX:12,deltaY:11});tick(1000);
 assert.deepEqual(steps,[1]);assert.equal(vertical.position,1);
});
test('Shift-wheel browses videos, while browser zoom and controls remain native',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);assert.equal(scroller.wheel({deltaY:120,shiftKey:true}),true);tick(1000);assert.deepEqual(steps,[1]);assert.equal(vertical.position,0);
 assert.equal(scroller.wheel({deltaX:200,ctrlKey:true}),false);scroller.control=true;assert.equal(scroller.wheel({deltaX:200}),false);tick(1000);assert.deepEqual(steps,[1]);
});
test('a fresh vertical gesture immediately hands control back to page navigation',t=>{
 const {scroller,steps,vertical,tick}=fixture(t);scroller.wheel({deltaX:120});tick(150);scroller.wheel({deltaY:180});tick(1000);assert.deepEqual(steps,[1]);assert.equal(vertical.position,1);
});
test('pausing or hiding cancels a deferred horizontal request',t=>{
 const {scroller,steps,tick,doc}=fixture(t);scroller.wheel({deltaX:120});doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));tick(1000);assert.deepEqual(steps,[]);
});
