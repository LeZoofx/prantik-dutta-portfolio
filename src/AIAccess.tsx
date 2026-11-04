export default function AIAccess({onClick,className='',current=false}:{onClick:()=>void;className?:string;current?:boolean}){
 return <button className={'ai-access '+className} aria-current={current?'location':undefined} onClick={onClick}><span className="ai-access-orbit" aria-hidden="true">✳</span><span>Skip to AI work</span><span aria-hidden="true">↗</span></button>;
}
