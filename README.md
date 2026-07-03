# latexdo.org

This repository hosts the public LatexDo website at `https://latexdo.org`. It includes the marketing pages, downloads metadata, update metadata, legal pages, and the shell installer endpoint.

## Repository Role

- Serves the public website and download pages.
- Publishes `install.sh` and `bin/latexdo` for CLI installation.
- Hosts update metadata under `updates/` and release metadata under `downloads/`.
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

Deploy the site to Cloudflare Workers assets:

```sh
npm run build
npx wrangler deploy
```

The Wrangler config publishes static files from the repository root. `_redirects` defines host redirects, and `.assetsignore` keeps development-only files out of the asset upload. In non-interactive environments, set `CLOUDFLARE_API_TOKEN` before deploying.

This repo also includes a GitHub Pages workflow at `.github/workflows/pages.yml`. In the repository's GitHub Pages settings, set Build and deployment > Source to GitHub Actions. If the source remains set to Deploy from a branch, GitHub will keep running its generated `pages build and deployment` workflow instead.

## Source Sync

Most website files are generated from the main app repo. To refresh this repo from local source, run this in `/Users/omar/Desktop/Github/latexdo`:

```sh
npm run sync:downstream
```

The sync script intentionally preserves this repo's `README.md`, `LICENSE`, `.nojekyll`, and `wrangler.jsonc`.
