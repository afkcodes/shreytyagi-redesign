// Where article images, photo sets and downloads come from.
//
// They live on GitHub, in the original site's repository, and the pages link to them there.
// They are not copied into the Cloudflare deploy. Content refers to them by site path
// (`/articles/x/photo.jpg`), and the build turns that into a GitHub URL. A file that is in
// `public/` (site assets, and the few images that only exist in this repository) is served
// with the site instead.
//
// Change the repository or branch here, and only here.

/** GitHub repository that holds the media, as "owner/name". It must stay public. */
export const MEDIA_REPO = 'shreytyagi/shreytyagi';

/** Branch to read from. */
export const MEDIA_BRANCH = 'main';

/**
 * Base URL the site paths are appended to. GitHub's own file server by default.
 * For a 7-day browser cache, use jsDelivr's GitHub CDN instead (same files, same repo):
 *   `https://cdn.jsdelivr.net/gh/${MEDIA_REPO}@${MEDIA_BRANCH}`
 * The MEDIA_BASE environment variable overrides this (for example in a build setting).
 */
export const MEDIA_BASE = process.env.MEDIA_BASE ?? `https://raw.githubusercontent.com/${MEDIA_REPO}/${MEDIA_BRANCH}`;
