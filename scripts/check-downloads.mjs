import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteOrigin = "https://latexdo.org";
const staleAppOrigin = ["https://app", "latexdo.org"].join(".");
const downloadsRoot = path.join(root, "downloads");
const updatesRoot = path.join(root, "updates");
const requiredDownloadIds = new Set([
  "macos-arm64",
  "macos-x64",
  "windows-x64",
  "linux-x64",
]);
const textFilePattern = /\.(html|json|js|mjs|ts|txt|xml|yml|yaml|md|css|webmanifest)$/;
const textFileNames = new Set([
  ".assetsignore",
  ".gitignore",
  "CNAME",
  "_headers",
  "_redirects",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathExists(relativePath) {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function parseSiteDownloadUrl(value, label) {
  assert(typeof value === "string" && value, `${label} is missing.`);
  const url = new URL(value);
  assert(url.origin === siteOrigin, `${label} must use ${siteOrigin}.`);
  assert(url.pathname.startsWith("/downloads/"), `${label} must live under /downloads/.`);
  return url;
}

function releaseSlugFromDownloadsPage(value, label) {
  const url = parseSiteDownloadUrl(value, label);
  const match = url.pathname.match(/^\/downloads\/([^/]+)\/$/);
  assert(match, `${label} must point at a release downloads directory.`);
  return match[1];
}

function assertReleaseFile(file, label) {
  assert(typeof file.id === "string" && file.id, `${label} file id is invalid.`);
  assert(typeof file.label === "string" && file.label, `${label} file label is invalid.`);
  assert(typeof file.platform === "string" && file.platform, `${label} file platform is invalid.`);
  assert(typeof file.arch === "string" && file.arch, `${label} file arch is invalid.`);
  assert(
    typeof file.filename === "string" && !/[\\/]/.test(file.filename),
    `${label} file name is invalid.`,
  );
  assert(
    typeof file.url === "string" &&
      file.url.startsWith("https://github.com/latexdo/latexdo/releases/download/"),
    `${label} file URL is invalid.`,
  );
  assert(/^[a-f0-9]{64}$/.test(file.sha256 ?? ""), `${label} file checksum is invalid.`);
  assert(Number.isFinite(file.size) && file.size > 0, `${label} file size is invalid.`);
}

function assertManifest(manifest, label, options = {}) {
  assert(manifest?.schemaVersion === 1, `${label} schemaVersion must be 1.`);
  assert(manifest.product === "LatexDo", `${label} product must be LatexDo.`);
  assert(manifest.repository === "latexdo/latexdo", `${label} repository is invalid.`);
  assert(/^\d+\.\d+\.\d+$/.test(manifest.version ?? ""), `${label} version is invalid.`);
  assert(/^[a-f0-9]{40}$/.test(manifest.commit ?? ""), `${label} commit is invalid.`);
  assert(Number.isFinite(Date.parse(manifest.publishedAt)), `${label} publishedAt is invalid.`);
  assert(Array.isArray(manifest.files), `${label} files must be an array.`);
  parseSiteDownloadUrl(manifest.downloadsPage, `${label} downloadsPage`);

  if (options.requireFullInstallerSet) {
    const ids = new Set(manifest.files.map((file) => file.id));
    for (const id of requiredDownloadIds) {
      assert(ids.has(id), `${label} is missing ${id}.`);
    }
  }

  for (const file of manifest.files) {
    assertReleaseFile(file, label);
  }
}

function assertChecksumFile(manifest, checksums, label) {
  const lines = new Set(
    checksums
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );

  for (const file of manifest.files ?? []) {
    assert(
      lines.has(`${file.sha256}  ${file.filename}`),
      `${label} is missing ${file.filename}.`,
    );
  }
}

function assertUpdateFeed(feed, label, options = {}) {
  assert(
    feed?.schemaVersion === 1 || feed?.schemaVersion === 2,
    `${label} has an unsupported schema.`,
  );
  assert(feed.product === "LatexDo", `${label} product must be LatexDo.`);
  assert(feed.repository === "latexdo/latexdo", `${label} repository is invalid.`);
  assert(feed.channel === "stable", `${label} channel must be stable.`);
  assert(/^\d+\.\d+\.\d+$/.test(feed.version ?? ""), `${label} version is invalid.`);
  assert(/^[a-f0-9]{40}$/.test(feed.commit ?? ""), `${label} commit is invalid.`);
  assert(Number.isFinite(Date.parse(feed.publishedAt)), `${label} publishedAt is invalid.`);

  const release = releaseSlugFromDownloadsPage(feed.downloadsPage, `${label} downloadsPage`);
  assert(feed.release === release, `${label} release does not match downloadsPage.`);
  assert(feed.releaseUrl === feed.downloadsPage, `${label} releaseUrl must match downloadsPage.`);
  assert(feed.manifestUrl === `${feed.downloadsPage}manifest.json`, `${label} manifestUrl is invalid.`);

  if (options.expectedRelease) {
    assert(feed.release === options.expectedRelease.tag, `${label} is not the latest release.`);
    assert(feed.version === options.expectedRelease.version, `${label} version is stale.`);
    assert(feed.commit === options.expectedRelease.commit, `${label} commit is stale.`);
  }

  for (const file of feed.files ?? []) {
    assertReleaseFile(file, label);
  }
}

async function collectTextFiles(directory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);
    if (entry.isDirectory()) {
      if (![".git", ".wrangler", "node_modules"].includes(entry.name)) {
        await collectTextFiles(absolutePath, files);
      }
      continue;
    }

    if (
      entry.isFile() &&
      (textFilePattern.test(relativePath) || textFileNames.has(entry.name))
    ) {
      files.push(relativePath);
    }
  }

  return files;
}

async function assertNoStaleAppOrigin() {
  for (const relativePath of await collectTextFiles(root)) {
    const text = await readFile(path.join(root, relativePath), "utf8");
    assert(!text.includes(staleAppOrigin), `${relativePath} contains a stale app download URL.`);
  }
}

for (const requiredPath of [
  "_headers",
  "downloads",
  "downloads/index.html",
  "downloads/manifest.json",
  "downloads/releases.json",
  "downloads/SHA256SUMS.txt",
  "updates",
  "updates/latest.json",
  "update-public-key.pem",
]) {
  assert(await pathExists(requiredPath), `Missing required downloads asset: ${requiredPath}`);
}

await assertNoStaleAppOrigin();

const latestManifest = await readJson(path.join(downloadsRoot, "manifest.json"));
assertManifest(latestManifest, "downloads/manifest.json", {
  requireFullInstallerSet: true,
});
assertChecksumFile(
  latestManifest,
  await readFile(path.join(downloadsRoot, "SHA256SUMS.txt"), "utf8"),
  "downloads/SHA256SUMS.txt",
);

const releasesIndex = await readJson(path.join(downloadsRoot, "releases.json"));
assert(releasesIndex?.schemaVersion === 1, "downloads/releases.json schemaVersion must be 1.");
assert(releasesIndex.product === "LatexDo", "downloads/releases.json product must be LatexDo.");
assert(Array.isArray(releasesIndex.releases), "downloads/releases.json releases must be an array.");
assert(releasesIndex.releases.length > 0, "downloads/releases.json must contain releases.");

const seenReleases = new Set();
let previousPublishedAt = Number.POSITIVE_INFINITY;
for (const release of releasesIndex.releases) {
  assert(typeof release.tag === "string" && release.tag, "Release index contains an invalid tag.");
  assert(!seenReleases.has(release.tag), `Duplicate release: ${release.tag}`);
  seenReleases.add(release.tag);
  assert(/^\d+\.\d+\.\d+$/.test(release.version ?? ""), `${release.tag} version is invalid.`);
  assert(/^[a-f0-9]{40}$/.test(release.commit ?? ""), `${release.tag} commit is invalid.`);

  const publishedAt = Date.parse(release.publishedAt);
  assert(Number.isFinite(publishedAt), `${release.tag} publishedAt is invalid.`);
  assert(publishedAt <= previousPublishedAt, "downloads/releases.json must be sorted newest first.");
  previousPublishedAt = publishedAt;

  assert(
    releaseSlugFromDownloadsPage(release.downloadsPage, `${release.tag} downloadsPage`) ===
      release.tag,
    `${release.tag} downloadsPage slug is wrong.`,
  );
  assert(
    release.manifestUrl === `${release.downloadsPage}manifest.json`,
    `${release.tag} manifestUrl is invalid.`,
  );
  assert(
    release.checksumsUrl === `${release.downloadsPage}SHA256SUMS.txt`,
    `${release.tag} checksumsUrl is invalid.`,
  );

  const releaseManifest = await readJson(path.join(downloadsRoot, release.tag, "manifest.json"));
  assertManifest(releaseManifest, `${release.tag}/manifest.json`);
  assert(releaseManifest.version === release.version, `${release.tag} manifest version differs from index.`);
  assert(releaseManifest.commit === release.commit, `${release.tag} manifest commit differs from index.`);
  assert(
    releaseManifest.downloadsPage === release.downloadsPage,
    `${release.tag} manifest downloadsPage differs from index.`,
  );
  assertChecksumFile(
    releaseManifest,
    await readFile(path.join(downloadsRoot, release.tag, "SHA256SUMS.txt"), "utf8"),
    `${release.tag}/SHA256SUMS.txt`,
  );
}

const latestRelease = releasesIndex.releases[0];
assert(latestManifest.version === latestRelease.version, "downloads/manifest.json is not the latest release version.");
assert(latestManifest.commit === latestRelease.commit, "downloads/manifest.json is not the latest release commit.");
assert(
  latestManifest.downloadsPage === latestRelease.downloadsPage,
  "downloads/manifest.json is not the latest release page.",
);

const latestUpdateFeed = await readJson(path.join(updatesRoot, "latest.json"));
assertUpdateFeed(latestUpdateFeed, "updates/latest.json", {
  expectedRelease: latestRelease,
});
assert(
  await pathExists(path.join("updates", `${latestRelease.tag}.json`)),
  `Missing latest release feed: updates/${latestRelease.tag}.json`,
);

for (const entry of await readdir(updatesRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
  const feed = await readJson(path.join(updatesRoot, entry.name));
  const label = `updates/${entry.name}`;
  assertUpdateFeed(feed, label);
  if (entry.name !== "latest.json") {
    assert(entry.name === `${feed.release}.json`, `${label} filename does not match release.`);
  }
  assert(seenReleases.has(feed.release), `${label} does not have a matching downloads release.`);
}

console.log(`Validated latexdo.org downloads and update feeds with ${releasesIndex.releases.length} releases.`);
