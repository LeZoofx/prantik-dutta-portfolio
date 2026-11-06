import {renderToString} from 'react-dom/server';
import App from './App';
import {PerformanceProvider} from './Performance';
export function render(path:string){return renderToString(<PerformanceProvider><App initialPath={path} /></PerformanceProvider>);}

import {projects} from './content';
import {buildSections} from './portfolioSections';
import {scenePath} from './sceneLinks';

export const scenePages=[...new Map([6,3].flatMap(size=>buildSections(projects,'curated','all',size))
 .map(section=>[section.id,{path:scenePath(section.id),title:section.title,description:section.summary,poster:section.items[0]?.poster}])).values()];
