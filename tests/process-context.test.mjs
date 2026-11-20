import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=name=>JSON.parse(readFileSync(new URL('../content/'+name+'.json',import.meta.url),'utf8'));
const steps=read('creative-process'),profiles=read('process-contexts'),campaigns=read('campaigns'),projects=read('projects'),sources=read('process-library-sources');
let code=ts.transpileModule(readFileSync(new URL('../src/processContext.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
for(const [name,value] of Object.entries({steps,profiles,campaigns}))code=code.replace(new RegExp('import '+name+' from [^;]+;'),'const '+name+'='+JSON.stringify(value)+';');
const {processForPage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const page=(ids,category='ai')=>({id:category+'-0',category,items:ids.map(id=>projects.find(p=>p.id===id)||{id,title:id}),title:category});
test('AI film notes use the films on this page without borrowing other campaigns',()=>{
 const cards=processForPage(page(['ai-kofuku-the-report','ai-original-ad']));
 assert.ok(cards.some(c=>c.id.startsWith('kofuku-')));assert.ok(cards.some(c=>c.id.startsWith('pisa-')));
 assert.ok(cards.every(c=>c.evidence.length===0));
 assert.ok(cards.every(c=>c.projectIds.every(id=>['ai-kofuku-the-report','ai-original-ad'].includes(id))));
 assert.ok(!cards.some(c=>c.detail.includes('TruNativ')));
});
test('campaign focus is restricted to collections on the current page',()=>{
 const section=page(['campaign-trunativ','campaign-sorted-consultancy'],'brands');
 const focused=processForPage(section,'campaign-sorted-consultancy');
 assert.ok(focused.length);assert.ok(focused.every(c=>c.id.startsWith('sorted-consultancy-')));
 assert.ok(processForPage(section,'campaign-hizzouse').some(c=>c.id.startsWith('trunativ-')));
});
test('a channel page names only its own channels and retains matching source links',()=>{
 const cards=processForPage(page(['social-01','social-03'],'youtube'));
 assert.ok(cards.length>=3);assert.ok(cards.every(c=>c.brand==='Pero Like'));
 assert.ok(cards.every(c=>c.evidence.every(id=>id==='buzzfeed-playbook'||id==='edit-strategy')));
});
test('the original twelve notes remain intact and every contextual source resolves',()=>{
 assert.equal(processForPage().length,12);
 for(const profile of Object.values(profiles))for(const card of profile.cards){
  assert.ok(steps.some(s=>s.id===card.base));
  for(const id of card.evidence)assert.ok(sources[id],id);
 }
});

test('legacy campaign membership cannot give an AI breakdown unrelated creator notes',()=>{
 const cards=processForPage(page(['social-short-format-02','social-short-format-06']));
 assert.deepEqual(cards.map(c=>c.id),['jaquar-0','viewing-habits-0']);
 assert.ok(cards.every(c=>c.evidence.length===0));
});
