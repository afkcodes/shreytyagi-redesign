# DESIGN.md

The design system for shreytyagi.com. Any agent or person changing anything visual follows
this file. It is a minimal application of [hanji](https://github.com/afkcodes/hanji): paper
and ink, hairlines instead of boxes, one cinnabar accent.

Everything here is implemented in `src/styles/global.css`. That file is the source of truth for
values; this file explains how to use them. If they ever disagree, fix this file.

## Principles

1. **Words first.** Most pages are long reads and data. Typography, spacing and order carry
   the design; decoration doesn't.
2. **Hairlines and whitespace, never cards.** Separate things with a 1px `--line`, a heading or
   space. No bordered boxes around sections, no drop-shadowed panels, no rounded tiles in a grid.
3. **One accent, used sparingly.** Scarlet marks *where you are* and *what you can act on*:
   the active nav item, link underlines, sort arrows, the focus ring, the contents marker, the
   reading-progress line and the seal. It is never a large fill, a button background or body
   text.
4. **Familiar patterns.** Lists are rows, tables are tables, search is a dialog, navigation is a
   row of words. Nothing a reader has to learn.
5. **Both themes, always.** Every colour comes from a token that has a light (paper) and dark
   (charcoal) value. The printable letter is the one exception: always white paper.

## Tokens

### Colour

| Token | Paper (light) | Charcoal (dark) | Use |
|---|---|---|---|
| `--bg` | `#f0ece3` | `#111114` | Page ground |
| `--bg-soft` | `#f7f5f0` | `#1b1b1e` | Inputs, code blocks |
| `--surface` | `#fbfaf8` | `#222225` | Raised layers: search dialog, selected segment |
| `--tint` | fg at 5.5% | white at 6% | Hover rows, inline code, notes |
| `--tint-2` | fg at 9% | white at 10% | Selected search result |
| `--line` | fg at 10% | white at 10% | Hairlines between rows |
| `--line-2` | fg at 18% | white at 17% | Input borders, table header rule |
| `--fg` | `#16130f` | `#f1efec` | Text |
| `--fg-dim` | `#5c5853` | `#b7b5b4` | Secondary text that must be read: dates, meta, captions |
| `--fg-mute` | `#8a867f` | `#85837f` | Decorative only: repeated table values, placeholders, markers |
| `--accent` | `#b81f18` | `#ff5a52` | See principle 3 |
| `--accent-soft` | `#e8d2c8` | `#321b1d` | Text selection, search highlights |
| `--on-accent` | `#ffffff` | `#ffffff` | Text on the seal |

Contrast rule: anything a reader needs (dates, captions, labels) uses `--fg-dim` or `--fg`.
`--fg-mute` is below body-text contrast on purpose; use it only for decoration.

Colours outside these tokens are allowed only inside fixed-palette regions (the lightbox,
which is always dark, and the printable letter and its diagrams, which are always white
paper). Those regions are marked with `palette:start` / `palette:end` comments, and
`npm run verify` rejects hex colours anywhere else.

### Type

| Role | Font | Size / line height | Weight |
|---|---|---|---|
| UI text | Figtree Variable | 16 / 1.55 | 400 |
| Reading text (`.prose`) | Figtree Variable | 18 / 1.72 | 400, bold 620 |
| Opening paragraph of a post | Figtree Variable | 20 / 1.6 | 400 |
| Home statement (`.lede`) | Figtree Variable | 21–25 (fluid) / 1.4 | 450 |
| Page title (`h1`) | Figtree Variable | 29–40 (fluid) / 1.12, tracking −0.025em | 620 |
| Section heading (`.prose h2`) | Figtree Variable | 23 / 1.25 | 620 |
| Subheading (`.prose h3`) | Figtree Variable | 19.5 / 1.3 | 620 |
| Dates, meta, crumbs, counts, table numbers | DM Mono | 12.5–13.5 | 400–500 |

Both fonts are self-hosted (`@fontsource`). Never add a font or load one from a CDN. Headings
use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.

### Layout and spacing

| Token | Value | Use |
|---|---|---|
| `--measure` | 720px | The column: header, index lists, page headers |
| `--read` | 650px | Reading width for `.prose` (about 70 characters a line) |
| `--wide` | 1180px | Pages whose table has more than six columns |
| `--gutter` | 20px | Side padding at every width |
| `--bar` | 60px | Header height on desktop |
| `--r-xs` / `--r-sm` / `--r-pill` | 8 / 12 / 999px | Corner radii; rows use 10px |

Breakpoints (don't add others): **560px** (index rows stack, two-column forms collapse),
**640px** (letter goes single column), **820px** (header wraps, nav becomes a swipeable row,
header hides on scroll down), **1240px** (contents rail appears beside long posts).

### Motion

hanji's motion vocabulary, unchanged (from `afkcodes/hanji` `tokens/motion.ts`). Springs are
compiled to CSS `linear()` easings, so motion costs no JavaScript.

| Token | Value | Use |
|---|---|---|
| `--ease-snappy` / `--dur-snappy` | spring 28/380 · 512ms | Controls and anything just released: press release, sort arrow, nav mark |
| `--ease-snappy-settle` / `--dur-snappy-settle` | clamped · 176ms | Dialogs arriving (never overshoot a surface) |
| `--ease-gentle` / `--dur-gentle` | spring 24/210 · 606ms | Things arriving: page header, rows, content blocks |
| `--ease-gentle-settle` / `--dur-gentle-settle` | clamped · 317ms | Header sliding, disclosures opening, the theme ink |
| `--ease-out` with `--dur-fast` / `--dur-base` / `--dur-slow` | 180 / 260 / 400ms | Colour, opacity and leaving |
| `--stagger` · `--rise` | 24ms · 12px | One clock per surface; counting stops at ten steps |
| `--press` · `--press-opacity` | .97 · .75 | Controls scale; rows dim |

Where it's used (all in the Motion section of `global.css`):

- **Arriving:** page header, then body, then rows rise 12px and fade in on the gentle spring,
  24ms apart, capped at ten steps (240ms).
- **Page to page:** cross-document view transitions. The header stays still, the active-section
  mark slides to its new item on the snappy spring, and the new page's arrival plays.
- **Press:** buttons scale to .97 in 70ms and spring back; rows and links dim to .75.
- **Dialogs:** search arrives from .94 scale on snappy-settle and leaves to .97 quickly; the
  backdrop fades. Nothing bounces.
- **State:** sort arrow rotates, "Show working" opens to its height, the theme switch spreads
  from the button like ink.

Rules: use only these tokens (no raw durations or `ease-in-out`); motion is transform and
opacity only; never animate something the reader is waiting on (search results and table
filtering are instant); `bouncy` is reserved for celebration and isn't used on this site.
`prefers-reduced-motion` swaps every spring for a short fade, removes travel, stagger and
page transitions.

## Components

All are plain HTML and CSS classes in `global.css`; the Astro components that produce them are
in `src/components/`.

| Pattern | Classes | Notes |
|---|---|---|
| Header | `.bar` `.brand` `.seal` `.nav` `.mark` `.tools` `.icon-btn` | Sticky. The active section link holds `.mark`, the accent underline that slides between pages. |
| Page header | `.ph` `.crumb` `h1` `.meta` `.sub` | Crumb and meta in DM Mono. |
| Index rows | `.grp` `.gh` `.rows` `.row` (`time`, `.t`, `.m`) | Grouped by year (or category for lists). Date left, title, meta right. |
| Reading | `.prose`, `.prose .tw` (scrolling table), `.prose .aside` (note) | `hr` renders as `· · ·`. |
| Contents rail | `.toc` | Only for 3+ `##` headings, only at ≥1240px. |
| Next/previous | `.pn` | Within the same section. |
| Data table | `.tbar` `.filter` `.count` `.dt` (`.scroll` when wide) `.data` | Sticky header; `.num`, `.mono`, `.rep` (repeat faded), `.s0`/`.s1` pinned columns. |
| Search | `.sd` `.sh` `.res` `.sf` | Native `<dialog>`; opened by `/` or ⌘K. |
| Gallery | `.gallery` `.lb` | Square thumbnails; full-screen dialog viewer. |
| Forms (tools) | `.form` `.fl` `.seg` `.units` `.unit` `.input` `.grid2` `.hint` | Labels above fields; units inside the field. |
| Actions | `.btn` `.actions` | The only button style: ink pill (`--fg` on `--bg`). Never accent-filled. |
| Results | `.result` `.result-2` `details.work` | Big DM Mono number, plain sentence below, working in a disclosure. |
| Printable letter | `.sheet` and children | Always white; print CSS shows only the letter. |
| About links | `.el` | Definition list, label in DM Mono. |

### Icons

Inline SVG only: 24 × 24 viewBox, `stroke="currentColor"`, `stroke-width="2"`, round caps
and joins, `aria-hidden="true"` with a text label on the control. 16px in buttons, 15px in
inputs.

## Writing in the interface

Sentence case everywhere ("Print or save as PDF", not "Print Or Save As PDF"). Plain words, no
exclamation marks, no emoji in UI. British spelling, matching the site's content.

## Checklist for a visual change

- [ ] Uses only tokens and existing classes, or adds a class built from tokens.
- [ ] Works in light and dark, and at 375, 768 and 1440px wide.
- [ ] Keyboard: visible focus ring, sensible tab order, `Esc` closes dialogs.
- [ ] No new font, colour, breakpoint, shadow or dependency.
- [ ] `npm run verify` passes.
