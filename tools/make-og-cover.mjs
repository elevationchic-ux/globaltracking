/**
 * One-off generator for the og:image asset (frontend/public/og-cover.png).
 *
 * The rasterization happens in a real browser (the SVG in tools/og-cover.svg
 * is drawn on a canvas and exported as PNG base64), then this script decodes
 * the base64 file into the final PNG. No npm dependencies required.
 *
 * Usage:
 *   1. Open tools/render-og.html in any browser (or via browser automation)
 *      and click "Export" — it downloads/copies og-cover.b64 next to it.
 *   2. node tools/make-og-cover.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b64Path = path.join(root, 'tools', 'og-cover.b64');
const outPath = path.join(root, 'frontend', 'public', 'og-cover.jpg');

if (!existsSync(b64Path)) {
  console.error('Missing tools/og-cover.b64 — export it from tools/render-og.html first.');
  process.exit(1);
}

const base64 = readFileSync(b64Path, 'utf8').replace(/^data:image\/(png|jpeg);base64,/, '').trim();
const jpg = Buffer.from(base64, 'base64');
writeFileSync(outPath, jpg);
console.log(`✓ ${outPath} (${(jpg.length / 1024).toFixed(0)} kB)`);
