import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {validateCampaignFiles,validateCampaigns} from '../scripts/validate-campaigns.mjs';
function load(file){
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const m={exports:{}};
 new Function('require','module','exports',code)(id=>{const v=load(path.resolve(path.dirname(file),id)+(id.endsWith('.json')?'':'.ts'));return id.endsWith('.json')?{default:v}:v},m,m.exports);
 return m.exports;
}
const {campaigns,campaignItems,campaignPreviews,filterCampaigns}=load(path.resolve('src/campaigns.ts'));
const {buildSections}=load(path.resolve('src/portfolioSections.ts'));
const projects=JSON.parse(readFileSync('content/projects.json','utf8'));
test('the complete campaign catalogue resolves every asset and source',()=>{assert.equal(validateCampaignFiles().collections,26)});
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
test('all non-campaign chapters preserve the previous items, layouts, art and themes',()=>{
 const baseline=JSON.parse(readFileSync('tests/fixtures/non-campaign-sections.json','utf8'));
 for(const size of [3,6])assert.deepEqual(buildSections(projects,'curated','all',size).filter(s=>s.category!=='brands').map(s=>({id:s.id,layout:s.layout,art:s.art,theme:s.theme,items:s.items.map(p=>p.id)})),baseline[size]);
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
