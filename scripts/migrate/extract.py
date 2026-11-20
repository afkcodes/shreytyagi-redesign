#!/usr/bin/env python3
"""Step 1 of the one-off migration: old site HTML -> clean HTML + metadata (JSON).

Reuses the prototype's sanitiser, with three changes for the Markdown site:
  * links and images point at the real site paths (/articles/x.html), not #/ routes
  * blank lines typed inside one <p> become real paragraph breaks
  * short plain lines that act as section titles become <h2>

Step 2 (to-markdown.mjs) turns the result into src/content/**/*.md.
"""
import base64
import csv
import importlib.util
import io
import json
import re
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('proto', ROOT / 'prototype' / 'build.py')
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)
SRC = P.SRC = ROOT / 'source'
PUBLIC = ROOT / 'public'
OUT = Path(__file__).with_name('.extracted.json')
LIVE = P.LIVE

rows = list(csv.DictReader(io.StringIO(P.read(SRC / 'index.csv'))))
URL = {'about': '/about.html'}
for r in rows:
    link = re.sub(r'^https?://(www\.)?shreytyagi\.com', '', r['Link'].strip())
    route = P.route_of(link)
    URL[route] = '/' + route + ('/' if link.endswith('/') else '.html')


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]


class Clean(P.Sanitiser):
    alt = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.alt = dict(attrs).get('alt') or ''
        super().handle_starttag(tag, attrs)

    def _url(self, raw, kind):
        raw = (raw or '').strip()
        if not raw:
            return None, False
        if raw.startswith('data:'):
            return self._asset(raw), False
        if raw.startswith(('#', 'mailto:', 'tel:')):
            return raw, False
        absu = urljoin(LIVE + self.page_url, raw)
        p = urlparse(absu)
        if p.netloc in ('shreytyagi.com', 'www.shreytyagi.com'):
            route = P.route_of(p.path)
            if kind == 'href' and route in URL:
                return URL[route] + ('#' + p.fragment if p.fragment else ''), False
            if kind == 'src' or re.search(r'\.(?!html?$)\w{2,5}$', p.path):
                return quote(unquote(p.path), safe='/'), False  # same-site file: keep the site path
            return absu, True  # a site page that isn't published: leave it pointing at the live site
        return absu, kind == 'href'

    def _asset(self, uri):
        m = re.match(r'data:image/(\w+);base64,(.*)', uri, re.S)
        if not m:
            return None
        ext = {'jpeg': 'jpg', 'svg+xml': 'svg'}.get(m.group(1), m.group(1))
        folder = self.page_url.rsplit('/', 1)[0].strip('/')
        d = PUBLIC / folder
        d.mkdir(parents=True, exist_ok=True)
        base = slug(self.alt) or 'image'
        name, n = f'{base}.{ext}', 2
        while (d / name).exists() and (d / name).read_bytes() != base64.b64decode(m.group(2)):
            name, n = f'{base}-{n}.{ext}', n + 1
        (d / name).write_bytes(base64.b64decode(m.group(2)))
        return f'/{folder}/{name}'

    def handle_data(self, data):
        # authors typed paragraphs as blank lines inside one <p>; browsers collapse them
        if (self.mode == 'post' and not self.skip_tag and not self.cap
                and not any(n in ('pre', 'li', 'td', 'th') for _, n in self.stack)):
            parts = re.split(r'\n[ \t]*\n\s*', data)
            if len(parts) > 1:
                for i, part in enumerate(parts):
                    if i:
                        self._close_p()
                    super().handle_data(part)
                return
        super().handle_data(data)


def clean(fragment, url, rid, mode='post', skip=None):
    s = Clean(url, rid, mode, set(URL), skip)
    s.feed(fragment)
    s.close()
    return s.result(), s


PROMOTED = []


def promote_headings(html, rid):
    """A short plain paragraph, followed by a much longer one, is a section title."""
    blocks = re.split(r'(?=<(?:p|h[2-4]|ul|ol|table|hr|img|pre|blockquote|figure|div)\b)', html)
    out = []
    for i, b in enumerate(blocks):
        m = re.fullmatch(r'<p>((?:<strong>)?([^<]+?)(?:</strong>)?)</p>\s*', b, re.S)
        nxt = blocks[i + 1] if i + 1 < len(blocks) else ''
        nxt_len = len(re.sub(r'<[^>]+>', '', nxt).strip()) if nxt.startswith('<p>') else 0
        if m and i > 0:
            t = m.group(2).strip()
            if (3 <= len(t) <= 90 and len(t.split()) >= 2 and re.match(r'[A-Za-z0-9]', t)
                    and not re.search(r'[.!?,;:=…\-–—]$', t) and '=' not in t and nxt_len > max(80, len(t) * 1.5)):
                PROMOTED.append(f'{rid}: {t}')
                out.append(f'<h2>{t}</h2>\n')
                continue
        out.append(b)
    return ''.join(out)


def main():
    out, report = [], []
    for r in rows:
        section = P.SECTIONS[r['Master Category'].strip()]
        path, url = P.file_of(r['Link'])
        rid = P.route_of(r['Link'])
        y, mo, d = r['Date'].strip().split('.')
        e = {'id': rid, 'folder': URL[rid].endswith('/'), 'section': section, 'category': r['Category'].strip(),
             'csvTitle': r['Title'].strip(), 'date': f'{y}-{mo}-{d}'}
        text = P.read(path)
        regions = P.find_regions(text, P.has_class('content-container'))

        if section == 'lists':
            cfg = P.table_cfg(text)
            intro, s = clean(regions[0], url, rid)
            note = ' '.join(re.sub(r'<[^>]+>', ' ', clean(x, url, rid)[0]) for x in regions[1:])
            note = re.sub(r'\s+', ' ', re.sub(r'^\s*Please Note:\s*', '', note)).strip()
            csv_path = SRC / cfg['csvfile'].lstrip('/')
            head = next(csv.reader(io.StringIO(P.read(csv_path).lstrip('﻿'))))
            sort = head[int(cfg['sortcolumn'])].strip() if cfg['sortcolumn'] else None
            e.update(kind='list', title=s.title, byline=s.byline, html=intro, note=note,
                     csv=str(csv_path), sort=sort or None, order=cfg['sortorder'] or 'asc')

        elif rid == 'utilities/bitratecalculator':
            intro, s = clean(regions[0].split('BITRATE CALCULATOR INJECTED HERE')[0], url, rid)
            e.update(kind='tool', title=s.title, byline=s.byline,
                     html=re.sub(r'<!--.*$', '', intro, flags=re.S).strip(), tool='<bitrate-calculator></bitrate-calculator>')

        elif rid == 'utilities/requestinfinityvision':
            intro, s = clean(regions[0].split('<h5')[0], url, rid)
            letter, _ = clean(P.find_regions(text, P.has_id('printable-letter'))[0], url, rid, 'letter')
            e.update(kind='tool', title=s.title, byline=s.byline, html=intro, letter=letter)

        else:
            skip = {'encoding-tool-wrapper': (
                '<p class="aside">The interactive encoding generator from this article hasn’t been rebuilt yet. '
                f'<a href="{LIVE}{url}">Use it on the current site</a>.</p>')}
            body, s = clean(regions[0], url, rid, skip=skip)
            body = promote_headings(body, rid)
            e.update(kind='post', title=s.title or e['csvTitle'], byline=s.byline, html=body)
            g = re.search(r'class="gallery-container[^"]*"[^>]*csvfile="([^"]+)"', text)
            if g:
                gallery = []
                for row in csv.reader(io.StringIO(P.read(path.parent / g.group(1)))):
                    if row and row[0].strip():
                        rel = lambda u: quote(urlparse(urljoin(LIVE + url, u.strip())).path, safe='/%')
                        gallery.append({'src': rel(row[1]), 'thumb': rel(row[0]), 'caption': (row[2].strip() if len(row) > 2 else '')})
                e['photos'] = gallery

        if e['title'] != e['csvTitle']:
            report.append(f'title  {rid}: index.csv "{e["csvTitle"]}"  vs page "{e["title"]}"')
        if e.get('byline'):
            m = re.search(r'(\d{1,2}) (\w{3})\w*,? (\d{4})', e['byline'])
            if m:
                months = 'jan feb mar apr may jun jul aug sep oct nov dec'.split()
                bd = f'{m.group(3)}-{months.index(m.group(2).lower()) + 1:02d}-{int(m.group(1)):02d}'
                if bd != e['date']:
                    report.append(f'date   {rid}: index.csv {e["date"]}  vs byline {bd}')
        out.append(e)

    about, _ = clean(P.find_regions(P.read(SRC / 'about.html'), P.has_class('content-container'))[0], '/about.html', 'about')
    OUT.write_text(json.dumps({'entries': out, 'about': about}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(out)} entries -> {OUT.name}')
    print('\nheadings promoted:\n  ' + '\n  '.join(PROMOTED))
    print('\nindex.csv vs page disagreements:\n  ' + '\n  '.join(report))


if __name__ == '__main__':
    main()
