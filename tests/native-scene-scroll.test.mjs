import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleURL=(file,replace=s=>s)=>'data:text/javascript;base64,'+Buffer.from(replace(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText)).toString('base64');
const paging=moduleURL('../src/scenePaging.ts'),intent=moduleURL('../src/WheelSceneIntent.ts'),transition=moduleURL('../src/SceneTransition.ts');
const wheel=new URL('../node_modules/wheel-gestures/dist/wheel-gestures.esm.js',import.meta.url).href;
const {NativeSceneScroll}=await import(moduleURL('../src/NativeSceneScroll.ts',s=>s.replace("'./scenePaging'",JSON.stringify(paging)).replace("'./WheelSceneIntent'",JSON.stringify(intent)).replace("'./SceneTransition'",JSON.stringify(transition)).replace("'wheel-gestures'",JSON.stringify(wheel))));
const {SceneTransition}=await import(transition);
const recorded=name=>JSON.parse(readFileSync(new URL('../node_modules/wheel-gestures/src/test/fixtures/'+name+'.json',import.meta.url))).wheelEvents;
function fixture(t){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:100});
 const saved={document:globalThis.document,performance:globalThis.performance,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;
 globalThis.performance={now:()=>Date.now()};globalThis.requestAnimationFrame=fn=>setTimeout(()=>fn(Date.now()),16);globalThis.cancelAnimationFrame=clearTimeout;
 class Scroller extends EventTarget{
  clientHeight=800;scrollTop=0;onscrollend=null;calls=[];
  scrollTo(options){this.calls.push(options);this.scrollTop=options.top;this.dispatchEvent(new Event('scroll'))}
  closest(){return null}
  at(page){this.scrollTop=page*800;this.dispatchEvent(new Event('scroll'))}
  end(){this.dispatchEvent(new Event('scrollend'))}
  wheel(data){const event=new Event('wheel',{cancelable:true});for(const [key,value] of Object.entries({deltaX:0,deltaY:120,deltaMode:0,timeStamp:Date.now(),...data}))Object.defineProperty(event,key,{value});this.dispatchEvent(event);return event.defaultPrevented}
 }
 const scroller=new Scroller(),motion=[],destinations=[];
 const controller=new NativeSceneScroll({scroller,root:{dataset:{},style:{setProperty(){}}},total:15,reduced:()=>false,paused:()=>false,moving:v=>motion.push(v),invalidate(){},prepare:(from,to)=>destinations.push(to)});
 controller.resize();scroller.calls=[];
 t.after(()=>{controller.destroy();Object.assign(globalThis,saved)});
 const tick=ms=>{for(let left=ms;left>0;left-=Math.min(16,left))t.mock.timers.tick(Math.min(16,left))};
 const tail=()=>{for(const deltaY of [120,100,82,65,50,38,30,23,17,12,8,6,4,3]){tick(16);scroller.wheel({deltaY})}};
 const replay=events=>{let previous=events[0].timeStamp;for(const event of events){tick(Math.max(0,Math.round(event.timeStamp-previous)));previous=event.timeStamp;scroller.wheel({...event,timeStamp:Date.now()})}tick(1000)};
 return {scroller,controller,motion,destinations,tick,tail,replay,doc};
}
test('recorded normal trackpad gestures and momentum tails land on exactly one page',t=>{
 const {scroller,controller,destinations,replay}=fixture(t);const events=recorded('swipe-down-trackpad'),direction=Math.sign(events.find(e=>e.deltaY).deltaY);replay(events);
 assert.deepEqual(destinations,[direction]);assert.equal(controller.position,(15+direction)%15);assert.equal(controller.moving,false);
 assert.ok(scroller.calls.every(call=>call.behavior==='instant'));
});
test('a recorded upward gesture wraps without adding another page',t=>{
 const {controller,destinations,replay}=fixture(t);const events=recorded('swipe-up-trackpad'),direction=Math.sign(events.find(e=>e.deltaY).deltaY);replay(events);
 assert.deepEqual(destinations,[direction]);assert.equal(controller.position,(15+direction)%15);assert.equal(controller.moving,false);
});
for(const name of ['swipe-down-fast-trackpad','swipe-up-fast-trackpad'])test(name+' chooses one multi-page destination',t=>{
 const {controller,destinations,replay}=fixture(t),events=recorded(name),direction=Math.sign(events.find(e=>e.deltaY).deltaY);replay(events);
 assert.deepEqual(destinations,[3*direction]);assert.equal(controller.position,(15+3*direction)%15);
});
test('a stale scrollend cannot truncate an incoming scene or request another destination',t=>{
 const {scroller,controller,destinations,tick}=fixture(t);scroller.wheel({deltaY:120});tick(160);const position=controller.position;scroller.end();
 assert.equal(controller.moving,true);assert.equal(controller.position,position);tick(1000);
 assert.equal(controller.position,1);assert.deepEqual(destinations,[1]);
});
test('the final owned scroll event cannot reopen an already settled transition',t=>{
 const {scroller,controller,motion,tick}=fixture(t);scroller.wheel({deltaY:120});tick(1000);
 scroller.dispatchEvent(new Event('scroll'));assert.equal(controller.moving,false);assert.equal(motion.at(-1),false);
});
test('a fresh gesture retargets an unfinished transition without restarting its speed',t=>{
 const curve=new SceneTransition();curve.move(1,100);curve.sample(330);const before=curve.position,speed=curve.velocity;
 curve.move(2,330);assert.equal(curve.position,before);assert.ok(Math.abs(curve.velocity-speed)<1e-10);
 curve.sample(331);assert.ok(Math.abs(curve.velocity-speed)<.00003);curve.sample(1400);assert.equal(curve.position,2);
 const {scroller,controller,destinations,tick}=fixture(t);scroller.wheel({deltaY:120});tick(200);scroller.wheel({deltaY:120});tick(1000);
 assert.deepEqual(destinations,[1,2]);assert.equal(controller.position,2);
});
test('a single large wheel event stays one page and browser zoom remains native',t=>{
 const {scroller,controller,tick,destinations}=fixture(t);assert.equal(scroller.wheel({deltaY:2800}),true);tick(1000);
 assert.equal(controller.position,1);assert.equal(scroller.wheel({deltaY:120,ctrlKey:true}),false);assert.deepEqual(destinations,[1]);
});
for(const gap of [160,240,360])test('a delayed decaying tail after '+gap+'ms does not cause an extra advance',t=>{
 const {scroller,controller,tick,tail,destinations}=fixture(t);tail();tick(gap);
 for(const deltaY of [30,18,12,8,6,4,2]){scroller.wheel({deltaY});tick(16)}tick(1000);
 assert.equal(controller.position,1);assert.deepEqual(destinations,[1]);
});
test('a short steady gentle gesture after a tail is registered rather than discarded',t=>{
 const {scroller,controller,tick,tail,destinations}=fixture(t);tail();tick(180);
 for(const deltaY of [12,12,12]){scroller.wheel({deltaY});tick(16)}tick(1000);
 assert.deepEqual(destinations,[1,2]);assert.equal(controller.position,2);
});
test('gentle individual mouse-wheel impulses are registered',t=>{
 const {scroller,controller,tick,destinations}=fixture(t);scroller.wheel({deltaY:120});tick(160);scroller.wheel({deltaY:20});tick(1000);
 assert.deepEqual(destinations,[1,2]);assert.equal(controller.position,2);
});
test('a rising gentle gesture and a new strong flick are accepted during the old tail',t=>{
 const {scroller,controller,tick,tail,destinations}=fixture(t);tail();
 for(const deltaY of [1,2,3,4,6,8,12]){tick(16);scroller.wheel({deltaY})}tick(1000);
 assert.deepEqual(destinations,[1,2]);assert.equal(controller.position,2);
});
test('explicit native momentum cannot turn into navigation',t=>{
 const {scroller,controller,tick,destinations}=fixture(t);scroller.wheel({deltaY:120});tick(1000);scroller.wheel({deltaY:300,momentum:true});tick(1000);
 assert.equal(controller.position,1);assert.deepEqual(destinations,[1]);
});
test('a freeze cancels deferred intent and motion',t=>{
 const {scroller,controller,tick,destinations}=fixture(t);scroller.wheel({deltaY:120});controller.freeze();tick(1000);
 assert.equal(controller.position,0);assert.equal(controller.moving,false);assert.deepEqual(destinations,[]);
});
test('manual partial scroll snaps to the nearest page without an extra gesture',t=>{
 const {scroller,controller,tick,destinations}=fixture(t);scroller.at(16.08);scroller.end();tick(1000);
 assert.equal(controller.position,1);assert.deepEqual(destinations,[1]);
});
const {NativeSceneAnimator}=await import(moduleURL('../src/NativeSceneAnimator.ts'));
test('layout changes update keyframes without restarting the entrance animation',t=>{
 const previousWindow=globalThis.window;globalThis.window={ScrollTimeline:class {}};t.after(()=>{globalThis.window=previousWindow});
 const created=[],layer={isConnected:true,animate(frames){const animation={effect:{target:this,frames,setKeyframes(value){this.frames=value}},cancel(){this.cancelled=true}};created.push(animation);return animation}};
 const animator=new NativeSceneAnimator({});animator.plane(layer,1,16,15,[],'before-font',false);const original=created[0];animator.plane(layer,1,16,15,[],'after-font',false);
 assert.equal(created.length,1);assert.equal(original.cancelled,undefined);animator.destroy();assert.equal(original.cancelled,true);
});
