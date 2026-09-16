import {
  aiTiers,
  claimAnchor,
  demoCapabilities,
  productRoutes,
  publicSceneControls,
  sceneCapabilities,
  sceneMeta,
} from "./data.js";
import {
  createDemoState,
  demoReducer,
  demoTimeline,
  getTimelineDuration,
} from "./engine.js";
import type { DemoEvent, DemoScene, DemoStage, DemoToken, ProductDemoState } from "./types.js";

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  __latexdoProductDemo?: {
    getState: () => ProductDemoState;
    setScene: (scene: DemoScene) => void;
    replay: () => void;
  };
};

const stageLabels: Array<{ stage: DemoStage; label: string }> = [
  { stage: "source", label: "Source" },
  { stage: "preview", label: "Preview" },
  { stage: "review", label: "Review" },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function trackDemoEvent(name: string, detail: Record<string, unknown> = {}): void {
  const payload = { event: name, ...detail };
  const win = window as DataLayerWindow;
  win.dataLayer?.push(payload);
  window.dispatchEvent(new CustomEvent("latexdo-demo-event", { detail: payload }));
}

function tokenizeLatex(line: string): DemoToken[] {
  const tokens: DemoToken[] = [];
  const pattern = /(\\cite\{[^}]+\}|\\[a-zA-Z]+|%.*|\{[^}]*\}|\$[^$]*\$)/g;
  let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ type: "plain", text: line.slice(cursor, index) });
    const text = match[0];
    let type: DemoToken["type"] = "plain";
    if (text.startsWith("%")) type = "comment";
    else if (text.startsWith("\\cite")) type = "citation";
    else if (text.startsWith("\\")) type = "command";
    else if (text.startsWith("{")) type = "argument";
    else if (text.startsWith("$")) type = "math";
    tokens.push({ type, text });
    cursor = index + text.length;
  }
  if (cursor < line.length) tokens.push({ type: "plain", text: line.slice(cursor) });
  return tokens;
}

function renderTokens(text: string): string {
  return tokenizeLatex(text)
    .map((token) => `<span class="demo-token demo-token-${token.type}">${escapeHtml(token.text)}</span>`)
    .join("");
}

function getLineMarkerText(state: ProductDemoState): string | null {
  if (state.scene === "compiler-error") return "\\includegraphics{results.pdf}";
  if (state.suggestion?.status === "accepted") return state.suggestion.after;
  if (state.suggestion) return state.suggestion.before;
  if (state.reviews.length) return claimAnchor.selectedText;
  return null;
}

function renderEditorLine(line: string, state: ProductDemoState): string {
  const marker = getLineMarkerText(state);
  const ghost = state.editor.ghostText && line.includes("difficult to reproduce")
    ? state.editor.ghostText
    : "";

  if (marker && line.includes(marker)) {
    const [before, afterWithMarker] = line.split(marker);
    const after = afterWithMarker ?? "";
    const className = state.scene === "compiler-error" ? "source-error" : "source-selection";
    return `${renderTokens(before)}<span class="${className}">${renderTokens(marker)}</span>${renderTokens(after)}`;
  }

  return `${renderTokens(line)}${ghost ? `<span class="ai-ghost-text">${escapeHtml(ghost)}</span>` : ""}`;
}

function renderEditor(state: ProductDemoState): string {
  const lines = state.editor.source.split(/\r?\n/);
  const lineBase = state.activeFile === "main.tex" ? 18 : 1;
  const marker = getLineMarkerText(state);

  return `<div class="demo-editor" role="textbox" aria-readonly="true" tabindex="0" data-demo-editor-surface>
    ${lines
      .map((line, index) => {
        const number = lineBase + index;
        const isMarked = Boolean(marker && line.includes(marker));
        const isCursorLine = state.editor.cursor?.line === number;
        return `<div class="editor-line${isMarked ? " is-marked" : ""}${isCursorLine ? " has-cursor" : ""}">
          <span class="line-number">${number}</span>
          <span class="line-code">${renderEditorLine(line, state)}</span>
        </div>`;
      })
      .join("")}
  </div>`;
}

function renderInlineDiff(before: string, after: string): string {
  return `<div class="inline-diff" aria-label="Proposed change">
    <div><span>-</span><del>${escapeHtml(before)}</del></div>
    <div><span>+</span><ins>${escapeHtml(after)}</ins></div>
  </div>`;
}

function renderPaper(state: ProductDemoState): string {
  const revised = state.pdf.version > 1 || state.scene === "complete";
  const claim = revised
    ? "Our method improves accuracy from 81.4% to 87.9% over the baseline."
    : "Our method significantly improves performance over the baseline.";
  const highlight = state.pdf.highlightedBlock === "results-claim-1";

  return `<article class="demo-paper${state.pdf.compiling ? " is-compiling" : ""}" aria-label="Rendered paper preview">
    <p class="paper-kicker">Rendered PDF</p>
    <h3>Efficient Retrieval for Scientific Document Workflows</h3>
    <p class="paper-authors">Anonymous Authors</p>
    <section>
      <h4>Abstract</h4>
      <p>Scientific writing systems must keep source, output, evidence, and review context synchronized.</p>
    </section>
    <section>
      <h4>Results</h4>
      <p class="demo-paper-block${highlight ? " is-linked" : ""}" data-pdf-block="results-claim-1" role="button" tabindex="0">
        ${escapeHtml(claim)}
      </p>
      <figure>
        <div class="paper-figure-bars" aria-hidden="true"><span></span><span></span><span></span></div>
        <figcaption>Accuracy across reproduction environments.</figcaption>
      </figure>
    </section>
    <section>
      <h4>Discussion</h4>
      <p>Reviewer concerns, manuscript revisions, and rebuttal responses remain connected.</p>
    </section>
    <div class="paper-page-count">page 9</div>
    ${state.pdf.compiling ? `<div class="paper-build-overlay">Compiling local PDF</div>` : ""}
  </article>`;
}

function renderReviewCard(state: ProductDemoState): string {
  const thread = state.reviews[0];
  if (!thread) {
    return `<article class="demo-empty-panel">
      <strong>No open review thread</strong>
      <span>The manuscript is ready for the next check.</span>
    </article>`;
  }

  const comment = thread.comments[0];
  return `<article class="review-thread-card" data-demo-thread="${escapeHtml(thread.id)}">
    <div class="finding-topline">
      <span class="status-pill ${thread.status}">${escapeHtml(thread.status)}</span>
      <span>main.tex - 42</span>
    </div>
    <h4>${escapeHtml(thread.author.name)}</h4>
    <blockquote>${escapeHtml(comment?.body ?? "")}</blockquote>
    <div class="review-anchor-mini">Our method <mark>significantly improves performance</mark> over the baseline.</div>
    <div class="demo-action-row">
      <button type="button" data-demo-action="show-proposal">Review suggestion</button>
      <button type="button" data-demo-action="resolve-review">Resolve</button>
    </div>
  </article>`;
}

function renderProblemPanel(state: ProductDemoState): string {
  const diagnostic = state.diagnostics[0];
  if (!diagnostic) {
    return `<article class="demo-empty-panel">
      <strong>No compiler errors</strong>
      <span>PDF and source are linked.</span>
    </article>`;
  }

  const proposal = diagnostic.proposal;
  return `<article class="finding-card severity-error">
    <div class="finding-topline"><span>ERROR</span><span>main.tex - 84</span></div>
    <h4>${escapeHtml(diagnostic.title)}</h4>
    <p>${escapeHtml(diagnostic.explanation)}</p>
    <p><strong>LatexDo found:</strong> figures/results.pdf</p>
    ${proposal ? renderInlineDiff(proposal.before, proposal.after) : ""}
    <button class="button compact primary" type="button" data-demo-action="apply-fix" data-id="${escapeHtml(diagnostic.id)}">Apply fix</button>
  </article>`;
}

function renderProposalPanel(state: ProductDemoState): string {
  const proposal = state.suggestion;
  if (!proposal) return renderReviewCard(state);

  return `<article class="proposal-card">
    <div class="finding-topline"><span>LATEXDO REVIEW</span><span>Claim precision</span></div>
    <h4>Claim precision</h4>
    <p><q>${escapeHtml(proposal.before)}</q> does not quantify the improvement.</p>
    <h5>Suggested revision</h5>
    ${renderInlineDiff(proposal.before, proposal.after)}
    <p class="proposal-reason">${escapeHtml(proposal.reason)}</p>
    <div class="demo-action-row">
      <button class="button compact primary" type="button" data-demo-action="accept-proposal" data-id="${escapeHtml(proposal.id)}">Accept proposal</button>
      <button type="button" data-demo-action="reject-proposal">Reject</button>
    </div>
  </article>`;
}

function renderRebuttalPanel(state: ProductDemoState): string {
  const item = state.rebuttal;
  if (!item) return renderReviewCard(state);

  return `<article class="rebuttal-card">
    <div class="finding-topline"><span>RESPOND</span><span>${escapeHtml(item.status)}</span></div>
    <h4>${escapeHtml(item.reviewer)}</h4>
    <p class="reviewer-comment">${escapeHtml(item.reviewerComment)}</p>
    <div class="response-box">
      <strong>Your response</strong>
      <p>${escapeHtml(item.authorResponse)}</p>
    </div>
    ${item.manuscriptChange ? renderInlineDiff(item.manuscriptChange.before, item.manuscriptChange.after) : ""}
    <footer>Linked to main.tex - 42</footer>
  </article>`;
}

function renderPaperReviewPanel(state: ProductDemoState): string {
  const result = state.paperReview;
  if (!result) {
    return `<article class="demo-empty-panel">
      <strong>Paper Review has not run</strong>
      <span>Structured findings will appear here.</span>
    </article>`;
  }

  const important = result.findings.filter((finding) => finding.severity === "review" || finding.severity === "warning").length;
  return `<div class="paper-review-panel">
    <div class="paper-review-summary">
      <strong>Paper Review</strong>
      <span>${important} important</span>
      <span>${result.findings.length + 4} suggestions</span>
      <span>2 checks</span>
    </div>
    <div class="paper-review-filters" aria-label="Paper review filters">
      ${["All", "Important", "Writing", "Evidence", "References", "Submission"]
        .map((label, index) => `<button type="button" class="${index === 0 ? "active" : ""}">${label}</button>`)
        .join("")}
    </div>
    ${result.findings
      .map((finding) => `<article class="finding-card severity-${escapeHtml(finding.severity)}">
        <div class="finding-topline"><span>${escapeHtml(finding.source.toUpperCase())}</span><span>${escapeHtml(finding.evidence?.[0]?.value ?? "Paper")}</span></div>
        <h4>${escapeHtml(finding.title)}</h4>
        <p>${escapeHtml(finding.explanation)}</p>
        <div class="demo-action-row">
          <button type="button">Explain</button>
          <button type="button">${finding.source === "citation" ? "Inspect citation" : "Add comment"}</button>
          <button type="button">Dismiss</button>
        </div>
      </article>`)
      .join("")}
  </div>`;
}

function renderSubmissionPanel(state: ProductDemoState): string {
  const report = state.submission;
  if (!report) {
    return `<article class="demo-empty-panel">
      <strong>Submission readiness</strong>
      <span>Run checks after the revision is complete.</span>
      <button class="button compact primary" type="button" data-demo-action="run-submission">Run check</button>
    </article>`;
  }

  return `<div class="submission-panel">
    <div class="submission-score">
      <strong>Submission readiness</strong>
      <span>${report.passed} / ${report.total} passed</span>
    </div>
    <div class="submission-checks">
      ${report.checks
        .map((check) => `<article class="submission-check ${escapeHtml(check.status)}">
          <span>${check.status === "pass" ? "PASS" : check.status === "warning" ? "WARN" : "FAIL"}</span>
          <div>
            <strong>${escapeHtml(check.title)}</strong>
            ${check.explanation ? `<small>${escapeHtml(check.explanation)}</small>` : ""}
          </div>
        </article>`)
        .join("")}
    </div>
  </div>`;
}

function renderInspector(state: ProductDemoState): string {
  if (state.scene === "compiler-error") return renderProblemPanel(state);
  if (state.scene === "revision-proposed") return renderProposalPanel(state);
  if (state.scene === "rebuttal") return renderRebuttalPanel(state);
  if (state.scene === "paper-review") return renderPaperReviewPanel(state);
  if (state.scene === "submission-check" || state.scene === "complete") return renderSubmissionPanel(state);
  if (state.scene === "review-arrives" || state.scene === "review-open" || state.scene === "revision-accepted") {
    return renderReviewCard(state);
  }
  return renderProblemPanel(state);
}

function renderCapabilityRegistry(state: ProductDemoState): string {
  const ids = sceneCapabilities[state.scene] ?? [];
  const active = demoCapabilities.filter((capability) => ids.includes(capability.id));
  return `<div class="capability-registry" aria-label="Feature truth registry">
    ${active
      .map((capability) => `<span class="${escapeHtml(capability.status)}">${escapeHtml(capability.status)} - ${escapeHtml(capability.id)}</span>`)
      .join("")}
  </div>`;
}

function renderStatusBar(state: ProductDemoState): string {
  const history = state.history.slice(-3);
  return `<div class="demo-statusbar">
    <span>${escapeHtml(sceneMeta[state.scene].status)}</span>
    <span>${state.playback.playing ? "Autoplay" : state.playback.reducedMotion ? "Reduced Motion" : "Manual"}</span>
    <span>${escapeHtml(state.activeFile)}</span>
    ${history.map((item) => `<span>${escapeHtml(item.label)}</span>`).join("")}
  </div>`;
}

function renderShell(root: HTMLElement, state: ProductDemoState): void {
  root.dataset.scene = state.scene;
  root.dataset.stage = state.activeStage;
  root.dataset.mode = state.mode;

  root.innerHTML = `<div class="product-demo-app" aria-label="LatexDo product demonstration">
    <div class="demo-titlebar">
      <div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="project-meta">
        <strong>LatexDo</strong>
        <span>~/papers/retrieval-workflow/main.tex</span>
      </div>
      <div class="demo-mode-indicator" aria-label="Current mode">${escapeHtml(state.mode)}</div>
      <div class="compile-status" aria-live="polite">${escapeHtml(sceneMeta[state.scene].pdfStatus)}</div>
      <a class="button compact primary" href="/downloads/" data-demo-download data-origin="product_demo">Download</a>
    </div>

    <div class="demo-scene-controls" role="tablist" aria-label="Demo scenes" data-demo-scenes>
      ${publicSceneControls
        .map((control) => `<button type="button" role="tab" aria-selected="${control.scene === state.scene}" class="${control.scene === state.scene ? "active" : ""}" data-demo-scene-target="${control.scene}">
          ${escapeHtml(control.label)}
        </button>`)
        .join("")}
      <button type="button" class="replay-button" data-demo-action="replay">Replay</button>
    </div>

    <div class="demo-stage-switcher" aria-label="Mobile stage">
      ${stageLabels
        .map((item) => `<button type="button" class="${item.stage === state.activeStage ? "active" : ""}" aria-pressed="${item.stage === state.activeStage}" data-demo-stage-target="${item.stage}">
          ${escapeHtml(item.label)}
        </button>`)
        .join("")}
    </div>

    <div class="demo-grid">
      <aside class="demo-activity-bar" aria-label="Workspace areas">
        <button type="button" class="${state.mode === "write" ? "active" : ""}" data-demo-scene-target="writing" title="Write">W</button>
        <button type="button" class="${state.mode === "review" ? "active" : ""}" data-demo-scene-target="review-open" title="Review">R</button>
        <button type="button" class="${state.mode === "respond" ? "active" : ""}" data-demo-scene-target="rebuttal" title="Respond">A</button>
      </aside>

      <aside class="demo-project-tree" aria-label="Project tree">
        <div class="panel-title">Project</div>
        ${["main.tex", "references.bib", "response.tex"]
          .map((file) => `<button type="button" class="tree-file ${state.activeFile === file ? "active" : ""}" data-demo-file="${escapeHtml(file)}">
            <span>${file.endsWith(".bib") ? ".bib" : ".tex"}</span>${escapeHtml(file)}
          </button>`)
          .join("")}
        ${renderCapabilityRegistry(state)}
      </aside>

      <section class="demo-pane demo-source-pane" aria-labelledby="demo-source-title">
        <div class="panel-title" id="demo-source-title">
          <span>${escapeHtml(state.activeFile)}</span>
          <span>${state.editor.ghostText ? "Tab to accept" : "Source"}</span>
        </div>
        ${renderEditor(state)}
      </section>

      <section class="demo-pane demo-pdf-pane" aria-labelledby="demo-pdf-title">
        <div class="panel-title" id="demo-pdf-title">
          <span>PDF preview</span>
          <span>${escapeHtml(sceneMeta[state.scene].pdfStatus)}</span>
        </div>
        ${renderPaper(state)}
      </section>

      <aside class="demo-pane demo-review-pane" aria-label="Review and checks">
        <div class="panel-title">
          <span>${escapeHtml(sceneMeta[state.scene].label)}</span>
          <span>${state.reviews[0]?.status ?? state.diagnostics[0]?.severity ?? "ready"}</span>
        </div>
        <div class="demo-inspector-scroll">
          ${renderInspector(state)}
        </div>
      </aside>
    </div>
    ${renderStatusBar(state)}
  </div>`;
}

function findSceneTimelineOffset(scene: DemoScene): number {
  const item = [...demoTimeline].reverse().find((timelineItem) => {
    const event = timelineItem.event;
    if (event.type === "SET_SCENE") return event.scene === scene;
    if (event.type === "SHOW_COMPLETION") return scene === "completion";
    if (event.type === "START_COMPILE") return scene === "compiling";
    if (event.type === "COMPILE_SUCCESS") return scene === "compiled";
    if (event.type === "OPEN_REVIEW") return scene === "review-open";
    if (event.type === "SHOW_PROPOSAL") return scene === "revision-proposed";
    if (event.type === "ACCEPT_PROPOSAL") return scene === "revision-accepted";
    if (event.type === "OPEN_REBUTTAL") return scene === "rebuttal";
    if (event.type === "RUN_PAPER_REVIEW") return scene === "paper-review";
    if (event.type === "RUN_SUBMISSION_CHECK") return scene === "submission-check";
    if (event.type === "AUTOPLAY_COMPLETE") return scene === "complete";
    return false;
  });
  return item?.at ?? 0;
}

export function initProductDemo(): void {
  const tierContainer = document.querySelector<HTMLElement>("[data-ai-tier-cards]");
  if (tierContainer) tierContainer.innerHTML = renderAiTierCards();

  const routeContainer = document.querySelector<HTMLElement>("[data-product-route-links]");
  if (routeContainer) routeContainer.innerHTML = renderProductRouteLinks();

  const root = document.querySelector<HTMLElement>("[data-product-demo]");
  if (!root) return;

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state = createDemoState(media.matches);
  let timers: number[] = [];
  let timelineStartedAt = 0;
  let timelineElapsed = findSceneTimelineOffset(state.scene);
  let timelineRunning = false;
  let autoplayStarted = false;
  let manualSceneOverride = false;

  const clearTimeline = (): void => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
    timelineRunning = false;
  };

  const render = (): void => {
    renderShell(root, state);
  };

  const dispatch = (event: DemoEvent): void => {
    const previous = state;
    state = demoReducer(state, event);
    timelineElapsed = findSceneTimelineOffset(state.scene);
    render();

    if (event.type === "START" && !previous.playback.playing && state.playback.playing) {
      trackDemoEvent("demo_started");
    }
    if (event.type === "STOP_AUTOPLAY" && previous.playback.playing) {
      trackDemoEvent("demo_interrupted", { scene: previous.scene });
    }
    if (event.type === "SHOW_PROPOSAL") trackDemoEvent("demo_proposal_opened");
    if (event.type === "ACCEPT_PROPOSAL") trackDemoEvent("demo_proposal_accepted");
    if (event.type === "OPEN_REBUTTAL") trackDemoEvent("demo_rebuttal_opened");
    if (event.type === "RUN_SUBMISSION_CHECK") trackDemoEvent("demo_submission_opened");
    if (event.type === "AUTOPLAY_COMPLETE") trackDemoEvent("demo_completed");
  };

  const runTimeline = (fromMs = 0): void => {
    if (state.playback.reducedMotion || state.playback.userInterrupted) return;
    clearTimeline();
    timelineElapsed = fromMs;
    timelineStartedAt = performance.now();
    timelineRunning = true;
    dispatch(fromMs === 0 ? { type: "START" } : { type: "RESUME_AUTOPLAY" });

    demoTimeline
      .filter((item) => item.at > fromMs)
      .forEach((item) => {
        const timer = window.setTimeout(() => {
          timelineElapsed = item.at;
          dispatch(item.event);
          if (item.event.type === "AUTOPLAY_COMPLETE") clearTimeline();
        }, item.at - fromMs);
        timers.push(timer);
      });
  };

  const pauseTimeline = (): void => {
    if (!timelineRunning) return;
    timelineElapsed += performance.now() - timelineStartedAt;
    timelineElapsed = Math.min(timelineElapsed, getTimelineDuration());
    clearTimeline();
    dispatch({ type: "PAUSE" });
  };

  const registerUserInteraction = (): void => {
    if (!state.playback.playing) return;
    clearTimeline();
    dispatch({ type: "STOP_AUTOPLAY" });
  };

  const setSceneManually = (scene: DemoScene): void => {
    registerUserInteraction();
    manualSceneOverride = true;
    dispatch({ type: "SET_SCENE", scene, userInitiated: true });
    trackDemoEvent("demo_scene_selected", { scene });
  };

  const replay = (): void => {
    clearTimeline();
    manualSceneOverride = false;
    state = demoReducer(state, { type: "RESET" });
    timelineElapsed = 0;
    render();
    if (!state.playback.reducedMotion) {
      autoplayStarted = true;
      runTimeline(0);
    }
  };

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const sceneButton = target.closest<HTMLButtonElement>("[data-demo-scene-target]");
    const stageButton = target.closest<HTMLButtonElement>("[data-demo-stage-target]");
    const fileButton = target.closest<HTMLButtonElement>("[data-demo-file]");
    const actionButton = target.closest<HTMLButtonElement>("[data-demo-action]");
    const pdfBlock = target.closest<HTMLElement>("[data-pdf-block]");
    const downloadLink = target.closest<HTMLAnchorElement>("[data-demo-download]");

    if (downloadLink) {
      trackDemoEvent("download_clicked", { origin: downloadLink.dataset.origin ?? "product_demo" });
      return;
    }

    if (sceneButton) {
      setSceneManually(sceneButton.dataset.demoSceneTarget as DemoScene);
      return;
    }

    if (stageButton) {
      registerUserInteraction();
      dispatch({ type: "SET_STAGE", stage: stageButton.dataset.demoStageTarget as DemoStage });
      return;
    }

    if (fileButton) {
      registerUserInteraction();
      dispatch({ type: "SET_FILE", file: fileButton.dataset.demoFile ?? "main.tex" });
      return;
    }

    if (pdfBlock) {
      registerUserInteraction();
      dispatch({ type: "PDF_BLOCK_SELECTED", blockId: pdfBlock.dataset.pdfBlock ?? "results-claim-1" });
      return;
    }

    if (!actionButton) return;
    const action = actionButton.dataset.demoAction;
    if (action !== "replay") registerUserInteraction();

    if (action === "replay") replay();
    if (action === "show-proposal") dispatch({ type: "SHOW_PROPOSAL", id: "proposal-claim-precision" });
    if (action === "accept-proposal") dispatch({ type: "ACCEPT_PROPOSAL", id: actionButton.dataset.id ?? "proposal-claim-precision" });
    if (action === "resolve-review") dispatch({ type: "ACCEPT_PROPOSAL", id: "proposal-claim-precision" });
    if (action === "apply-fix") dispatch({ type: "APPLY_FIX", id: actionButton.dataset.id ?? "compiler-figure-not-found" });
    if (action === "run-submission") dispatch({ type: "RUN_SUBMISSION_CHECK" });
  });

  root.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    if (target.matches("[data-demo-editor-surface]")) {
      registerUserInteraction();
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const button = target.closest<HTMLButtonElement>("[data-demo-scene-target]");
    if (!button) return;

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-demo-scene-target]"));
    const index = buttons.indexOf(button);
    if (index < 0) return;

    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(index + delta + buttons.length) % buttons.length];
    next?.focus();
  });

  root.addEventListener("focusin", (event) => {
    const target = event.target as HTMLElement;
    if (target.matches("[data-demo-editor-surface]")) registerUserInteraction();
  });

  const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-demo-chapter]"));
  if ("IntersectionObserver" in window && chapters.length) {
    const chapterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;
          if (state.playback.playing || manualSceneOverride) return;
          const scene = (entry.target as HTMLElement).dataset.demoChapter as DemoScene | undefined;
          if (scene) dispatch({ type: "SET_SCENE", scene });
        });
      },
      { threshold: [0.6] },
    );
    chapters.forEach((chapter) => chapterObserver.observe(chapter));
  }

  if ("IntersectionObserver" in window) {
    const demoObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.65) return;
        if (autoplayStarted || state.playback.reducedMotion) return;
        autoplayStarted = true;
        runTimeline(0);
      },
      { threshold: [0.65] },
    );
    demoObserver.observe(root);
  } else if (!state.playback.reducedMotion) {
    autoplayStarted = true;
    runTimeline(0);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseTimeline();
      return;
    }
    if (autoplayStarted && !state.playback.userInterrupted && !state.playback.reducedMotion && state.scene !== "complete") {
      runTimeline(timelineElapsed);
    }
  });

  const applyReducedMotion = (matches: boolean): void => {
    clearTimeline();
    state = demoReducer(state, { type: "SET_REDUCED_MOTION", reducedMotion: matches });
    timelineElapsed = findSceneTimelineOffset(state.scene);
    render();
  };

  media.addEventListener("change", (event) => applyReducedMotion(event.matches));

  const win = window as DataLayerWindow;
  win.__latexdoProductDemo = {
    getState: () => state,
    setScene: (scene: DemoScene) => setSceneManually(scene),
    replay,
  };

  render();
}

export function renderAiTierCards(): string {
  return aiTiers
    .map((tier) => `<article class="ai-tier-card">
      <h3>${escapeHtml(tier.name)}</h3>
      <p>${escapeHtml(tier.title)}</p>
      <ul>${tier.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
    </article>`)
    .join("");
}

export function renderProductRouteLinks(): string {
  return productRoutes
    .map((route) => `<a href="${escapeHtml(route.href)}">${escapeHtml(route.label)}</a>`)
    .join("");
}
