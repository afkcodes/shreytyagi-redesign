#!/usr/bin/env node
// Confirm every image and download the content uses can actually be loaded.
// Media is served from GitHub (MEDIA_BASE in site.config.mjs) unless the file is in public/.
//   npm run media:check            # report
//   npm run media:check -- --strict  # also exit 1 if anything is missing (for CI)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_BASE, MEDIA_BRANCH, MEDIA_REPO } from '../site.config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const strict = process.argv.includes('--strict');
const MEDIA = /\.(jpe?g|png|webp|gif|avif|svg|heic|pdf|mp4|zip)$/i;

// content files only (not the AGENTS.md guide, whose examples are placeholders)
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') && e.name !== 'AGENTS.md' ? [join(dir, e.name)] : []);

/** path -> pages that use it */
const uses = new Map();
for (const file of walk(join(root, 'src', 'content'))) {
  const md = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const page = file.slice(join(root, 'src', 'content').length + 1);
  for (const m of [...md.matchAll(/\]\((\/[^)\s]+)\)/g), ...md.matchAll(/(?:src|href)="(\/[^"]+)"/g), ...md.matchAll(/(?:src|thumb):\s*"?(\/[^"\n]+)"?/g)]) {
    const p = m[1].split(/[?#]/)[0];
    if (MEDIA.test(p)) uses.set(p, [...(uses.get(p) ?? []), page]);
  }
}

let onGitHub = 0, bundled = 0;
const missing = [];
const paths = [...uses.keys()].sort();
await Promise.all(paths.map(async p => {
  if (existsSync(join(root, 'public', decodeURI(p)))) { bundled++; return; }
  try {
    const res = await fetch(MEDIA_BASE + p, { method: 'HEAD' });
    if (res.ok) onGitHub++;
    else missing.push(`${p}  (HTTP ${res.status}; used by ${[...new Set(uses.get(p))].join(', ')})`);
  } catch (err) {
    missing.push(`${p}  (${err.message})`);
  }
}));

console.log(`\n  Media source: ${MEDIA_BASE}\n  ${paths.length} files used: ${onGitHub} on GitHub, ${bundled} bundled from public/, ${missing.length} missing.`);
if (missing.length) {
  console.log(`\n  Missing — upload each to ${MEDIA_REPO} (branch ${MEDIA_BRANCH}) at the same path:\n    ${missing.sort().join('\n    ')}`);
}
console.log('');
if (strict && missing.length) process.exit(1);
