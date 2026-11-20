import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { MEDIA_BASE } from '../../site.config.mjs';

export const SECTIONS = {
  articles: { name: 'Articles', one: 'Article', blurb: 'Long reads on cinema formats, reviews and technology.' },
  blogs: { name: 'Blogs', one: 'Blog', blurb: 'Personal notes and experiences.' },
  lists: { name: 'Lists', one: 'List', blurb: 'Sortable data on Indian cinemas and the movies shown in them.' },
  utilities: { name: 'Utilities', one: 'Utility', blurb: 'Web based tools to help you visualise, calculate, find or create.' },
  photos: { name: 'Photos', one: 'Photos', blurb: 'Photo sets.' },
} as const;
export type Section = keyof typeof SECTIONS;

export type Entry = CollectionEntry<'posts'> | CollectionEntry<'lists'>;

export const sectionOf = (e: Entry) => e.id.split('/')[0] as Section;
export const label = (e: Entry) => e.data.shortTitle ?? e.data.title;

/** Old site URLs: /articles/x.html, and /articles/x/ for folder pages (index.md). */
export const urlOf = (e: Entry) => (e.id.endsWith('/index') ? `/${e.id.slice(0, -'index'.length)}` : `/${e.id}.html`);
/** Markdown copy of a page, for agents: same path, ending in .md (llms.txt convention). */
export const mdUrlOf = (e: Entry) => `/${e.id}.md`;
/** A list's data as a download. */
export const csvUrlOf = (e: CollectionEntry<'lists'>) => `/${e.id}.csv`;
export const SITE = 'https://shreytyagi.com';
export const SUMMARY = 'Articles, lists and tools about cinema technology — IMAX, Dolby Cinema, HDR, 3D and encoding, mostly in India. First-hand reviews and data by Shrey Tyagi.';

/** The Markdown an agent gets for a page: frontmatter it can trust, then the body as written. */
export function entryMarkdown(e: Entry) {
  const lines = ['---', `title: ${JSON.stringify(e.data.title)}`, `date: ${iso(e.data.date)}`, `category: ${JSON.stringify(e.data.category)}`,
    `section: ${SECTIONS[sectionOf(e)].name}`, `url: ${SITE}${urlOf(e)}`, '---', '', `# ${e.data.title}`, '', (e.body ?? '').trim(), ''];
  if (e.collection === 'lists') {
    const t = loadTable(e as CollectionEntry<'lists'>);
    lines.push(`## Data`, '', `${t.rows.length} rows. Columns: ${t.head.join(', ')}. CSV: ${SITE}${csvUrlOf(e as CollectionEntry<'lists'>)}`, '');
    if (e.data.note) lines.push(`Note: ${e.data.note}`, '');
  }
  return lines.join('\n');
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...o });
export const dateShort = (d: Date) => fmt(d, { day: 'numeric', month: 'short' });
export const dateLong = (d: Date) => fmt(d, { day: 'numeric', month: 'long', year: 'numeric' });
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Every published entry, newest first. */
export async function allEntries(): Promise<Entry[]> {
  const [posts, lists] = await Promise.all([
    getCollection('posts', e => !e.data.draft),
    getCollection('lists', e => !e.data.draft),
  ]);
  return [...posts, ...lists].sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

const publicDir = resolve('public');
/** Site-path media: from GitHub (site.config.mjs), unless the file is in public/. */
export function asset(path: string) {
  if (!path.startsWith('/')) return path;
  try {
    readFileSync(resolve(publicDir, '.' + decodeURI(path)));
    return path;
  } catch {
    return MEDIA_BASE + path;
  }
}

/** Markdown -> plain text, for search and reading time. */
export function plain(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<letter-generator>[\s\S]*?<\/letter-generator>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>|]|\\(?=\S)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const readingMinutes = (md = '') => Math.max(1, Math.round(plain(md).split(' ').length / 220));

export function description(md = '') {
  const t = plain(md);
  return t.length > 160 ? t.slice(0, t.lastIndexOf(' ', 157)) + '…' : t;
}

/* ------------------------------------------------------------------ CSV */

/** RFC 4180: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

export interface Table {
  head: string[];
  rows: string[][];
  /** Plain text per cell, for sorting, filtering and search. */
  text: string[][];
  num: boolean[];
  mono: boolean[];
  wide: boolean;
}

const strip = (h: string) => h.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
const share = (text: string[][], re: RegExp, c: number) => {
  const v = text.map(r => r[c]).filter(Boolean);
  return v.length > 0 && v.filter(x => re.test(x)).length / v.length >= 0.8;
};

export function loadTable(entry: CollectionEntry<'lists'>): Table {
  const file = resolve(dirname(entry.filePath!), entry.data.data);
  const [head, ...rest] = parseCSV(readFileSync(file, 'utf8').replace(/^﻿/, ''));
  const rows = rest.map(r => head.map((_, c) => (r[c] ?? '').trim().replace(/\n/g, '<br>')));
  const text = rows.map(r => r.map(strip));
  const num = head.map((_, c) => share(text, /^[-+]?\d[\d,]*(\.\d+)?\s?%?$/, c));
  const mono = head.map((_, c) => share(text, /^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/, c));
  return { head: head.map(h => h.trim()), rows, text, num, mono, wide: head.length > 6 };
}

export const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
