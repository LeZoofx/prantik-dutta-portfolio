import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleURL=(file,replace=s=>s)=>'data:text/javascript;base64,'+Buffer.from(replace(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText)).toString('base64');
const paging=moduleURL('../src/scenePaging.ts');
const intent=moduleURL('../src/WheelSceneIntent.ts');
const wheel=new URL('../node_modules/wheel-gestures/dist/wheel-gestures.esm.js',import.meta.url).href;
const {NativeSceneScroll}=await import(moduleURL('../src/NativeSceneScroll.ts',s=>s.replace("'./scenePaging'",JSON.stringify(paging)).replace("'./WheelSceneIntent'",JSON.stringify(intent)).replace("'wheel-gestures'",JSON.stringify(wheel))));
const recorded=name=>JSON.parse(readFileSync(new URL('../node_modules/wheel-gestures/src/test/fixtures/'+name+'.json',import.meta.url))).wheelEvents;
const originalDocument=globalThis.document;
function fixture(t){
 const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;
 class Scroller extends EventTarget {
  closest(){return null}
  clientHeight=800;scrollTop=0;onscrollend=null;calls=[];
  scrollTo(options){this.calls.push(options);if(options.behavior==='instant')this.scrollTop=options.top}
  at(page){this.scrollTop=page*this.clientHeight;this.dispatchEvent(new Event('scroll'))}
  end(){this.dispatchEvent(new Event('scrollend'))}
  wheel(data){const event=new Event('wheel',{cancelable:true});for(const [key,value] of Object.entries({deltaX:0,deltaY:120,deltaMode:0,timeStamp:0,...data}))Object.defineProperty(event,key,{value});this.dispatchEvent(event);return event.defaultPrevented}
 }
 const scroller=new Scroller(),root={dataset:{},style:{setProperty(){}}},motion=[];
 const controller=new NativeSceneScroll({scroller,root,total:15,reduced:()=>false,paused:()=>false,moving:v=>motion.push(v),invalidate(){}});
 controller.resize();scroller.calls=[];t.after(()=>{globalThis.document=doc;controller.destroy();if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument});return {controller,scroller,motion};
}
test('recorded normal trackpad gestures and their full momentum tails choose exactly one page',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const name of ['swipe-down-trackpad','swipe-up-trackpad']){
  const {scroller,controller,motion}=fixture(t),events=recorded(name),direction=Math.sign(events.find(e=>e.deltaY).deltaY);
  for(const event of events)assert.equal(scroller.wheel(event),true);
  assert.deepEqual(scroller.calls,[{top:(15+direction)*800,behavior:'smooth'}]);
  scroller.at(15+direction);scroller.end();t.mock.timers.tick(3000);
  assert.equal(controller.position,(direction+15)%15);assert.equal(scroller.calls.length,direction<0?2:1);assert.equal(motion.at(-1),false);
 }
});
test('stale scrollend cannot truncate an incoming scene or issue another scroll',t=>{
 const {scroller,controller}=fixture(t);
 scroller.wheel({deltaY:120});scroller.at(15.4);scroller.end();
 assert.deepEqual(scroller.calls,[{top:12800,behavior:'smooth'}]);
 assert.equal(controller.moving,true);assert.equal(controller.position,.40000000000000036);
 scroller.at(16);scroller.end();scroller.end();
 assert.equal(controller.position,1);assert.equal(scroller.calls.length,1);
});
test('recorded fast flicks request multiple pages before momentum, with no delayed extra navigation',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const name of ['swipe-down-fast-trackpad','swipe-up-fast-trackpad']){
  const {scroller,controller}=fixture(t),events=recorded(name),direction=Math.sign(events.find(e=>e.deltaY).deltaY);
  for(const event of events)scroller.wheel(event);
  assert.equal(controller.target,3*direction);assert.equal(scroller.calls.at(-1).top,(15+direction*3)*800);
  const count=scroller.calls.length;scroller.at(15+direction*3);scroller.end();scroller.end();t.mock.timers.tick(3000);
  assert.equal(controller.position,(3*direction+15)%15);assert.equal(scroller.calls.length,count+(direction<0?1:0));
 }
});
test('a fresh gesture during an unfinished transition is accepted without losing its destination',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const {scroller,controller}=fixture(t);
 scroller.wheel({deltaY:120,timeStamp:0});scroller.at(15.2);t.mock.timers.tick(1001);
 scroller.wheel({deltaY:120,timeStamp:1001});scroller.end();
 assert.equal(controller.target,2);assert.equal(scroller.calls.length,2);
 scroller.at(17);scroller.end();assert.equal(controller.position,2);assert.equal(controller.moving,false);
});
test('a single large wheel event remains one page; browser zoom stays native',t=>{
 const {scroller,controller}=fixture(t);
 assert.equal(scroller.wheel({deltaY:2800}),true);assert.equal(controller.target,1);
 assert.equal(scroller.wheel({deltaY:120,ctrlKey:true}),false);assert.equal(scroller.calls.length,1);
});
test('manual scroll recovery rounds to a whole page and does not force a further advance',t=>{
 const {scroller,controller}=fixture(t);scroller.at(16.08);scroller.end();
 assert.deepEqual(scroller.calls,[{top:12800,behavior:'smooth'}]);scroller.at(16);scroller.end();scroller.end();
 assert.equal(controller.position,1);assert.equal(scroller.calls.length,1);
});
const {NativeSceneAnimator}=await import(moduleURL('../src/NativeSceneAnimator.ts'));
test('layout changes update keyframes without restarting the entrance animation',t=>{
 const previousWindow=globalThis.window;globalThis.window={ScrollTimeline:class {}};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow});
 const created=[];const layer={isConnected:true,animate(frames){const animation={effect:{target:this,frames,setKeyframes(value){this.frames=value}},cancelled:false,cancel(){this.cancelled=true}};created.push(animation);return animation}};
 const animator=new NativeSceneAnimator({});
 animator.plane(layer,1,16,15,[],'before-font',false);
 const original=created[0];animator.plane(layer,1,16,15,[],'after-font',false);
 assert.equal(created.length,1);assert.equal(original.cancelled,false);
 animator.destroy();assert.equal(original.cancelled,true);
});
