// One-off receiver: browser POSTs { name, base64 } and this writes the PNG
// binary into frontend/public/icons/. Usage: node tools/icon-receiver.mjs
import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'public', 'icons');
const expected = new Set([
  'icon-512.png', 'icon-192.png', 'apple-touch-icon.png', 'favicon-32.png',
  'icon-maskable-512.png', 'icon-maskable-192.png',
]);

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    try {
      const { name, base64 } = JSON.parse(body);
      if (!expected.has(name)) throw new Error(`unexpected name ${name}`);
      writeFileSync(path.join(root, name), Buffer.from(base64, 'base64'));
      res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
      res.end('ok');
      console.log(`wrote ${name} (${base64.length} b64 chars)`);
    } catch (e) {
      res.writeHead(400, { 'Access-Control-Allow-Origin': '*' });
      res.end(String(e));
    }
  });
});
server.listen(8791, '127.0.0.1', () => console.log('icon receiver on 8791'));
