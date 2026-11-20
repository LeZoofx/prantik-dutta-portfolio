import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const catalogue=JSON.parse(readFileSync(new URL('content/process-artefacts.json',root),'utf8'));
const projects=JSON.parse(readFileSync(new URL('content/projects.json',root),'utf8'));
const campaigns=JSON.parse(readFileSync(new URL('content/campaigns.json',root),'utf8'));
const assets=JSON.parse(readFileSync(new URL('content/campaign-assets.json',root),'utf8'));
const projectIds=new Set([...projects,...campaigns,...assets].map(p=>p.id));
test('every production artefact resolves to a valid project and deployable asset',()=>{
 assert.ok(catalogue.length>250);
 assert.equal(new Set(catalogue.map(a=>a.id)).size,catalogue.length);
 const referenced=new Set();
 for(const item of catalogue){
  assert.ok(item.width>0&&item.height>0,item.id);
  assert.ok(item.projectIds.length&&item.projectIds.every(id=>projectIds.has(id)),item.id);
  for(const path of [item.src,item.preview]){
   assert.match(path,/^media\/process\/artefacts\/[a-f0-9]+(?:-small)?\.(?:webp|svg)$/);
   assert.ok(existsSync(new URL('public/'+path,root)),path);referenced.add(path.split('/').pop());
  }
 }
 assert.deepEqual(new Set(readdirSync(new URL('public/media/process/artefacts/',root))),referenced);
});
test('public catalogue omits private workflow and provenance data',()=>{
 const text=JSON.stringify(catalogue);
 assert.doesNotMatch(text,/\/Users\/|\/private\/|https?:|prompt|seed|api.?key|job.?id/i);
 for(const item of catalogue)assert.deepEqual(Object.keys(item).sort(),['id','src','preview','caption','kind','group','projectIds','width','height'].sort());
});
test('published vector artwork contains no executable or remote references',()=>{
 for(const item of catalogue.filter(a=>a.src.endsWith('.svg'))){
  const svg=readFileSync(new URL('public/'+item.src,root),'utf8');
  assert.doesNotMatch(svg,/<script|<foreignObject|\son\w+\s*=|javascript:|(?:href|src)\s*=\s*["'](?:https?:|file:)/i,item.src);
 }
});
