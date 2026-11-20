# shreytyagi.com — redesign

A minimal, fast rebuild of [shreytyagi.com](https://shreytyagi.com) on the
[hanji](https://github.com/afkcodes/hanji) design system. Every page is a Markdown file;
data lists are Markdown plus a CSV. [Astro](https://astro.build) turns them into plain static
HTML at the **same URLs as the current site**, so existing links keep working.

```bash
npm install
npm run dev      # local preview with live reload
npm run build    # static site in dist/ (upload anywhere, e.g. GitHub Pages)
npm run check    # type-check, plus content validation
```

## Writing

Everything lives in `src/content/`. The folder is the section; the file name is the URL.

| File | URL |
|---|---|
| `src/content/articles/dolbycinemaindiareview.md` | `/articles/dolbycinemaindiareview.html` |
| `src/content/articles/youtube_av1_encoding/index.md` | `/articles/youtube_av1_encoding/` |
| `src/content/lists/seenatcinema.md` + `seenatcinema.csv` | `/lists/seenatcinema.html` |
| `src/content/pages/about.md` | `/about.html` |

### An article, blog, photo set or utility

```md
---
title: "Dolby Cinema Pune: Complete In-Depth Review"
shortTitle: "Dolby Cinema Pune Review"   # optional: used in lists, search, next/previous
date: 2025-07-05
category: Cinemas
# draft: true                            # optional: hides it everywhere without deleting it
---

Write normally. A blank line starts a new paragraph.

## A section heading

Long posts with three or more `##` headings get an "On this page" rail on wide screens.

![What the photo shows](/articles/dhurandhar2inepiqluxonimages/IMG_1976.jpeg)

$$
\frac{D_i}{D_f - D_o - D_e} \times \left( \frac{A_n}{A_i} - 1 \right) \times 100
$$
```

The section list, home page, next/previous links and search are all generated from this
frontmatter. There is no separate index to keep in sync. If a required field is missing or
misspelt, the build stops and says which file.

### A data list

`src/content/lists/imaxcinemasofindia.md`:

```md
---
title: "IMAX Cinemas of India"
date: 2025-03-27
category: Cinemas
data: ./imaxcinemasofindia.csv   # first row is the header
sort: City                       # optional: column to sort by on open
order: asc                       # asc | desc
note: "This list is still being refined."   # optional: shown under the table
---

Intro text, in Markdown, shown above the table.
```

Edit the CSV in any spreadsheet app. Tables are rendered as HTML at build time, then
enhanced with sorting, filtering and pinned columns. Tables with more than six columns
scroll inside a frame.

### Photo sets

Add a `photos:` list to the frontmatter (`src`, optional `thumb` and `caption`). The page
shows a grid with a full-screen viewer.

### Tools

Utilities are Markdown pages that place a tool with a plain HTML tag:

```md
<bitrate-calculator></bitrate-calculator>
```

`<letter-generator>` wraps a letter written in the page itself and adds the form, live
preview and print button. Tool code lives in `src/scripts/tools.ts` and only loads on
utility pages.

## Images and downloads

Use the site path (`/articles/x/photo.jpg`). Files in `public/` are served from here;
anything else is fetched from `PUBLIC_ASSET_BASE`, which defaults to
`https://shreytyagi.com` while the large photo folders still live on the current site.
Once they're copied into `public/`, build with `PUBLIC_ASSET_BASE=""`.

## How it's built

- `src/content.config.ts`: the content schema (what each frontmatter field means).
- `src/lib/site.ts`: URLs, dates, CSV parsing, search text.
- `src/layouts/Base.astro`, `src/components/`: page chrome, index lists, tables, gallery, contents rail.
- `src/styles/global.css`: hanji tokens (paper and charcoal grounds, scarlet accent, Figtree and DM Mono).
- `astro.config.mjs`: keeps the old URL shapes, prefetches pages on hover, renders maths at build time.

Search (`/` or `⌘K`) reads `/search.json`, generated at build time with the text of every
page and every table row. It is only downloaded the first time someone opens search.

## History

- `scripts/migrate/`: the one-off conversion from the old Bootstrap pages and `index.csv`.
  It restored paragraph breaks that the old HTML had collapsed, and turned title-like lines
  into real headings. **Don't re-run it**: it would overwrite edits in `src/content/`.
- `prototype/`: the earlier single-file prototype, kept for reference.
