import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const react=url(`export const useRef=value=>({current:globalThis.processScrollFixture.refs.length?globalThis.processScrollFixture.refs.shift():value});export const useState=value=>[typeof value==='function'?value():value,()=>{}];export const useEffect=()=>{};export const useLayoutEffect=()=>{};`);
const jsx=url(`export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment='fragment';`);
let code=ts.transpileModule(readFileSync(new URL('../src/CreativeProcess.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
code=code.replace(/from ['"]react['"]/g,'from '+JSON.stringify(react)).replace(/from ['"]react\/jsx-runtime['"]/g,'from '+JSON.stringify(jsx));
code=code.replace(/import \{[^}]+\} from ['"]\.\/content['"];?/,'const asset=value=>value,previewAsset=value=>value,projectPath=value=>value,projects=[];');
code=code.replace(/import \{ campaignProjects \} from [^;]+;/,'const campaignProjects=[];');
code=code.replace(/import \{ processPagePlan, artefactsForProjects \} from [^;]+;/,'const processPagePlan=()=>({primary:[],additional:[]}),artefactsForProjects=()=>[];');
code=code.replace(/import \{ advanceRail, readingHold \} from [^;]+;/,'const advanceRail=()=>{},readingHold=()=>9000;');
code=code.replace(/import ProcessArtefacts, \{ ArtefactPreview \} from [^;]+;/,'const ProcessArtefacts=()=>null,ArtefactPreview=()=>null;');
for(const name of ['steps','excerpts','sourceIndex'])code=code.replace(new RegExp('import '+name+' from [^;]+;'),'const '+name+'='+JSON.stringify(name==='steps'?[]:{})+';');
const {default:CreativeProcess}=await import(url(code));
function fixture(t){
 let reads=0,pauses=0;
 const view={scrollTop:0,dataset:{}},track={get offsetHeight(){reads++;return 20000}},animation={currentTime:0,pause(){pauses++}};
 const saved=globalThis.processScrollFixture;
 globalThis.processScrollFixture={refs:[view,track]};
 const tree=CreativeProcess({ready:true});
 t.after(()=>{globalThis.processScrollFixture=saved});
 const rail=tree.props.children[0],scroller=rail.props.children[1];
 return {view,rail,scroller,reads:()=>reads,pauses:()=>pauses};
}
test('manual process scrolling keeps the chosen position without looping or layout reads',t=>{
 const {view,rail,scroller,reads}=fixture(t);
 rail.props.onPointerEnter({pointerType:'mouse'});
 for(let i=0;i<120;i++){
  view.scrollTop=10000+i;
  scroller.props.onScroll({currentTarget:view,stopPropagation(){}});
  assert.equal(view.scrollTop,10000+i);
 }
 assert.equal(reads(),0);
});
test('strategy wheel and pointer input are isolated before stage handlers, without cancelling native scrolling',t=>{
 const {rail}=fixture(t);
 for(const handler of ['onWheelCapture','onPointerMoveCapture']){
  let stopped=0,prevented=0;
  rail.props[handler]({stopPropagation(){stopped++},preventDefault(){prevented++}});
  assert.equal(stopped,1);assert.equal(prevented,0);
 }
});
