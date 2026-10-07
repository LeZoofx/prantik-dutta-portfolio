import {usePerformance} from './Performance';
export default function PlaybackToggle({className=''}:{className?:string}){
 const {autoplay,toggleAutoplay}=usePerformance();
 return <button className={'autoplay-toggle '+className} aria-pressed={autoplay} onClick={toggleAutoplay}><span className="autoplay-icon" aria-hidden="true">{autoplay?'Ⅱ':'▶'}</span><span>{autoplay?'Pause previews':'Play previews'}</span></button>;
}
