import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import './youtube-ad-notice.css';

let noticeOwner:symbol|undefined;

// A heads-up about the host, not an attempt to detect or cover an actual ad.
export default function YouTubeAdNotice({active,videoId}:{active:boolean;videoId:string}){
 const anchor=useRef<HTMLSpanElement>(null),seen=useRef(new Set<string>()),owner=useRef(Symbol());
 const [notice,setNotice]=useState<{target:HTMLElement;bottom:number;id:string}|null>(null);
 useEffect(()=>{
  if(!active||!videoId||seen.current.has(videoId)||!anchor.current)return;
  if(noticeOwner&&noticeOwner!==owner.current){seen.current.add(videoId);return}
  const target=anchor.current.closest<HTMLElement>('dialog[open]')||document.body;
  // Explore has navigation along its bottom edge; keep the notice above it.
  const bottomBar=target===document.body?document.querySelector('.depth-bottom'):null;
  let bottom=bottomBar?Math.max(16,innerHeight-bottomBar.getBoundingClientRect().top+12):16;
  // Find the lowest clear position along the left edge, outside pictures and controls.
  const left=16,width=Math.min(265,innerWidth-32),height=58;
  const blockers=Array.from(target.querySelectorAll('iframe,video,button,a,input,select')).map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.right>left&&r.left<left+width&&r.bottom>0&&r.top<innerHeight);
  let top=innerHeight-bottom-height;
  for(const rect of blockers.sort((a,b)=>b.top-a.top))if(top<rect.bottom+8&&top+height>rect.top-8)top=rect.top-height-8;
  if(top<12)return;
  bottom=innerHeight-top-height;
  noticeOwner=owner.current;
  seen.current.add(videoId);setNotice({target,bottom,id:videoId});
  const timer=setTimeout(()=>{if(noticeOwner===owner.current)noticeOwner=undefined;setNotice(null)},3000);
  return()=>{clearTimeout(timer);if(noticeOwner===owner.current)noticeOwner=undefined;setNotice(null)};
 },[active,videoId]);
 return <><span ref={anchor} hidden/>{notice&&createPortal(<div key={notice.id} className="youtube-ad-notice" role="status" style={{bottom:`max(${notice.bottom}px, env(safe-area-inset-bottom))`}}><span className="youtube-ad-notice-icon" aria-hidden="true">i</span><span>YouTube might show you an Ad before the video</span></div>,notice.target)}</>;
}
