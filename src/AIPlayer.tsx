import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import ProductionNotes from './ProductionNotes';
import {asset,previewAsset,type Project} from './content';
import {usePerformance,useVideoPermit} from './Performance';
import {requestVideoConsent,useVideoConsent} from './videoConsent';
import {playerAPI} from './JourneyPlayer';
import InstagramPlayer from './InstagramPlayer';
import annotationData from '../content/ai-annotations.json';
import {activeCues,cueRange,markerLanes,timecode,type AIAnnotation,type AICue} from './aiWork';
import './ai-player.css';
type Props={project:Project;preview?:boolean;enabled?:boolean;playing?:boolean;muted?:boolean;onOpen?:()=>void;notesTarget?:HTMLElement|null};
const annotations=annotationData as Record<string,AIAnnotation>;


function NativePlayer({project,preview=false,enabled=false,playing:wantPlay=false,muted=false,notesTarget}:Props){
 const annotation=annotations[project.id],root=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),pending=useRef<number|null>(null);
 const {playbackReady}=usePerformance(),permitted=useVideoPermit(preview&&enabled&&wantPlay),[requested,setRequested]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(project.duration||0),[silent,setSilent]=useState(preview||muted),[failed,setFailed]=useState(false),[buffering,setBuffering]=useState(false),[notesOpen,setNotesOpen]=useState(false),[selectedNote,setSelectedNote]=useState<AICue|undefined>(undefined);
 const sourceReady=preview?permitted:requested;
 const source=sourceReady?asset(project.videoSource):undefined;
 useEffect(()=>{const el=video.current;if(!el)return;el.pause();setRequested(false);setPlaying(false);setTime(0);setDuration(project.duration||0);setBuffering(false);setNotesOpen(false);setSelectedNote(undefined);pending.current=null;return()=>{el.pause();el.removeAttribute('src');el.load()}},[project.id]);
 useEffect(()=>{const el=video.current;if(!el||!preview)return;if(sourceReady&&wantPlay&&playbackReady&&!document.hidden)void el.play().catch(()=>{});else el.pause();if(!sourceReady){el.removeAttribute('src');el.load()}},[sourceReady,wantPlay,playbackReady,preview]);
 useEffect(()=>{if(preview&&video.current)video.current.muted=muted},[preview,muted]);
 useEffect(()=>{const hide=()=>{if(document.hidden)video.current?.pause()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 function start(at?:number){const el=video.current;if(!el)return;setFailed(false);setBuffering(true);if(!sourceReady){setRequested(true);el.src=asset(project.videoSource);el.load()}if(at!==undefined){pending.current=at;if(el.readyState>=1){el.currentTime=Math.min(at,Math.max(0,el.duration-.05));pending.current=null}}void el.play().catch(()=>{setPlaying(false);setBuffering(false)})}
 function selectNote(cue:AICue){const el=video.current;if(!el)return;el.pause();setSelectedNote(cue);setNotesOpen(true);setTime(cue.start);if(!sourceReady){setRequested(true);el.src=asset(project.videoSource);pending.current=cue.start;el.load()}else if(el.readyState>=1)el.currentTime=Math.min(cue.start,Math.max(0,el.duration-.05));else pending.current=cue.start;}
 function openNotes(){video.current?.pause();setSelectedNote(currentCue||annotation.cues[0]);setNotesOpen(true)}
 function seek(at:number){start(at)}
 function metadata(){const el=video.current!;setDuration(el.duration);if(pending.current!==null){el.currentTime=Math.min(pending.current,el.duration-.05);pending.current=null}}
 const active=activeCues(annotation.cues,time,duration||Infinity),currentCue=active[active.length-1];
 const lanes=markerLanes(annotation.cues,Math.max(duration,annotation.cues[annotation.cues.length-1].end||annotation.cues[annotation.cues.length-1].start+20));
 return <div ref={root} className={'ai-player'+(preview?' ai-preview':'')}>
  <div className="ai-picture"><video ref={video} src={preview?source:undefined} poster={previewAsset(project.poster,960)} preload="none" playsInline muted={preview?muted:silent} onLoadedMetadata={metadata} onTimeUpdate={e=>setTime(Math.floor(e.currentTarget.currentTime*4)/4)} onPlay={()=>setPlaying(true)} onWaiting={()=>setBuffering(true)} onPlaying={()=>{setBuffering(false);setPlaying(true);root.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}))}} onPause={()=>setPlaying(false)} onEnded={()=>{if(preview&&wantPlay){video.current!.currentTime=0;void video.current!.play().catch(()=>{})}else setPlaying(false)}} onError={()=>{if(sourceReady){setBuffering(false);setFailed(true)}}} onClick={()=>{if(!preview){playing?video.current?.pause():start()}}} aria-label={project.title}/>
   {!preview&&!playing&&!buffering&&!failed&&<button className="ai-big-play" onClick={()=>start()} aria-label={'Play '+project.title}>▶</button>}
   {sourceReady&&buffering&&<span className="ai-buffering" role="status">Loading video…</span>}
   {failed&&<div className="ai-playback-error"><span>Playback is unavailable.</span><button onClick={()=>start()}>Try again</button><a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Open original video ↗</a></div>}
  </div>
  {!preview&&<div className="ai-controls">
   <div className="ai-timeline" style={{'--marker-lanes':Math.max(...lanes.map(x=>x.lane))+1} as CSSProperties}>
    <input type="range" min="0" max={duration||1} step="0.1" value={Math.min(time,duration||1)} disabled={!duration} aria-label="Video position" aria-valuetext={timecode(time)+' of '+timecode(duration)} onChange={e=>{const t=Number(e.target.value);if(!sourceReady){seek(t);return}if(video.current)video.current.currentTime=t;setTime(t)}}/>
    <div className="ai-timeline-markers" aria-label="Jump to production moments">{lanes.map(({cue,x,lane})=><button key={cue.start+cue.title} className={'ai-marker marker-'+cue.kind} style={{left:x+'%','--marker-lane':lane} as CSSProperties} aria-label={'Jump to '+cueRange(cue)+': '+cue.title} onClick={()=>selectNote(cue)}><span aria-hidden="true"/></button>)}</div>

   </div>
   <div className="ai-control-row"><button aria-label={playing?'Pause video':'Play video'} onClick={()=>playing?video.current?.pause():start()}>{playing?'Ⅱ':'▶'}</button><button aria-label={silent?'Unmute video':'Mute video'} onClick={()=>setSilent(!silent)}>{silent?'Sound off':'Sound on'}</button><span className="ai-clock">{timecode(time)} / {timecode(duration)}</span><button className="ai-notes-control" onClick={notesOpen?()=>setNotesOpen(false):openNotes} aria-expanded={notesOpen}>Notes</button></div>
  </div>}
  {!preview&&notesTarget&&createPortal(<ProductionNotes key={project.id} annotation={annotation} current={currentCue} time={time} playing={playing&&!buffering} open={notesOpen} selected={selectedNote} onOpen={openNotes} onClose={()=>setNotesOpen(false)} onSelect={selectNote} onResume={()=>{setNotesOpen(false);start()}}/>,notesTarget)}
 </div>;
}

function YouTubePlayer({project,preview=false,enabled=false,playing:wantPlay=false,muted=false,notesTarget}:Props){
 const annotation=annotations[project.id],[notesOpen,setNotesOpen]=useState(false),[selectedNote,setSelectedNote]=useState<AICue|undefined>(undefined);
 const {allowed}=useVideoConsent(),{playbackReady}=usePerformance(),permit=useVideoPermit(preview&&enabled&&wantPlay),host=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null),player=useRef<InstanceType<NonNullable<Window['YT']>['Player']>|null>(null),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{setNotesOpen(false);setSelectedNote(undefined)},[project.id]);
 const wanted=useRef({wantPlay,muted,playbackReady});wanted.current={wantPlay,muted,playbackReady};
 const admitted=preview?permit:allowed,id=project.embedUrl?.match(/embed\/([\w-]{11})/)?.[1];
 useEffect(()=>{if(!admitted||!id)return;let disposed=false;playerAPI().then(()=>{if(disposed||!host.current||!window.YT)return;const mount=document.createElement('div');host.current.replaceChildren(mount);player.current=new window.YT.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{autoplay:0,playsinline:1,controls:preview?0:1,rel:0,cc_load_policy:preview?0:1,origin:location.origin},events:{onReady:()=>{const p=player.current;if(!p||disposed)return;if(wanted.current.muted||preview)p.mute();else p.unMute();if(!document.hidden&&(!preview||(wanted.current.wantPlay&&wanted.current.playbackReady)))p.playVideo()},onStateChange:(event:{data:number})=>{if(disposed)return;setPlaying(event.data===1);if(event.data===1)root.current?.dispatchEvent(new Event('portfolio-video-ready',{bubbles:true}));if(event.data===0&&preview&&wanted.current.wantPlay){player.current?.seekTo(0,true);player.current?.playVideo()}},onError:()=>!disposed&&setFailed(true)}})}).catch(()=>!disposed&&setFailed(true));return()=>{disposed=true;player.current?.destroy();player.current=null;setPlaying(false)}},[admitted,id,preview]);
 useEffect(()=>{if(!preview)return;if(wantPlay&&playbackReady&&!document.hidden)player.current?.playVideo();else player.current?.pauseVideo()},[wantPlay,playbackReady,preview]);
 useEffect(()=>{muted?player.current?.mute():player.current?.unMute()},[muted]);
 useEffect(()=>{const hide=()=>{if(document.hidden)player.current?.pauseVideo()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
 return <div ref={root} className={'ai-provider-player'+(preview?' ai-preview':'')}><img className="ai-provider-poster" src={previewAsset(project.poster,960)} alt=""/><div className="ai-provider-host" ref={host}/>{!admitted&&!preview&&<button className="ai-big-play" aria-label={'Play '+project.title} onClick={()=>{void requestVideoConsent()}}>▶</button>}{!preview&&notesTarget&&createPortal(<ProductionNotes key={project.id} annotation={annotation} current={annotation.cues[0]} time={0} playing={playing} open={notesOpen} selected={selectedNote} onOpen={()=>{player.current?.pauseVideo();setSelectedNote(annotation.cues[0]);setNotesOpen(true)}} onClose={()=>setNotesOpen(false)} onSelect={c=>{player.current?.seekTo(c.start,true);player.current?.pauseVideo();setSelectedNote(c)}} onResume={()=>{setNotesOpen(false);player.current?.playVideo()}}/>,notesTarget)}{failed&&<a className="ai-provider-fallback" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Open video on YouTube ↗</a>}</div>;
}
function InstagramAnnotated(props:Props){
 const annotation=annotations[props.project.id],[notesOpen,setNotesOpen]=useState(false),[selectedNote,setSelectedNote]=useState<AICue|undefined>(undefined);
 useEffect(()=>{setNotesOpen(false);setSelectedNote(undefined)},[props.project.id]);
 return <div className={'ai-provider-player'+(props.preview?' ai-preview':'')}><InstagramPlayer project={props.project} enabled={!!props.enabled} playing={!props.preview||!!props.playing} explicit={!props.preview} onOpen={props.onOpen}/>{!props.preview&&props.notesTarget&&createPortal(<ProductionNotes key={props.project.id} annotation={annotation} time={0} playing={false} open={notesOpen} selected={selectedNote} onOpen={()=>{setSelectedNote(annotation.cues[0]);setNotesOpen(true)}} onClose={()=>setNotesOpen(false)} onSelect={setSelectedNote}/>,props.notesTarget)}</div>;
}
export default function AIPlayer(props:Props){return props.project.videoSource?<NativePlayer {...props}/>:props.project.provider==='instagram'?<InstagramAnnotated {...props}/>:<YouTubePlayer {...props}/>;}
