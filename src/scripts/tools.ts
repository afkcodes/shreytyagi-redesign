// Interactive tools, used from Markdown as plain HTML tags:
//   <bitrate-calculator></bitrate-calculator>
//   <letter-generator> …letter written in Markdown/HTML… </letter-generator>

const printIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v6H7z"/></svg>';

class BitrateCalculator extends HTMLElement {
  connectedCallback() {
    const unit = (n: string, u: string, l: string) => `<label class="unit"><input inputmode="decimal" name="${n}" placeholder="0" aria-label="${l}"><span>${u}</span></label>`;
    this.innerHTML = `
      <form class="form" autocomplete="off">
        <div><span class="fl">Size counted in</span>
          <div class="seg" role="radiogroup" aria-label="Size counted in">
            <label><input type="radio" name="base" value="1024" checked><span>1024-base<small>DCP servers, Linux, Windows</small></span></label>
            <label><input type="radio" name="base" value="1000"><span>1000-base<small>Apple &amp; Android</small></span></label>
          </div></div>
        <div><span class="fl">File size</span><div class="units">${unit('tb', 'TB', 'Terabytes')}${unit('gb', 'GB', 'Gigabytes')}${unit('mb', 'MB', 'Megabytes')}</div></div>
        <div><span class="fl">Runtime</span><div class="units">${unit('h', 'h', 'Hours')}${unit('m', 'min', 'Minutes')}${unit('s', 's', 'Seconds')}</div></div>
      </form>
      <output class="result idle" aria-live="polite"><b>0.00</b><span>Mbps</span></output>
      <p class="result-2">Enter a file size and a runtime.</p>
      <details class="work"><summary>Show working</summary><pre></pre></details>`;
    const f = this.querySelector('form')!;
    f.addEventListener('submit', e => e.preventDefault());
    f.addEventListener('input', () => this.calc(f));
    this.calc(f);
  }

  calc(f: HTMLFormElement) {
    const out = this.querySelector('.result')!, out2 = this.querySelector('.result-2')!, pre = this.querySelector('pre')!;
    const fmt = (n: number, d?: number) => n.toLocaleString('en-GB', d == null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: d, maximumFractionDigits: d });
    const v = (k: string) => parseFloat((f.elements.namedItem(k) as HTMLInputElement).value) || 0;
    const base = Number((f.elements.namedItem('base') as RadioNodeList).value);
    const [tb, gb, mb, h, m, s] = ['tb', 'gb', 'mb', 'h', 'm', 's'].map(v);
    if ((!tb && !gb && !mb) || (!h && !m && !s)) {
      out.classList.add('idle'); out.querySelector('b')!.textContent = '0.00';
      out2.textContent = 'Enter a file size and a runtime.'; pre.textContent = '—';
      return;
    }
    const L = ['SIZE'];
    let totalMB = mb;
    if (tb) { L.push(`${fmt(tb)} TB × ${base} = ${fmt(tb * base)} GB`, `${fmt(tb * base)} GB × ${base} = ${fmt(tb * base * base)} MB`); totalMB += tb * base * base; }
    if (gb) { L.push(`${fmt(gb)} GB × ${base} = ${fmt(gb * base)} MB`); totalMB += gb * base; }
    const kb = totalMB * base, bytes = kb * base, bits = bytes * 8;
    L.push(`total = ${fmt(totalMB)} MB`, `${fmt(totalMB)} MB × ${base} = ${fmt(kb)} KB`, `${fmt(kb)} KB × ${base} = ${fmt(bytes)} bytes`, `${fmt(bytes)} bytes × 8 = ${fmt(bits)} bits`, '', 'RUNTIME');
    let secs = s;
    if (h) { L.push(`${fmt(h)} h × 3,600 = ${fmt(h * 3600)} s`); secs += h * 3600; }
    if (m) { L.push(`${fmt(m)} min × 60 = ${fmt(m * 60)} s`); secs += m * 60; }
    L.push(`total = ${fmt(secs)} s`, '', 'BITRATE');
    const bps = bits / secs, kbps = bps / 1000, mbps = kbps / 1000;
    L.push(`${fmt(bits)} bits ÷ ${fmt(secs)} s = ${fmt(bps, 2)} bps`, `${fmt(bps, 2)} bps ÷ 1,000 = ${fmt(kbps, 2)} kbps`, `${fmt(kbps, 2)} kbps ÷ 1,000 = ${fmt(mbps, 2)} Mbps`);
    out.classList.remove('idle');
    out.querySelector('b')!.textContent = fmt(mbps, 2);
    out2.textContent = `= ${fmt(Math.round(kbps))} kbps · ${fmt(Math.round(totalMB))} MB over ${fmt(secs)} s, ${base}-base`;
    pre.textContent = L.join('\n');
  }
}

const frameSvg: Record<string, string> = {
  0: `<svg viewBox="0 0 370 200" role="img" aria-label="Scope 2.39:1 picture with black bars on a flat screen"><rect width="370" height="200" fill="#16130f"/><rect y="22.6" width="370" height="154.8" fill="#e6e0d4"/><g font-family="Figtree Variable,Figtree,Arial,sans-serif" text-anchor="middle"><text x="185" y="15.5" font-size="9" font-weight="600" fill="#b9b3a8" letter-spacing=".8">BLACK BAR</text><text x="185" y="96" font-size="14" font-weight="650" fill="#16130f">2.39:1 scope picture</text><text x="185" y="114" font-size="10.5" fill="#5c5853">top and bottom of the screen unused</text><text x="185" y="192.5" font-size="9" font-weight="600" fill="#b9b3a8" letter-spacing=".8">BLACK BAR</text></g></svg>`,
  1: `<svg viewBox="0 0 370 200" role="img" aria-label="Flat 1.85:1 picture filling the whole flat screen"><rect x="1" y="1" width="368" height="198" fill="#e6e0d4" stroke="#16130f" stroke-width="2"/><g font-family="Figtree Variable,Figtree,Arial,sans-serif" text-anchor="middle"><text x="185" y="96" font-size="14" font-weight="650" fill="#16130f">1.85:1 flat picture</text><text x="185" y="114" font-size="10.5" fill="#5c5853">fills 100% of the screen, zero black bars</text></g></svg>`,
};

class LetterGenerator extends HTMLElement {
  connectedCallback() {
    const field = (id: string, label: string, ph: string, type = 'text') =>
      `<div><label class="fl" for="${id}">${label}</label><div class="input">${type === 'area'
        ? `<textarea id="${id}" rows="3" placeholder="${ph}"></textarea>` : `<input id="${id}" type="${type}" placeholder="${ph}">`}</div></div>`;
    this.insertAdjacentHTML('afterbegin', `
      <form class="form grid2" autocomplete="on">
        ${field('userName', 'Your name', 'e.g. Shrey Tyagi')}
        ${field('userPhone', 'Phone', 'e.g. +91 98765 43210', 'tel')}
        ${field('userEmail', 'Email', 'name@email.com', 'email')}
        <div>${field('screenType', 'Screen format <span style="font-weight:400">(optional)</span>', 'BIGPIX, PXL, PCX, EPIQ…')}<p class="hint">Typing BIGPIX makes the letter say “BIGPIX flat screen”.</p></div>
        <div class="full">${field('cinemaDetails', 'Cinema name, mall or area, and city', 'PVR INOX Cinemas&#10;Elante Mall, Industrial Area Phase 1&#10;Chandigarh', 'area')}</div>
      </form>
      <div class="actions"><button class="btn" type="button" data-print>${printIcon}Print or save as PDF</button>
        <small>In the print dialog choose “Save as PDF” and untick “Headers and footers” for a clean one-page letter.</small></div>`);
    this.querySelectorAll<HTMLElement>('.frame').forEach(f => (f.innerHTML = frameSvg[f.dataset.n ?? ''] ?? ''));
    const form = this.querySelector('form')!;
    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('input', () => this.update());
    this.querySelector('[data-print]')!.addEventListener('click', () => window.print());
    this.update();
  }

  update() {
    const v = (id: string) => (this.querySelector<HTMLInputElement>('#' + id)!.value || '').trim();
    const set = (k: string, t: string) => this.querySelectorAll(`[data-out="${k}"]`).forEach(n => (n.textContent = t));
    const name = v('userName') || '[Your Name]';
    const contact = [v('userPhone'), v('userEmail')].filter(Boolean).join(' | ') || '[Your Phone / Email]';
    const scr = v('screenType').replace(/\bflat\s*screen\b/gi, '').replace(/\bflat\b/gi, '').replace(/\bscreen\b/gi, '').trim();
    set('outHeaderName', name); set('outFooterName', name);
    set('outHeaderContact', contact); set('outFooterContact', contact);
    set('outCinemaDetails', v('cinemaDetails') || '[Cinema Name, Mall/Area & City]');
    this.querySelectorAll('.screen-label').forEach(n => (n.textContent = scr ? `${scr} flat screen` : 'flat screen'));
    this.querySelectorAll('.screen-label-cap').forEach(n => (n.textContent = scr ? `${scr} Flat Screen` : 'Flat Screen'));
  }
}

customElements.define('bitrate-calculator', BitrateCalculator);
customElements.define('letter-generator', LetterGenerator);

export {};
