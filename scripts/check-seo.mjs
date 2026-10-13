// Guards the on-page SEO of every indexable page: one clear title and
// description, a canonical URL, complete social cards, valid structured data,
// a single h1, and a sitemap that lists exactly the pages search engines may index.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const site = "https://latexdo.org";
// Versioned release pages, partials, generators and the vendored AI catalog
// project are not marketing pages.
const ignored = [/^node_modules\//, /^\.wrangler\//, /^\.git\//, /^partials\//, /^scripts\//, /^research\/ai\//, /^downloads\/v[^/]+\//];

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

const attribute = (html, pattern) => html.match(pattern)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
const errors = [];
const titles = new Map();
const indexable = new Set();
let checked = 0;

for (const file of htmlFiles(root)) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (ignored.some((pattern) => pattern.test(path))) continue;
  const html = readFileSync(file, "utf8");
  const fail = (message) => errors.push(`${path}: ${message}`);
  const robots = attribute(html, /<meta\s+name="robots"\s+content="([^"]*)"/);
  const canonical = attribute(html, /<link\s+rel="canonical"\s+href="([^"]*)"/);
  if (robots?.includes("noindex")) {
    if (canonical && sitemapUrls.has(canonical) && canonical === `${site}/${path.replace(/index\.html$/, "")}`) {
      fail("is noindex but listed in sitemap.xml");
    }
    continue;
  }
  // Pages that only exist to be redirected are not expected to rank.
  if (!robots) continue;
  checked += 1;

  const title = attribute(html, /<title>([\s\S]*?)<\/title>/);
  const description = attribute(html, /<meta\s+name="description"\s+content="([^"]*)"/);
  if (!title || title.length < 10 || title.length > 60) fail(`title must be 10-60 characters (${title?.length ?? 0})`);
  if (!description || description.length < 70 || description.length > 165) {
    fail(`description must be 70-165 characters (${description?.length ?? 0})`);
  }
  if (title) {
    if (titles.has(title)) fail(`title duplicates ${titles.get(title)}`);
    titles.set(title, path);
  }
  if (!canonical?.startsWith(`${site}/`)) fail("missing canonical URL on latexdo.org");
  else indexable.add(canonical);
  if (!/<html[^>]*\slang="en"/.test(html)) fail('missing <html lang="en">');
  if (!/<meta\s+name="viewport"/.test(html)) fail("missing viewport meta");
  for (const property of ["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) {
    if (!html.includes(`property="${property}"`)) fail(`missing ${property}`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (!html.includes(`name="${name}"`)) fail(`missing ${name}`);
  }
  const image = attribute(html, /<meta\s+property="og:image"\s+content="([^"]*)"/);
  if (image && !/\.(png|jpe?g)$/.test(image)) fail("og:image must be a PNG or JPEG; social networks ignore SVG");
  const ogUrl = attribute(html, /<meta\s+property="og:url"\s+content="([^"]*)"/);
  if (canonical && ogUrl && ogUrl !== canonical) fail("og:url differs from the canonical URL");

  const headingCount = (html.match(/<h1[\s>]/g) ?? []).length;
  if (headingCount !== 1) fail(`expected exactly one <h1>, found ${headingCount}`);

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) fail("missing JSON-LD structured data");
  for (const block of blocks) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(`invalid JSON-LD: ${error.message}`);
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(match[0])) fail(`image without alt text: ${match[0].slice(0, 80)}`);
  }
  if (canonical && !sitemapUrls.has(canonical)) fail("not listed in sitemap.xml");
}

for (const url of sitemapUrls) {
  if (!indexable.has(url) && !url.startsWith(`${site}/research/ai/`)) {
    errors.push(`sitemap.xml lists ${url}, which is not an indexable page`);
  }
}
if (!/Sitemap: https:\/\/latexdo\.org\/sitemap\.xml/.test(readFileSync(join(root, "robots.txt"), "utf8"))) {
  errors.push("robots.txt must point to the sitemap");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`SEO checks passed for ${checked} indexable pages and ${sitemapUrls.size} sitemap URLs.`);
