---
title: "Welcome to the LatexDo Blog"
description: "The first post on the LatexDo blog: where release notes, LaTeX writing workflows and editor decisions get written up as short, readable notes."
date: "2026-07-27"
author: "LatexDo"
tags:
  - LatexDo
  - Writing
  - Releases
---

This blog is for short, readable updates about LatexDo: release notes, writing
workflow decisions, LaTeX editor details, and the small engineering notes that
are easier to publish as posts than as full documentation pages.

## Why this exists

LatexDo has a product site, [documentation](/docs/) and an
[extension store](/store/). A blog needs a different shape: one Markdown file
per post, a stable URL that says when it was written, clean metadata, an RSS
feed, and a layout that does not interrupt the reader.

The goal is simple:

- write Markdown in `content/blogpost/`
- commit the file
- let the build turn it into a page at `latexdo.org/blogpost/<year>/<slug>/`
- publish readable HTML with the same LatexDo header, footer, and CSS

## A tiny workflow

The build uses Node only, with no runtime framework and no Markdown package
dependency. That keeps the site easy to audit and keeps CI predictable.

```sh
npm run build
npm test
```

If those commands pass, the post is ready to ship.
