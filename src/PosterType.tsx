import type {CSSProperties} from 'react';
import type {ArtStyle} from './artStyles';
const emphasis=/^(research|strategy|positioning|briefs|production|direction|shooting|shoot|teams|scripts|packaging|formats|hook|hooks|retention|reach|editing|graphics|motion|vfx|ai|audience|pacing|performance|identity|quality|results|watch|watching|305%|5\.2m|post-production)[.,:;!?]?$/i;
export function KineticCopy({text,className='',art}:{text:string;className?:string;art?:ArtStyle}){
 return <span className={'kinetic-copy '+className} data-art={art} aria-label={text}>{text.split(/\s+/).map((word,i)=><span aria-hidden="true" className={'copy-word'+(emphasis.test(word)?' copy-emphasis':'')} key={i} style={{'--word':i%16} as CSSProperties}>{word}{' '}</span>)}</span>;
}
export default function PosterType({lines,art,className=''}:{lines:string[];art?:ArtStyle;className?:string}){
 return <div className={'type-poster-copy '+className} data-art={art} aria-label={lines.join(' ')}>{lines.map((line,i)=><div className={'poster-line poster-line-'+i} key={line} aria-hidden="true" style={{'--line':i} as CSSProperties}><KineticCopy text={line}/></div>)}</div>;
}
