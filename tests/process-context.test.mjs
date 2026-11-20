import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=name=>JSON.parse(readFileSync(new URL('../content/'+name+'.json',import.meta.url),'utf8'));
const steps=read('creative-process'),profiles=read('process-contexts'),campaigns=read('campaigns'),projects=read('projects'),sources=read('process-library-sources'),artefacts=read('process-artefacts');
let code=ts.transpileModule(readFileSync(new URL('../src/processContext.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
for(const [name,value] of Object.entries({steps,profiles,campaigns,artefacts}))code=code.replace(new RegExp('import '+name+' from [^;]+;'),'const '+name+'='+JSON.stringify(value)+';');
const {processForPage,processPagePlan,artefactsForProjects}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
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

test('the first pass gives every visible work one compact entry with full detail available on open',()=>{
 const section=page(['ai-kofuku-the-report','ai-kofuku-strangers-email','ai-original-ad']);
 const plan=processPagePlan(section);
 assert.equal(plan.primary.length,3);
 assert.equal(new Set(plan.primary.map(c=>c.id)).size,3);
 assert.ok(plan.primary.every(c=>c.expanded.length>=3));
 assert.ok(plan.additional.length>0);
 assert.equal(new Set(plan.additional.map(c=>c.id+':'+c.brand)).size,plan.additional.length);
});
test('shared deeper themes are not repeated for every video in the same channel',()=>{
 const plan=processPagePlan(page(['social-01','social-03'],'youtube'));
 assert.equal(plan.primary.length,2);
 assert.equal(plan.additional.length,3);
 assert.ok(plan.additional.every(c=>c.projectIds.length===2));
});
test('film thumbnails appear in the first pass only and artefact peeks do not repeat',()=>{
 const plan=processPagePlan(page(['ai-kofuku-the-report','ai-kofuku-strangers-email','ai-original-ad']));
 assert.ok(plan.primary.every(c=>c.showThumbnail&&c.preview));
 assert.ok(plan.additional.every(c=>!c.showThumbnail&&!c.preview));
 const ids=[...plan.primary,...plan.additional].flatMap(c=>c.artifactIds);
 assert.equal(ids.length,new Set(ids).size);
});
test('the original film opens its own character studies and edit evidence',()=>{
 const items=artefactsForProjects(['ai-original-ad']);
 assert.equal(items.length,4);
 assert.ok(items.every(a=>a.group==='Koi nahi aaya'));
 assert.equal(items.filter(a=>a.kind==='Character design').length,3);
 assert.ok(items.some(a=>a.kind==='Edit study'));
 assert.ok(artefactsForProjects(['social-short-format-02']).every(a=>a.group!=='Sorted'));
});
