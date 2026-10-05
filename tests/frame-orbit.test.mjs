import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const stub='data:text/javascript;base64,'+Buffer.from(`export const useRef=value=>({current:value===null?globalThis.orbitFixture.gallery:value});export const useState=value=>[value,update=>globalThis.orbitFixture.turns.push(typeof update==='function'?update(value):update)];export const useEffect=fn=>globalThis.orbitFixture.cleanups.push(fn());export const useLayoutEffect=()=>{};`).toString('base64');
const source=ts.transpileModule(readFileSync(new URL('../src/useFrameOrbit.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText.replace("'react'",JSON.stringify(stub));
const {default:useFrameOrbit}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function fixture(t,ready=true,playing=true){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:100});
 const saved={document:globalThis.document,window:globalThis.window,performance:globalThis.performance,orbitFixture:globalThis.orbitFixture};
 const doc=new EventTarget();doc.hidden=false;doc.documentElement={dataset:{previews:'ready'}};
 const win=new EventTarget(),gallery=new EventTarget();gallery.ready=ready;gallery.querySelector=selector=>selector===':focus-visible'?null:gallery.ready?{}:null;gallery.querySelectorAll=()=>[];
 Object.assign(globalThis,{document:doc,window:win,performance:{now:()=>Date.now()},orbitFixture:{gallery,turns:[],cleanups:[]}});
 useFrameOrbit(4,true,{scrolling:false,velocity:0,target:0,position:0},playing);
 const result=globalThis.orbitFixture;
 t.after(()=>{result.cleanups.forEach(fn=>fn?.());Object.assign(globalThis,saved)});
 return {doc,gallery,win,turns:result.turns,tick:ms=>t.mock.timers.tick(ms)};
}
test('a playing focal frame remains in place for 60 seconds',t=>{
 const {tick,turns}=fixture(t);tick(59999);assert.deepEqual(turns,[]);tick(1);assert.deepEqual(turns,[1]);
});
test('the 60-second clock begins after the focal preview becomes ready',t=>{
 const {tick,gallery,turns}=fixture(t,false);tick(4000);gallery.ready=true;gallery.dispatchEvent(new Event('portfolio-video-ready'));
 tick(59999);assert.deepEqual(turns,[]);tick(1);assert.deepEqual(turns,[1]);
});
test('time in a hidden tab does not consume the viewing interval',t=>{
 const {doc,tick,turns}=fixture(t);tick(20000);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));tick(120000);
 assert.deepEqual(turns,[]);doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));tick(39999);assert.deepEqual(turns,[]);tick(1);assert.deepEqual(turns,[1]);
});
test('poster-only idle rotation remains active before autoplay is requested',t=>{
 const {tick,turns}=fixture(t,true,false);tick(7799);assert.deepEqual(turns,[]);tick(1);assert.deepEqual(turns,[1]);
});
