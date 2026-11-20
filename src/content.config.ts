import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Entry ids are the file path without `.md`, so they map 1:1 to the old URLs. */
const byPath = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const common = {
  /** The headline on the page. */
  title: z.string().min(1),
  /** Optional shorter title for index rows, search results and next/previous links. */
  shortTitle: z.string().optional(),
  date: z.coerce.date(),
  category: z.string().min(1),
  /** Hide from every index and search without deleting the file. */
  draft: z.boolean().default(false),
};

/** Articles, blogs, photo sets and utilities: Markdown pages. Section = first folder. */
const posts = defineCollection({
  loader: glob({ base: './src/content', pattern: '{articles,blogs,photos,utilities}/**/*.md', generateId: byPath }),
  schema: z.object({
    ...common,
    photos: z
      .array(z.object({ src: z.string(), thumb: z.string().optional(), caption: z.string().optional() }))
      .optional(),
  }),
});

/** Data lists: a Markdown intro plus a CSV file next to it. */
const lists = defineCollection({
  loader: glob({ base: './src/content', pattern: 'lists/**/*.md', generateId: byPath }),
  schema: z.object({
    ...common,
    /** CSV path, relative to the Markdown file. First row is the header. */
    data: z.string().regex(/\.csv$/),
    /** Column (by header name) to sort by when the page opens. */
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
    /** One line shown under the table. */
    note: z.string().optional(),
  }),
});

/** Stand-alone pages such as About. */
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '*.md' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { posts, lists, pages };
