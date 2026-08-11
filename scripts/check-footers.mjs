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

function normalizeFooter(footer) {
  return footer.replace(/\s+/g, " ").trim();
}

const root = process.cwd();
const footerPattern = /<footer class="site-footer">[\s\S]*?<\/footer>/g;
const htmlFiles = findHtmlFiles(root).sort();
const errors = [];
let canonicalFooter = null;
let canonicalPath = null;

for (const file of htmlFiles) {
  const relativePath = relative(root, file);
  const html = readFileSync(file, "utf8");
  const footers = [...html.matchAll(footerPattern)].map((match) =>
    normalizeFooter(match[0]),
  );

  if (footers.length !== 1) {
    errors.push(`${relativePath}: expected 1 site footer, found ${footers.length}`);
    continue;
  }

  if (!canonicalFooter) {
    canonicalFooter = footers[0];
    canonicalPath = relativePath;
    continue;
  }

  if (footers[0] !== canonicalFooter) {
    errors.push(`${relativePath}: footer differs from ${canonicalPath}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML pages: footer is consistent.`);
