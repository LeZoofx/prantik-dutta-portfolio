import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {asset,previewAsset,type Project} from './content';
import {usePerformance,useVideoPermit} from './Performance';
import {requestVideoConsent,useVideoConsent} from './videoConsent';
import {playerAPI} from './JourneyPlayer';
import InstagramPlayer from './InstagramPlayer';
import annotationData from '../content/ai-annotations.json';
import {activeCues,cueRange,markerLanes,timecode,type AIAnnotation,type AICue} from './aiWork';
import './ai-player.css';
type Props={project:Project;preview?:boolean;enabled?:boolean;playing?:boolean;muted?:boolean;onOpen?:()=>void};
const annotations=annotationData as Record<string,AIAnnotation>;

function AINote({annotation,time,duration,playing,small=false}:{annotation:AIAnnotation;time:number;duration:number;playing:boolean;small?:boolean}){
 const [open,setOpen]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),held=useRef(false);
 const cues=activeCues(annotation.cues,time,duration),primary=cues.find(c=>c.kind==='transition')||cues.find(c=>c.title.includes('Photorealism'))||cues[cues.length-1];
 const key=cues.map(c=>c.start+':'+c.title).join('|'),title=primary?.title||annotation.label;
 const detail=[...new Set(cues.map(c=>c.detail))].join(' ')||annotation.description;
 function close(){clearTimeout(timer.current);setOpen(false)}
 function reveal(){clearTimeout(timer.current);setOpen(true);timer.current=setTimeout(()=>{if(!held.current)setOpen(false)},6500)}
 useEffect(()=>{if(!playing){close();return}if(!small)reveal();return()=>clearTimeout(timer.current)},[key,playing,small]);
 if(!playing)return null;
 return <aside className={'ai-note'+(small?' ai-note-small':'')} data-kind={primary?.kind||'ai'} aria-label="AI production notes" onPointerEnter={()=>{held.current=true;reveal()}} onPointerLeave={()=>{held.current=false;clearTimeout(timer.current);timer.current=setTimeout(()=>setOpen(false),1800)}} onFocus={()=>{held.current=true;reveal()}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){held.current=false;close()}}} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close()}}}>
  <button className="ai-note-trigger" aria-expanded={open} onClick={e=>{e.stopPropagation();open?close():reveal()}}><span aria-hidden="true">✳</span>{small?'AI work':title}<span aria-hidden="true">{open?'−':'+'}</span></button>
  {open&&<div className="ai-note-panel"><button className="ai-note-close" aria-label="Close AI note" onClick={e=>{e.stopPropagation();held.current=false;close()}}>×</button>{!small&&<span className="ai-note-kicker">{primary?cueRange(primary):'PRODUCTION NOTE'}</span>}<strong>{title}</strong><p hidden={small}>{detail}</p></div>}
 </aside>;
}

function NativePlayer({project,preview=false,enabled=false,playing:wantPlay=false,muted=false}:Props){
 const annotation=annotations[project.id],root=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),pending=useRef<number|null>(null);
 const {playbackReady}=usePerformance(),permitted=useVideoPermit(preview&&enabled&&wantPlay),[requested,setRequested]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(project.duration||0),[silent,setSilent]=useState(preview||muted),[failed,setFailed]=useState(false),[buffering,setBuffering]=useState(false),[hover,setHover]=useState<AICue|null>(null);
 const sourceReady=preview?permitted:requested;
 const source=sourceReady?asset(project.videoSource):undefined;
 useEffect(()=>{const el=video.current;if(!el)return;el.pause();setRequested(false);setPlaying(false);setTime(0);setDuration(project.duration||0);setBuffering(false);pending.current=null;return()=>{el.pause();el.removeAttribute('src');el.load()}},[project.id]);
 useEffect(()=>{const el=video.current;if(!el||!preview)return;if(sourceReady&&wantPlay&&playbackReady&&!document.hidden)void el.play().catch(()=>{});else el.pause();if(!sourceReady){el.removeAttribute('src');el.load()}},[sourceReady,wantPlay,playbackReady,preview]);
 useEffect(()=>{if(preview&&video.current)video.current.muted=muted},[preview,muted]);
 useEffect(()=>{const hide=()=>{if(document.hidden)video.current?.pause()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 function start(at?:number){const el=video.current;if(!el)return;setFailed(false);setBuffering(true);if(!sourceReady){setRequested(true);el.src=asset(project.videoSource);el.load()}if(at!==undefined){pending.current=at;if(el.readyState>=1){el.currentTime=Math.min(at,Math.max(0,el.duration-.05));pending.current=null}}void el.play().catch(()=>{setPlaying(false);setBuffering(false)})}
 function seek(at:number){setHover(null);start(at)}
 function metadata(){const el=video.current!;setDuration(el.duration);if(pending.current!==null){el.currentTime=Math.min(pending.current,el.duration-.05);pending.current=null}}
 const lanes=markerLanes(annotation.cues,Math.max(duration,annotation.cues[annotation.cues.length-1].end||annotation.cues[annotation.cues.length-1].start+20));
 return <div ref={root} className={'ai-player'+(preview?' ai-preview':'')}>
  <div className="ai-picture"><video ref={video} src={preview?source:undefined} poster={previewAsset(project.poster,960)} preload="none" playsInline muted={preview?muted:silent} onLoadedMetadata={metadata} onTimeUpdate={e=>setTime(Math.floor(e.currentTarget.currentTime*4)/4)} onPlay={()=>setPlaying(true)} onWaiting={()=>setBuffering(true)} onPlaying={()=>{setBuffering(false);setPlaying(true);root.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}))}} onPause={()=>setPlaying(false)} onEnded={()=>{if(preview&&wantPlay){video.current!.currentTime=0;void video.current!.play().catch(()=>{})}else setPlaying(false)}} onError={()=>{if(sourceReady){setBuffering(false);setFailed(true)}}} onClick={()=>{if(!preview){playing?video.current?.pause():start()}}} aria-label={project.title}/>
   {!preview&&!playing&&!buffering&&!failed&&<button className="ai-big-play" onClick={()=>start()} aria-label={'Play '+project.title}>▶</button>}
   <AINote annotation={annotation} time={time} duration={duration||Infinity} playing={playing&&!buffering} small={preview}/>
   {sourceReady&&buffering&&<span className="ai-buffering" role="status">Loading video…</span>}
   {failed&&<div className="ai-playback-error"><span>Playback is unavailable.</span><button onClick={()=>start()}>Try again</button><a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Open original video ↗</a></div>}
  </div>
  {!preview&&<div className="ai-controls" onKeyDown={e=>{if(e.key==='Escape'){setHover(null);e.currentTarget.querySelector('details[open]')?.removeAttribute('open')}}}>
   <div className="ai-timeline" style={{'--marker-lanes':Math.max(...lanes.map(x=>x.lane))+1} as CSSProperties}>
    <input type="range" min="0" max={duration||1} step="0.1" value={Math.min(time,duration||1)} disabled={!duration} aria-label="Video position" aria-valuetext={timecode(time)+' of '+timecode(duration)} onChange={e=>{const t=Number(e.target.value);if(!sourceReady){seek(t);return}if(video.current)video.current.currentTime=t;setTime(t)}}/>
    <div className="ai-timeline-markers" aria-label="Jump to production moments">{lanes.map(({cue,x,lane})=><button key={cue.start+cue.title} className={'ai-marker marker-'+cue.kind} style={{left:x+'%','--marker-lane':lane} as CSSProperties} aria-label={'Jump to '+cueRange(cue)+': '+cue.title} onPointerEnter={()=>setHover(cue)} onPointerLeave={()=>setHover(null)} onFocus={()=>setHover(cue)} onBlur={()=>setHover(null)} onClick={()=>seek(cue.start)}><span aria-hidden="true"/></button>)}</div>
    {hover&&<div className="ai-chapter-tooltip" role="tooltip" style={{left:Math.max(10,Math.min(90,hover.start/Math.max(1,duration)*100))+'%'}}><b>{cueRange(hover)} · {hover.title}</b><span>{hover.detail}</span><small>Click to jump</small></div>}
   </div>
   <div className="ai-control-row"><button aria-label={playing?'Pause video':'Play video'} onClick={()=>playing?video.current?.pause():start()}>{playing?'Ⅱ':'▶'}</button><button aria-label={silent?'Unmute video':'Mute video'} onClick={()=>setSilent(!silent)}>{silent?'Sound off':'Sound on'}</button><span className="ai-clock">{timecode(time)} / {timecode(duration)}</span><details className="ai-chapter-list"><summary>AI breakdown <span aria-hidden="true">＋</span></summary><div><p>Choose a chapter to jump to that moment.</p>{annotation.cues.map(c=><button key={c.start+c.title} onClick={e=>{seek(c.start);e.currentTarget.closest('details')?.removeAttribute('open')}}><span>{cueRange(c)}</span><strong>{c.title}</strong><small>{c.detail}</small></button>)}</div></details></div>
  </div>}
 </div>;
}

function YouTubePlayer({project,preview=false,enabled=false,playing:wantPlay=false,muted=false}:Props){
 const {allowed}=useVideoConsent(),{playbackReady}=usePerformance(),permit=useVideoPermit(preview&&enabled&&wantPlay),host=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null),player=useRef<InstanceType<NonNullable<Window['YT']>['Player']>|null>(null),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const wanted=useRef({wantPlay,muted,playbackReady});wanted.current={wantPlay,muted,playbackReady};
 const admitted=preview?permit:allowed,id=project.embedUrl?.match(/embed\/([\w-]{11})/)?.[1];
 useEffect(()=>{if(!admitted||!id)return;let disposed=false;playerAPI().then(()=>{if(disposed||!host.current||!window.YT)return;const mount=document.createElement('div');host.current.replaceChildren(mount);player.current=new window.YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{autoplay:0,playsinline:1,controls:preview?0:1,rel:0,cc_load_policy:preview?0:1,origin:location.origin},events:{onReady:()=>{const p=player.current;if(!p||disposed)return;if(wanted.current.muted||preview)p.mute();else p.unMute();if(!document.hidden&&(!preview||(wanted.current.wantPlay&&wanted.current.playbackReady)))p.playVideo()},onStateChange:(event:{data:number})=>{if(disposed)return;setPlaying(event.data===1);if(event.data===1)root.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}));if(event.data===0&&preview&&wanted.current.wantPlay){player.current?.seekTo(0,true);player.current?.playVideo()}},onError:()=>!disposed&&setFailed(true)}})}).catch(()=>!disposed&&setFailed(true));return()=>{disposed=true;player.current?.destroy();player.current=null;setPlaying(false)}},[admitted,id,preview]);
 useEffect(()=>{if(!preview)return;if(wantPlay&&playbackReady&&!document.hidden)player.current?.playVideo();else player.current?.pauseVideo()},[wantPlay,playbackReady,preview]);
 useEffect(()=>{muted?player.current?.mute():player.current?.unMute()},[muted]);
 useEffect(()=>{const hide=()=>{if(document.hidden)player.current?.pauseVideo()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 return <div ref={root} className={'ai-provider-player'+(preview?' ai-preview':'')}><img className="ai-provider-poster" src={previewAsset(project.poster,960)} alt=""/><div className="ai-provider-host" ref={host}/>{!admitted&&!preview&&<button className="ai-big-play" aria-label={'Play '+project.title} onClick={()=>{void requestVideoConsent()}}>▶</button>}<AINote annotation={annotations[project.id]} time={0} duration={Infinity} playing={playing} small={preview}/>{failed&&<a className="ai-provider-fallback" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Open video on YouTube ↗</a>}</div>;
}
function InstagramAnnotated(props:Props){
 const [loaded,setLoaded]=useState(false),{allowed}=useVideoConsent();
 return <div className={'ai-provider-player'+(props.preview?' ai-preview':'')} onLoadCapture={e=>{if((e.target as HTMLElement).tagName==='IFRAME')setLoaded(true)}}><InstagramPlayer project={props.project} enabled={!!props.enabled} playing={!props.preview||!!props.playing} explicit={!props.preview} onOpen={props.onOpen}/><AINote annotation={annotations[props.project.id]} time={0} duration={Infinity} playing={loaded&&allowed&&(!props.preview||!!props.playing)} small={props.preview}/></div>;
}
export default function AIPlayer(props:Props){return props.project.videoSource?<NativePlayer {...props}/>:props.project.provider==='instagram'?<InstagramAnnotated {...props}/>:<YouTubePlayer {...props}/>;}
