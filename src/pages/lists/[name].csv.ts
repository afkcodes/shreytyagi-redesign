import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

/** /lists/name.csv: each list's data, exactly as stored. */
export const getStaticPaths = (async () =>
  (await getCollection('lists', e => !e.data.draft)).map(entry => ({ params: { name: entry.id.slice('lists/'.length) }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const entry = (props as { entry: CollectionEntry<'lists'> }).entry;
  const csv = readFileSync(resolve(dirname(entry.filePath!), entry.data.data), 'utf8');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
