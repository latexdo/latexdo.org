# LatexDo AI Source

Public default AI source for LatexDo, now hosted at
`https://latexdo.org/research/ai/`.

LatexDo builds consume the AI source manifest and
`catalog/latexdo-ai-catalog.v1.json` from this repository. That keeps the public
agent loop and model/provider choices outside the desktop app source while still
baking them into normal desktop releases. A user with a regular laptop can
install LatexDo, open setup, choose a local model, download it, and use AI
normally.

## Public AI Source

This repository owns the AI implementation that LatexDo bakes into normal
desktop releases:

- Renderer agent loop, prompts, tool protocol, slash commands, config, and tests.
- AI sidebar, setup wizard, cloud-provider form, researcher profile dialog, and
  their tests.
- Electron local GGUF/Ollama IPC modules.
- AI-specific CSS injected into the LatexDo stylesheet.
- Public model/provider catalog.

LatexDo reads `latexdo-sync.json` to copy the source files into the desktop app
before build. The host app wiring remains in LatexDo because it connects these
modules to the editor shell.

## Catalog

The catalog controls:

- Local GGUF models offered by the setup wizard.
- Cloud provider presets and default models.
- Default local, inline-completion, and cloud provider selections.

Validate the catalog before using it:

```sh
npm run check
```

## Using This Source

From the `latexdo` repository:

```sh
npm run ai:sync
```

By default this reads the source manifest and catalog from:

```text
https://latexdo.org/research/ai/latexdo-sync.json
https://latexdo.org/research/ai/catalog/latexdo-ai-catalog.v1.json
```

Advanced distribution builds can point LatexDo at another checked-out AI source:

```sh
LATEXDO_AI_SOURCE_PATH=/path/to/ai-source npm run build
```

They can also point at another catalog:

```sh
LATEXDO_AI_CATALOG_PATH=/path/to/ai-catalog/catalog/latexdo-ai-catalog.v1.json npm run build
```

Or use a hosted catalog:

```sh
LATEXDO_AI_CATALOG_URL=https://latexdo.org/research/ai/catalog/latexdo-ai-catalog.v1.json npm run build
```

Set `LATEXDO_AI_CATALOG_REQUIRED=1` in release CI if a missing or invalid external
catalog must fail the build instead of leaving the checked-in generated fallback.
Set `LATEXDO_AI_SOURCE_REQUIRED=1` as well if missing synced AI source must fail
the build.
