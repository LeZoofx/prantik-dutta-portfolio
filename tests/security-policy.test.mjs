import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {secureDocument} from '../scripts/security-policy.mjs';

test('the built policy precedes scripts, hashes the compatibility code and excludes executable inline handlers',()=>{
 const bootstrap='if(!window.ResizeObserver){document.documentElement.className+=" compat-view"}';
 const html='<html><head><meta charset="UTF-8"/><script>'+bootstrap+'</script><script type="application/json">{"path":"/"}</script><script src="/assets/main.js" type="module"></script></head><body></body></html>';
 const output=secureDocument(html),policy=output.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
 assert.ok(output.indexOf('Content-Security-Policy')<output.indexOf('<script>'));
 assert.ok(policy.includes("'sha256-"+createHash('sha256').update(bootstrap).digest('base64')+"'"));
 assert.ok(!policy.includes(createHash('sha256').update('{"path":"/"}').digest('base64')));
 assert.ok(!policy.split('; ').find(x=>x.startsWith('script-src ')).includes("'unsafe-inline'"));
 assert.ok(policy.includes("script-src-attr 'none'"));
 assert.ok(policy.includes("object-src 'none'"));
 assert.ok(policy.includes("form-action 'none'"));
 assert.ok(policy.includes('https://www.youtube-nocookie.com'));
 assert.ok(policy.includes('https://www.instagram.com'));
 assert.ok(policy.includes('https://drive.google.com'));
 assert.ok(!policy.includes('https://*'));
});
