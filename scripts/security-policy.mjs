import {createHash} from 'node:crypto';

// Applied at build time: no consent SDK, extra request or client-side work.
export function secureDocument(html){
 const hashes=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([,attrs])=>!(/\bsrc\s*=|\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attrs)))
  .map(([, ,code])=>"'sha256-"+createHash('sha256').update(code).digest('base64')+"'");
 const policy=[
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'none'",
  ["script-src 'self'",...hashes,'https://www.youtube.com','https://s.ytimg.com'].join(' '),
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self' https://www.youtube.com https://s.ytimg.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://drive.google.com",
  'upgrade-insecure-requests'
 ].join('; ');
 const meta='<meta http-equiv="Content-Security-Policy" content="'+policy+'"/>';
 return html.replace(/(<meta\s+charset\s*=\s*["'][^"']+["']\s*\/?>)/i,'$1\n'+meta);
}
