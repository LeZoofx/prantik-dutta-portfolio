import snapshot from '../content/video-metrics.json';
import positioning from '../content/positioning.json';
export const videoMetrics=[...new Map(snapshot.videos.map(v=>[v.videoId,v])).values()];
export const totalViews=videoMetrics.reduce((n,v)=>n+v.views,0);
export const channels=[...new Map(videoMetrics.map(v=>[v.channelId,{id:v.channelId,name:v.channel}])).values()];
export const compactViews=(n:number)=>n>=1e6?(Math.floor(n/1e5)/10).toFixed(1)+'M+':n>=1e3?Math.floor(n/1e3)+'K+':String(n);
export const metricFor=(id:string)=>videoMetrics.find(v=>v.projectId===id);
const featuredCareer=[['Creator Engine','30-second retention'],['Trunativ','Campaign ROAS'],['Sorted','Paid-campaign CAC'],['BuzzFeed','Average view duration'],['OML','Post-production budget saved']].flatMap(([brand,label])=>positioning.statistics.filter(s=>s.brand===brand&&s.label===label));
export const marketingStatistics=[
 {value:compactViews(totalViews),label:'Combined video views',brand:'Linked YouTube work',detail:snapshot.method},
 ...featuredCareer,
 {value:String(channels.length),label:'Channels featuring the work',brand:'YouTube',detail:'Distinct publishing channels across verified linked uploads. This is not a claim of channel ownership or management.'},
 ...positioning.statistics.slice(0,2).filter(s=>!featuredCareer.includes(s)),
 ...[...videoMetrics].sort((a,b)=>b.views-a.views).slice(0,7).map(v=>({value:compactViews(v.views),label:v.title.split(' | ')[0].replace(/\s*\(Official Trailer\)/i,''),brand:v.channel,detail:'Public YouTube view count checked '+new Date(v.checkedAt).toISOString().slice(0,10),source:v.url})),
 ...positioning.statistics.slice(2).filter(s=>!featuredCareer.includes(s))
];
