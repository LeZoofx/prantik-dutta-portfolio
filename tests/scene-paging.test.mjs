import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/scenePaging.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText;
const {ScenePager,swipePages,nativeSnapPage,recenterPage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('native recovery completes a partial stop without inventing another gesture',()=>{
 assert.equal(nativeSnapPage(12.1,60),12);
 assert.equal(nativeSnapPage(11.9,60),12);
 assert.equal(nativeSnapPage(12.6,60),13);
 assert.equal(nativeSnapPage(12,60),12);
 assert.equal(nativeSnapPage(16.3,60),16);
 assert.equal(nativeSnapPage(7.7,60),8);
 assert.equal(nativeSnapPage(-.5,60),0);
 assert.equal(nativeSnapPage(60,60),59);
});
test('infinite recentring preserves the visible scene at either edge',()=>{
 for(const page of [0,1,11,12,23,24,35]){
  const centered=recenterPage(page,12);assert.equal(centered%12,page%12);
  assert.ok(centered>=12&&centered<24);
 }
});
test('the deadline ends exactly on a page at both high and low frame rates',()=>{
 for(const frames of [[0,16,50,100,200,379,380],[0,300,900]]){
  const pager=new ScenePager();pager.advance(1,0);for(const t of frames)pager.sample(t);
  assert.equal(pager.position,1);assert.equal(pager.moving,false);
 }
});
test('new input queues another page without restarting the current transition',()=>{
 const pager=new ScenePager();pager.advance(1,0);pager.sample(200);pager.advance(1,200);
 assert.equal(pager.sample(380),1);assert.equal(pager.target,2);
 assert.equal(pager.sample(760),2);assert.equal(pager.moving,false);
 pager.advance(3,800);assert.equal(pager.sample(2000),5);assert.equal(pager.moving,false);
});
test('reversal, category jumps and interruption always finish on whole pages',()=>{
 const pager=new ScenePager();pager.advance(1,0);pager.sample(180);pager.advance(-1,180);
 assert.equal(pager.sample(560),0);assert.equal(pager.moving,false);
 pager.navigate(12,600);assert.equal(pager.sample(980),12);
 pager.advance(1,1000);pager.sample(1100);assert.equal(pager.settle(),13);
 assert.equal(pager.target,13);assert.equal(pager.moving,false);
});
test('mobile swipe thresholds are unchanged',()=>{
 assert.equal(swipePages(20,100,800),0);assert.equal(swipePages(300,300,800),1);
 assert.equal(swipePages(-600,250,800),-2);assert.equal(swipePages(600,800,800),1);
});
test('settling never adds a page for residual momentum near the destination',()=>{
 assert.equal(nativeSnapPage(13.02,60),13);
 assert.equal(nativeSnapPage(12.98,60),13);
 assert.equal(nativeSnapPage(15.8,60),16);
 assert.equal(nativeSnapPage(13,60),13);
});
const animationCode=ts.transpileModule(readFileSync(new URL('../src/NativeSceneAnimator.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText;
const {scenePose,timelineFrames}=await import('data:text/javascript;base64,'+Buffer.from(animationCode).toString('base64'));
test('native timelines cover a complete cycle and keep every resting scene sharp',()=>{
 for(const center of [0,1,20,40,59]){
  const frames=timelineFrames(center,20,d=>scenePose(0,d,false));
  assert.equal(frames[0].offset,0);assert.equal(frames.at(-1).offset,1);
  assert.ok(frames.every((frame,i)=>!i||frame.offset>frames[i-1].offset));
  const resting=frames.find(f=>Math.abs(f.offset-center/59)<1e-8);
  assert.equal(resting.opacity,1);assert.equal(resting.filter,'blur(0px) brightness(1)');
 }
});
