import {useRef,useState,useEffect,type CSSProperties, type PointerEvent} from 'react';

export default function KineticName({compact=false}:{compact?:boolean}) {
 const root=useRef<HTMLSpanElement>(null),[tapped,setTapped]=useState(false),reset=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const frame=useRef(0),pointer=useRef(0),letters=useRef<{letter:HTMLElement;center:number;flip:string;lift:string}[]>([]);
 useEffect(()=>()=>{clearTimeout(reset.current);cancelAnimationFrame(frame.current)},[]);
 function enter(e:PointerEvent<HTMLSpanElement>) {
  if(e.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // Measure each word once. Animated letter bounds must never feed back into the reaction.
  letters.current=Array.from(root.current?.querySelectorAll<HTMLElement>('.name-word')||[]).flatMap(word=>{
   const bounds=word.getBoundingClientRect(),scale=bounds.width/(word.offsetWidth||1);
   return Array.from(word.querySelectorAll<HTMLElement>('.name-letter')).map(letter=>({letter,center:bounds.left+(letter.offsetLeft+letter.offsetWidth/2)*scale,flip:'',lift:''}));
  });
  if(root.current)root.current.dataset.reacting='true';
  move(e);
 }
 function move(e:PointerEvent<HTMLSpanElement>) {
  if(e.pointerType==='touch'||!letters.current.length)return;
  pointer.current=e.clientX;
  if(frame.current)return;
  frame.current=requestAnimationFrame(()=>{
   frame.current=0;
   for(const item of letters.current){
    const force=Math.max(0,1-Math.abs(pointer.current-item.center)/(compact?65:190));
    const flip=`${(force*175).toFixed(1)}deg`,lift=`${(-force*(compact?2:10)).toFixed(1)}px`;
    if(flip!==item.flip){item.letter.style.setProperty('--letter-flip',flip);item.flip=flip}
    if(lift!==item.lift){item.letter.style.setProperty('--letter-lift',lift);item.lift=lift}
   }
  });
 }
 function clear(){cancelAnimationFrame(frame.current);frame.current=0;letters.current=[];if(root.current)delete root.current.dataset.reacting;root.current?.querySelectorAll<HTMLElement>('.name-letter').forEach(el=>{el.style.setProperty('--letter-flip','0deg');el.style.setProperty('--letter-lift','0px')})}
 return <span className={'kinetic-name'+(compact?' compact-name':'')+(tapped?' is-tapped':'')} aria-label="Prantik Dutta" ref={root} onPointerDown={e=>{if(e.pointerType==='touch'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){setTapped(true);clearTimeout(reset.current);reset.current=setTimeout(()=>setTapped(false),1200)}}} onPointerEnter={enter} onPointerMove={move} onPointerLeave={clear} onPointerCancel={clear}>
  {['Prantik','Dutta'].map(word=><span className="name-word" key={word} aria-hidden="true">{[...word].map((letter,i)=><span className="name-letter" key={i} style={{'--letter':i} as CSSProperties}><span>{letter}</span><span className="letter-reverse">{letter}</span></span>)}</span>)}
 </span>;
}
