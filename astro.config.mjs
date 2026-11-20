// @ts-check
import { existsSync } from 'node:fs';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

/**
 * Images and downloads are referenced by their site path (/articles/x/photo.jpg).
 * Until the big media folders live in public/, anything not found there is served
 * from the current site. Set PUBLIC_ASSET_BASE="" once everything is local.
 */
const ASSET_BASE = process.env.PUBLIC_ASSET_BASE ?? 'https://shreytyagi.com';
/** @param {string} path */
const isLocalFile = path => existsSync(new URL(`./public${decodeURI(path.split(/[?#]/)[0])}`, import.meta.url));

/** @returns {import('unified').Transformer<any>} */
function rehypeSite() {
  return tree => {
    /** @param {any} node @param {any} parent */
    const walk = (node, parent) => {
      // raw HTML blocks (e.g. inside <letter-generator>) are strings, not elements
      if (node.type === 'raw') {
        node.value = node.value.replace(/\b(src|href)="(\/[^"]+\.(?!html?")\w{2,5})"/g, (/** @type {string} */ m, /** @type {string} */ attr, /** @type {string} */ path) =>
          isLocalFile(path) ? m : `${attr}="${ASSET_BASE}${path}"`);
      }
      if (node.type === 'element') {
        const p = node.properties;
        if (node.tagName === 'img') {
          if (typeof p.src === 'string' && p.src.startsWith('/') && !isLocalFile(p.src)) p.src = ASSET_BASE + p.src;
          p.loading = 'lazy';
          p.decoding = 'async';
        }
        if (node.tagName === 'a' && typeof p.href === 'string') {
          if (/^\/[^#?]*\.(?!html?\b)\w{2,5}([?#]|$)/.test(p.href) && !isLocalFile(p.href)) p.href = ASSET_BASE + p.href;
          if (/^https?:/.test(p.href) && !p.href.startsWith('https://shreytyagi.com')) p.rel = ['noopener'];
        }
        // wide tables scroll inside the column instead of the page
        if (node.tagName === 'table' && parent && !(parent.properties?.className || []).includes('tw')) {
          const i = parent.children.indexOf(node);
          parent.children[i] = { type: 'element', tagName: 'div', properties: { className: ['tw'] }, children: [node] };
        }
      }
      for (const child of [...(node.children || [])]) walk(child, node);
    };
    walk(tree, null);
  };
}

export default defineConfig({
  site: 'https://shreytyagi.com',
  // keep every old URL: /articles/x.html, /articles/index.html, /articles/youtube_av1_encoding/
  build: { format: 'preserve', inlineStylesheets: 'always' },
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  experimental: { clientPrerender: true },
  redirects: { '/help': '/about.html' },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeSite],
    }),
  },
});
