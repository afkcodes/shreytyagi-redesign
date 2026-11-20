# Code

Rules for changing components, routes, scripts, styles and config. The root `AGENTS.md` still
applies, and anything visual must follow `DESIGN.md`.

## How a page is made

1. `src/content.config.ts` loads `src/content/**/*.md` into three collections: `posts`
   (articles, blogs, photos, utilities), `lists` and `pages`. Entry ids are file paths without
   `.md`, so an id maps straight to a URL.
2. Routes turn entries into files with `build.format: 'preserve'`:
   - `src/pages/[...slug].astro` → `/articles/name.html`
   - `src/pages/[section]/[folder]/index.astro` → `/articles/name/` (folder pages)
   - `src/pages/[section]/index.astro` → `/articles/index.html`
   - `src/pages/[...slug].md.ts` → `/articles/name.md` (raw Markdown for agents)
   - `src/pages/lists/[name].csv.ts` → `/lists/name.csv` (list data)
   - `src/pages/index.astro`, `about.astro`, `404.astro`
   - `search.json.ts`, `llms.txt.ts`, `llms-full.txt.ts`, `sitemap.xml.ts`, `robots.txt.ts`
3. `src/components/EntryPage.astro` renders every entry; it picks the table, gallery, tools and
   contents rail from the entry's data.
4. `src/lib/site.ts` holds the shared helpers: `SECTIONS`, `urlOf`, `allEntries`, dates,
   `loadTable` (CSV), `plain` (search text), `asset` (media paths).

Add behaviour by extending these, not by adding a route or component per page.

## Rules

- **Server first.** Render everything in `.astro` at build time. Client code only enhances
  HTML that already works without it (the table is readable without JS; search is a button
  that opens a dialog).
- **Client code** goes in `src/scripts/*.ts` as plain TypeScript, imported from a `<script>`
  tag in the component that needs it, so it ships only on pages that use it. No frameworks, no
  `client:*` directives, no new runtime dependencies without a strong reason.
- **Tools** are custom elements (see `src/scripts/tools.ts`): `class X extends HTMLElement`
  with `connectedCallback`, registered with `customElements.define('x-name', X)`. They render
  their controls with the classes in `DESIGN.md` and are loaded only on utility pages through
  `src/components/Tools.astro`.
- **CSS** lives in `src/styles/global.css` only, built from the tokens at the top. No
  component `<style>` blocks, no inline `style=""`, no CSS frameworks. Hex colours are only
  allowed inside `palette:start` / `palette:end` regions (verify enforces this).
- **Media paths** go through `asset()` (components) or the `rehypeSite` plugin (Markdown), so
  they work whether or not the file is in `public/`.
- **Types:** `npm run check` must pass with zero errors. TypeScript is strict.
- **Markdown pipeline:** Astro 7's default processor is Sätteri; this project uses
  `unified()` from `@astrojs/markdown-remark` so `remark-math` and `rehype-katex` work. Add
  plugins there.
- **Hosting:** Cloudflare serves `dist/` as exact files (`wrangler.jsonc`,
  `html_handling: "none"`). The `cloudflareRedirects` integration in `astro.config.mjs` writes
  `dist/_redirects` after each build: folder URLs serve their `index.html`, extensionless links
  301 to `.html`. If you add a route shape, check it with `npm run preview`.
- **Motion:** only through the hanji tokens and the Motion section of `global.css`. New motion
  is CSS (transitions, keyframes, view transitions); JavaScript only to set state, as in the
  rolling number and theme switch.
- **Content cache:** Astro caches rendered Markdown. `npm run build` passes `--force`, so
  plugin or config changes always apply. Keep it.

## Performance budgets

Enforced by `scripts/verify.mjs` after a build. Don't loosen a budget to make a change pass;
make the change smaller.

| Check | Limit |
|---|---|
| JavaScript per page (external + inline, gzipped) | 12 KB |
| HTML per page (gzipped) | 64 KB |
| `search.json` (gzipped) | 150 KB |
| Stylesheet files | none, except `/katex/katex.min.css` on pages with formulas |
| Code or fonts from other origins | none |
| Legacy URLs (`scripts/legacy-urls.txt`) | all must exist |
| Internal links | all must resolve to a built file |
| Images in Markdown | all must have alt text |
| Pages | one `h1`, a `<title>`, a meta description, `lang` |

## Verifying a change

```bash
npm run verify
```

For visual changes, also run `npm run build`, serve `dist/` with any static server, and look
at the page in light and dark themes at 375, 768 and 1440px.
