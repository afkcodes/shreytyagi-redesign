import type { APIRoute } from 'astro';
import { SECTIONS, SITE, allEntries, iso, urlOf } from '../lib/site';

export const GET: APIRoute = async () => {
  const entries = await allEntries();
  const newest = entries[0] ? iso(entries[0].data.date) : undefined;
  const urls = [
    { loc: '/', lastmod: newest },
    ...Object.keys(SECTIONS).map(s => ({ loc: `/${s}/`, lastmod: newest })),
    { loc: '/about.html', lastmod: undefined },
    ...entries.map(e => ({ loc: urlOf(e), lastmod: iso(e.data.date) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(u => `  <url><loc>${SITE}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
