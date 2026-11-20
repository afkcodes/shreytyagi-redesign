# Writing content

Rules for adding or editing anything in `src/content/`. The root `AGENTS.md` still applies.
Field definitions live in `src/content.config.ts`; if this file and the schema disagree, the
schema wins and this file should be fixed.

## Where a page goes

The folder is the section and the file name is the public URL. Never rename or move a file
once it exists.

| Section | Folder | URL of `name.md` | Use for |
|---|---|---|---|
| Articles | `articles/` | `/articles/name.html` | Long reads: reviews, explainers, analysis |
| Blogs | `blogs/` | `/blogs/name.html` | Personal notes and experiences |
| Photos | `photos/` | `/photos/name.html` | Photo sets |
| Utilities | `utilities/` | `/utilities/name.html` | Pages built around a tool |
| Lists | `lists/` | `/lists/name.html` | A table of data (`name.md` + `name.csv`) |
| Pages | `pages/` | (fixed routes) | Stand-alone pages such as About |

`name/index.md` gives a folder URL (`/articles/name/`). Only use it to match an existing URL.

New file names: lowercase letters, digits and hyphens (`dolby-atmos-explained`). Older pages
use run-together words (`dolbycinemaindiareview`); leave those as they are.

Create pages with `npm run new -- <section> <name> "<Title>" --category <Category>`. It copies
the right template from `templates/` and fills in today's date.

## Frontmatter

```yaml
---
title: "Dolby Cinema Pune: Complete In-Depth Review"   # required; the page's h1
shortTitle: "Dolby Cinema Pune review"                  # optional; lists, search, next/previous
date: 2025-07-05                                         # required; YYYY-MM-DD, publish or last update
category: Cinemas                                        # required; one short word or two
draft: false                                             # optional; true hides it everywhere
---
```

- Quote titles that contain `:` or `"`. Use the title exactly as the author wrote it.
- Reuse an existing category where one fits (`Cinemas`, `Movies`, `Movie Review`, `Technology`,
  `Media`, `Travel`). Check with `grep -rh '^category:' src/content | sort | uniq -c`.
- Lists add `data`, `sort`, `order` and `note` (see below). Photo sets add `photos`.
- Never put a page into an index by hand. Home, section pages, search, sitemap and `llms.txt`
  read the frontmatter.

## The body

- **Paragraphs:** separate them with a blank line. A paragraph is one idea; break up walls of
  text when you're asked to edit, but don't rewrite the author's sentences.
- **Headings:** the title is the only `h1`, so the body starts at `##`. Use `##` for sections and
  `###` inside them, never skipping a level. Three or more `##` headings add an "On this page"
  rail on wide screens, so give long posts real section headings.
- **Emphasis:** `**bold**` for the few words a skimming reader needs; `_italics_` for titles
  of films and terms.
- **Lists:** `-` for bullets, `1.` for steps or rankings.
- **Links:** to other pages, use the site path (`/lists/imaxcinemasofindia.html`). To other
  sites, use the full URL.
- **Images:** `![What the image shows, in a sentence](/articles/name/photo.jpg)`. Alt text is
  required. Put the file in `public/` at that path, or leave it on the current site (see
  `PUBLIC_ASSET_BASE` in the README). Prefer `.jpg`/`.webp` under 500 KB.
- **Scene breaks:** `---` on its own line renders as `· · ·`.
- **Tables:** small tables can be Markdown tables. Anything with more than about ten rows, or
  that people will want to sort, belongs in a list (`lists/`) instead.
- **Maths:** `$$ … $$` on its own lines for display formulas; `$…$` inline. Rendered at build
  time.
- **Notes:** `<p class="aside">…</p>` for a short note set apart from the text.
- **Raw HTML:** only for tools (`<bitrate-calculator>`, `<letter-generator>`) and `aside`. No
  inline styles, scripts, iframes other than YouTube, or classes not listed in `DESIGN.md`.

## Lists (data tables)

`lists/name.md`:

```yaml
---
title: "IMAX Cinemas of India"
date: 2025-03-27            # date the data was last updated
category: Cinemas
data: ./imaxcinemasofindia.csv
sort: City                  # optional; a header name from the CSV
order: asc                  # asc or desc
note: "This list is still being refined."   # optional; one line under the table
---
Intro in Markdown: what the list covers and how to read it.
```

`lists/name.csv`:

- First row is the header. Keep header names short; they become sortable column buttons.
- One row per item, comma separated, quotes around any value with a comma or line break.
- Dates as `YYYY.MM.DD` or `YYYY-MM-DD` so they sort correctly. Numbers without units in the
  cell (put the unit in the header: `Width (ft)`).
- A cell may contain a link: `<a href="https://…">Name</a>`. Nothing else in HTML.
- Leave a cell empty rather than writing `N/A`. Repeated values are fine; the table fades them.
- Tables with more than six columns become a wide, scrolling table with pinned first columns.

Updating a list: edit the CSV, then update `date` in the `.md`. Row order doesn't matter.

## Photo sets

```yaml
photos:
  - src: "/photos/name/1.jpg"
    thumb: "/photos/name/thumbs/1.jpg"   # optional
    caption: "What the photo shows"      # optional, also used as alt text
```

## Utilities

A utility is a normal page whose body places a tool by its tag on its own line:

```md
<bitrate-calculator></bitrate-calculator>
```

`<letter-generator>` wraps the letter text itself (see `utilities/requestinfinityvision.md`).
New tools are code changes: see `src/AGENTS.md`.

## Don't

- Don't invent or "improve" facts, figures, dates or data rows.
- Don't add emoji, decorative images or stock photos.
- Don't paste HTML exported from another site; convert it to Markdown.
- Don't edit `scripts/migrate/` output by re-running it; it would overwrite these files.
