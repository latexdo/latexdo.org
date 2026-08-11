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
const footerPattern = /<footer class="site-footer">[\s\S]*?<\/footer>/g;
const footerIncludePattern = /<div data-footer-src="\/partials\/footer\.html"><\/div>/g;
const footerPartial = join(root, "partials", "footer.html");
const htmlFiles = findHtmlFiles(root)
  .filter((file) => file !== footerPartial)
  .sort();
const errors = [];
const footerPartialHtml = readFileSync(footerPartial, "utf8");
const footerPartialMatches = [...footerPartialHtml.matchAll(footerPattern)];

if (footerPartialMatches.length !== 1) {
  errors.push(
    `partials/footer.html: expected 1 site footer, found ${footerPartialMatches.length}`,
  );
}

for (const file of htmlFiles) {
  const relativePath = relative(root, file);
  const html = readFileSync(file, "utf8");
  const footers = [...html.matchAll(footerPattern)];
  const footerIncludes = [...html.matchAll(footerIncludePattern)];

  if (footers.length !== 0) {
    errors.push(`${relativePath}: expected 0 copied site footers, found ${footers.length}`);
  }

  if (footerIncludes.length !== 1) {
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
  `Checked ${htmlFiles.length} HTML pages: each points to partials/footer.html.`,
);
