#!/usr/bin/env node
// Copy every image and download the content uses into public/, so the site no longer depends
// on the old shreytyagi.com host. Run it while the OLD site is still live (before the domain
// moves to Cloudflare), then commit public/.
//   npm run media:import                 # downloads from https://shreytyagi.com
//   npm run media:import -- ../old-site  # or copies from a local checkout of the old repo
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const from = process.argv[2] ?? process.env.PUBLIC_ASSET_BASE ?? 'https://shreytyagi.com';
const local = !/^https?:/.test(from);
const MEDIA = /\.(jpe?g|png|webp|gif|avif|svg|heic|pdf|mp4|zip)$/i;

// content files only (not the AGENTS.md guide, whose examples are placeholders)
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') && e.name !== 'AGENTS.md' ? [join(dir, e.name)] : []);

// every site-path media reference: Markdown images, raw src/href, photo lists
const paths = new Set();
for (const file of walk(join(root, 'src', 'content'))) {
  const md = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, ''); // skip examples in comments
  const found = [
    ...md.matchAll(/\]\((\/[^)\s]+)\)/g),
    ...md.matchAll(/(?:src|href)="(\/[^"]+)"/g),
    ...md.matchAll(/(?:src|thumb):\s*"?(\/[^"\n]+)"?/g),
  ].map(m => m[1].split(/[?#]/)[0]);
  for (const p of found) if (MEDIA.test(p)) paths.add(p);
}

let copied = 0, skipped = 0, bytes = 0;
const missing = [];
for (const p of [...paths].sort()) {
  const dest = join(root, 'public', decodeURI(p));
  if (existsSync(dest)) { skipped++; continue; }
  try {
    if (local) {
      const src = join(from, decodeURI(p));
      if (!existsSync(src)) throw new Error('not found');
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      bytes += statSync(dest).size;
    } else {
      const res = await fetch(from + p);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      bytes += buf.length;
    }
    copied++;
    process.stdout.write(`  ✓ ${p}\n`);
  } catch (err) {
    missing.push(`${p} (${err.message})`);
  }
}

console.log(`\n  ${copied} copied (${(bytes / 1024 / 1024).toFixed(1)} MB), ${skipped} already in public/, ${missing.length} not found.`);
if (missing.length) console.log(`\n  Not found on ${from}:\n    ${missing.join('\n    ')}`);
console.log(copied ? '\n  Next: npm run verify, then commit public/ and push.\n' : '');
