import type { APIRoute, GetStaticPaths } from 'astro';
import { allEntries, entryMarkdown, type Entry } from '../lib/site';

/** /articles/name.md and /articles/name/index.md: the page as Markdown, for agents. */
export const getStaticPaths = (async () =>
  (await allEntries()).map(entry => ({ params: { slug: entry.id }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(entryMarkdown((props as { entry: Entry }).entry), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
