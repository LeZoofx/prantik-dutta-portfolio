import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
const collection=JSON.parse(readFileSync('content/ai-collection.json','utf8'));
const annotations=JSON.parse(readFileSync('content/ai-annotations.json','utf8'));
const projects=JSON.parse(readFileSync('content/projects.json','utf8'));
const source=readFileSync('src/aiWork.ts','utf8').replace("import collection from '../content/ai-collection.json';",'const collection='+JSON.stringify(collection)+';');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText;
const {activeCues}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function load(file){
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(id=>{const v=load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts'));return id.endsWith('.json')?{default:v}:v},module,module.exports);
 return module.exports;
}
const {buildSections}=load(path.resolve('src/portfolioSections.ts'));
test('AI adds one desktop scene; existing scenes retain their order, layouts and content',()=>{
 for(const size of [3,6]){
  const original=buildSections(projects.filter(p=>!p.id.startsWith('ai-')||p.id==='ai-original-ad'),'curated','all',size).filter(s=>s.category!=='ai');
  const next=buildSections(projects,'curated','all',size),existing=next.filter(s=>s.category!=='ai');
  assert.deepEqual(existing.map(s=>[s.id,s.layout,s.art,s.theme]),original.map(s=>[s.id,s.layout,s.art,s.theme]));
  for(let i=0;i<original.length;i++)assert.deepEqual(existing[i].items.filter(p=>!p.id.startsWith('ai-')||p.id==='ai-original-ad').map(p=>p.id),original[i].items.map(p=>p.id));
  const ai=next.filter(s=>s.category==='ai');
  assert.deepEqual(ai.flatMap(s=>s.items).map(p=>p.id),collection);
  if(size===6)assert.equal(ai.length,1);
  else assert.deepEqual(ai[0].items.map(p=>p.id),collection.slice(0,3));
 }
});
test('AI hierarchy features the original ad first and preserves the requested ordering, without duplicating archive records',()=>{
 assert.deepEqual(collection.slice(0,5),['ai-original-ad','ai-sheldon','ai-eric-schiffer','social-short-format-02','social-short-format-01']);
 assert.deepEqual(collection.slice(-3),['ai-character-motion','social-short-format-03','social-short-format-11']);
 assert.equal(new Set(collection).size,collection.length);
 for(const id of collection){assert.equal(projects.filter(p=>p.id===id).length,1);assert.ok(annotations[id])}
 for(const id of ['ai-character-motion','social-short-format-03'])assert.equal(projects.find(p=>p.id===id).category,'short-form');
});
test('Jaquar AI labels exclude the entire 0:14–0:43 reference passage',()=>{
 const cues=annotations['social-short-format-02'].cues;
 assert.equal(activeCues(cues,13.99,82.233)[0].kind,'ai');
 for(const time of [14,28,42.999])assert.equal(activeCues(cues,time,82.233)[0].kind,'reference');
 assert.equal(activeCues(cues,43,82.233)[0].kind,'ai');
});
test('The Product Report labels distinguish filmed reference and the 4:22 AI-to-camera cut',()=>{
 const cues=annotations['ai-sheldon'].cues;
 for(const time of [8,35,70,90,107,120,145,175,230,261.99])assert.ok(activeCues(cues,time,294.208).some(c=>c.kind==='ai'));
 for(const time of [58,128,160,190,270,290]){const active=activeCues(cues,time,294.208);assert.ok(active.some(c=>c.kind==='real'));assert.ok(!active.some(c=>c.kind==='ai'))}
 assert.ok(activeCues(cues,262,294.208).some(c=>c.kind==='transition'));
 assert.ok(!activeCues(cues,262,294.208).some(c=>c.kind==='ai'));
});
test('Eric retains overlapping work notes and the photorealism highlight',()=>{
 const cues=annotations['ai-eric-schiffer'].cues;
 assert.equal(activeCues(cues,270,333.483).length,2);
 assert.ok(activeCues(cues,303.5,333.483).some(c=>c.title==='Photorealism highlight'));
 assert.ok(activeCues(cues,303.5,333.483).some(c=>c.title==='AI shots, characters & VFX'));
 assert.equal(activeCues(cues,329,333.483).length,0);
 assert.equal(activeCues(cues,37,333.483)[0].start,37);
 assert.equal(activeCues(cues,42,333.483).length,0);
});
