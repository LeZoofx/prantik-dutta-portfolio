// Optional one-time publisher. Run locally with Node, Git and the official GitHub CLI installed.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
function run(command,args,capture=false){const r=spawnSync(command,args,{cwd:root,stdio:capture?'pipe':'inherit',encoding:'utf8'});if(r.error||r.status!==0)throw Error(command+' '+args.slice(0,2).join(' ')+' failed. '+(r.error?.message||r.stderr||''));return r.stdout?.trim()||'';}
for(const command of ['git','gh']){if(spawnSync(command,['--version'],{stdio:'ignore'}).status!==0)throw Error('Install '+command+' first. See START-HERE.md for official download links.');}
if(spawnSync('gh',['auth','status'],{stdio:'ignore'}).status!==0)run('gh',['auth','login','--web','--git-protocol','https']);
const owner=run('gh',['api','user','--jq','.login'],true);
const plan=run('gh',['api','user','--jq','.plan.name // "unknown"'],true);
if(plan!=='pro')throw Error('Private-source GitHub Pages requires GitHub Pro for this personal account. Verify your plan before publishing; no subscription is purchased automatically.');
const repo=process.argv[2]||'portfolio';if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(repo))throw Error('Use a simple repository name, such as portfolio.');
const full=owner+'/'+repo;
if(existsSync('.git')){
 const remote=spawnSync('git',['remote','get-url','origin'],{encoding:'utf8'});
 if(remote.status===0)throw Error('This folder already has a remote. Initial publishing is already configured; use normal commits or GitHub Actions for future edits.');
}else run('git',['init','-b','main']);
console.log('Creating a NEW private portfolio repository for '+owner+'. Existing repositories are never overwritten. The published website remains public.');
run('gh',['repo','create',full,'--private','--description','Prantik Dutta — creative direction, films and AI visuals','--disable-wiki','--source','.','--remote','origin']);
run('git',['config','user.name',owner]);run('git',['config','user.email',owner+'@users.noreply.github.com']);
run('git',['add','--all']);run('git',['commit','-m','Build Prantik Dutta portfolio']);run('gh',['auth','setup-git']);run('git',['push','-u','origin','main']);
try{run('gh',['api','--method','POST','repos/'+full+'/pages','-f','build_type=workflow'])}catch{console.log('If Pages is not enabled, select Settings → Pages → Source: GitHub Actions in your repository.');}
try{run('gh',['workflow','run','deploy.yml','--repo',full])}catch{console.log('Open Actions → Publish portfolio → Run workflow once the uploaded workflow appears.');}
console.log('Source: https://github.com/'+full+'\nDeployment status: https://github.com/'+full+'/actions\nAfter the green deployment: https://'+owner.toLowerCase()+'.github.io/'+(repo.toLowerCase()===owner.toLowerCase()+'.github.io'?'':repo+'/'));
