import {useEffect,useState} from 'react';
import './youtube-ad-notice.css';

// This is a brief host notice, not an ad detector.
export default function YouTubeAdNotice({active,videoId,preview=false}:{active:boolean;videoId:string;preview?:boolean}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  setVisible(active&&!!videoId);
  if(!active||!videoId)return;
  const timer=setTimeout(()=>setVisible(false),3000);
  return()=>clearTimeout(timer);
 },[active,videoId]);
 return visible?<div key={videoId} className={'youtube-ad-notice'+(preview?' is-preview':'')} role="status"><span className="youtube-ad-notice-icon" aria-hidden="true">i</span><span>YouTube might show you an Ad before the video</span></div>:null;
}
