import {useSyncExternalStore} from 'react';

// Tab-only consent: no identifiers, cookies, storage or network calls.
const initial={allowed:false,prompt:false};
let state=initial;
const listeners=new Set<()=>void>();
let waiting:((allowed:boolean)=>void)[]=[];
function publish(next:typeof state){state=next;listeners.forEach(fn=>fn())}
function subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}}
export function useVideoConsent(){return useSyncExternalStore(subscribe,()=>state,()=>initial)}
export function requestVideoConsent():Promise<boolean>{
 if(state.allowed)return Promise.resolve(true);
 const result=new Promise<boolean>(resolve=>waiting.push(resolve));
 if(!state.prompt)publish({allowed:false,prompt:true});
 return result;
}
export function resolveVideoConsent(allowed:boolean){
 const pending=waiting;waiting=[];
 publish({allowed,prompt:false});pending.forEach(resolve=>resolve(allowed));
}
export function withdrawVideoConsent(){resolveVideoConsent(false)}
