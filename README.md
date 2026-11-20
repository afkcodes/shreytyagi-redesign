# shreytyagi.com — minimal redesign

A design prototype for [shreytyagi.com](https://shreytyagi.com): every page published in the
site's `index.csv`, rebuilt as one fast single-page HTML file on the
[hanji](https://github.com/afkcodes/hanji) design system.

Open `index.html` in a browser. No server and no build step are needed to view it.

## What's in it

- **Look:** hanji paper (light) and charcoal (dark) grounds, scarlet as the only accent,
  Figtree for words, DM Mono for dates and numbers. No cards.
- **Navigation:** all content ships in the page, so moving between pages doesn't fetch
  anything. Sections stay in the header; on phones they become a swipeable row.
- **Search:** `/` or `⌘K` searches the full text of every article and every table row.
  Opening a table from a result pre-fills its filter.
- **Lists:** sortable, filterable tables with sticky headers. Repeated values are faded,
  and wide tables keep their first columns pinned.
- **Utilities:** the bitrate calculator updates as you type. The Infinity Vision letter
  generator previews live and prints to a one-page PDF.

## Rebuilding

`index.html` is generated from `template.html` (design and app) and the original site's
content.

```bash
git clone --depth 1 https://github.com/shreytyagi/shreytyagi.git source
python3 build.py
```

`build.py` uses only the Python standard library. It reads `source/index.csv`, cleans each
page down to plain HTML, embeds the data tables, and writes inlined images to `assets/`.

## Not included

- The Help page; the new layout shouldn't need one.
- Pages that exist in the original repo but aren't listed in `index.csv` (treated as drafts).
- The interactive encoding generator in the x265 article, which links to the live page instead.
- HEIC photos only display in Safari, as on the live site. Article images load from
  shreytyagi.com.
