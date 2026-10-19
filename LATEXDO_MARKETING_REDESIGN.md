# LatexDo Marketing Redesign

Status: **Audit, strategy and implementation complete on branch `redesign/marketing-site`.
Not committed, not pushed, not deployed.** Implementation followed the approved plan.
Date: 2026-10-19. Audited: `https://latexdo.org/` (live), this repository at `e9652a5`,
and `latexdo-desktop` at `04c9eb3` (read-only, to verify product claims).

The branch was created from `main` (`f22b49e`). All changes are uncommitted in the
working tree; review with `git diff` and `git status`.

---

## 0. Summary

The current site is better than most early-stage product sites. Its copy is
plain and concrete, it already avoids fake testimonials, and Lighthouse rates it
well on desktop. A redesign should not start from the premise that it is broken.

The problems that matter are narrower and more fixable:

1. **The biggest objection is answered wrongly.** The homepage FAQ says LatexDo
   compiles with "the TeX distribution on your computer". The app's setup
   assistant actually installs one for you (pinned TinyTeX, `electron/texRuntime.ts`,
   `src/components/SetupWizard.tsx`). For anyone new to LaTeX, "install TeX first" is
   the main reason not to start, and the site currently creates that obstacle.
2. **The product is shown with HTML imitations, not the product.** Every "screenshot"
   is a hand-built HTML/CSS replica marked `aria-hidden`. Real captures exist in
   `latexdo-desktop/docs/images/` (hero, AI approval, citations, checks, table
   generator; PNG and GIF). The replicas are faithful, but a visitor can't tell
   they're real, and screen-reader users get no description of the product at all.
3. **The navigation is about the association, not the product.** The header has
   eight links plus Donate: About, Programs, Vision, Research, Downloads, Store,
   Docs, Blog. Only two of them help someone decide whether to download. There is
   no Download button in the header.
4. **The homepage has two goals that compete.** After the features, the page moves
   on to Research, then the nonprofit mission with a primary-styled "Support the
   association" button, then stats. The download path and the donation path use
   the same button style.
5. **Trust information is missing at the point of decision.** The version number,
   release date, file sizes (218 to 546 MB), the system requirements, notarization
   and checksums, and what happens after installation are not near the main CTA.
6. **The header and footer are fetched after load.** `/partials/header.html` returns
   a 307 to `/partials/header`, then JavaScript injects it. Without JavaScript there
   is no navigation, and every page view makes two extra requests before the nav
   appears.

---

## 1. Product understanding (verified)

Verified against `latexdo-desktop` source and release notes, version 1.0.0
(released 2026-10-16; 14 builds published 2026-10-16 to 2026-10-19).

| Capability | Evidence |
|---|---|
| Desktop app for macOS (arm64, x64), Windows x64, Linux x64 AppImage | `downloads/manifest.json` |
| macOS builds hardened and notarized | `latexdo-desktop/package.json` `build.mac.notarize: true` |
| Signed update feed; updates only from latexdo.org and the official repo | release notes 1.0.0 `security`; `update-public-key.pem` |
| SHA-256 checksums for every file | `downloads/SHA256SUMS.txt` |
| Setup assistant can install a TeX runtime (TinyTeX v2026.10) | `electron/texRuntime.ts`, `SetupWizard.tsx` |
| Source ⇄ PDF sync (SyncTeX), Code and Visual editing | `electron/synctex.ts`, app screenshots |
| Plain-language error diagnostics | `electron/latexDiagnostics.ts` |
| Pre-submission checks (structure, figures, citations, PDF fonts) | `docs/images/checks.png` |
| Citation search via Crossref and OpenAlex; knowledge graph | `src/features/scholarly/`, `src/features/graph/` |
| Review and rebuttal modes | `src/rebuttalGenerator.ts`, `src/reviewMarkup.ts` |
| AI: local model, Ollama, or own provider; edits need approval | README, `src/features/ai/` |
| Sentence completion, table generator, notation manager, project search | release notes 1.0.0 |
| Voice dictation, local speech-to-text | `src/features/voice/` |
| Import from Overleaf, Word, Markdown, PDF | homepage claims; `electron/pdfImport/` |
| Git and local history | `src/gitBackend.test.ts` |
| No product telemetry | `nextEditTelemetry.ts` is an intentional no-op |
| MIT license, ~77% test coverage badge | `LICENSE`, `docs/coverage.svg` |

**Claims I could not verify and that need your confirmation before they stay on
the site:**

- "12,500+ automated tests run on every build". I counted about 1,930 `it`/`test`
  declarations. Parameterized cases could account for the difference, but I didn't
  run the suite. Either cite the number from a CI run or remove it.
- Windows code signing. There is no signing configuration under `build.win`. If the
  installer isn't signed, Windows SmartScreen will warn users, and the download page
  should say so and explain what to do.
- Minimum OS versions (macOS, Windows, glibc for the AppImage).
- Whether real-time collaboration ships (there is a `src/collaboration/` directory).
  Until confirmed, the site won't mention it.

---

## 2. Audience and positioning

### Who to prioritise

| Audience | Fit with what ships today | Reachability | Priority |
|---|---|---|---|
| PhD students and postdocs writing and revising papers in LaTeX-heavy fields (CS/ML, math, physics, engineering) | Highest: compile → cite → check → rebuttal is exactly their cycle | High: they search for tools and they influence their lab | **Primary** |
| Master's and undergraduate students writing a first thesis in LaTeX | High: TeX auto-install and plain-language errors remove the two biggest hurdles | High: search-driven ("latex error …") | **Secondary** |
| Professors and PIs | Medium: they write less and decide more; they recommend tools | Medium | Tertiary (trust content) |
| Experienced users of local setups (VS Code + LaTeX Workshop, TeXstudio, TeXShop) | Medium: they already have something that works; switching costs are real | Low | Don't lead with them |
| Non-LaTeX academics (Word users) | Low: LatexDo is a LaTeX tool; Word import helps, but it isn't the pitch | — | Not targeted |

The **primary visitor** is a researcher with a deadline who already knows LaTeX
well enough to be frustrated by it. They typically use Overleaf or a local editor
plus several separate tools: a reference manager, a PDF viewer, and a Word file for
the response letter.

### Value proposition

> **LatexDo is a free LaTeX editor for your desktop that handles the whole paper:
> writing, compiling, fixing errors, citing, checking before submission, and
> answering reviewers. Your files stay on your computer.**

- **Why LatexDo:** it is the one app that covers the full paper cycle. Most editors
  stop at "edit and compile".
- **Why now:** 1.0 shipped on 16 October 2026, and builds are being published
  several times a week. It is also an AI assistant that runs locally and asks before
  every edit, at a time when many researchers are wary of uploading unpublished work.
- **Why care:** fewer tools to switch between, errors you can understand, and no
  setup, no account, and no cost.

### Messaging pillars (in order)

1. **The whole paper, one app.** (differentiation)
2. **LaTeX that explains itself.** Plain-language errors and TeX installed for you. (removes objections)
3. **Yours, on your computer.** Local files, no account, works offline, AI that asks first. (trust)
4. **Free and open, built by a nonprofit.** (credibility; it supports the decision but isn't the headline)

---

## 3. Marketing psychology and UX audit (expert heuristic review)

This is an expert heuristic evaluation, not user research. No participants were
tested. Findings are hypotheses to validate (see §11).

| Dimension | Current state | Issue | Severity |
|---|---|---|---|
| First-impression clarity | H1 "Everything your paper needs. In one window." Kicker packs three facts. | The H1 never says "LaTeX" or "editor"; the category depends on the sub-line. "Everything … in one window" is a common all-in-one claim. | Medium |
| Cognitive load | 4 feature chapters + AI + 6 bento cards + research + mission (3 cards) + 4 stats + 6 FAQs | About 20 distinct claims before the final CTA. The research block ("Look inside the writing loop") gives weak information scent. | Medium |
| Visual attention | The animated hero mock competes with the H1; a gradient on "In one window." | Gradient text looks decorative and is a generic pattern. | Low |
| Hierarchy / Gestalt | Chapters alternate consistently. Good. | The mission section uses the same primary button style as Download. | Medium |
| Decision friction (Hick-Hyman) | 9 header choices; no header CTA | The primary action isn't always visible. | **High** |
| Credibility / trust | Nonprofit, MIT, public expenses: strong but buried | Version, date, size, notarization, checksums, and privacy aren't near the CTA. The stat counter animation reads as promotional. | **High** |
| Objection handling | FAQ implies you must install TeX yourself | Wrong. Fixing it is the highest-leverage copy change. | **High** |
| Expectations | 218–546 MB download not shown before clicking | The size surprise happens mid-download. | Medium |
| Recognition over recall | Product shown in context: good | Replicas, not captures, so a visitor can't recognise the real UI after installing. | Medium |
| Choice overload on download | 4 installers + "Developer mode" toggle on a public page | The developer toggle adds noise; static sizes are stale (214.2 MB shown vs 217.8 MB actual). | Medium |
| Memorability | "Where papers get finished." exists only in the footer and JSON-LD | Strong line, underused. | Low |
| Perceived quality | Polished on desktop | The mobile nav toggle has no accessible name; muted text fails contrast. | Medium |

**What makes visitors hesitate or leave (hypotheses):** "Do I have to install
LaTeX?", "Is this trustworthy software from an unknown publisher?" (Windows
SmartScreen, if the installer is unsigned), "Will this upload my unpublished
paper?", "Is it as mature as what I use now?", and a 400–550 MB download they
didn't expect.

---

## 4. Measured baseline (live site, 2026-10-19)

Lighthouse 12.2.1, headless Chrome, one run each. Treat these as indicative, not
statistically robust.

| | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP | Weight |
|---|---|---|---|---|---|---|---|---|---|
| Mobile | 90 | 88 | 82 | 100 | 3.5 s | 0.022 | 30 ms | 1.8 s | 242 KiB |
| Desktop | 99 | 94 | 81 | 100 | 0.8 s | 0 | 0 ms | 0.7 s | 244 KiB |

- Accessibility failures: color contrast (code line numbers, `<em>` in cards),
  heading order (`<h5>` in footer), `nav-toggle` button has no accessible name.
- Best practices: the deduction comes from Cloudflare's injected bot-challenge
  script (`/cdn-cgi/challenge-platform/…`), not from site code.
- `style.css` is 90 KB raw / 17 KB transferred; Lighthouse reports about 17 KiB unused on the homepage.
- Header and footer come from JavaScript `fetch` after a 307 redirect.
- Field data (CrUX INP) is not available. INP can't be measured in a lab run.

---

## 5. Proposed information architecture

### Global navigation (from 9 items to 5 + CTA)

```
[LatexDo]   Features   Docs   Download   GitHub ↗          [ Download — free ]
```

- About, Programs, Vision, Research, Store, Blog, Board, Donate → footer
  ("Association", "Resources", "Transparency" columns). No pages are deleted and no
  URLs change.
- The header CTA is always visible and changes its label based on the detected OS
  ("Download for macOS").
- The header and footer are included at **build time** by a small step in the
  existing `npm run build`. No framework is added, and the client-side fetch is removed.

### Homepage narrative

| # | Section | Question it answers |
|---|---|---|
| 1 | **Hero**: H1, sub-line, primary CTA (OS-aware), secondary "Watch a 30-second tour", release line (`v1.0 · 16 Oct 2026 · macOS, Windows, Linux`), real product capture | What is it? Is it for me? |
| 2 | **Fact strip**: Free and open source (MIT) · No account · Works offline · TeX installed for you | Is there a catch? |
| 3 | **Problem → solution**: three common frustrations (setting up TeX, cryptic logs, a paper spread across five tools), each paired with what LatexDo does | Why would I switch? |
| 4 | **Four core features**, each with a real capture: PDF⇄source sync, plain-language errors + pre-submission checks, citations + graph, review and rebuttal | What does it actually do? |
| 5 | **AI, on your terms**: local/Ollama/own key, approve every diff, sentence completion | Is the AI safe for unpublished work? |
| 6 | **Also built in** (compact): import from Overleaf/Word/Markdown/PDF, Git and history, tables and TikZ, templates, dictation | Does it cover my edge cases? |
| 7 | **Is LatexDo right for you?**: an honest "great fit / not the best fit yet" list instead of a competitor table | Will it work for me? |
| 8 | **Trust**: open source (link to repo and commits), signed and notarized builds + checksums, privacy (no account, no telemetry, what cloud AI sends), nonprofit with public accounts | Can I trust it? |
| 9 | **Download**: OS cards with size, version, requirements, "what happens on first launch" | How do I start? |
| 10 | **FAQ** (8–10 items, incl. TeX install, storage, privacy, Overleaf migration, updates, cost) | What else? |
| 11 | **Final CTA** + a quiet "Support the association" link | Next step |

The Research and Mission sections move off the homepage. Mission becomes a single
line in the Trust section with a link to `/about/`.

### Download page

Detected-OS installer first and the other platforms collapsed beneath it. Each one
shows its size, version, date, and SHA-256. A "Before you install" box covers
requirements and the Windows SmartScreen note if it applies. "After you install"
describes the setup assistant (TeX runtime, optional local AI model). The developer
toggle and release history move to `/downloads/releases/` (with a link back).

---

## 6. Headline exploration

Scored 1–5 by heuristic judgement, not by testing.

| Candidate | Clarity | Differentiation | Credibility | Memorability | Relevance | Notes |
|---|---|---|---|---|---|---|
| Everything your paper needs. In one window. *(current)* | 3 | 3 | 3 | 3 | 4 | No category word; generic all-in-one claim |
| Scientific Writing, Simplified. | 3 | 1 | 3 | 2 | 3 | Could describe any product |
| Your Research Deserves a Better Editor. | 2 | 2 | 2 | 3 | 3 | Vague, and implies the reader's current tool is bad |
| Write Brilliant Research. Without the Friction. | 2 | 2 | 2 | 3 | 3 | Superlative; "brilliant" isn't the editor's job |
| Where papers get finished. | 3 | 4 | 4 | **5** | 5 | Existing brand line; needs a sub-line for the category |
| LaTeX, without the friction. | **5** | 3 | 4 | 4 | 4 | Clear and short; "friction" is common in marketing copy |
| **The LaTeX editor for the whole paper.** | **5** | **5** | **5** | 4 | **5** | Names the category and the differentiator in seven words |

**Recommendation:**

> # The LaTeX editor for the whole paper.
> Write, compile, cite, check and answer reviewers in one free app that runs on your
> computer. LatexDo even installs LaTeX for you.
>
> **[ Download for macOS ]**  Watch the tour ▸
> Version 1.0 · Free and open source · macOS, Windows, Linux

"Where papers get finished." stays as the brand line, used in the final CTA and
the footer. A/B test it as the H1 once analytics can measure it (see §9).

---

## 7. Visual identity: "The typeset page"

The current style is clean but borrows from Apple: system sans, `#fbfbfd`
backgrounds, traffic-light windows, gradient text. The proposed identity draws on
the thing LatexDo produces, a well-typeset scientific page. That makes it
specific to LatexDo rather than a copy of another brand.

**Typography**
- Display: **Source Serif 4** (OFL, self-hosted, one variable woff2 subset of about
  35 KB, `font-display: swap`, metric-matched fallback so text doesn't jump on load).
  It looks like a scholarly page without imitating Computer Modern.
- UI and body: **Inter** (system fallback stack retained).
- Code: system mono stack (no download).
- Scale: 1.25 ratio, fluid via `clamp()`, 17–18 px body, 60–70 ch measure.

**Color** (tokens, light and dark)
- `--ink` #14171f (text), `--paper` #fbfaf7 (warm page), `--rule` #e4e1d9.
- `--accent` **#2f6fdb**, the blue already used for Compile and selection in the
  app, so the site and the product match.
- `--margin` **#c2410c**, a "red pen" used only for review, error, and annotation
  moments. It is never used for buttons, so it keeps its meaning.
- All text pairs ≥ 4.5:1; UI and focus indicators ≥ 3:1. These will be checked with a script, not by eye.

**Motifs, used sparingly and with a purpose**
- Equation-style section numbers on the right margin, `(1)`, `(2)`, …, as the
  section index. This is wayfinding, not decoration.
- Hairline rules and a baseline grid in place of shadows and gradients.
- Product captures framed as plain windows with a 1 px rule and a soft shadow. No
  device mockups.

**Interaction**
- One 200 ms ease-out for state changes. Sections fade in by 8 px once, and the
  page is fully visible without JavaScript.
- Feature captures are muted, looping, `playsinline` MP4/WebM with a poster frame.
  They autoplay only when in view and only if `prefers-reduced-motion: no-preference`;
  otherwise a static image with a play button is shown.
- Visible 2 px focus ring in `--accent` with an offset, plus `:focus-visible` on every
  interactive element.
- The count-up stat animation and gradient text are removed.

**Components:** button (primary/secondary/link), header, OS-aware download button,
release line, feature row (copy + capture), fact strip, fit list, trust card,
download card, FAQ (`<details>`), footer, announcement bar (for new releases only),
status pill.

---

## 8. Engineering plan

Constraints: static HTML + TypeScript compiled by `tsc`, deployed by Cloudflare
Workers static assets. **No framework added.** All existing pages, URLs, download
and update feeds, `_redirects`, the Turnstile email flow, and CI checks are kept.

1. Branch `redesign/marketing-site` from `main`. Rollback = don't merge, or revert
   the merge commit. Deploys only happen from `main`, so the branch can't reach
   production by itself.
2. `scripts/build-partials.mjs`: inline `partials/header.html` and `footer.html` into
   every page at build time, then remove the runtime fetch. `check:footers`
   is updated to match.
3. New `assets/tokens.css` (design tokens) and a rewritten homepage stylesheet.
   Shared `style.css` changes are limited to header, footer, and tokens so other
   pages don't regress.
4. Product media: copy the PNG captures from `latexdo-desktop/docs/images/` (copied
   only; that repo is not modified), convert them to AVIF/WebP with explicit sizes,
   and convert the GIFs to MP4/WebM. The 3.7 MB hero GIF becomes a sub-1 MB video with
   a poster. Every capture gets real alt text.
5. Homepage rebuilt to the §5 structure. The HTML replicas (`app-shots.css`, ~27 KB)
   are dropped from the homepage.
6. Download page: OS-first layout, sizes rendered from `manifest.json` at build time
   (no stale fallbacks), requirements, first-launch explainer.
7. SEO: update title/description, `SoftwareApplication` (`softwareVersion`,
   `datePublished`, `downloadUrl`, `fileSize`), FAQ JSON-LD synced to the visible FAQ,
   new OG image from a real capture, sitemap `lastmod`.
8. Accessibility fixes: nav toggle label, heading order, contrast, alt text, skip
   link, reduced motion.
9. Verification: `npm test`, Lighthouse mobile and desktop (3 runs, median),
   axe-core, keyboard-only walkthrough, VoiceOver spot check, 360/768/1280/1440 px
   screenshots, link check, download links resolve to the manifest.

Unchanged: the desktop app, `downloads/` and `updates/` contents, `worker/`,
`wrangler.jsonc`, the CI workflow, DNS, and analytics configuration (see §9).

---

## 9. Conversion and analytics

**Primary conversion:** an installer download started (click on a `manifest.json`
file URL).
**Secondary:** download page view, tour video played ≥ 50%, GitHub click, docs click
from the homepage.

**Objectives** (relative to a baseline measured after launch; no baseline numbers
are assumed here):
- Increase the homepage → download-click rate.
- Reduce homepage visitors who never scroll past the hero (exits from the hero).
- Increase the share of downloads that start from the OS-recommended button rather than "other platforms".

**Privacy-respecting analytics (recommendation, needs your approval):** the site
currently loads GA4 behind a consent banner. Because the site already runs on
Cloudflare, **Cloudflare Web Analytics** (cookieless, no personal data) could
replace it. That removes the consent banner, which is friction on its own, and still
counts page views. Download clicks can be counted with a single `POST /api/event`
in the existing Worker that stores only `{event, platform, origin, date}` with
no IP or user agent. This changes production infrastructure, so it is **out of scope
unless you approve it**. Until then, the existing `data-origin` attributes stay so
that GA can attribute clicks.

**Ethics:** no countdowns, no scarcity, no pre-checked boxes, no exit popups.
Donation requests appear only after the product has been explained.

---

## 10. SEO

The site already scores 100 and has intent pages (`/overleaf-alternative/`,
`/latex-editor-{mac,windows,linux}/`, `/latex-errors/`). Planned changes:

- Homepage title: `LatexDo: Free LaTeX Editor for Mac, Windows and Linux` (leads
  with the query people actually type; "AI" moves to the description).
- Description: ≤ 155 chars, matching the new value proposition.
- One `<h1>`, descriptive `<h2>`s that match search terms ("LaTeX errors explained",
  "Citation search with Crossref and OpenAlex", "Respond to reviewers").
- Structured data synced to the visible content. No `aggregateRating` (there are no ratings).
- Real-capture OG image. `lastmod` in the sitemap. robots.txt unchanged.
- Cross-link the homepage FAQ to `/latex-errors/` and `/overleaf-alternative/` so
  those pages are easier to find.

---

## 11. Validation plan

**Not done yet.** No participants have been tested. Proposed test: 5 participants
(3 PhD/postdoc, 2 Master's), a 10-minute unmoderated test on the staging build,
on desktop and mobile:

1. After 5 s on the hero: "What is this product?" (comprehension)
2. "Who is it for?" / "Name two reasons you'd use it."
3. "Download it for your computer." (task success, time, wrong clicks)
4. "Do you need anything else installed first?" (tests the TeX message)
5. "How confident are you that this is safe to install? Why?" (1–5 + free text)

Expert heuristic findings (§3) are reported separately and are not presented as
user evidence.

---

## 12. What was implemented

### Open questions: what I did by default

| Question (§1) | Default applied |
|---|---|
| "12,500+ automated tests" | Removed. It couldn't be verified. |
| Windows code signing | No claim either way. Only the macOS notarization is mentioned. |
| Minimum OS versions | Not stated. Only architectures are listed (from `manifest.json`). |
| Real-time collaboration | Not mentioned. The "Maybe not yet" list says LatexDo is a desktop app. |
| Product visuals | Real captures (see below). HTML replicas removed from the homepage. |
| Analytics | Unchanged (GA4 behind the existing consent banner). |
| Preview | Local only (`npx serve`). No Cloudflare preview was created. |

### Files

| File | Change |
|---|---|
| `index.html` | Rewritten to the §5 structure and §6 headline. Header and footer are inlined at build time. FAQ JSON-LD matches the visible FAQ. New title, description, and OG/Twitter copy. |
| `assets/home.css` | Rewritten ("typeset page" system, responsive, reduced motion). |
| `src/home.ts` → `assets/home.js` | Rewritten: OS detection, download data from `manifest.json`, recommended platform, tour dialog, scroll reveal (content stays visible without JS). Removes the typing animation, counters, tilt, and `research.js` from the homepage. |
| `partials/header.html` | Nav cut from 9 items to Features · Docs · FAQ · GitHub + a **Download** button. Nav toggle gets an accessible name. The donation iframe gets a title. |
| `partials/footer.html` | Association pages moved here (Product / Learn / Association / Transparency). Donate moved here. `h5` → `h2` (heading order). |
| `style.css` | Appended block with brand tokens (`--ld-*`) and new header/footer styles. Earlier rules are untouched. |
| `src/site.ts` | The Donate dialog uses event delegation, so the button in the lazily loaded footer works on every page. |
| `scripts/build-partials.mjs` (new), `package.json` | `npm run build:partials`: inlines partials into pages that use `<!-- partial:… -->` markers. It is part of `npm run build`. |
| `scripts/check-footers.mjs` | Accepts inlined partials and fails if they are out of date. |
| `assets/shots/` (new) | Real captures from `latexdo-desktop/docs/images/` as AVIF + WebP at 1200/1600 and 800 px. `hero.mp4` (383 KB, replaces the 3.7 MB GIF) for the tour. |
| `assets/fonts/` (new) | Source Serif 4 variable, latin, **49 KB** (not the ~35 KB I estimated), OFL. |
| `sitemap.xml`, `assets/ATTRIBUTION.md` | Homepage `lastmod`; font and capture attribution. |

**Not touched:** `downloads/`, `updates/`, `worker/`, `wrangler.jsonc`, `_headers`,
`_redirects`, CI, and the desktop app. The other 60 pages keep their content and
styles. They automatically get the new header and footer because they load the
same partials at runtime.

### Design decisions made during implementation

- The README GIFs have captions and title cards burned in, so they don't work as
  silent loops on a page. Features use the clean PNG captures. The full captioned
  12-second tour plays in a dialog only when someone asks for it ("Watch the tour").
- No review/rebuttal screenshot exists, so that feature is presented as text rather
  than with an invented visual.
- Equation-style numbers `(1)`–`(4)` mark features and install steps. The red-pen
  colour appears only on "Before" labels.
- Download section: links and sizes come from `manifest.json` at runtime. The static
  HTML links to `/downloads/`, so it can never show stale sizes. The visitor's
  platform is highlighted and moved first. Macs show both chips plus how to check
  which one you have.
- Legacy `style.css` rules (`.hero`, `.reveal`, `.faq-list`, `.feature-grid`) collided
  with the new classes. The homepage uses non-colliding names instead of overrides.

## 13. Test results (measured 2026-10-19, local build served by `npx serve`)

### Lighthouse 12.2.1, median of 3 runs

| | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP | Weight |
|---|---|---|---|---|---|---|---|---|---|
| Before, live, mobile (1 run) | 90 | 88 | 82 | 100 | 3.5 s | 0.022 | 30 ms | 1.8 s | 242 KiB |
| **After, local, mobile** | **98** | **100** | **100** | **100** | **2.2 s** | **0** | **0 ms** | **1.4 s** | **204 KiB** |
| Before, live, desktop (1 run) | 99 | 94 | 81 | 100 | 0.8 s | 0 | 0 ms | 0.7 s | 244 KiB |
| **After, local, desktop** | **100** | **100** | **100** | **100** | **0.5 s** | **0** | **0 ms** | **0.3 s** | **253 KiB** |

Caveats: "before" is the live Cloudflare site; "after" is localhost. The live
best-practices deduction came from Cloudflare's injected challenge script, which
the local server doesn't add, so that column isn't a like-for-like comparison.
Remaining flags are long cache TTLs (a `serve` artefact; production uses
`_headers`), unminified CSS/JS (~7 KiB), and ~16 KiB of unused rules in the shared
`style.css`. Re-measure on a Cloudflare preview before launch.

### Automated checks (Playwright + axe-core 4.10, Chrome)

All passed:

- `npm test`: typecheck, build, product-demo, volunteering, shells (63 pages), downloads/update feeds, SEO (43 pages).
- axe-core WCAG 2.0/2.1/2.2 A+AA: **0 violations** at 1440 px and 390 px, after all sections were revealed.
- No horizontal scroll at 320, 390, 768, 1024, 1440 px.
- Keyboard: skip link → logo → Features → Docs → FAQ → GitHub → Download → hero links. Focus is visible on every stop. The skip link lands on `#content`.
- The tour dialog opens; Escape closes it and pauses the video. FAQ items open with Enter.
- The Donate dialog opens from the final section and from the footer.
- Mobile menu opens and shows Download. On a phone, the hero CTA stays "Download for free" and points to the section.
- Emulated Windows visitor: "Download for Windows" → the `.exe` URL in the manifest. The Windows card is recommended and listed first.
- All 4 download buttons match `manifest.json`.
- `/docs/`, `/downloads/`, `/about/`, `/overleaf-alternative/` render the new header and footer.
- Without JavaScript: all 5 nav links are in the HTML and no content is hidden.

**Not tested:** real screen readers (VoiceOver/NVDA), Safari, Firefox, real
devices, and users (§11 still applies).

## 14. Deployment and rollback plan

1. Review locally: `npm run build && npx serve -l 8787 .` → http://localhost:8787
2. Commit on `redesign/marketing-site` and open a PR (CI validates PRs only).
3. Optional, with your approval: `npx wrangler versions upload` for a Cloudflare
   preview URL. Re-run Lighthouse there.
4. Launch = merge to `main` after your approval.
5. Rollback = `git revert -m 1 <merge>` and push, or `npx wrangler rollback`.
   `downloads/` and `updates/` are untouched, so the desktop auto-updater is unaffected.

## 15. Remaining limitations and launch recommendations

- **Confirm the four facts in §1.** If the Windows installer is unsigned, add a
  SmartScreen note to the download card.
- **The `/downloads/` page is generated by the desktop release workflow**, so it
  wasn't redesigned here. Make the §5 download-page changes in that template (in
  `latexdo-desktop`), or point the release workflow at this design.
- Inner pages still use the previous body styles under the new header. Restyle
  them in a follow-up so the whole site uses the typeset-page system.
- `assets/app-shots.css`, `assets/research.js` (on the homepage) and the old homepage
  product-demo CSS are no longer used by the homepage. `app-shots.css` can be
  deleted after confirming nothing else references it.
- The social preview image is unchanged. Replace it with one made from `hero.webp`.
- New captures (dark mode, Windows chrome, rebuttal mode) need to be recorded in the app.
- Consider cookieless analytics (§9) to remove the consent banner, which covers
  part of the mobile hero on first visit.
- Run the 5-person test in §11 before or shortly after launch.
