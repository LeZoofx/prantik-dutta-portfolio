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
const added=['social-short-format-02','social-short-format-11','brands-03','brands-22'];
test('Highlights keeps the original opening and includes exactly two more shorts and two more campaigns',()=>{
 const items=buildSections(projects).filter(s=>s.category==='selected').flatMap(s=>s.items);
 assert.deepEqual(items.slice(0,6).map(p=>p.id),['videos-03','social-01','videos-04','stand-up-events-03','brands-15','social-short-format-06']);
 assert.deepEqual(items.slice(6).map(p=>p.id),added);
 assert.deepEqual(items.slice(6).map(p=>p.category),['short-form','short-form','brands','brands']);
});
test('desktop and mobile retain their existing scene limits and every archive project',()=>{
 for(const size of [3,6]){
  const sections=buildSections(projects,'curated','all',size);
  assert.ok(sections.every(s=>s.items.length<=size));
  assert.deepEqual(sections.filter(s=>s.category==='selected').flatMap(s=>s.items).slice(6).map(p=>p.id),added);
  const archive=sections.filter(s=>s.category!=='selected').flatMap(s=>s.items);
  assert.equal(archive.length,projects.length);
  assert.deepEqual(new Set(archive.map(p=>p.id)),new Set(projects.map(p=>p.id)));
 }
});
test('brand filtering includes added Highlights without leaking other brands',()=>{
 const sections=buildSections(projects,'curated','OnePlus');
 assert.deepEqual(sections.filter(s=>s.category==='selected').flatMap(s=>s.items).map(p=>p.id),['brands-22']);
});
