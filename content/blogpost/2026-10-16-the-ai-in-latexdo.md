---
title: "The AI in LatexDo, shown in the editor"
description: "Sentence completion, Reformulate with AI, the \fix command, @ file mentions and TikZ figures: each AI feature in LatexDo, played live with a real cursor."
date: "2026-10-16"
author: "LatexDo"
tags:
  - AI
  - Editor
  - Product
---

Most AI features are explained with a screen recording. A video is the wrong
tool for that: you cannot pause it on the exact moment that matters, it blurs
the text you are supposed to read, and it costs megabytes before you see one
frame.

So every demo on this page is the editor itself, drawn in HTML and driven by a
cursor. The text is real text, the menus are the menus LatexDo shows, and the
labels are the labels in the app. Each demo starts when you scroll to it. Use
**Pause** to stop on a step, or **Replay** to watch it again.

One rule runs through all of them: **the AI proposes, you decide.** LatexDo
never edits your file behind your back. A suggestion is grey text until you
press Tab, and every change from the assistant waits on an **Approve** button.

## Finish the sentence you are writing

Pause at the end of an unfinished sentence and LatexDo offers the rest of it as
grey text after the caret. Press **Tab** to keep it. Keep typing, or press
**Escape**, and it disappears.

::demo ghost

It only speaks when a sentence is actually open. It stays quiet inside math,
comments, command names, citation and reference arguments, and headings, and it
never proposes more than the one sentence you started. You can switch it off
under **Settings → AI → Complete sentences as I type**.

## Reformulate a selection

Select a sentence, right-click it and choose **Reformulate with AI**, or press
**⇧⌘R** (**Ctrl+Shift+R** on Windows and Linux). The assistant rewrites only
what you selected and shows the change as a diff: the old text in red, the new
text in green. Nothing changes until you choose **Approve**.

::demo reformulate

**Ask AI about Selection** (**⇧⌘A**) in the same menu attaches the selection to
the chat instead, with its file and line numbers, so you can ask a question about
it rather than replace it.

## Fix the build with one command

Type `\` in the chat to see the quick commands. `\fix` compiles the project,
reads the errors, proposes a fix for each one, and compiles again to check the
build is clean.

::demo fix

The other quick commands work the same way: `\rewrite` the selection,
`\cite` to suggest citations for it from your bibliography, `\proofread` or
`\summarize` the open document, `\outline` the whole project, and `\check` to
run the built-in checkers.

## Point the assistant at a file

Type `@` and pick a file from the project, or press **+** in the composer. The
assistant reads that file before it answers, so you can ask about a chapter you
do not have open.

::demo mention

## Draw a figure, then place it

Describe a figure in plain words. The assistant answers with TikZ code and an
**Insert figure** button. The figure lands at your cursor and appears in the PDF
preview, as ordinary LaTeX you can keep editing.

::demo figure

## Where the model runs

The assistant can use one of three kinds of model, chosen in
**Settings → AI**:

| Option | Where it runs | What you need |
| --- | --- | --- |
| LatexDo AI | On your computer | A one-time model download |
| Ollama | On your computer | Ollama and a model you pulled |
| Cloud | At the provider | Your own API key |

The LatexDo AI models come in four sizes. **LatexDo AI** handles completion and
quick fixes; **AI Plus** adds the in-editor agent, compile diagnostics and
citations; **Pro** and **Pro Max** add paper review, conference checks and
rebuttals. Pick the largest one your computer runs comfortably.

## Try it

Every demo above is a feature in the current release.
[Download LatexDo](/downloads/), open a project and open the AI panel. The [documentation](/docs/) covers the settings in detail.
