# AGENTS.md

Instructions for AI coding agents (Gemini, Codex, Claude, Copilot, Cursor, Windsurf, Junie,
Cline and any other) working in this repository. People should start with `README.md`.

**This file is the single source of truth.** Tool-specific files (`GEMINI.md`, `CLAUDE.md`,
`.github/copilot-instructions.md` and the rest) only point here. Read these too, before the
matching kind of change:

| Before you… | Read |
|---|---|
| add or edit any page, list or data | [`src/content/AGENTS.md`](src/content/AGENTS.md) |
| change anything visual (CSS, markup, components) | [`DESIGN.md`](DESIGN.md) |
| change code (components, routes, scripts, config) | [`src/AGENTS.md`](src/AGENTS.md) |

If instructions conflict, the file closest to what you are editing wins, then this file.

## What this project is

`shreytyagi.com`: a personal site about cinema technology (IMAX, Dolby Cinema, HDR, 3D,
encoding), mostly in India. It is a static site built with **Astro 7** from **Markdown**
(pages) and **CSV** (data tables). The design is a minimal take on the **hanji** design system:
paper and charcoal grounds, one scarlet accent, Figtree and DM Mono, no cards. It is built to
be fast: plain HTML at the same URLs as the old site, a few KB of JavaScript per page, and
pages prefetched on hover.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 22+). |
| `npm run dev` | Live preview at http://localhost:4321. |
| `npm run new -- <section> <slug> "<Title>" [--category <Category>]` | Create a page with correct frontmatter from `templates/`. Always use this to add a page. |
| `npm run build` | Static site in `dist/`. Always a fresh content build. |
| `npm run verify` | Type check, build, then every guardrail below. **Must pass before you finish.** Cloudflare runs it on every push and won't deploy if it fails. |
| `npm run preview` | Serve `dist/` with Cloudflare's own runtime, exactly as production does. |
| `npm run media:check` | Confirm every image the content uses exists on GitHub (see `site.config.mjs`). |

## Map

```
src/content/            all content; folder = section, file name = URL
  articles/ blogs/ photos/ utilities/   name.md, or name/index.md for a folder URL
  lists/                name.md + name.csv
  pages/about.md
src/content.config.ts   frontmatter schema: the definition of every field
src/lib/site.ts         sections, URLs, dates, CSV parsing, search text
src/pages/              routes: generic, one per page type; never one per article
src/components/         server-rendered Astro components
src/scripts/            small TypeScript modules that enhance static HTML
src/styles/global.css   all CSS; hanji tokens at the top
public/                 served as-is: images, KaTeX, favicon
templates/              copy-ready Markdown for each content type (used by `npm run new`)
scripts/new.mjs         page scaffolder
scripts/media-check.mjs   checks every referenced image exists
scripts/verify.mjs      guardrails
scripts/legacy-urls.txt URLs that must keep working forever
scripts/migrate/        one-off history; never run it again
prototype/              the earlier single-file prototype; don't edit
site.config.mjs         where images come from: a GitHub repository, not Cloudflare
wrangler.jsonc          Cloudflare hosting config (see DEPLOY.md); don't change html_handling
DEPLOY.md               how the site is hosted and deployed
```

## Golden rules

1. **One source of truth.** A page's title, date, category and settings live only in its
   frontmatter. Never add index files, manifests, JSON lists or hard-coded page lists. The home
   page, section pages, next/previous links, search, sitemap and `llms.txt` are all generated.
2. **URLs are permanent.** Never rename, move or delete a file in `src/content/`; its path is a
   public URL. Don't change `build.format`, the route files or `scripts/legacy-urls.txt`. To
   hide a page, set `draft: true`.
3. **Design comes from tokens.** Use the CSS variables in `src/styles/global.css` and the
   patterns in `DESIGN.md`. No new colours, fonts, shadows, radii or breakpoints; one accent
   only. No cards, gradients, emoji icons or icon fonts.
4. **No JavaScript unless it earns it.** Pages are static HTML. Client code is only for
   progressive enhancement (search, table sorting, tools), written as small TypeScript modules
   or custom elements. No React, Vue, Svelte or other UI frameworks, no `client:*` islands,
   no third-party scripts, fonts, analytics or CDNs.
5. **Keep the budgets.** `npm run verify` enforces them; don't raise a limit to make it pass.
   - JavaScript per page: at most 12 KB gzipped (today about 1.4 KB, or 4 KB on tool pages).
   - HTML per page: at most 64 KB gzipped. CSS is inlined; the only stylesheet file is
     `/katex/katex.min.css`, and only on pages with formulas.
   - `search.json`: at most 150 KB gzipped, loaded only when search opens.
   - No code or fonts from other origins. Content images come from GitHub (`site.config.mjs`),
     never from the Cloudflare deploy; don't copy them into `public/`.
6. **Never invent content.** This is a first-hand personal site. Don't make up facts, dates,
   ratings, measurements or data rows. Keep the author's wording; change only what you were
   asked to change, and say what you couldn't verify.
7. **Accessible by default.** One `h1` per page (it comes from `title`), headings in order,
   alt text on every image, every control reachable by keyboard, and colour never the only
   signal.

## Common tasks

**Add an article, blog post, photo set or utility.**
`npm run new -- articles dolby-atmos-explained "Dolby Atmos Explained" --category Cinemas`,
then write the body. Rules for Markdown, headings, images and maths are in
`src/content/AGENTS.md`.

**Add a data list.** `npm run new -- lists screenx-cinemas "ScreenX Cinemas of India" --category Cinemas`
creates the `.md` and a `.csv` with a header row. Fill the CSV; set `sort`/`order` to a header
name.

**Update a list.** Edit its CSV (rows can be in any order) and update `date` in the `.md`.

**Add an interactive tool.** Write a custom element in `src/scripts/tools.ts`, style it with
existing tool classes from `DESIGN.md`, and place it in a utility page with its tag. See
`src/AGENTS.md`.

**Deploying.** Never deploy by hand. Merging to `main` deploys through Cloudflare after
`npm run verify` passes; pull requests get preview links. `DEPLOY.md` has the setup.

**Change the design.** Read `DESIGN.md` first. Change tokens, not individual rules. Check light
and dark themes, and widths of 375, 768 and 1440 px.

## Before you finish

- [ ] `npm run verify` passes. It prints each failure with the file and the reason.
- [ ] New pages show up on the home page, their section page and in search on their own. If
      you edited an index page by hand to make that happen, undo it.
- [ ] Nothing in `dist/`, `.astro/`, `node_modules/`, `source/` or `prototype/` was edited.
- [ ] Commit messages follow Conventional Commits. Use `content:` for pages and data, with the
      path (`content: add articles/dolby-atmos-explained`, `content: update lists/seenatcinema`),
      and `feat:`, `fix:`, `docs:`, `refactor:`, `perf:` or `chore:` for everything else.
      Never add `Co-Authored-By` or any other AI-attribution line to commits, pull requests or
      code comments.
