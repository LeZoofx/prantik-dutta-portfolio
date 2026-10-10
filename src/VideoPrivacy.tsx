import {useEffect,useRef} from 'react';
import {asset} from './content';
import {resolveVideoConsent} from './videoConsent';
export default function VideoPrivacy(){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current,previous=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();if(previous?.isConnected)previous.focus({preventScroll:true})}},[]);
 return <dialog ref={ref} className="video-privacy" aria-labelledby="video-privacy-title" aria-describedby="video-privacy-description" onCancel={e=>{e.preventDefault();resolveVideoConsent(false)}}>
  <p className="mono">VIDEO PRIVACY</p><h2 id="video-privacy-title">Before the videos.</h2>
  <p id="video-privacy-description">Playing embedded videos connects to YouTube (Google) or Instagram (Meta). They receive your IP address, browser details and page origin, and may use cookies or similar storage under their own policies.</p>
  <p>The choice applies to video embeds in this tab until you reload or reset it. You can keep browsing with thumbnails.</p>
  <div className="video-privacy-actions"><button onClick={()=>resolveVideoConsent(false)} autoFocus>Keep thumbnails</button><button onClick={()=>resolveVideoConsent(true)}>Allow video embeds</button></div>
  <a href={asset('privacy.html')} target="_blank" rel="noopener noreferrer">Privacy, providers & your choices ↗</a>
 </dialog>;
}
