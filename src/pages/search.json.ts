import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { SECTIONS, allEntries, iso, label, loadTable, plain, sectionOf, urlOf } from '../lib/site';

/** One small JSON file, fetched the first time someone opens search. */
export const GET: APIRoute = async () => {
  const docs = (await allEntries()).map(e => {
    const doc: Record<string, unknown> = {
      u: urlOf(e),
      t: label(e),
      f: e.data.title,
      s: SECTIONS[sectionOf(e)].one,
      c: e.data.category,
      d: iso(e.data.date),
      x: plain(e.body),
    };
    if (e.collection === 'lists') doc.r = loadTable(e as CollectionEntry<'lists'>).text.map(r => r.filter(Boolean).join(' · '));
    return doc;
  });
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } });
};
