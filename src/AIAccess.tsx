import type {CSSProperties} from 'react';
const label='Skip to AI work';
export default function AIAccess({onClick,className='',current=false}:{onClick:()=>void;className?:string;current?:boolean}){
 return <button type="button" className={'ai-access '+className} aria-label={label} aria-current={current?'location':undefined} onClick={onClick}><span className="ai-access-orbit" aria-hidden="true">✳</span><span className="ai-access-label" aria-hidden="true">{Array.from(label).map((letter,i)=><span className="ai-access-letter" key={i} style={{'--ai-letter':i} as CSSProperties}>{letter}</span>)}</span><span className="ai-access-arrow" aria-hidden="true">↗</span></button>;
}
