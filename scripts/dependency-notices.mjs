import fs from 'node:fs/promises';
import path from 'node:path';

// Retain third-party permissions separately from the proprietary portfolio code.
export async function writeDependencyNotices(){
 const {packages}=JSON.parse(await fs.readFile('package-lock.json','utf8'));
 const notices=['THIRD-PARTY SOFTWARE NOTICES\n\nThe original portfolio code and design are proprietary. The following software retains its own licences; those rights are not restricted by the portfolio notice. Self-hosted font licences are distributed separately in fonts/.'];
 for(const [directory,info] of Object.entries(packages)){
  if(!directory||info.dev||info.optional)continue;
  const files=(await fs.readdir(directory)).filter(name=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(name)).sort();
  const paths=files.map(name=>path.join(directory,name));
  if(directory==='node_modules/@react-three/fiber'&&!paths.length)paths.push('docs/licenses/react-three-fiber-LICENSE');
  if(!paths.length)throw Error('Missing dependency licence: '+directory);
  const texts=await Promise.all(paths.map(file=>fs.readFile(file,'utf8')));
  notices.push(directory.replace(/^node_modules\//,'')+' '+info.version+'\n'+texts.join('\n\n'));
 }
 await fs.writeFile('dist/software-notices.txt',notices.join('\n\n'+ '='.repeat(72)+'\n\n')+'\n');
}
