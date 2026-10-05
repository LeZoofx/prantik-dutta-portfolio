import {useEffect,useRef,useState} from 'react';
import {asset,previewAsset,previewSrcSet,type Project} from './content';
import {filmId} from './journeyData';
import InstagramPlayer from './InstagramPlayer';
import {usePerformance,useVideoPermit} from './Performance';
import './journey.css';
type Player={mute:()=>void;unMute:()=>void;playVideo:()=>void;pauseVideo:()=>void;destroy:()=>void;loadVideoById:(id:string)=>void;cueVideoById:(id:string)=>void;seekTo:(n:number,allow:boolean)=>void;getVideoData:()=>{video_id?:string}};
declare global {interface Window {YT?:{Player:new(el:HTMLElement,opts:Record<string,unknown>)=>Player};onYouTubeIframeAPIReady?:()=>void}}
let apiPromise:Promise<void>|undefined;
function playerAPI(){
 if(window.YT?.Player)return Promise.resolve();
 if(!apiPromise)apiPromise=new Promise<void>((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve()};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>{apiPromise=undefined;reject(new Error('Player unavailable'))};document.head.appendChild(script);
 });return apiPromise;
}
function YouTubePlayer({project,enabled,muted,playing,onOpen}:{project:Project;enabled:boolean;muted:boolean;playing:boolean;onOpen:()=>void}){
 const {playbackReady}=usePerformance();
 playing=playing&&playbackReady;
 const host=useRef<HTMLDivElement>(null),player=useRef<Player|null>(null),ready=useRef(false),latest=useRef({project,muted,playing});latest.current={project,muted,playing};
 const [status,setStatus]=useState<'poster'|'loading'|'playing'|'blocked'>('poster');
 const [requested,setRequested]=useState(false),currentId=useRef(''),timeout=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const id=filmId(project),allowed=useVideoPermit((enabled||requested)&&!!id);
 function startDeadline(){clearTimeout(timeout.current);timeout.current=setTimeout(()=>setStatus(s=>s==='playing'?s:'blocked'),10000)}
 useEffect(()=>{
  if(!allowed){setStatus('poster');return}
  let disposed=false;ready.current=false;setStatus('loading');
  const create=()=>{
   if(disposed||player.current||!host.current||!window.YT||document.hidden||document.documentElement.classList.contains('is-scrolling'))return;
   if(latest.current.playing)startDeadline();
   const mount=document.createElement('div');host.current.replaceChildren(mount);currentId.current=filmId(latest.current.project)||'';
   player.current=new window.YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:currentId.current,playerVars:{autoplay:0,mute:1,playsinline:1,controls:0,rel:0,enablejsapi:1,origin:location.origin},events:{
    onReady:()=>{if(disposed||!player.current)return;ready.current=true;player.current.mute();const wanted=filmId(latest.current.project);if(wanted&&wanted!==currentId.current){currentId.current=wanted;latest.current.playing?player.current.loadVideoById(wanted):player.current.cueVideoById(wanted)}if(latest.current.playing&&!document.hidden)player.current.playVideo();else player.current.pauseVideo()},
    onStateChange:(event:{data:number})=>{if(disposed||!ready.current)return;const actual=player.current?.getVideoData().video_id;if(actual&&actual!==filmId(latest.current.project))return;if(event.data===1){setStatus('playing');clearTimeout(timeout.current);if(!latest.current.playing||document.hidden)player.current?.pauseVideo();else if(!latest.current.muted)player.current?.unMute()}if(event.data===0){player.current?.seekTo(0,true);if(latest.current.playing&&!document.hidden)player.current?.playVideo()}},
    onAutoplayBlocked:()=>!disposed&&setStatus('blocked'),onError:()=>!disposed&&setStatus('blocked')
   }});
  };
  window.addEventListener('portfolio-rest',create);
  playerAPI().then(create).catch(()=>!disposed&&setStatus('blocked'));
  return()=>{disposed=true;window.removeEventListener('portfolio-rest',create);ready.current=false;clearTimeout(timeout.current);player.current?.destroy();player.current=null;host.current?.replaceChildren()};
 },[allowed]);
 useEffect(()=>{if(!id||currentId.current===id)return;setStatus(allowed?'loading':'poster');if(!allowed)return;if(latest.current.playing)startDeadline();const timer=setTimeout(()=>{if(ready.current&&player.current){currentId.current=id;player.current.mute();latest.current.playing?player.current.loadVideoById(id):player.current.cueVideoById(id)}},260);return()=>clearTimeout(timer)},[id,allowed]);
 useEffect(()=>{if(!ready.current)return;if(muted)player.current?.mute();else player.current?.unMute()},[muted,status]);
 useEffect(()=>{if(!ready.current)return;if(playing&&!document.hidden){player.current?.playVideo();if(status!=='playing')startDeadline()}else{clearTimeout(timeout.current);player.current?.pauseVideo()}},[playing]);
 useEffect(()=>{if(status==='playing')host.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}))},[status,playing]);

 function play(){if(status==='blocked'){onOpen();return}setRequested(true);if(ready.current){player.current?.mute();player.current?.playVideo();startDeadline()}}
 return <div className={'journey-picture '+(status==='playing'?'is-playing':'')} data-player-state={status}>
  {project.poster&&<img className="journey-poster" src={previewAsset(project.poster)} srcSet={previewSrcSet(project.poster)} sizes="(max-width:699px) 75vw, 42vw" alt={project.title} loading="lazy" decoding="async"/>}
  {status==='loading'&&playing&&<span className="preview-loading">Loading preview…</span>}
  <div className="journey-player-host" ref={host} aria-hidden="true"/>
  {(status==='poster'||status==='blocked')&&<button className="ambient-play" onClick={id?play:onOpen} aria-label={'Play '+project.title}><span aria-hidden="true">▶</span></button>}
  <button className="film-expand" aria-label={'Expand video: '+project.title} onClick={onOpen}><span aria-hidden="true">⤢</span><span className="expand-label">Expand</span></button>
 </div>;
}

export default function JourneyPlayer(props:{project:Project;enabled:boolean;muted:boolean;playing:boolean;onOpen:()=>void}){return props.project.provider==='instagram'?<InstagramPlayer {...props}/>:<YouTubePlayer {...props}/>;}
