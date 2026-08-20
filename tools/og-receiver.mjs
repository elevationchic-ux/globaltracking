/**
 * One-off HTTP receiver: the browser rasterizer POSTs the og-cover base64
 * payload here and it is persisted to tools/og-cover.b64.
 * Usage: node tools/og-receiver.mjs  (then POST from the browser page)
 */
import http from 'node:http';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'og-cover.b64');

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    writeFileSync(outPath, body);
    console.log(`received ${body.length} chars -> ${outPath}`);
    res.writeHead(200).end('ok');
    server.close();
    process.exit(0);
  });
});

server.listen(8790, '127.0.0.1', () => console.log('listening on 8790'));
