import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {validateCampaignFiles,validateCampaigns,validateCampaignFamilies} from '../scripts/validate-campaigns.mjs';
function load(file){
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const m={exports:{}};
 new Function('require','module','exports',code)(id=>{const v=load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts'));return id.endsWith('.json')?{default:v}:v},m,m.exports);
 return m.exports;
}
const {campaigns,campaignFamilies,campaignItems,campaignPreviews,filterCampaigns,filterCampaignGroups,campaignFamilyFor}=load(path.resolve('src/campaigns.ts'));
const {buildSections}=load(path.resolve('src/portfolioSections.ts'));
const projects=JSON.parse(readFileSync('content/projects.json','utf8'));
test('the complete campaign catalogue resolves every asset and source',()=>{assert.equal(validateCampaignFiles().collections,26)});
test('campaign pages group collections without losing their individual art and families',()=>{
 const groups=filterCampaignGroups();
 assert.deepEqual(groups.map(group=>group.title),['Brand campaigns','Shows & channels','Entertainment','Festivals & live']);
 for(const size of [3,6]){
  const scenes=buildSections(projects,'curated','all',size).filter(s=>s.category==='brands');
  const ids=scenes.flatMap(scene=>scene.items.map(project=>project.id));
  assert.equal(ids.length,26);
  assert.equal(new Set(ids).size,26);
  assert.ok(scenes.every(scene=>scene.items.length>=2&&scene.items.length<=size));
  assert.deepEqual(scenes[0].items.slice(0,3).map(project=>project.id),['campaign-trunativ','campaign-sorted-girl','campaign-sorted-consultancy']);
  assert.equal(scenes[0].title,'Brand campaigns');
  if(size===6)assert.deepEqual(scenes.filter(scene=>scene.groupId==='brands').map(scene=>scene.items.length),[5,5]);
 }
 assert.equal(campaignFamilyFor('campaign-trunativ').art,'matchbox');
 assert.equal(campaignFamilyFor('campaign-sorted-girl').art,'calendar');
 assert.deepEqual(filterCampaignGroups('all','Lateasha').map(group=>[group.id,group.collections.map(c=>c.id)]),[['shows',['campaign-cocoa-butter']]]);
 assert.deepEqual(filterCampaignGroups('Bumble').map(group=>[group.id,group.collections.map(c=>c.id)]),[['brands',['campaign-bumble']]]);
});
test('every newly recovered film appears in YouTube and its campaign without duplicate records',()=>{
 const ids=[...Array.from({length:8},(_,i)=>'campaign-hizzouse-ep'+(i+1)),'nutrition-magnified-bento','nutrition-magnified-food-scandals','nutrition-magnified-momo','campaign-film-everyday-sweet'];
 const assets=JSON.parse(readFileSync('content/campaign-assets.json','utf8'));
 for(const size of [3,6]){
  const youtube=buildSections(projects,'curated','all',size).filter(s=>s.category==='youtube').flatMap(s=>s.items.map(p=>p.id));
  for(const id of ids)assert.equal(youtube.filter(x=>x===id).length,1,id);
 }
 for(const id of ids){
  const matches=projects.filter(p=>p.id===id);assert.equal(matches.length,1);assert.equal(matches[0].provider,'youtube');assert.ok(matches[0].embedUrl.includes('/embed/'));assert.ok(!assets.some(p=>p.id===id));
  assert.equal(campaigns.filter(c=>campaignItems(c).some(p=>p.id===id)).length,1,id);
 }
});
test('every collection has exactly one valid parent family',()=>{
 assert.equal(validateCampaignFamilies(campaignFamilies,campaigns),7);
 const duplicate=structuredClone(campaignFamilies);duplicate[1].collectionIds.push(duplicate[0].collectionIds[0]);
 assert.throws(()=>validateCampaignFamilies(duplicate,campaigns),/Unknown or repeated/);
 const missing=structuredClone(campaignFamilies);missing[0].collectionIds[0]='missing-collection';
 assert.throws(()=>validateCampaignFamilies(missing,campaigns),/Unknown or repeated/);
 assert.throws(()=>validateCampaignFamilies(campaignFamilies.slice(1),campaigns),/has no family/);
});
test('collections cover brand work throughout the archive, including Bumble and skincare',()=>{
 for(const [id,expected] of Object.entries({'campaign-bumble':['brands-20','brands-21'],'campaign-groww':['brands-01','brands-02'],'campaign-venusia':['brands-23','brands-27'],'campaign-mumbai-indians':['brands-15','brands-16','brands-17','brands-18','brands-19'],'campaign-medimix':['brands-24','brands-25','brands-26']}))assert.deepEqual(new Set(campaignItems(campaigns.find(c=>c.id===id)).map(p=>p.id)),new Set(expected));
 const covered=new Set(campaigns.flatMap(c=>campaignItems(c).map(p=>p.id)));
 for(const p of projects.filter(p=>['brands','youtube','trailers'].includes(p.category)))assert.ok(covered.has(p.id),p.id);
});
test('search finds nested campaigns and series inside their channel',()=>{
 assert.deepEqual(filterCampaigns('all','Duplicity').map(c=>c.id),['campaign-cocoa-butter']);
 assert.deepEqual(filterCampaigns('all','Lateasha').map(c=>c.id),['campaign-cocoa-butter']);
 assert.deepEqual(filterCampaigns('all','Lost In Translation').map(c=>c.id),['campaign-tasty']);
 assert.deepEqual(filterCampaigns('Bumble').map(c=>c.id),['campaign-bumble']);
 assert.equal(filterCampaigns('BuzzFeed').length,4);
 assert.equal(filterCampaigns('all','no-such-campaign').length,0);
});
test('visible previews represent separate subgroups and retain original video source URLs',()=>{
 const cocoa=campaigns.find(c=>c.id==='campaign-cocoa-butter');
 assert.deepEqual(campaignPreviews(cocoa).map(p=>p.id),['social-05','social-08','social-18','social-07']);
 for(const c of campaigns)for(const p of campaignItems(c)){const original=projects.find(x=>x.id===p.id);if(original)assert.equal(p.sourceUrl,original.sourceUrl)}
});
test('non-campaign chapters preserve layouts, art and themes with the requested video placements',()=>{
 const baseline=JSON.parse(readFileSync('tests/fixtures/non-campaign-sections.json','utf8'));
 const legacy=new Set(projects.filter(p=>!p.addedToPortfolio||p.id==='ai-original-ad').map(p=>p.id));
 for(const size of [3,6])assert.deepEqual(buildSections(projects,'curated','all',size).filter(s=>s.category!=='brands').map(s=>({...s,items:s.items.filter(p=>legacy.has(p.id))})).filter(s=>s.items.length).map(s=>({id:s.id,layout:s.layout,art:s.art,theme:s.theme,items:s.items.map(p=>p.id)})),baseline[size]);
});
test('broken references cannot pass publication validation',()=>{
 const c=structuredClone(campaigns);c[0].sections[0].projectIds.push('missing-source');
 const read=name=>JSON.parse(readFileSync('content/'+name+'.json','utf8'));
 assert.throws(()=>validateCampaigns(c,read('campaign-assets'),projects,read('process-library-sources'),read('campaign-labels')),/Unknown or repeated/);
});
test('The Product Report keeps its stable ID and media annotations',()=>{
 const p=projects.find(p=>p.id==='ai-sheldon');assert.ok(p.title.startsWith('The Product Report'));assert.equal(p.videoSource,'video/ai-product-report.mp4');
 const notes=JSON.parse(readFileSync('content/ai-annotations.json','utf8'));assert.ok(notes[p.id].cues.some(c=>c.start===262));
});
