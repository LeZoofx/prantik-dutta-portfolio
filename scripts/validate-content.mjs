import fs from 'node:fs';
import {validateCampaignFiles} from './validate-campaigns.mjs';
const data=JSON.parse(fs.readFileSync('content/projects.json','utf8'));
const ids=new Set();
for(const p of data){
 if(!/^[a-z0-9-]+$/.test(p.id)||ids.has(p.id))throw Error('Invalid/duplicate project ID: '+p.id);ids.add(p.id);
 if(p.category==='youtube'&&!/(^|\.)youtube\.com$|^youtu\.be$/.test(new URL(p.sourceUrl).hostname))throw Error('YouTube category requires a YouTube source: '+p.id);
 if(p.provider==='instagram'&&!/(^|\.)instagram\.com$/.test(new URL(p.sourceUrl).hostname))throw Error('Instagram provider requires an Instagram source: '+p.id);
 if(!p.title||!['youtube','trailers','short-form','events','brands','ai'].includes(p.category))throw Error('Missing project title/category: '+p.id);
 for(const key of ['sourceUrl','embedUrl']){if(p[key]){const u=new URL(p[key]);if(u.protocol!=='https:')throw Error('HTTPS required: '+p.id);if(key==='embedUrl'&&!['www.youtube.com','www.youtube-nocookie.com','www.instagram.com','drive.google.com'].includes(u.hostname))throw Error('Unsupported embed host: '+p.id);}}
 if(p.videoSource&&!/^video\/[a-z0-9-]+\.mp4$/.test(p.videoSource))throw Error('Invalid video path: '+p.id);
 for(const key of ['poster','image'])if(p[key]&&!/^https:/.test(p[key])&&!fs.existsSync('public/'+p[key]))throw Error('Missing image: '+p[key]);
}
console.log('Validated '+data.length+' projects.');
const campaigns=validateCampaignFiles();
console.log('Validated '+campaigns.collections+' campaign collections and '+campaigns.assets+' linked assets.');

const metrics=JSON.parse(fs.readFileSync('content/video-metrics.json','utf8'));const videoIds=new Set();
for(const metric of metrics.videos){const project=data.find(p=>p.id===metric.projectId);if(!project||project.provider!=='youtube'||metric.url!==project.sourceUrl)throw Error('Metric does not match a linked video: '+metric.projectId);if(!Number.isSafeInteger(metric.views)||metric.views<0||videoIds.has(metric.videoId)||!metric.channelId||!Number.isFinite(Date.parse(metric.checkedAt)))throw Error('Invalid metric snapshot: '+metric.projectId);videoIds.add(metric.videoId)}
