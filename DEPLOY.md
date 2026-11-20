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
3. **A computer with Node.js** for one step (Step 1). Install the "LTS" version from
   [nodejs.org](https://nodejs.org) if you don't have it. Check it worked by opening Terminal
   (Mac) or PowerShell (Windows) and running `node -v`; you should see `v22` or higher.

---

## Step 1 — Bring the photos into the repository (once)

Today, the article photos (about 88 MB) still load from the **current** shreytyagi.com. When
the domain moves to the new site in Step 5, those links would point at the new site, which
doesn't have them yet. This step copies them in. Do it **before** Step 5, while the old site
is still live.

In Terminal:

```bash
git clone https://github.com/<your-github-name>/<repository-name>.git
```

```bash
cd <repository-name>
```

```bash
npm install
```

```bash
npm run media:import
```

You'll see a line per file, then a summary like `56 copied (88.1 MB)`. One file,
`/articles/encoding_masterclass/IMG_COVER.jpg`, is reported as not found; it is already
missing on the current site, so add it back to that folder if you still have it.

Now check everything and publish the photos to GitHub:

```bash
npm run verify
```

It should end with `✓ verify passed` and **no** "still load from shreytyagi.com" warning.

```bash
git add public && git commit -m "content: import media into public/" && git push
```

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
**None** (or **Unpublish site**). Keep the repository itself; it's the history of the old site.

You're done.

---

## Everyday use

- **Add or edit a page:** change files in `src/content/` (see `src/content/AGENTS.md`), push to
  `main`, and it's live about two minutes later. Small edits can be made on github.com with
  the pencil icon; committing there deploys too.
- **New page:** `npm run new -- articles my-new-article "My New Article" --category Cinemas`.
- **New images:** put them in `public/` at the path the page uses (for example
  `public/articles/my-new-article/photo.jpg`).
- **See exactly what Cloudflare will serve, on your computer:** `npm run build`, then
  `npm run preview`, and open the address it prints.

## If something goes wrong

| Problem | What to do |
|---|---|
| Build failed | **Deployments** → the failed build → read the last lines. `verify` names the file and the rule. Fix it and push again. |
| "Worker name doesn't match" | The project name in Cloudflare must equal `"name"` in `wrangler.jsonc`. Change one to match the other. |
| Images missing after the domain moved | Step 1 was skipped, or new images aren't in `public/`. Run `npm run media:import`, commit, push. |
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
- `scripts/legacy-urls.txt` lists every URL from the old site; `npm run verify` fails if any
  of them disappears.
- Tested locally with Cloudflare's own runtime (`npm run preview`): every old URL returns 200
  without redirecting, folder URLs work, extensionless links redirect with 301, and unknown
  pages return the custom 404 page.
