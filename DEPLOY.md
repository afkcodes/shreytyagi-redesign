# Putting the site online with Cloudflare (free)

This guide sets up **shreytyagi.com** on Cloudflare so that:

- hosting is **free** (Cloudflare doesn't charge for visits to a static site like this one),
- every time a change is pushed to GitHub, the site **rebuilds and goes live by itself** in
  about two minutes,
- every pull request (for example one an AI agent opens) gets its own **preview link** to
  check before merging,
- if a change breaks a rule (a missing page, a broken link, a slow page), the build stops and
  **the live site stays as it was**.

It takes about 30 minutes, plus up to a day of waiting if the domain has to move to
Cloudflare. Do the steps in order. Menu names in the Cloudflare dashboard sometimes change
slightly; if a label doesn't match, pick the closest one.

---

## What you need

1. **The GitHub repository** with this code, and admin rights to it. If someone else owns it,
   ask them either to transfer it to your GitHub account (repository **Settings → General →
   Transfer ownership**) or to make you an admin (**Settings → Collaborators**).
2. **The login for wherever shreytyagi.com was bought** (the "registrar": GoDaddy, Namecheap,
   Hostinger, BigRock, Squarespace, …).
3. **Optional: a computer with Node.js**, only if you want to run checks or preview the site
   on your own machine. Install the "LTS" version from [nodejs.org](https://nodejs.org).
   Nothing in this guide requires it.

---

## Step 1 — Keep the photo repository public (nothing to set up)

The article images, photo sets and downloads (about 88 MB) are **not** uploaded to Cloudflare.
They stay on GitHub, in the original site's repository **`shreytyagi/shreytyagi`**, and the
new pages link to them there. Cloudflare only hosts the pages themselves.

So, for as long as the site runs:

- keep **`shreytyagi/shreytyagi` public**, and don't rename or delete it;
- keep each image at the path it has today (for example
  `articles/dhurandhar2inepiqluxonimages/IMG_1976.jpeg`).

If that repository ever moves or gets renamed, change `MEDIA_REPO` in `site.config.mjs` (one
line) and push.

To confirm every image the site uses is really there, run this on a computer with Node.js
(optional):

```bash
npm install
```

```bash
npm run media:check
```

It prints how many files load from GitHub and lists any that are missing. Today one file is
missing, `articles/encoding_masterclass/IMG_COVER.jpg` (the x265 article's cover). It is
already missing on the current site; upload it to that folder of `shreytyagi/shreytyagi` if
you still have it.

---

## Step 2 — Create a free Cloudflare account

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and sign up with
   your email.
2. Confirm your email address from the message Cloudflare sends.

---

## Step 3 — Connect GitHub and deploy

1. In the Cloudflare dashboard, open **Workers & Pages** (in the left menu, sometimes under
   **Compute**).
2. Click **Create application**, then **Import a repository** (or **Continue with GitHub**).
3. GitHub opens and asks to install the **Cloudflare Workers and Pages** app. Choose **Only
   select repositories**, pick this repository, and click **Install**.
4. Back in Cloudflare, select the repository. On the **Configure your project** screen, fill in:

   | Field | What to enter |
   |---|---|
   | **Project name** | `shreytyagi` (it must match `"name"` in `wrangler.jsonc`) |
   | **Build command** | `npm run verify` |
   | **Deploy command** | `npx wrangler deploy` (usually already filled in) |
   | **Root directory** | leave empty |
   | **Production branch** | `main` |

   You don't need any environment variables; the Node version comes from the `.node-version`
   file.
5. Click **Save and Deploy**. The first build takes 2–3 minutes. You can watch the log.
6. When it finishes, Cloudflare shows an address like
   `https://shreytyagi.<your-account>.workers.dev`. Open it and click around: the home page,
   **Lists**, an article, and an old link such as `/about.html`.

> If Cloudflare offers to open a pull request that adds an "Astro adapter", close it. This
> site is static and is already set up (`wrangler.jsonc`).

### Turn on preview links (recommended)

1. Open **Workers & Pages → shreytyagi → Settings → Build**.
2. Under **Branch control**, turn on builds for **non-production branches**.

From now on, every pull request gets a comment with its own preview address.

### How automatic deploys work

- **Push or merge to `main`** → Cloudflare runs `npm run verify` → if every check passes, the
  new version goes live about two minutes later.
- **A check fails** → nothing changes on the live site. Open **Deployments**, click the failed
  build and read the last lines of the log: they name the file and the reason.
- **Undo a bad deploy** → **Deployments**, choose an earlier version, **Rollback**.

---

## Step 4 — Check where your domain's DNS lives

In the Cloudflare dashboard, open **Domains** (or **Websites**).

- If **shreytyagi.com** is listed and says **Active**, skip to **Step 5**.
- If it isn't listed, do **Step 4a** first.

### Step 4a — Move the domain's DNS to Cloudflare (once)

This doesn't move or transfer the domain; you keep it where it is. It only lets Cloudflare
answer for it.

1. **Domains → Onboard a domain** (or **Add a site**), type `shreytyagi.com`, pick the
   **Free** plan.
2. Cloudflare copies your existing DNS records. **Keep** anything to do with email (records of
   type **MX**, and **TXT** records mentioning `spf`, `dkim` or `dmarc`). Leave the GitHub
   records for now so the old site keeps working:
   - four **A** records for `shreytyagi.com` pointing to `185.199.108.153`, `.109.153`,
     `.110.153` and `.111.153`
   - a **CNAME** record for `www` pointing to something ending in `github.io`
3. Cloudflare shows **two nameservers**, like `ada.ns.cloudflare.com` and
   `bob.ns.cloudflare.com`. Keep that page open.
4. Log in to your registrar:
   - If **DNSSEC** is switched on for the domain, switch it **off** first.
   - Find **Nameservers** (GoDaddy: *Domain → DNS → Nameservers → Change*; Namecheap: *Domain
     List → Manage → Nameservers → Custom DNS*). Replace the existing ones with Cloudflare's
     two, and save.
5. Wait. Cloudflare emails you when the domain is **Active**. It's usually within an hour,
   but it can take up to 24 hours. The old site keeps working during this time.

---

## Step 5 — Point shreytyagi.com at the new site

Do these one after another; the site may be unreachable for a few minutes in between.

1. **Remove the GitHub records.** Open **shreytyagi.com → DNS → Records** and delete the four
   `185.199.x.x` **A** records and the `www` **CNAME** that points to `github.io`. Cloudflare
   won't attach the domain while they exist.
2. **Attach the domain.** Open **Workers & Pages → shreytyagi → Settings → Domains & Routes →
   Add → Custom domain**, type `shreytyagi.com`, and click **Add custom domain**. Do the same
   for `www.shreytyagi.com`. Cloudflare creates the DNS records and the HTTPS certificate; it
   takes a few minutes.
3. **Send www to the main address.** Open **shreytyagi.com → Rules → Redirect Rules → Create
   rule**, choose the template **Redirect from WWW to root**, and **Deploy**. (Without a
   template: when the hostname equals `www.shreytyagi.com`, redirect dynamically to
   `concat("https://shreytyagi.com", http.request.uri.path)` with status **301** and **Preserve
   query string** on.)
4. **Test** in a private browser window:
   - `https://shreytyagi.com/`
   - `https://shreytyagi.com/about.html` (must stay `.html`, no redirect)
   - `https://shreytyagi.com/articles/youtube_av1_encoding/`
   - `https://shreytyagi.com/lists/seenatcinema.html`
   - `https://www.shreytyagi.com/` (should land on `https://shreytyagi.com/`)
   - `https://shreytyagi.com/does-not-exist` (should show the site's "Not found" page)

---

## Step 6 — Switch off the old GitHub Pages site

In the **old** repository (`shreytyagi/shreytyagi`): **Settings → Pages**, set **Source** to
**None** (or **Unpublish site**). This only stops GitHub from serving the old pages. **Keep the
repository itself, and keep it public**: the new site's images load from it (Step 1).

You're done.

---

## Everyday use

- **Add or edit a page:** change files in `src/content/` (see `src/content/AGENTS.md`), push to
  `main`, and it's live about two minutes later. Small edits can be made on github.com with
  the pencil icon; committing there deploys too.
- **New page:** `npm run new -- articles my-new-article "My New Article" --category Cinemas`.
- **New images:** upload them to the `shreytyagi/shreytyagi` repository on github.com (open
  the folder, **Add file → Upload files**, commit), for example to
  `articles/my-new-article/photo.jpg`. Then use that path in the page:
  `![What the photo shows](/articles/my-new-article/photo.jpg)`. They load from GitHub, not
  Cloudflare.
- **See exactly what Cloudflare will serve, on your computer:** `npm run build`, then
  `npm run preview`, and open the address it prints.

## If something goes wrong

| Problem | What to do |
|---|---|
| Build failed | **Deployments** → the failed build → read the last lines. `verify` names the file and the rule. Fix it and push again. |
| "Worker name doesn't match" | The project name in Cloudflare must equal `"name"` in `wrangler.jsonc`. Change one to match the other. |
| An image doesn't show | It isn't in `shreytyagi/shreytyagi` at the path the page uses (paths are case-sensitive: `.JPG` ≠ `.jpg`), or that repository was made private. `npm run media:check` lists what's missing. |
| The domain shows an old page or an error | DNS can take time. Check **Domains & Routes** shows the domain as **Active**, then wait a little and try a private window. |
| A page works at `/about` but you want `/about.html` | That's intended: old-style links without `.html` redirect to the `.html` page. |
| Need to undo a deploy | **Deployments → earlier version → Rollback**. |

## Free plan limits (Cloudflare, November 2026)

- Visits to static files: **free and unlimited**.
- Builds: **3,000 build minutes a month**; one build takes about 2 minutes.
- Per deploy: up to **20,000 files**, each up to **25 MB**.

## How it's configured (for whoever maintains this)

- `wrangler.jsonc`: serves `dist/` as plain files. `html_handling: "none"` means
  `/about.html` is served exactly (Cloudflare's default would redirect it to `/about`).
  `not_found_handling: "404-page"` serves `dist/404.html` with a real 404 status.
- `dist/_redirects` is written by the build (`astro.config.mjs`). It makes folder URLs
  (`/articles/`) serve their `index.html`, and redirects old extensionless links (`/about`) to
  the `.html` page. Don't edit it by hand.
- `site.config.mjs`: where images and downloads come from (`MEDIA_REPO`, `MEDIA_BRANCH`,
  `MEDIA_BASE`). Pages refer to media by site path; the build points those at
  `raw.githubusercontent.com/shreytyagi/shreytyagi/main`. Files in `public/` are served with the
  site instead: site assets, and 14 bitrate graphs for the YouTube AV1 article that only exist
  in this repository (they were embedded inside the old page). To serve those from GitHub too,
  upload `public/articles/youtube_av1_encoding/*.png` to the same folder in the media repository
  and move them out of `public/`.
- `scripts/legacy-urls.txt` lists every URL from the old site; `npm run verify` fails if any
  of them disappears.
- Tested locally with Cloudflare's own runtime (`npm run preview`): every old URL returns 200
  without redirecting, folder URLs work, extensionless links redirect with 301, and unknown
  pages return the custom 404 page.
