import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/ExploreOpening.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import .*;\n/gm,'');
const {default:Opening}=await import('data:text/javascript;base64,'+Buffer.from("const mobileLayout='mobile';const useEffect=fn=>globalThis.openingFixture.cleanup=fn();"+code).toString('base64'));
function fixture(t){
 const names=['window','document','Element','location','matchMedia','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','openingFixture'];
 const saved=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 class Node extends EventTarget{
  style={setProperty(){}};children=[];removed=false;
  append(...children){this.children.push(...children)}remove(){this.removed=true}setAttribute(){}
  getBoundingClientRect(){return {left:0,top:0,right:1280,bottom:720,width:1280,height:720}}
  querySelectorAll(){return []}querySelector(){return new Node()}
  animate(){return {cancel(){}}}
 }
 const h={available:{current:true},active:[],wheels:[],touches:[]},win=new EventTarget(),doc={hidden:false,body:new Node(),createElement:()=>new Node()};
 let frame;
 const globals={window:win,document:doc,Element:Node,location:{search:''},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{frame=fn;return 1},cancelAnimationFrame(){},getComputedStyle:()=>({backgroundImage:'none'}),openingFixture:h};
 for(const [n,value] of Object.entries(globals))Object.defineProperty(globalThis,n,{value,writable:true,configurable:true});
 Opening({bar:{current:new Node()},available:h.available,enabled:true,mobile:false,onActiveChange:v=>h.active.push(v),onWheel:e=>{h.wheels.push(e);e.preventDefault()},onPointerStart:e=>h.touches.push(e)});
 t.after(()=>{h.cleanup?.();for(const [n,d] of Object.entries(saved))d?Object.defineProperty(globalThis,n,d):delete globalThis[n]});
 return {h,win,doc,start:()=>frame()};
}
test('the first wheel interrupts the opening and forwards the same event exactly once',t=>{
 const {h,win}=fixture(t),event=new Event('wheel',{cancelable:true});
 win.dispatchEvent(event);assert.deepEqual(h.wheels,[event]);assert.equal(event.defaultPrevented,true);assert.equal(h.available.current,false);
 win.dispatchEvent(new Event('wheel'));assert.equal(h.wheels.length,1);
});
test('a touch interrupts the opening and transfers its pointer without clicking through',t=>{
 const {h,doc,start}=fixture(t);start();const layer=doc.body.children[0],event=new Event('pointerdown',{cancelable:true});
 Object.defineProperty(event,'pointerType',{value:'touch'});layer.dispatchEvent(event);
 assert.deepEqual(h.touches,[event]);assert.equal(layer.removed,true);assert.equal(event.defaultPrevented,true);assert.deepEqual(h.active,[true,false]);
});
