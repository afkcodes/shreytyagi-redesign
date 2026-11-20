#!/usr/bin/env node
// Guardrails for people and agents. Runs on dist/ after `astro check` and `astro build`
// (see `npm run verify`). Prints every failure with its file and reason, then exits 1.
// Don't loosen a limit to make a change pass; make the change smaller.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const KB = 1024;
const BUDGET = { js: 12 * KB, html: 64 * KB, search: 150 * KB };
const ALLOWED_STYLESHEETS = ['/katex/katex.min.css'];

const failures = [];
const warnings = [];
const fail = (where, why) => failures.push(`${where}: ${why}`);
const gz = buf => gzipSync(buf).length;
const kb = n => `${(n / KB).toFixed(1)} KB`;
const walk = (dir, ext) => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = join(dir, e.name);
  return e.isDirectory() ? walk(p, ext) : ext.some(x => e.name.endsWith(x)) ? [p] : [];
});
/** Map a site path to the built file that answers it (mirrors the Cloudflare config). */
const fileFor = path => {
  const p = decodeURIComponent(path.split(/[?#]/)[0]);
  return join(dist, p.endsWith('/') ? p + 'index.html' : p);
};

if (!existsSync(dist)) {
  console.error('dist/ is missing. Run `npm run build` first (or `npm run verify`, which builds).');
  process.exit(1);
}

// 1. Old URLs keep working
for (const line of readFileSync(join(root, 'scripts', 'legacy-urls.txt'), 'utf8').split('\n')) {
  const url = line.trim();
  if (url && !url.startsWith('#') && !existsSync(fileFor(url))) fail('scripts/legacy-urls.txt', `${url} is not in the build. URLs are permanent.`);
}

// 2. Every page: structure, budgets, no third-party code, working internal links
const pages = walk(dist, ['.html']);
for (const file of pages) {
  const where = relative(dist, file);
  const html = readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue; // redirect stubs

  if (!/<html[^>]*\blang="/.test(html)) fail(where, 'missing <html lang>');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(where, 'missing <title>');
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(where, 'missing meta description');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(where, `has ${h1s} <h1> elements; a page has exactly one (from its title)`);

  const htmlGz = gz(Buffer.from(html));
  if (htmlGz > BUDGET.html) fail(where, `HTML is ${kb(htmlGz)} gzipped (budget ${kb(BUDGET.html)})`);

  let js = 0;
  for (const [, src] of html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) {
    if (/^(https?:)?\/\//.test(src)) { fail(where, `loads a script from another origin: ${src}`); continue; }
    if (existsSync(fileFor(src))) js += gz(readFileSync(fileFor(src)));
    else fail(where, `script ${src} is missing`);
  }
  for (const [, body] of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) js += gz(Buffer.from(body));
  if (js > BUDGET.js) fail(where, `ships ${kb(js)} of JavaScript gzipped (budget ${kb(BUDGET.js)})`);

  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    const href = tag.match(/href="([^"]+)"/)?.[1] ?? '';
    const rel = tag.match(/rel="([^"]+)"/)?.[1] ?? '';
    if (/stylesheet/.test(rel) && !ALLOWED_STYLESHEETS.includes(href)) fail(where, `external stylesheet ${href}; CSS is inlined (only KaTeX is allowed)`);
    if (/stylesheet|preload|modulepreload|font/.test(rel) && /^(https?:)?\/\//.test(href)) fail(where, `loads ${rel} from another origin: ${href}`);
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) fail(where, 'uses Google Fonts; fonts are self-hosted');

  for (const [, attr, url] of html.matchAll(/\s(href|src)="(\/(?!\/)[^"]*)"/g)) {
    if (!existsSync(fileFor(url)) || statSync(fileFor(url)).isDirectory()) fail(where, `broken internal ${attr}: ${url}`);
  }
}

// 3. Search index stays small
const search = join(dist, 'search.json');
if (!existsSync(search)) fail('dist/search.json', 'missing');
else if (gz(readFileSync(search)) > BUDGET.search) fail('dist/search.json', `${kb(gz(readFileSync(search)))} gzipped (budget ${kb(BUDGET.search)})`);

// 4. Agent and host files the build must produce
for (const f of ['llms.txt', 'llms-full.txt', 'sitemap.xml', 'robots.txt', '_redirects', '404.html']) {
  if (!existsSync(join(dist, f))) fail(`dist/${f}`, 'missing from the build');
}

// 5. Content: alt text on every image
for (const file of walk(join(root, 'src', 'content'), ['.md'])) {
  const md = readFileSync(file, 'utf8');
  const where = relative(root, file);
  for (const [m] of md.matchAll(/!\[\s*\]\([^)]*\)/g)) fail(where, `image without alt text: ${m}`);
  for (const [m] of md.matchAll(/<img\b(?![^>]*\balt="[^"]+")[^>]*>/g)) fail(where, `<img> without alt text: ${m.slice(0, 80)}`);
}

// 6. Design: hex colours only inside palette regions (tokens, lightbox, printable letter)
for (const file of walk(join(root, 'src'), ['.css', '.astro', '.ts'])) {
  const where = relative(root, file);
  let inPalette = false;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/palette:start/.test(line)) inPalette = true;
    const hex = !inPalette && line.replace(/palette:(start|end).*/, '').match(/#[0-9a-fA-F]{3,8}\b(?![-\w])/);
    if (hex && !/^\s*(\/\/|\*|\/\*)/.test(line) && !/href="#|url\(#|`#\$\{|'#'|"#"/.test(line)) {
      fail(`${where}:${i + 1}`, `colour ${hex[0]} outside a palette region; use a token from DESIGN.md`);
    }
    if (/palette:end/.test(line)) inPalette = false;
  });
}

// 7. Content media comes from GitHub (site.config.mjs), not the Cloudflare deploy.
//    public/ holds site assets only, plus graphs that exist nowhere else (grandfathered).
const PUBLIC_ALLOWED = [/^favicon\.svg$/, /^katex\//, /^articles\/youtube_av1_encoding\/[^/]+\.png$/, /\.DS_Store$/];
for (const file of walk(join(root, 'public'), [''])) {
  const rel = relative(join(root, 'public'), file).split('\\').join('/');
  if (!PUBLIC_ALLOWED.some(re => re.test(rel))) fail(`public/${rel}`, 'content images and downloads live on GitHub (MEDIA_REPO in site.config.mjs), not in public/');
}

// 8. Agent instruction files: one source of truth, nothing that hides it
for (const [f, needle] of [['AGENTS.md', 'single source of truth'], ['GEMINI.md', 'AGENTS.md'], ['CLAUDE.md', 'AGENTS.md'], ['.gemini/settings.json', 'AGENTS.md'], ['.aider.conf.yml', 'AGENTS.md']]) {
  if (!existsSync(join(root, f)) || !readFileSync(join(root, f), 'utf8').includes(needle)) fail(f, `must exist and point to AGENTS.md`);
}
for (const f of ['.rules', '.cursorrules', '.windsurfrules', '.clinerules', '.github/copilot-instructions.md']) {
  if (existsSync(join(root, f))) fail(f, 'remove it: these tools read AGENTS.md, and this file hides AGENTS.md in some editors (Zed)');
}

for (const w of warnings) console.warn(`  warning  ${w}`);
if (failures.length) {
  console.error(`\n  ${failures.length} check${failures.length > 1 ? 's' : ''} failed:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`\n  ✓ verify passed: ${pages.length} pages, legacy URLs, budgets, links, alt text, colours, agent files\n`);
