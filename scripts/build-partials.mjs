// Inlines the shared header and footer into pages that opt in with marker
// comments, so their navigation is in the HTML instead of fetched after load:
//
//   <!-- partial:header -->
//   <!-- /partial:header -->
//
// Pages that still use <div data-header-src> placeholders keep loading the
// partials at runtime (see loadHtmlIncludes in src/site.ts).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".wrangler", "node_modules", "partials", "scripts"]);
const names = ["header", "footer"];

export const partialMarker = (name) =>
  new RegExp(`(<!-- partial:${name} -->)[\\s\\S]*?(\\s*<!-- /partial:${name} -->)`, "g");

export function readPartial(name) {
  return readFileSync(join(root, "partials", `${name}.html`), "utf8").trim();
}

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : htmlFiles(join(directory, entry.name));
    }
    return entry.name.endsWith(".html") ? [join(directory, entry.name)] : [];
  });
}

let updated = 0;
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  let next = html;
  for (const name of names) {
    next = next.replace(partialMarker(name), (_match, open, close) => `${open}\n${readPartial(name)}${close}`);
  }
  if (next !== html) {
    writeFileSync(file, next);
    updated += 1;
    console.log(`Inlined partials into ${relative(root, file)}`);
  }
}

if (!updated) console.log("Inlined partials are up to date.");
