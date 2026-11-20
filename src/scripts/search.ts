// ⌘K / "/" search over every page and every table row.
// The index (/search.json) is fetched the first time it's needed, then cached.
interface Doc { u: string; t: string; f: string; s: string; c: string; d: string; x: string; r?: string[] }
interface Hit { doc: Doc; score: number; snip: string }

const sd = document.getElementById('search') as HTMLDialogElement;
const q = document.getElementById('q') as HTMLInputElement;
const res = document.getElementById('res')!;
let docs: Promise<(Doc & { lt: string; lc: string; lx: string; lr?: string[] })[]> | null = null;
let hits: Hit[] = [];
let sel = 0;

const load = () => (docs ??= fetch('/search.json')
  .then(r => r.json() as Promise<Doc[]>)
  .then(list => list.map(d => ({ ...d, lt: (d.t + ' ' + d.f).toLowerCase(), lc: (d.c + ' ' + d.s).toLowerCase(), lx: d.x.toLowerCase(), lr: d.r?.map(r => r.toLowerCase()) }))));

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const mark = (s: string, terms: string[]) =>
  terms.reduce((h, t) => h.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'), esc(s));

async function run() {
  const all = await load();
  const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) {
    hits = all.slice(0, 8).map(doc => ({ doc, score: 0, snip: '' }));
    res.innerHTML = '<li class="rh" role="presentation">Latest</li>' + hits.map((h, i) => item(h, i, [])).join('');
    return paintSel(0);
  }
  hits = [];
  for (const d of all) {
    const rows = d.lr?.map((r, i) => (terms.every(t => r.includes(t)) ? i : -1)).filter(i => i >= 0) ?? [];
    if (!terms.every(t => d.lt.includes(t) || d.lc.includes(t) || d.lx.includes(t)) && !rows.length) continue;
    let score = 0;
    for (const t of terms) score += d.lt.startsWith(t) ? 100 : d.lt.includes(t) ? 60 : d.lc.includes(t) ? 25 : 8;
    let snip = '';
    if (!terms.every(t => d.lt.includes(t))) {
      if (rows.length) snip = `${rows.length} matching row${rows.length > 1 ? 's' : ''} — ${d.r![rows[0]].slice(0, 120)}`;
      else {
        const i = d.lx.indexOf(terms[0]);
        if (i >= 0) { const a = Math.max(0, i - 50); snip = (a ? '…' : '') + d.x.slice(a, i + 90).trim() + '…'; }
      }
    }
    hits.push({ doc: d, score, snip });
  }
  hits.sort((a, b) => b.score - a.score || b.doc.d.localeCompare(a.doc.d));
  hits = hits.slice(0, 30);
  res.innerHTML = hits.length
    ? hits.map((h, i) => item(h, i, terms)).join('')
    : `<li class="none" role="presentation">Nothing found for “${esc(q.value)}”.</li>`;
  paintSel(0);
}

function item(h: Hit, i: number, terms: string[]) {
  // opening a table from a row match pre-fills its filter
  const href = h.doc.r && terms.length && h.snip.includes('matching row') ? `${h.doc.u}?q=${encodeURIComponent(terms.join(' '))}` : h.doc.u;
  return `<li role="option" id="r${i}" aria-selected="false"><a href="${esc(href)}">
    <span class="rt">${mark(h.doc.t, terms)}</span><span class="rm">${esc(h.doc.s)} · ${esc(h.doc.c)}</span>
    ${h.snip ? `<span class="rs">${mark(h.snip, terms)}</span>` : ''}</a></li>`;
}

function paintSel(i: number) {
  sel = Math.max(0, Math.min(hits.length - 1, i));
  res.querySelectorAll('li[role="option"]').forEach((li, n) => li.setAttribute('aria-selected', String(n === sel)));
  const cur = document.getElementById('r' + sel);
  q.setAttribute('aria-activedescendant', cur ? cur.id : '');
  cur?.scrollIntoView({ block: 'nearest' });
}

function open() {
  if (sd.open) return;
  sd.showModal();
  q.select();
  run();
}

q.addEventListener('input', run);
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); paintSel(sel + (e.key === 'ArrowDown' ? 1 : -1)); }
  else if (e.key === 'Enter') { const a = document.querySelector<HTMLAnchorElement>(`#r${sel} a`); if (a) { e.preventDefault(); location.href = a.href; } }
});
sd.addEventListener('click', e => { if (e.target === sd) sd.close(); });
document.addEventListener('click', e => {
  if ((e.target as Element).closest('[data-open-search]')) { e.preventDefault(); open(); }
});
// warm the index when the pointer heads for the button
document.querySelector('[data-open-search]')?.addEventListener('pointerenter', () => load(), { once: true });
document.addEventListener('keydown', e => {
  const el = document.activeElement as HTMLElement | null;
  const typing = !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey)) {
    e.preventDefault();
    open();
  }
});
