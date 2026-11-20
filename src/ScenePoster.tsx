import {useLayoutEffect,useRef,useState} from 'react';
import './scene-loading.css';

// Readiness belongs to the image, never to the navigation or its input queue.
export default function ScenePoster({src,srcSet,alt,active=false,priority=false,sizes='(max-width:699px) 75vw, 42vw'}:{src:string;srcSet?:string;alt:string;active?:boolean;priority?:boolean;sizes?:string}){
 const image=useRef<HTMLImageElement>(null),[state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 useLayoutEffect(()=>{const img=image.current;setState(img?.complete?(img.naturalWidth?'ready':'failed'):'loading')},[src]);
 return <><img ref={image} data-poster-state={state} src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading={active?'eager':'lazy'} fetchPriority={active&&priority?'high':'low'} decoding="async" onLoad={()=>setState('ready')} onError={()=>setState('failed')}/>
  {state!=='ready'&&<span className="scene-poster-loading" data-failed={state==='failed'} aria-hidden="true"><i/><i/><i/><i/><span>{state==='failed'?'Preview unavailable':'Loading preview'}<b aria-hidden="true">↗</b></span></span>}
 </>;
}
