import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(id=>{const value=load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts'));return id.endsWith('.json')?{default:value}:value},module,module.exports);
 return module.exports;
}
const {buildSections}=load(path.resolve('src/portfolioSections.ts'));
const {orbitPeriod,queuedFrames}=load(path.resolve('src/frameQueue.ts'));
const projects=load(path.resolve('content/projects.json'));
const added=['social-short-format-02','social-short-format-11','brands-03','brands-22'];
test('Highlights keeps the original opening and includes exactly two more shorts and two more campaigns',()=>{
 const sections=buildSections(projects).filter(s=>s.category==='selected');
 assert.equal(sections.length,1,'The added videos must not create another desktop page');
 const items=sections[0].orbitItems;
 assert.deepEqual(sections[0].items.map(p=>p.id),['videos-03','social-01','videos-04','stand-up-events-03','brands-15','social-short-format-06']);
 assert.deepEqual(items.slice(6).map(p=>p.id),added);
 assert.deepEqual(items.slice(6).map(p=>p.category),['short-form','short-form','brands','brands']);
});
test('desktop and mobile retain the original Highlights pages, frame limits and every archive project',()=>{
 for(const size of [3,6]){
  const sections=buildSections(projects,'curated','all',size);
  assert.ok(sections.every(s=>s.items.length<=size));
  const highlights=sections.filter(s=>s.category==='selected');
  assert.equal(highlights.length,6/size);
  assert.deepEqual(new Set(highlights.flatMap(s=>s.orbitItems.slice(s.items.length)).map(p=>p.id)),new Set(added));
  const archive=sections.filter(s=>s.category!=='selected').flatMap(s=>s.items);
  assert.equal(archive.length,projects.length);
  assert.deepEqual(new Set(archive.map(p=>p.id)),new Set(projects.map(p=>p.id)));
 }
});
test('brand filtering includes added Highlights without leaking other brands',()=>{
 const sections=buildSections(projects,'curated','OnePlus');
 assert.deepEqual(sections.filter(s=>s.category==='selected').flatMap(s=>s.items).map(p=>p.id),['brands-22']);
});
test('each added video reaches the focal frame on the same page without more mounted frames',()=>{
 for(const size of [3,6])for(const section of buildSections(projects,'curated','all',size).filter(s=>s.category==='selected')){
  const frames=section.items,pool=section.orbitItems,period=orbitPeriod(frames.length,pool.length),seen=new Set();
  for(let step=0;step<period;step++){
   const visible=queuedFrames(frames,pool,step);
   assert.equal(visible.length,size);
   assert.equal(new Set(visible.map(p=>p.id)).size,size);
   assert.equal(visible[step%size].id,pool[step%pool.length].id);
   seen.add(visible[step%size].id);
  }
  assert.deepEqual(seen,new Set(pool.map(p=>p.id)));
  assert.deepEqual(queuedFrames(frames,pool,period),queuedFrames(frames,pool,0));
 }
});
test('ordinary scenes keep their original frame contents throughout every rotation',()=>{
 for(const section of buildSections(projects).filter(s=>s.category!=='selected'))for(let step=0;step<section.items.length;step++){
  assert.equal(orbitPeriod(section.items.length,section.items.length),section.items.length);
  assert.deepEqual(queuedFrames(section.items,undefined,step),section.items);
 }
});
