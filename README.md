# latexdo.org

This repository hosts the public LatexDo website at `https://latexdo.org`. It includes the marketing pages, legal pages, and the CLI installer served from `https://cli.latexdo.org`.

## Repository Role

- Serves the public website.
- Publishes `install.sh` and `bin/latexdo` for CLI installation at `https://cli.latexdo.org`.
- Serves desktop downloads under `https://latexdo.org/downloads/` and update metadata under `https://latexdo.org/updates/`.
- Receives most source updates from `/Users/omar/Desktop/Github/latexdo/website`.

## Requirements

- Node.js 20 or newer.
- npm.
- Wrangler for Cloudflare deploys through `npx wrangler`.

## Run Locally

```sh
npm install
npm run build
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`. The build compiles `src/site.ts` into `assets/site.js`.

## Common Commands

```sh
npm run build      # Compile website TypeScript.
npm run test       # Type-check and validate shared shells plus download/update metadata.
npm run typecheck  # Check TypeScript without emitting files.
```

## Volunteering

The shared footer links to `/volunteering/`. Positions are managed in
`volunteering/positions.json`; HTML pages and sitemap entries are generated during
`npm run build` (or `npm run build:volunteering`). No page code needs to be copied.

To add a position:

1. Copy the object from `volunteering/position.example.json` into the array in
   `volunteering/positions.json`.
2. Set a unique `slug`, title, languages, summary,
   description, responsibilities, and requirements. Text is escaped automatically.
3. Paste that position's Google Form share URL into `applicationUrl` (an HTTPS
   `forms.gle` link or a `docs.google.com/forms/.../viewform` link). Leave it empty
   to show that the application form is coming soon, without a broken button.
4. Set `published` to `true` and run `npm run build:volunteering`. Commit the data,
   generated `volunteering/` HTML files, and `sitemap.xml` together.

Each published position appears on the volunteering index and has its own page at
`/volunteering/<slug>/`, including an application button. Set `published` to `false`
or remove an entry to withdraw it; rebuild to remove its generated page and
sitemap entry. Drafts and the example file are not published. Until real roles
are added, the volunteering page shows an empty state.

The shared page layout is `scripts/volunteer-page.template.html`. Keep these changes
in the main app's website source too if using the source sync described below.

## Deploy

GitHub Actions validates this repository and deploys `main` to Cloudflare Workers with Wrangler. The Workers static assets deployment is configured in `wrangler.jsonc`.

```sh
npm run build
npx wrangler deploy
```

The Wrangler config publishes static files from the repository root. `_redirects` defines product subdomain redirects, `.assetsignore` keeps development-only files out of the asset upload, and `worker/index.ts` applies the runtime headers needed by the JSON download and update feeds. Pull requests validate only; pushes to `main` and manual workflow dispatches validate and then deploy the Worker.

The deploy workflow expects `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be configured as GitHub repository secrets.

## Source Sync

Most website files are generated from the main app repo. To refresh this repo from local source, run this in `/Users/omar/Desktop/Github/latexdo`:

```sh
npm run sync:downstream
```

The sync script intentionally preserves this repo's `README.md`, `LICENSE`, `.nojekyll`, and `wrangler.jsonc`.
