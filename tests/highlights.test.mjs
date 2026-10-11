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
const projects=load(path.resolve('content/projects.json'));
const added=['social-short-format-02','brands-04','brands-03','brands-07'];
test('Highlights keeps its frame hierarchy with the three requested video swaps',()=>{
 const sections=buildSections(projects).filter(s=>s.category==='selected');
 assert.equal(sections.length,1,'The added videos must not create another desktop page');
 const items=sections[0].items;
 assert.deepEqual(items.slice(0,6).map(p=>p.id),['videos-03','social-01','videos-04','stand-up-events-03','brands-01','social-short-format-06']);
 assert.deepEqual(items.slice(6).map(p=>p.id),added);
 assert.deepEqual(items.slice(6).map(p=>p.category),['short-form','brands','brands','brands']);
});
test('desktop and mobile add frames on the original Highlights pages and keep every archive project',()=>{
 for(const size of [3,6]){
  const sections=buildSections(projects,'curated','all',size);
  assert.ok(sections.filter(s=>s.category!=='selected').every(s=>s.items.length<=size));
  const highlights=sections.filter(s=>s.category==='selected');
  assert.equal(highlights.length,6/size);
  assert.deepEqual(new Set(highlights.flatMap(s=>s.items.slice(size)).map(p=>p.id)),new Set(added));
  const archive=sections.filter(s=>s.category!=='selected').flatMap(s=>s.items);
  assert.equal(archive.length,projects.length);
  assert.deepEqual(new Set(archive.map(p=>p.id)),new Set(projects.map(p=>p.id)));
 }
});
test('brand filtering includes added Highlights without leaking other brands',()=>{
 const sections=buildSections(projects,'curated','Lollapalooza');
 assert.deepEqual(sections.filter(s=>s.category==='selected').flatMap(s=>s.items).map(p=>p.id),['brands-07']);
});
test('all existing and added videos remain mounted throughout the same-page rotation',()=>{
 for(const size of [3,6])for(const section of buildSections(projects,'curated','all',size).filter(s=>s.category==='selected')){
  assert.equal(section.items.length,size===6?10:5);
  const expected=new Set(section.items.map(p=>p.id)),focal=new Set();
  for(let turn=0;turn<section.items.length;turn++){
   const slots=section.items.map((p,i)=>({id:p.id,slot:((i-turn)%section.items.length+section.items.length)%section.items.length}));
   assert.deepEqual(new Set(slots.map(p=>p.id)),expected);
   assert.equal(new Set(slots.map(p=>p.slot)).size,section.items.length);
   focal.add(slots.find(p=>p.slot===0).id);
  }
  assert.deepEqual(focal,expected);
 }
});
