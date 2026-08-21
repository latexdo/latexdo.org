# latexdo.org

This repository hosts the public LatexDo website at `https://latexdo.org`. It includes the marketing pages, legal pages, and the CLI installer served from `https://cli.latexdo.org`.

## Repository Role

- Serves the public website.
- Publishes `install.sh` and `bin/latexdo` for CLI installation at `https://cli.latexdo.org`.
- Redirects download and update traffic to `https://app.latexdo.org`.
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
npm run typecheck  # Check TypeScript without emitting files.
```

## Deploy

Cloudflare deploys this repository through its GitHub integration. The Workers static assets deployment is configured in `wrangler.jsonc`.

```sh
npm run build
npx wrangler deploy
```

The Wrangler config publishes static files from the repository root. `_redirects` defines product subdomain redirects, including download/update redirects to `app.latexdo.org`, and `.assetsignore` keeps development-only files out of the asset upload. The GitHub Actions workflow validates PRs and pushes, but it does not deploy GitHub Pages.

## Source Sync

Most website files are generated from the main app repo. To refresh this repo from local source, run this in `/Users/omar/Desktop/Github/latexdo`:

```sh
npm run sync:downstream
```

The sync script intentionally preserves this repo's `README.md`, `LICENSE`, `.nojekyll`, and `wrangler.jsonc`.
