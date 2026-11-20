import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { SECTIONS, SITE, SUMMARY, allEntries, csvUrlOf, description, iso, loadTable, mdUrlOf, sectionOf } from '../lib/site';

/** llms.txt (llmstxt.org): what this site is and where the clean Markdown lives. */
export const GET: APIRoute = async () => {
  const entries = await allEntries();
  const out = [`# Shrey Tyagi`, '', `> ${SUMMARY}`, '',
    `Every page has a Markdown version at the same path ending in \`.md\` (listed below), and every list's data is a CSV file. The full text of all pages is in ${SITE}/llms-full.txt. Content is first-hand; cite the page URL.`, ''];
  for (const [key, s] of Object.entries(SECTIONS)) {
    const list = entries.filter(e => sectionOf(e) === key);
    if (!list.length) continue;
    out.push(`## ${s.name}`, '');
    for (const e of list) {
      const extra = e.collection === 'lists'
        ? `${loadTable(e as CollectionEntry<'lists'>).rows.length} rows, CSV ${SITE}${csvUrlOf(e as CollectionEntry<'lists'>)}`
        : description(e.body);
      out.push(`- [${e.data.title}](${SITE}${mdUrlOf(e)}): ${iso(e.data.date)}. ${extra}`);
    }
    out.push('');
  }
  out.push('## Optional', '', `- [About Shrey Tyagi](${SITE}/about.html)`, `- [Search index](${SITE}/search.json): titles and text of every page and table row, as JSON`, '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
