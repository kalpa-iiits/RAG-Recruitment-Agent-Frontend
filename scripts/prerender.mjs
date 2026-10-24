// Runs after `vite build` and `vite build --ssr`: renders each public route
// into a copy of dist/index.html, with that route's title, description and
// canonical URL, and writes it where a static host serves it.
//   /         -> dist/index.html
//   /pricing  -> dist/pricing/index.html and dist/pricing.html
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const ssrDir = resolve(root, 'dist-ssr');

const { ORIGIN, render, routes } = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href);
const template = await readFile(resolve(dist, 'index.html'), 'utf8');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function setTag(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: index.html has no tag matching ${pattern}`);
  return html.replace(pattern, replacement);
}

for (const [i, { seo }] of routes.entries()) {
  const url = ORIGIN + seo.path;
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);

  let html = template;
  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = setTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`);
  html = setTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`);
  html = setTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${description}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${title}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${url}" />`);
  html = setTag(html, /<div id="root"><\/div>/, `<div id="root">${render(i)}</div>`);

  const targets = seo.path === '/'
    ? ['index.html']
    : [`${seo.path.slice(1)}/index.html`, `${seo.path.slice(1)}.html`];
  for (const target of targets) {
    const file = resolve(dist, target);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  console.log(`prerendered ${seo.path} -> ${targets.join(', ')}`);
}

await rm(ssrDir, { recursive: true, force: true });
