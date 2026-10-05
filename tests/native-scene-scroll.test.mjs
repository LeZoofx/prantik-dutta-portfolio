import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleURL=(file,replace=s=>s)=>'data:text/javascript;base64,'+Buffer.from(replace(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText)).toString('base64');
const paging=moduleURL('../src/scenePaging.ts');
const {NativeSceneScroll}=await import(moduleURL('../src/NativeSceneScroll.ts',s=>s.replace("'./scenePaging'",JSON.stringify(paging))));
function fixture(t){
 const previousDocument=globalThis.document;const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;
 class Scroller extends EventTarget {
  closest(){return null}
  clientHeight=800;scrollTop=0;onscrollend=null;calls=[];
  scrollTo(options){this.calls.push(options);if(options.behavior==='instant')this.scrollTop=options.top}
  at(page){this.scrollTop=page*this.clientHeight;this.dispatchEvent(new Event('scroll'))}
  end(){this.dispatchEvent(new Event('scrollend'))}
  wheel(delta){this.dispatchEvent(Object.assign(new Event('wheel'),{deltaY:delta,ctrlKey:false,metaKey:false}))}
 }
 const scroller=new Scroller(),root={dataset:{},style:{setProperty(){}}},motion=[];
 const controller=new NativeSceneScroll({scroller,root,total:15,reduced:()=>false,paused:()=>false,moving:v=>motion.push(v),invalidate(){}});
 controller.resize();scroller.calls=[];t.after(()=>{controller.destroy();if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument});return {controller,scroller,motion};
}
test('a trackpad tail cannot manufacture a second page after native snap',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const {scroller,controller,motion}=fixture(t);
 scroller.wheel(480);scroller.at(15.6);t.mock.timers.tick(180);
 scroller.at(16);scroller.end();scroller.calls=[];
 scroller.wheel(4);scroller.at(16.02);scroller.at(16);scroller.end();
 t.mock.timers.tick(3000);
 assert.equal(controller.position,1);assert.deepEqual(scroller.calls,[]);assert.equal(motion.at(-1),false);
});
test('recovery finishes the interrupted page rather than advancing again',t=>{
 const {scroller,controller}=fixture(t);
 scroller.at(16.08);scroller.end();
 assert.deepEqual(scroller.calls,[{top:12800,behavior:'smooth'}]);
 scroller.at(16);scroller.end();scroller.end();
 assert.equal(controller.position,1);assert.equal(scroller.calls.length,1);
});
test('long native travel is retained and repeated scrollend cannot queue navigation',t=>{
 const {scroller,controller}=fixture(t);
 scroller.wheel(2600);scroller.at(18);scroller.end();scroller.end();
 assert.equal(controller.position,3);assert.deepEqual(scroller.calls,[]);
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
