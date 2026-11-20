import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/processRail.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {advanceRail,readingHold}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('a new page scrolls upwards through the existing stream without snapping to its start',()=>{
 let state={offset:150,hold:0,transition:{from:150,to:900,elapsed:0}},last=150,settled=false;
 for(let i=0;i<9;i++){
  const next=advanceRail(state,80,1300,12,7000);
  assert.ok(next.progress.offset>=last);assert.ok(next.progress.offset<=900);
  if(i===0)assert.ok(next.progress.offset>150&&next.progress.offset<900);
  last=next.progress.offset;state=next.progress;settled=next.settled;
 }
 assert.equal(last,900);assert.equal(settled,true);
});
test('deeper material waits until the compact pass is finished and the end has been read',()=>{
 let state={offset:0,hold:0};
 for(let i=0;i<100;i++){
  const next=advanceRail(state,80,100,20,6500);state=next.progress;
  assert.equal(next.reveal,false);
 }
 let revealed=false;
 for(let i=0;i<100&&!revealed;i++){
  const next=advanceRail(state,80,100,20,6500);state=next.progress;revealed=next.reveal;
 }
 assert.equal(revealed,true);assert.equal(state.offset,100);
});
test('a resized viewport uses its new reading limit and an idle tab cannot skip a whole pass',()=>{
 const next=advanceRail({offset:100,hold:0},120000,200,10,6500);
 assert.ok(next.progress.offset<101);assert.equal(next.reveal,false);
 assert.equal(readingHold(1),6500);assert.equal(readingHold(1000),18000);
});
