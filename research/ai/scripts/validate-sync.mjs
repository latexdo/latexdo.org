import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2] ?? "latexdo-sync.json";
const repoRoot = process.cwd();

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value) {
  return typeof value === "string";
}

function validateRelativePath(label, value) {
  if (!isString(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  if (path.isAbsolute(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error(`${label} must stay inside this repository: ${value}`);
  }
  return value;
}

async function listFiles(dir, prefix = "") {
  const entries = await readdir(path.join(repoRoot, dir, prefix), {
    withFileTypes: true,
  });
  const out = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    const repoPath = path.join(dir, relative).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      out.push(...(await listFiles(dir, relative)));
    } else if (entry.isFile()) {
      out.push(repoPath);
    }
  }
  return out;
}

function validateManifest(value) {
  if (!isObject(value)) throw new Error("AI sync manifest must be an object");
  if (value.schemaVersion !== 1) {
    throw new Error("AI sync manifest schemaVersion must be 1");
  }
  if (!Array.isArray(value.files)) {
    throw new Error("AI sync manifest files must be an array");
  }
  const files = value.files.map((entry, index) => {
    if (!isObject(entry)) throw new Error(`files[${index}] must be an object`);
    return {
      from: validateRelativePath(`files[${index}].from`, entry.from),
      to: validateRelativePath(`files[${index}].to`, entry.to),
    };
  });
  const styleFragments = Array.isArray(value.styleFragments)
    ? value.styleFragments.map((entry, index) => {
        if (!isObject(entry)) {
          throw new Error(`styleFragments[${index}] must be an object`);
        }
        if (!isString(entry.startMarker) || !isString(entry.endMarker)) {
          throw new Error(
            `styleFragments[${index}] startMarker/endMarker must be strings`,
          );
        }
        return {
          from: validateRelativePath(`styleFragments[${index}].from`, entry.from),
          to: validateRelativePath(`styleFragments[${index}].to`, entry.to),
          startMarker: entry.startMarker,
          endMarker: entry.endMarker,
        };
      })
    : [];
  return { files, styleFragments };
}

const manifest = validateManifest(JSON.parse(await readFile(manifestPath, "utf8")));
const manifestSources = new Set([
  ...manifest.files.map((entry) => entry.from),
  ...manifest.styleFragments.map((entry) => entry.from),
]);
const manifestTargets = new Set();
for (const entry of [...manifest.files, ...manifest.styleFragments]) {
  if (manifestTargets.has(entry.to)) {
    throw new Error(`Duplicate AI sync target: ${entry.to}`);
  }
  manifestTargets.add(entry.to);
}

const sourceFiles = await listFiles("latexdo");
for (const sourceFile of sourceFiles) {
  if (!manifestSources.has(sourceFile)) {
    throw new Error(`${sourceFile} exists but is not listed in ${manifestPath}`);
  }
}
for (const sourceFile of manifestSources) {
  if (!sourceFiles.includes(sourceFile)) {
    throw new Error(`${sourceFile} is listed in ${manifestPath} but does not exist`);
  }
}
for (const fragment of manifest.styleFragments) {
  const text = await readFile(path.join(repoRoot, fragment.from), "utf8");
  if (!text.includes(fragment.startMarker)) {
    throw new Error(`${fragment.from} does not contain its start marker`);
  }
  if (text.includes(fragment.endMarker)) {
    throw new Error(`${fragment.from} must not include its host end marker`);
  }
}

console.log(
  `Validated LatexDo AI sync manifest with ${manifest.files.length} files and ${manifest.styleFragments.length} style fragment(s).`,
);
