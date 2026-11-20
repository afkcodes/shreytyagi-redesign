# shreytyagi.com — redesign

A minimal, fast rebuild of [shreytyagi.com](https://shreytyagi.com) on the
[hanji](https://github.com/afkcodes/hanji) design system. Every page is a Markdown file;
data lists are Markdown plus a CSV. [Astro](https://astro.build) turns them into plain static
HTML at the **same URLs as the current site**, so existing links keep working.

```bash
npm install
npm run dev            # local preview with live reload
npm run new -- articles my-article "My Article" --category Cinemas   # start a page
npm run verify         # type check + build + every guardrail (Cloudflare runs this too)
npm run preview        # serve the build with Cloudflare's runtime
```

**Hosting:** free on Cloudflare, deploying itself on every push to `main`. Step-by-step setup
for a non-developer is in [`DEPLOY.md`](DEPLOY.md).

## For AI agents

This repository is set up so any coding agent produces the same design and structure:

| File | Read by |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The rules: single source of truth. Read natively by Codex, Copilot, Cursor, Windsurf, Jules, Junie, Cline, Roo, Kilo, Amp, OpenHands, Factory, Kiro, Zed and recent Claude Code. |
| [`DESIGN.md`](DESIGN.md) | The hanji design system: tokens, type, motion, components. |
| [`src/content/AGENTS.md`](src/content/AGENTS.md), [`src/AGENTS.md`](src/AGENTS.md) | Rules for content and for code; nearest file wins. |
| `GEMINI.md`, `.gemini/settings.json` | Gemini Code Assist and Gemini CLI, pointed at `AGENTS.md`. |
| `CLAUDE.md`, `.aider.conf.yml` | Claude Code (older versions) and Aider, pointed at `AGENTS.md`. |
| `templates/`, `npm run new` | Every new page starts from the right structure. |
| `npm run verify` | Enforces it all: old URLs, speed budgets, links, alt text, design tokens, agent files. |

The published site is agent-readable too: [`/llms.txt`](https://shreytyagi.com/llms.txt) lists
every page, each page has a Markdown copy at the same path ending in `.md`, every list's data is
at `/lists/<name>.csv`, and `/llms-full.txt` has the full text.

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

Images, photo sets and downloads stay on **GitHub**, in the original site's repository
(`shreytyagi/shreytyagi`); they are not copied into the Cloudflare deploy. Pages use the site
path (`/articles/x/photo.jpg`) and the build links it to
`raw.githubusercontent.com/shreytyagi/shreytyagi/main/articles/x/photo.jpg`. The repository,
branch and URL are set in one place, `site.config.mjs`. `npm run media:check` confirms every
referenced file exists. Files in `public/` (site assets) are served with the site.

## How it's built

- `src/content.config.ts`: the content schema (what each frontmatter field means).
- `src/lib/site.ts`: URLs, dates, CSV parsing, search text.
- `src/layouts/Base.astro`, `src/components/`: page chrome, index lists, tables, gallery, contents rail.
- `src/styles/global.css`: hanji tokens (paper and charcoal grounds, scarlet accent, Figtree and DM Mono, hanji springs).
- `astro.config.mjs`: keeps the old URL shapes, prefetches pages on hover, renders maths at build time, writes `dist/_redirects` for Cloudflare.
- `wrangler.jsonc`: Cloudflare hosting (see `DEPLOY.md`).

Search (`/` or `⌘K`) reads `/search.json`, generated at build time with the text of every
page and every table row. It is only downloaded the first time someone opens search.

## History

- `scripts/migrate/`: the one-off conversion from the old Bootstrap pages and `index.csv`.
  It restored paragraph breaks that the old HTML had collapsed, and turned title-like lines
  into real headings. **Don't re-run it**: it would overwrite edits in `src/content/`.
- `prototype/`: the earlier single-file prototype, kept for reference.
