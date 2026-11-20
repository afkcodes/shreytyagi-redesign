// Step 2 of the one-off migration: clean HTML + metadata -> src/content/**/*.md (+ list CSVs).
// After this runs once, the Markdown files are the source of truth; nothing reads index.csv.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = join(root, 'src', 'content');
const { entries, about } = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '.extracted.json'), 'utf8'));

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '_', hr: '---' });
td.use(gfm);
td.keep(['sub', 'sup', 'iframe']);
td.addRule('aside', {
  filter: n => n.nodeName === 'P' && n.getAttribute('class') === 'aside',
  replacement: (_c, n) => `\n\n${n.outerHTML}\n\n`,
});
td.addRule('listItem', {
  filter: 'li',
  replacement(c, node) {
    const parent = node.parentNode;
    let prefix = '- ';
    if (parent.nodeName === 'OL') {
      const start = Number(parent.getAttribute('start') || 1);
      prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
    }
    c = c.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n(?=.)/g, '\n' + ' '.repeat(prefix.length));
    return prefix + c + (node.nextSibling && !c.endsWith('\n') ? '\n' : '');
  },
});

function md(html) {
  const math = [];
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_m, tex) => `<p>MATHBLOCK${math.push(tex.trim()) - 1}</p>`);
  let out = td.turndown(html);
  out = out.replace(/MATHBLOCK(\d+)/g, (_m, i) => `$$\n${math[i]}\n$$`);
  return out.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

const yaml = v => typeof v === 'string' ? JSON.stringify(v) : String(v);
function frontmatter(o) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(o)) {
    if (v == null || v === '') continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) {
        const [first, ...rest] = Object.entries(item).filter(([, x]) => x);
        lines.push(`  - ${first[0]}: ${yaml(first[1])}`, ...rest.map(([a, b]) => `    ${a}: ${yaml(b)}`));
      }
    } else lines.push(`${k}: ${k === 'date' ? v : yaml(v)}`);
  }
  return lines.concat('---', '').join('\n');
}

function write(id, folder, text) {
  const file = join(content, folder ? `${id}/index.md` : `${id}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  return file;
}

let n = 0;
for (const e of entries) {
  const fm = {
    title: e.title,
    shortTitle: e.csvTitle !== e.title ? e.csvTitle : null,
    date: e.date,
    category: e.category,
  };
  let body = md(e.html);
  if (e.kind === 'list') {
    const csvName = e.id.split('/').pop() + '.csv';
    copyFileSync(e.csv, join(content, 'lists', csvName));
    Object.assign(fm, { data: `./${csvName}`, sort: e.sort, order: e.order, note: e.note });
  }
  if (e.photos) fm.photos = e.photos;
  if (e.tool) body += `\n${e.tool}\n`;
  if (e.letter) body += `\n<letter-generator>\n\n<div class="sheet">\n${e.letter.trim()}\n</div>\n\n</letter-generator>\n`;
  write(e.id, e.folder, frontmatter(fm) + '\n' + body);
  n++;
}
write('pages/about', false, frontmatter({ title: 'About' }) + '\n' + md(about));
console.log(`wrote ${n + 1} Markdown files to src/content`);
