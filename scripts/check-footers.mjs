import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ignoredDirectories = new Set([
  ".git",
  ".wrangler",
  "node_modules",
]);

function findHtmlFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...findHtmlFiles(join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(join(directory, entry.name));
    }
  }

  return files;
}

const root = process.cwd();
const headerPattern = /<header class="site-header" data-header>[\s\S]*?<\/header>/g;
const headerIncludePattern = /<div data-header-src="\/partials\/header\.html"><\/div>/g;
const footerPattern = /<footer class="site-footer">[\s\S]*?<\/footer>/g;
const footerIncludePattern = /<div data-footer-src="\/partials\/footer\.html"><\/div>/g;
const headerPartial = join(root, "partials", "header.html");
const footerPartial = join(root, "partials", "footer.html");
const partials = new Set([headerPartial, footerPartial]);
const htmlFiles = findHtmlFiles(root)
  .filter((file) => !partials.has(file))
  .sort();
const errors = [];
const headerPartialHtml = readFileSync(headerPartial, "utf8");
const footerPartialHtml = readFileSync(footerPartial, "utf8");
const headerPartialMatches = [...headerPartialHtml.matchAll(headerPattern)];
const footerPartialMatches = [...footerPartialHtml.matchAll(footerPattern)];

if (headerPartialMatches.length !== 1) {
  errors.push(
    `partials/header.html: expected 1 site header, found ${headerPartialMatches.length}`,
  );
}

if (footerPartialMatches.length !== 1) {
  errors.push(
    `partials/footer.html: expected 1 site footer, found ${footerPartialMatches.length}`,
  );
}

// Pages may instead carry the partials inlined at build time between marker
// comments (scripts/build-partials.mjs); the copy must match the partial exactly.
const inlinedPattern = (name) =>
  new RegExp(`<!-- partial:${name} -->\\n([\\s\\S]*?)\\s*<!-- /partial:${name} -->`, "g");
const partialHtml = { header: headerPartialHtml.trim(), footer: footerPartialHtml.trim() };

for (const file of htmlFiles) {
  const relativePath = relative(root, file);
  let html = readFileSync(file, "utf8");
  const inlined = { header: 0, footer: 0 };
  for (const name of ["header", "footer"]) {
    html = html.replace(inlinedPattern(name), (_match, content) => {
      inlined[name] += 1;
      if (content.trim() !== partialHtml[name]) {
        errors.push(`${relativePath}: inlined ${name} is out of date; run npm run build:partials`);
      }
      return "";
    });
  }
  const headers = [...html.matchAll(headerPattern)];
  const headerIncludes = [...html.matchAll(headerIncludePattern)];
  const footers = [...html.matchAll(footerPattern)];
  const footerIncludes = [...html.matchAll(footerIncludePattern)];

  if (headers.length !== 0) {
    errors.push(`${relativePath}: expected 0 copied site headers, found ${headers.length}`);
  }

  if (headerIncludes.length + inlined.header !== 1) {
    errors.push(
      `${relativePath}: expected 1 header include pointing to /partials/header.html, found ${headerIncludes.length}`,
    );
  }

  if (footers.length !== 0) {
    errors.push(`${relativePath}: expected 0 copied site footers, found ${footers.length}`);
  }

  if (footerIncludes.length + inlined.footer !== 1) {
    errors.push(
      `${relativePath}: expected 1 footer include pointing to /partials/footer.html, found ${footerIncludes.length}`,
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} HTML pages: each uses the shared header and footer partials.`,
);
