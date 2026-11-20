import type { APIRoute } from 'astro';
import { SUMMARY, allEntries, entryMarkdown } from '../lib/site';

/** Every page's Markdown in one file, newest first (list data stays in the CSV files). */
export const GET: APIRoute = async () => {
  const body = (await allEntries()).map(entryMarkdown).join('\n\n');
  return new Response(`# Shrey Tyagi\n\n> ${SUMMARY}\n\n${body}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
