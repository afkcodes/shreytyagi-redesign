// Progressive enhancement for server-rendered data tables: sort, filter, repeat-fading.
// Rows are moved, never rebuilt, so even the 360 × 32 table stays instant.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function enhanceTable(wrap: HTMLElement) {
  const table = wrap.querySelector('table')!;
  const tbody = table.tBodies[0];
  const rows = [...tbody.rows];
  const stick = Number(wrap.dataset.stick);
  const input = wrap.previousElementSibling?.querySelector<HTMLInputElement>('.filter input');
  const count = wrap.previousElementSibling?.querySelector('.count');
  const total = rows.length;
  const cellText = new Map<HTMLTableRowElement, string[]>();
  const text = (r: HTMLTableRowElement) => {
    let t = cellText.get(r);
    if (!t) cellText.set(r, (t = [...r.cells].map(c => c.textContent!.trim())));
    return t;
  };
  const hay = new Map<HTMLTableRowElement, string>();
  let col = Number(table.dataset.sort);
  let dir = Number(table.dataset.dir);

  const empty = document.createElement('tr');
  empty.className = 'empty';
  empty.innerHTML = `<td colspan="${table.tHead!.rows[0].cells.length}"></td>`;

  function fade() {
    let prev: HTMLTableRowElement | null = null;
    for (const r of tbody.rows) {
      if (r.hidden || r === empty) continue;
      for (let c = stick; c < r.cells.length; c++) {
        const v = r.cells[c].innerHTML;
        r.cells[c].classList.toggle('rep', !!prev && v !== '' && prev.cells[c].innerHTML === v);
      }
      prev = r;
    }
  }

  function sort() {
    const sorted = [...rows].sort((a, b) => {
      if (!dir) return Number(a.dataset.i) - Number(b.dataset.i);
      const x = text(a)[col], y = text(b)[col];
      if (!x || !y) return x ? -1 : y ? 1 : 0;
      return collator.compare(x, y) * dir;
    });
    tbody.append(...sorted);
    for (const th of table.tHead!.rows[0].cells) {
      const c = Number(th.querySelector('button')!.dataset.col);
      if (dir && c === col) th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    }
    fade();
  }

  function filter(q: string) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const r of rows) {
      let h = hay.get(r);
      if (h === undefined) hay.set(r, (h = text(r).join(' \u0001 ').toLowerCase()));
      r.hidden = !terms.every(t => h!.includes(t));
      if (!r.hidden) shown++;
    }
    if (!shown) {
      empty.cells[0].textContent = `No rows match “${q}”.`;
      tbody.append(empty);
    } else empty.remove();
    if (count) count.textContent = terms.length ? `${shown} of ${total.toLocaleString('en-GB')}` : `${total.toLocaleString('en-GB')} rows`;
    fade();
  }

  table.tHead!.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-col]');
    if (!b) return;
    const c = Number(b.dataset.col);
    if (c !== col) { col = c; dir = 1; } else dir = dir === 1 ? -1 : dir === -1 ? 0 : 1;
    sort();
  });
  input?.addEventListener('input', () => filter(input.value.trim()));

  const q = new URLSearchParams(location.search).get('q');
  if (q && input) { input.value = q; filter(q); }

  if (stick === 2) {
    const first = table.querySelector<HTMLElement>('th.s0');
    if (first) table.style.setProperty('--c0', `${first.offsetWidth}px`);
  }
}
