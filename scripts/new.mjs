#!/usr/bin/env node
// Create a page with the right frontmatter and structure.
//   npm run new -- <section> <slug> "<Title>" --category <Category> [--date YYYY-MM-DD]
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(root, 'src', 'content');
const TEMPLATE = { articles: 'post', blogs: 'post', photos: 'photos', utilities: 'utility', lists: 'list' };

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const category = flag('category');
const date = flag('date') ?? new Date().toISOString().slice(0, 10);
const [section, slug, title] = args;

const fail = msg => { console.error(`\n  ${msg}\n\n  Usage: npm run new -- <section> <slug> "<Title>" --category <Category>\n`); process.exit(1); };
if (!TEMPLATE[section]) fail(`Section must be one of: ${Object.keys(TEMPLATE).join(', ')}.`);
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail('Slug must be lowercase letters, digits and hyphens, e.g. dolby-atmos-explained. It becomes the URL and can never change.');
if (!title) fail('Give the page title in quotes.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date must be YYYY-MM-DD.');
if (!category) {
  const seen = new Set();
  const walk = d => { for (const f of readdirSync(d, { withFileTypes: true })) {
    if (f.isDirectory()) walk(join(d, f.name));
    else if (f.name.endsWith('.md')) { const m = readFileSync(join(d, f.name), 'utf8').match(/^category:\s*"?([^"\n]+)"?/m); if (m) seen.add(m[1]); }
  } };
  if (existsSync(join(content, section))) walk(join(content, section));
  fail(`Add --category. Existing ${section} categories: ${[...seen].sort().join(', ') || '(none yet)'}.`);
}

const file = join(content, section, `${slug}.md`);
if (existsSync(file) || existsSync(join(content, section, slug, 'index.md'))) fail(`${section}/${slug} already exists. URLs are permanent; pick another slug.`);

const fill = s => s.replaceAll('{{title}}', title.replaceAll('"', '\\"')).replaceAll('{{date}}', date)
  .replaceAll('{{category}}', category.replaceAll('"', '\\"')).replaceAll('{{section}}', section).replaceAll('{{slug}}', slug);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, fill(readFileSync(join(root, 'templates', `${TEMPLATE[section]}.md`), 'utf8')));
const made = [file];
if (section === 'lists') {
  const csv = join(content, section, `${slug}.csv`);
  writeFileSync(csv, readFileSync(join(root, 'templates', 'list.csv'), 'utf8'));
  made.push(csv);
}
const url = `/${section}/${slug}.html`;
console.log(`\n  Created ${made.map(f => f.slice(root.length + 1)).join(' and ')}\n  URL: ${url}\n\n  Next: write the page, then run npm run verify.\n`);
