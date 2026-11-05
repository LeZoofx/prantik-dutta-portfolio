import type {CSSProperties} from 'react';

type Props = {
 onClick: () => void;
 destination?: 'ai' | 'campaigns';
 className?: string;
 current?: boolean;
};

export default function AIAccess({onClick, destination='ai', className='', current=false}: Props) {
 const label = destination === 'campaigns' ? 'Campaigns' : 'Skip to AI work';
 const accessibleLabel = destination === 'campaigns' ? 'Skip to Campaigns' : label;
 return <button type="button" className={'ai-access '+className} aria-label={accessibleLabel} aria-current={current?'location':undefined} onClick={onClick}>
  <span className="ai-access-orbit" aria-hidden="true">✳</span>
  <span className="ai-access-label" aria-hidden="true">
   {Array.from(label).map((letter, index) => <span className="ai-access-letter" key={index} style={{'--ai-letter':index} as CSSProperties}>{letter}</span>)}
  </span>
  <span className="ai-access-arrow" aria-hidden="true">↗</span>
 </button>;
}
