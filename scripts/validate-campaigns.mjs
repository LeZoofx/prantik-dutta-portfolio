import {readFileSync,existsSync} from 'node:fs';
export function validateCampaigns(collections,assets,projects,sources,labels){
 const ids=new Set(projects.map(p=>p.id)),collectionIds=new Set(),assigned=new Set();
 for(const p of assets){
  if(!/^[a-z0-9-]+$/.test(p.id)||ids.has(p.id))throw Error('Duplicate or invalid campaign asset: '+p.id);
  ids.add(p.id);
  if(!p.title||new URL(p.sourceUrl).protocol!=='https:')throw Error('Invalid campaign source: '+p.id);
  for(const key of ['poster','image'])if(p[key]&&!/^https:/.test(p[key])&&(!p[key].startsWith('media/')||!existsSync('public/'+p[key])))throw Error('Missing campaign artwork: '+p.id);
 }
 for(const c of collections){
  if(!/^campaign-[a-z0-9-]+$/.test(c.id)||ids.has(c.id)||collectionIds.has(c.id))throw Error('Invalid campaign collection: '+c.id);
  collectionIds.add(c.id);
  if(!c.title||!c.brand||!c.summary||!c.scope.length||!c.sections.length)throw Error('Incomplete campaign collection: '+c.id);
  const seen=new Set();
  for(const s of c.sections){
   if(!s.title||!s.projectIds.length)throw Error('Empty campaign series: '+c.id);
   for(const id of s.projectIds){if(!ids.has(id)||seen.has(id))throw Error('Unknown or repeated campaign asset: '+id);seen.add(id);assigned.add(id)}
  }
  for(const id of c.evidence)if(!sources[id])throw Error('Unknown campaign evidence: '+id);
 }
 for(const id of Object.keys(labels))if(!ids.has(id))throw Error('Unknown campaign label: '+id);
 for(const p of [...projects.filter(p=>p.category==='brands'),...assets])if(!assigned.has(p.id))throw Error('Campaign asset has no collection: '+p.id);
 return {collections:collections.length,assets:assigned.size};
}
export function validateCampaignFamilies(families,collections){
 const available=new Set(collections.map(c=>c.id)),assigned=new Set(),ids=new Set();
 const styles=new Set(['liquid','baroque','matchbox','pixel','noir','aero','calendar','brutal','anti','curse','sigil','retro']);
 for(const family of families){
  if(!/^[a-z0-9-]+$/.test(family.id)||ids.has(family.id))throw Error('Invalid or repeated campaign family: '+family.id);
  ids.add(family.id);
  if(!family.title||!family.level||!family.summary||!family.copy?.length||!family.collectionIds?.length||!styles.has(family.art)||!Number.isInteger(family.theme)||family.theme<0||family.theme>5)throw Error('Incomplete campaign family: '+family.id);
  for(const id of family.collectionIds){if(!available.has(id)||assigned.has(id))throw Error('Unknown or repeated family collection: '+id);assigned.add(id)}
 }
 for(const id of available)if(!assigned.has(id))throw Error('Campaign collection has no family: '+id);
 return families.length;
}
export function validateCampaignFiles(){
 const read=name=>JSON.parse(readFileSync('content/'+name+'.json','utf8'));
 const collections=read('campaigns'),families=validateCampaignFamilies(read('campaign-families'),collections);
 return {...validateCampaigns(collections,read('campaign-assets'),read('projects'),read('process-library-sources'),read('campaign-labels')),families};
}
