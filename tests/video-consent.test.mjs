import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/videoConsent.ts',import.meta.url),'utf8');
// Exercise the actual consent transaction; the hook adapter only reads its state.
const code=ts.transpileModule(source.replace("import {useSyncExternalStore} from 'react';",'const useSyncExternalStore=(_subscribe,getSnapshot)=>getSnapshot();'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2022}}).outputText;
const consent=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('simultaneous video requests wait for one choice and declining leaves embeds disabled',async()=>{
 assert.deepEqual(consent.useVideoConsent(),{allowed:false,prompt:false});
 const first=consent.requestVideoConsent(),second=consent.requestVideoConsent();
 assert.deepEqual(consent.useVideoConsent(),{allowed:false,prompt:true});
 consent.resolveVideoConsent(false);
 assert.deepEqual(await Promise.all([first,second]),[false,false]);
 assert.deepEqual(consent.useVideoConsent(),{allowed:false,prompt:false});
});
test('allowing enables the tab; withdrawal disables it and cancels pending requests',async()=>{
 const pending=consent.requestVideoConsent();consent.resolveVideoConsent(true);
 assert.equal(await pending,true);assert.equal(await consent.requestVideoConsent(),true);
 assert.deepEqual(consent.useVideoConsent(),{allowed:true,prompt:false});
 consent.withdrawVideoConsent();
 assert.deepEqual(consent.useVideoConsent(),{allowed:false,prompt:false});
 const next=consent.requestVideoConsent();consent.withdrawVideoConsent();
 assert.equal(await next,false);assert.deepEqual(consent.useVideoConsent(),{allowed:false,prompt:false});
});
