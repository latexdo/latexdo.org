import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), "latexdo-volunteering-"));
try {
  for (const directory of ["scripts", "volunteering"]) mkdirSync(join(temporary, directory));
  for (const file of ["scripts/build-volunteering.mjs", "scripts/volunteer-page.template.html", "sitemap.xml"]) {
    copyFileSync(join(root, file), join(temporary, file));
  }
  const fixture = {
    ...JSON.parse(readFileSync(join(root, "volunteering/position.example.json"), "utf8")),
    slug: "test-position", title: 'Research & tools <engineer> "role"',
    applicationUrl: "https://docs.google.com/forms/d/e/test-form/viewform?usp=pp_url&entry.1=Research",
    published: true,
  };
  const writePositions = (positions) => writeFileSync(join(temporary, "volunteering/positions.json"), JSON.stringify(positions));
  const build = () => execFileSync(process.execPath, [join(temporary, "scripts/build-volunteering.mjs")]);
  const read = (file) => readFileSync(join(temporary, file), "utf8");
  const rejects = (positions) => {
    writePositions(positions);
    assert.notEqual(spawnSync(process.execPath, [join(temporary, "scripts/build-volunteering.mjs")]).status, 0);
  };

  writePositions([fixture, { ...fixture, slug: "second-position", applicationUrl: "https://forms.gle/second-form" },
    { slug: "draft-position", published: false }]);
  build();
  assert.match(read("volunteering/index.html"), /href="\/volunteering\/test-position\/"/);
  assert.match(read("volunteering/test-position/index.html"), /Research &amp; tools &lt;engineer&gt; &quot;role&quot;/);
  assert.match(read("volunteering/test-position/index.html"), /viewform\?usp=pp_url&amp;entry.1=Research/);
  assert.match(read("volunteering/second-position/index.html"), /href="https:\/\/forms.gle\/second-form"/);
  assert.match(read("sitemap.xml"), /https:\/\/latexdo.org\/volunteering\/test-position\//);
  assert.ok(!existsSync(join(temporary, "volunteering/draft-position/index.html")));
  const firstSitemap = read("sitemap.xml");
  build();
  assert.equal(read("sitemap.xml"), firstSitemap, "Repeated builds must be stable");

  for (const url of ["javascript:alert(1)", "https://example.com/form", "https://forms.gle.evil.test/form",
    "https://docs.google.com/forms/d/form/edit"]) {
    rejects([{ ...fixture, applicationUrl: url }]);
  }
  rejects([fixture, fixture]);
  rejects([{ ...fixture, slug: "../outside" }]);
  rejects([{ ...fixture, responsibilities: [] }]);
  rejects([{ ...fixture, languages: [] }]);
  assert.ok(existsSync(join(temporary, "volunteering/test-position/index.html")), "Invalid input must preserve pages");

  writePositions([{ ...fixture, applicationUrl: "" }]);
  build();
  assert.match(read("volunteering/index.html"), /TypeScript/);
  assert.match(read("volunteering/test-position/index.html"), /application form will be available here soon/);
  assert.doesNotMatch(read("volunteering/test-position/index.html"), /href=""/);

  mkdirSync(join(temporary, "volunteering/handwritten"));
  writeFileSync(join(temporary, "volunteering/handwritten/index.html"), "Handwritten page");
  writePositions([{ ...fixture, published: false }]);
  build();
  assert.match(read("volunteering/index.html"), /no open positions/i);
  assert.ok(!existsSync(join(temporary, "volunteering/test-position/index.html")));
  assert.ok(!existsSync(join(temporary, "volunteering/second-position/index.html")));
  assert.doesNotMatch(read("sitemap.xml"), /volunteering\/test-position/);
  assert.equal(read("volunteering/handwritten/index.html"), "Handwritten page");
  rejects([{ ...fixture, slug: "handwritten" }]);
  assert.equal(read("volunteering/handwritten/index.html"), "Handwritten page");
  console.log("Volunteering checks passed: pages, form links, drafts, validation, sitemap, and withdrawal.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
