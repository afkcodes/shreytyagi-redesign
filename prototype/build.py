#!/usr/bin/env python3
"""Build the minimal shreytyagi.com redesign.

Reads every page published in source/index.csv (plus About), pulls the real
content out of the old Bootstrap pages, cleans it down to plain semantic HTML,
and writes one self-contained index.html from template.html.

    python3 build.py            # -> index.html (+ assets/ for inlined images)
"""
import base64
import csv
import hashlib
import html
import io
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse

ROOT = Path(__file__).parent
SRC = ROOT.parent / 'source'
LIVE = 'https://shreytyagi.com'
ASSETS = ROOT / 'assets'

VOID = {'br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track'}
INLINE_OUT = {'a', 'strong', 'em', 'i', 'u', 'sub', 'sup', 'code', 'small', 'mark', 's', 'del'}
BLOCK = {'p', 'div', 'li', 'figcaption', 'details', 'summary', 'iframe', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'pre', 'blockquote', 'section', 'article', 'figure', 'hr'}

SECTIONS = {
    'Articles': 'articles', 'Blogs': 'blogs', 'Lists': 'lists',
    'Utilities': 'utilities', 'Photos': 'photos',
}


# ---------------------------------------------------------------- regions
class _Finder(HTMLParser):
    """Raw inner-HTML of every element matching pred (outermost only)."""

    def __init__(self, text, pred):
        super().__init__(convert_charrefs=False)
        self.text, self.pred = text, pred
        self.lines = [0]
        for m in re.finditer('\n', text):
            self.lines.append(m.end())
        self.out, self.tag, self.depth, self.start = [], None, 0, 0

    def _off(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        if self.tag is None:
            if self.pred(tag, dict(attrs)):
                self.tag, self.depth = tag, 1
                self.start = self._off() + len(self.get_starttag_text())
        elif tag == self.tag:
            self.depth += 1

    def handle_endtag(self, tag):
        if self.tag and tag == self.tag:
            self.depth -= 1
            if self.depth == 0:
                self.out.append(self.text[self.start:self._off()])
                self.tag = None


def find_regions(text, pred):
    f = _Finder(text, pred)
    f.feed(text)
    f.close()
    return f.out


def has_class(name):
    return lambda tag, a: name in (a.get('class') or '').split()


def has_id(name):
    return lambda tag, a: a.get('id') == name


# ---------------------------------------------------------------- sanitiser
POST_TAGS = {'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'u',
             'sub', 'sup', 'br', 'hr', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot',
             'tr', 'th', 'td', 'caption', 'blockquote', 'code', 'pre', 'small', 'mark', 's', 'del',
             'details', 'summary', 'iframe'}
CELL_TAGS = {'a', 'br', 'strong', 'b', 'em', 'i', 'sub', 'sup', 'small'}
RENAME = {'h1': 'h2', 'h2': 'h2', 'h3': 'h2', 'h4': 'h3', 'h5': 'h4', 'h6': 'h4', 'b': 'strong'}
DROP = {'script', 'style', 'noscript', 'button', 'select', 'textarea', 'label', 'head', 'nav', 'form', 'svg', 'option'}

LETTER_CLASSES = {
    'doc-header-table': 'tofrom', 'doc-header-cell': 'cell', 'doc-header-right': 'right',
    'doc-subject': 'subject', 'doc-section-title': 'sec', 'comparison-grid': 'pair',
    'visual-card': 'fig', 'visual-card-title': 'figt', 'bad': 'bad', 'good': 'good',
    'visual-caption': 'figc', 'req-grid': 'req', 'action-callout': 'callout',
    'doc-signoff': 'signoff', 'screen-label': 'screen-label', 'screen-label-cap': 'screen-label-cap',
    'ref-photo': 'photo',
}


class Sanitiser(HTMLParser):
    def __init__(self, page_url, slug, mode, routes, skip_ids=None):
        super().__init__(convert_charrefs=True)
        self.page_url, self.slug, self.mode, self.routes = page_url, slug, mode, routes
        self.allowed = CELL_TAGS if mode == 'cell' else POST_TAGS
        self.skip_ids = skip_ids or {}
        self.out, self.stack = [], []
        self.skip_tag, self.skip_depth = None, 0
        self.title, self.byline = None, None
        self.cap, self.cap_buf = None, []
        self.emitted = False
        self.words = 0
        self.img_n = 0
        self.svg_n = 0

    # -- helpers
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
        if kind == 'href' and p.netloc in ('shreytyagi.com', 'www.shreytyagi.com'):
            r = route_of(p.path)
            if r in self.routes:
                return '#/' + r, False
        return absu, kind == 'href'

    def _asset(self, uri):
        m = re.match(r'data:image/(\w+);base64,(.*)', uri, re.S)
        if not m:
            return None
        ext = {'jpeg': 'jpg', 'svg+xml': 'svg'}.get(m.group(1), m.group(1))
        data = base64.b64decode(m.group(2))
        self.img_n += 1
        name = f'{self.slug.replace("/", "-")}-{self.img_n:02d}-{hashlib.sha1(data).hexdigest()[:6]}.{ext}'
        ASSETS.mkdir(exist_ok=True)
        (ASSETS / name).write_bytes(data)
        return 'assets/' + name

    def _classes(self, a):
        if self.mode != 'letter':
            return ''
        cls = [LETTER_CLASSES[c] for c in (a.get('class') or '').split() if c in LETTER_CLASSES]
        return ' '.join(cls)

    # -- parser hooks
    def handle_starttag(self, tag, attrs):
        a = {k: (v or '') for k, v in attrs}
        if self.skip_tag:
            if tag == self.skip_tag and tag not in VOID:
                self.skip_depth += 1
            return
        if self.cap == 'byline' and tag in BLOCK:
            self._end_cap()  # byline <p> is often left unclosed
        elif self.cap:
            return
        if a.get('id') in self.skip_ids:
            self.out.append(self.skip_ids[a['id']])
            self._skip(tag)
            return
        if tag == 'svg' and self.mode == 'letter':
            self.out.append(f'<div class="frame" data-n="{self.svg_n}"></div>')
            self.svg_n += 1
            self._skip(tag)
            return
        if tag in DROP:
            self._skip(tag)
            return
        # headline + byline are lifted out of the body
        if self.mode == 'post' and not self.emitted and self.title is None and tag in ('h1', 'h2', 'h3'):
            self.cap, self.cap_buf = 'title', []
            return
        if self.mode == 'post' and 'articleauth' in a.get('class', ''):
            self.cap, self.cap_buf = 'byline', []
            return
        if self.mode == 'post' and tag in BLOCK:
            self._close_p()  # what a browser does: a block start ends any open <p>
        cls = self._classes(a)
        keep_span = tag in ('span', 'div', 'strong') and (cls or (self.mode == 'letter' and a.get('id', '').startswith('out')))
        if tag not in self.allowed and not keep_span:
            if tag not in VOID:
                self.stack.append((tag, None))  # unwrapped: tracked so its end tag closes nothing else
            return
        name = RENAME.get(tag, tag)
        if self.mode != 'post' and name in ('h2', 'h3', 'h4'):
            name = 'h3'
        attrs_out = []
        if tag == 'a':
            href, ext = self._url(a.get('href'), 'href')
            if href:
                attrs_out.append(f'href="{html.escape(href)}"')
                if ext:
                    attrs_out.append('target="_blank" rel="noopener"')
        elif tag == 'img':
            src, _ = self._url(a.get('src'), 'src')
            if not src:
                return
            attrs_out += [f'src="{html.escape(src)}"', f'alt="{html.escape(a.get("alt", ""))}"', 'loading="lazy" decoding="async"']
        elif tag == 'iframe':
            src = a.get('src', '')
            if 'youtube' not in src:
                self._skip(tag)
                return
            attrs_out += [f'src="{html.escape(src)}"', 'allowfullscreen loading="lazy"']
        elif tag in ('td', 'th'):
            for k in ('colspan', 'rowspan'):
                if a.get(k):
                    attrs_out.append(f'{k}="{html.escape(a[k])}"')
        if cls:
            attrs_out.append(f'class="{cls}"')
        if self.mode == 'letter' and a.get('id', '').startswith('out'):
            attrs_out.append(f'data-out="{html.escape(a["id"])}"')
        if self.mode == 'post' and not self._named():
            if name == 'br':
                return
            if name in INLINE_OUT:
                self._open_p()
        self.out.append('<' + name + (' ' + ' '.join(attrs_out) if attrs_out else '') + '>')
        if name not in VOID:
            self.stack.append((tag, name))
        self.emitted = True

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def _named(self):
        return any(n for _, n in self.stack)

    def _open_p(self):
        self.out.append('<p>')
        self.stack.append(('p', 'p'))

    def _close_p(self):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][1] == 'p':
                for _, n in reversed(self.stack[i:]):
                    if n:
                        self.out.append(f'</{n}>')
                del self.stack[i:]
                return

    def _skip(self, tag):
        if tag in VOID:
            return
        self.skip_tag, self.skip_depth = tag, 1

    def handle_endtag(self, tag):
        if self.skip_tag:
            if tag == self.skip_tag:
                self.skip_depth -= 1
                if self.skip_depth == 0:
                    self.skip_tag = None
            return
        if self.cap and ((self.cap == 'title' and tag in ('h1', 'h2', 'h3')) or (self.cap == 'byline' and tag == 'p')):
            self._end_cap()
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for _, n in reversed(self.stack[i:]):
                    if n:
                        self.out.append(f'</{n}>')
                del self.stack[i:]
                return

    def _end_cap(self):
        txt = re.sub(r'\s+', ' ', ''.join(self.cap_buf)).strip()
        setattr(self, self.cap, txt)
        self.cap = None

    def handle_data(self, data):
        if self.skip_tag:
            return
        if self.cap:
            self.cap_buf.append(data)
            return
        if data.strip():
            if self.mode == 'post' and not self._named():
                self._open_p()
            self.emitted = True
            self.words += len(data.split())
        self.out.append(html.escape(data, quote=False))

    def result(self):
        if self.cap:
            self._end_cap()
        for _, n in reversed(self.stack):
            if n:
                self.out.append(f'</{n}>')
        s = ''.join(self.out)
        if '<pre' not in s:
            s = re.sub(r'[ \t\r\f\v]*\n\s*', '\n', s)
            s = re.sub(r'[ \t]{2,}', ' ', s)
        s = re.sub(r'<p>\s*[—–\-_]{3,}\s*</p>', '<hr>', s)
        for _ in range(2):
            s = re.sub(r'<(p|li|strong|em|h2|h3|h4|ul|ol)>\s*(<br>\s*)*</\1>', '', s)
        return s.strip()


def sanitise(fragment, page_url, slug, mode, routes, skip_ids=None):
    s = Sanitiser(page_url, slug, mode, routes, skip_ids)
    s.feed(fragment)
    s.close()
    return s.result(), s


# ---------------------------------------------------------------- helpers
def route_of(path):
    """'/articles/x.html' -> 'articles/x'; '/articles/y/' -> 'articles/y'."""
    p = path.split('#')[0].split('?')[0].strip()
    p = re.sub(r'^https?://(www\.)?shreytyagi\.com', '', p)
    p = '/' + p.lstrip('/')
    p = re.sub(r'/index\.html$', '/', p)
    p = re.sub(r'\.html$', '', p)
    return p.strip('/')


def file_of(link):
    p = re.sub(r'^https?://(www\.)?shreytyagi\.com', '', link.strip())
    p = '/' + p.lstrip('/')
    if p.endswith('/'):
        p += 'index.html'
    return SRC / p.lstrip('/'), p


def read(path):
    return path.read_text(encoding='utf-8', errors='replace')


def table_cfg(text):
    m = re.search(r'<div[^>]*class="table-container"[^>]*>', text)
    tag = m.group(0) if m else ''
    get = lambda k: (re.search(fr'{k}="([^"]*)"', tag) or [None, None])[1]
    return {k: get(k) for k in ('csvfile', 'fullwidth', 'sortcolumn', 'sortorder', 'visiblecolumns')}


def load_csv(path, page_url, slug, routes):
    text = read(path).lstrip('﻿')
    rows = [r for r in csv.reader(io.StringIO(text)) if any(c.strip() for c in r)]
    width = len(rows[0])
    out = []
    for r in rows:
        r = (r + [''] * width)[:width]
        out.append([sanitise(c.strip().replace('\n', '<br>'), page_url, slug, 'cell', routes)[0] for c in r])
    return out


# ---------------------------------------------------------------- build
def build():
    entries_raw = list(csv.DictReader(io.StringIO(read(SRC / 'index.csv'))))
    routes = {route_of(e['Link']) for e in entries_raw} | {'about'}

    entries, posts, lists, tools = [], {}, {}, {}
    for e in entries_raw:
        section = SECTIONS[e['Master Category'].strip()]
        path, url = file_of(e['Link'])
        rid = route_of(e['Link'])
        y, m, d = e['Date'].strip().split('.')
        item = {'id': rid, 'section': section, 'category': e['Category'].strip(),
                'title': e['Title'].strip(), 'date': f'{y}-{m}-{d}'}
        if not path.exists():
            item.update(kind='external', url=LIVE + url)
            entries.append(item)
            continue
        text = read(path)
        regions = find_regions(text, has_class('content-container'))

        if section == 'lists':
            cfg = table_cfg(text)
            intro, s = sanitise(regions[0], url, rid, 'post', routes)
            note = ''.join(sanitise(r, url, rid, 'post', routes)[0] for r in regions[1:])
            rows = load_csv(SRC / cfg['csvfile'].lstrip('/'), url, rid, routes)
            lists[rid] = {'title': s.title or item['title'], 'intro': intro, 'note': note, 'rows': rows,
                          'sort': int(cfg['sortcolumn']) if cfg['sortcolumn'] else None,
                          'order': cfg['sortorder'] or None, 'wide': cfg['fullwidth'] == 'true'}
            item.update(kind='list', count=len(rows) - 1)

        elif rid == 'utilities/bitratecalculator':
            raw = regions[0].split('BITRATE CALCULATOR INJECTED HERE')[0]
            intro, s = sanitise(raw, url, rid, 'post', routes)
            tools[rid] = {'title': s.title, 'intro': re.sub(r'<!--.*$', '', intro, flags=re.S).strip()}
            item.update(kind='tool', tool='bitrate')

        elif rid == 'utilities/requestinfinityvision':
            raw = regions[0].split('<h5')[0]
            intro, s = sanitise(raw, url, rid, 'post', routes)
            intro = re.sub(r'<div[^>]*>\s*$', '', intro)
            letter_raw = find_regions(text, has_id('printable-letter'))[0]
            letter, _ = sanitise(letter_raw, url, rid, 'letter', routes)
            tools[rid] = {'title': s.title, 'byline': s.byline, 'intro': intro, 'letter': letter}
            item.update(kind='tool', tool='letter')

        else:
            skip = {'encoding-tool-wrapper': (
                '<p class="aside">The interactive encoding generator from this article isn’t rebuilt in '
                f'this prototype. <a href="{LIVE}{url}" target="_blank" rel="noopener">Open it on shreytyagi.com ↗</a></p>')}
            body, s = sanitise(regions[0], url, rid, 'post', routes, skip)
            gallery = None
            g = re.search(r'class="gallery-container[^"]*"[^>]*csvfile="([^"]+)"', text)
            if g:
                gpath = path.parent / g.group(1)
                rows = [r for r in csv.reader(io.StringIO(read(gpath))) if r and r[0].strip()]
                q = lambda u: quote(urljoin(LIVE + url, u.strip()), safe=':/%')
                gallery = [[q(r[0]), q(r[1]),
                            r[2].strip() if len(r) > 2 else ''] for r in rows]
            posts[rid] = {'gallery': gallery, 'title': s.title or item['title'], 'html': body,
                          'mins': max(1, round(s.words / 220)),
                          'math': '\\[' in body or '\\(' in body}
            item.update(kind='post')
        entries.append(item)

    about_html, s = sanitise(find_regions(read(SRC / 'about.html'), has_class('content-container'))[0],
                             '/about.html', 'about', 'post', routes)

    entries.sort(key=lambda x: x['date'], reverse=True)
    data = {'entries': entries, 'posts': posts, 'lists': lists, 'tools': tools,
            'about': about_html, 'year': 2026}
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    tpl = read(ROOT / 'template.html')
    out = tpl.replace('/*__DATA__*/null', payload)
    (ROOT / 'index.html').write_text(out, encoding='utf-8')
    kinds = {}
    for e in entries:
        kinds[e['kind']] = kinds.get(e['kind'], 0) + 1
    print(f'index.html  {len(out) / 1024:.0f} KB  ·  {len(entries)} entries  ·  {kinds}')


if __name__ == '__main__':
    build()
