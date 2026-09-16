export const demoScenes = [
    "initial",
    "writing",
    "completion",
    "compiling",
    "compiled",
    "compiler-error",
    "review-arrives",
    "review-open",
    "revision-proposed",
    "revision-accepted",
    "rebuttal",
    "paper-review",
    "submission-check",
    "complete",
];
export const publicSceneControls = [
    { scene: "writing", label: "Write", stage: "source" },
    { scene: "compiled", label: "Compile", stage: "preview" },
    { scene: "compiler-error", label: "Error", stage: "review" },
    { scene: "review-open", label: "Review", stage: "review" },
    { scene: "rebuttal", label: "Respond", stage: "review" },
    { scene: "paper-review", label: "Paper Review", stage: "review" },
    { scene: "submission-check", label: "Submit", stage: "review" },
];
export const sceneMeta = {
    initial: {
        label: "Ready",
        mode: "write",
        stage: "source",
        status: "Edited",
        pdfStatus: "PDF",
    },
    writing: {
        label: "Writing",
        mode: "write",
        stage: "source",
        status: "Edited",
        pdfStatus: "PDF",
    },
    completion: {
        label: "Completion",
        mode: "write",
        stage: "source",
        status: "Edited",
        pdfStatus: "PDF",
    },
    compiling: {
        label: "Compiling",
        mode: "write",
        stage: "preview",
        status: "Compiling",
        pdfStatus: "Compiling",
    },
    compiled: {
        label: "Built",
        mode: "write",
        stage: "preview",
        status: "Built in 0.8s",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    "compiler-error": {
        label: "Diagnostic",
        mode: "write",
        stage: "review",
        status: "Figure not found",
        pdfStatus: "Needs fix",
    },
    "review-arrives": {
        label: "Review arrived",
        mode: "review",
        stage: "review",
        status: "Open review",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    "review-open": {
        label: "Review open",
        mode: "review",
        stage: "review",
        status: "Open review",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    "revision-proposed": {
        label: "Proposal",
        mode: "review",
        stage: "review",
        status: "Proposal pending",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    "revision-accepted": {
        label: "Revision accepted",
        mode: "review",
        stage: "preview",
        status: "Review resolved",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    rebuttal: {
        label: "Respond",
        mode: "respond",
        stage: "review",
        status: "Response linked",
        pdfStatus: "Built in 0.8s",
        highlightedBlock: "results-claim-1",
    },
    "paper-review": {
        label: "Paper Review",
        mode: "review",
        stage: "review",
        status: "3 important",
        pdfStatus: "Built in 0.8s",
    },
    "submission-check": {
        label: "Submission",
        mode: "respond",
        stage: "review",
        status: "7 of 9 passed",
        pdfStatus: "Ready check",
    },
    complete: {
        label: "Ready",
        mode: "respond",
        stage: "review",
        status: "Manuscript ready",
        pdfStatus: "Ready",
    },
};
export const introTypingChunks = [
    { text: "However, ", duration: 260 },
    { text: "existing approaches ", duration: 420 },
    { text: "remain difficult to reproduce ", duration: 510 },
    { text: "across heterogeneous environments.", duration: 600 },
];
export const deterministicDelays = [42, 51, 39, 63, 47, 44, 78];
export const writingPrefix = String.raw `\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{graphicx}
\usepackage{microtype}
\usepackage{hyperref}

\title{Efficient Retrieval for Scientific Document Workflows}
\author{Anonymous Authors}
\date{}

\begin{document}
\maketitle

\begin{abstract}
Scientific writing systems must keep source, output, evidence, and review
context synchronized while authors revise under deadline pressure.
\end{abstract}

\section{Introduction}`;
export const writingPartial = "However, existing approaches remain difficult to reproduce";
export const completionGhost = " across heterogeneous environments.";
export const writingComplete = `${writingPartial}${completionGhost}`;
export const mainSourceAccepted = String.raw `${writingPrefix}
${writingComplete}

\section{Method}
LatexDo records source anchors, rendered PDF blocks, and review state as
document transitions rather than as a detached chat transcript.

\section{Results}
Our method significantly improves performance over the baseline.

\begin{figure}
  \centering
  \includegraphics{figures/results.pdf}
  \caption{Accuracy across reproduction environments.}
\end{figure}

\section{Discussion}
The workflow links reviewer concerns, source edits, PDF updates, and rebuttal
responses so authors can verify that every change is accounted for.
\end{document}`;
export const mainSourceInitial = String.raw `${writingPrefix}

\section{Method}
LatexDo records source anchors, rendered PDF blocks, and review state as
document transitions rather than as a detached chat transcript.

\section{Results}
Our method significantly improves performance over the baseline.

\begin{figure}
  \centering
  \includegraphics{figures/results.pdf}
  \caption{Accuracy across reproduction environments.}
\end{figure}

\section{Discussion}
The workflow links reviewer concerns, source edits, PDF updates, and rebuttal
responses so authors can verify that every change is accounted for.
\end{document}`;
export const mainSourceWriting = String.raw `${writingPrefix}
${writingPartial}

\section{Method}
LatexDo records source anchors, rendered PDF blocks, and review state as
document transitions rather than as a detached chat transcript.

\section{Results}
Our method significantly improves performance over the baseline.

\begin{figure}
  \centering
  \includegraphics{figures/results.pdf}
  \caption{Accuracy across reproduction environments.}
\end{figure}

\section{Discussion}
The workflow links reviewer concerns, source edits, PDF updates, and rebuttal
responses so authors can verify that every change is accounted for.
\end{document}`;
export const mainSourceCompilerError = mainSourceAccepted.replace("\\includegraphics{figures/results.pdf}", "\\includegraphics{results.pdf}");
export const mainSourceRevised = mainSourceAccepted.replace("Our method significantly improves performance over the baseline.", "Our method improves accuracy from 81.4% to 87.9% over the baseline.");
export const demoFileSources = {
    "main.tex": mainSourceAccepted,
    "references.bib": String.raw `@article{smith2026workflow,
  title = {Scientific Document Workflows},
  author = {Smith, A. and Chen, R.},
  journal = {Journal of Reproducible Systems},
  year = {2026}
}

@inproceedings{doe2025retrieval,
  title = {Retrieval Grounded Writing Tools},
  author = {Doe, J.},
  booktitle = {Conference on Research Software},
  year = {2025}
}`,
    "response.tex": String.raw `\reviewer{2}
The claim of significant improvement requires quantitative evidence.

\response
Thank you for pointing this out. We revised Section 3 to report the exact
improvement over the baseline and linked the response to the manuscript edit.`,
};
const reviewerTwo = {
    kind: "human",
    name: "Reviewer 2",
    role: "external reviewer",
};
export const claimAnchor = {
    filePath: "main.tex",
    range: {
        startLine: 42,
        startColumn: 12,
        endLine: 42,
        endColumn: 51,
    },
    selectedText: "significantly improves performance",
    contextBefore: "Our method ",
    contextAfter: " over the baseline.",
    contentHash: "claim-precision-81f6",
};
export const figureAnchor = {
    filePath: "main.tex",
    range: {
        startLine: 84,
        startColumn: 3,
        endLine: 84,
        endColumn: 34,
    },
    selectedText: "\\includegraphics{results.pdf}",
    contextBefore: "  \\centering\n  ",
    contextAfter: "\n  \\caption",
    contentHash: "figure-path-a90c",
};
export const reviewProposal = {
    id: "proposal-claim-precision",
    target: claimAnchor,
    before: "significantly improves performance",
    after: "improves accuracy from 81.4% to 87.9%",
    reason: "Reviewer 2 asked for the claim to be quantified.",
    source: "ai",
    status: "pending",
};
export const compilerFixProposal = {
    id: "proposal-figure-path",
    target: figureAnchor,
    before: "\\includegraphics{results.pdf}",
    after: "\\includegraphics{figures/results.pdf}",
    reason: "The project contains figures/results.pdf.",
    source: "compiler",
    status: "pending",
};
export const reviewThreadsBase = [
    {
        id: "review-r2-precision",
        anchor: claimAnchor,
        author: reviewerTwo,
        status: "open",
        comments: [
            {
                id: "comment-r2-precision",
                author: reviewerTwo,
                body: "Can you quantify 'significantly'?",
                createdAt: 1789502400000,
            },
        ],
        proposedEdit: reviewProposal,
        createdAt: 1789502400000,
    },
];
export const compilerDiagnostic = {
    id: "compiler-figure-not-found",
    source: "compiler",
    severity: "error",
    filePath: "main.tex",
    anchor: figureAnchor,
    title: "Figure not found",
    explanation: "results.pdf could not be resolved.",
    proposal: compilerFixProposal,
    evidence: [{ label: "LatexDo found", value: "figures/results.pdf" }],
    state: "open",
};
export const rebuttalItem = {
    id: "rebuttal-r2-precision",
    reviewer: "Reviewer 2",
    reviewThreadId: "review-r2-precision",
    reviewerComment: "The claim of significant improvement requires quantitative evidence.",
    authorResponse: "Thank you for pointing this out. We revised Section 3 to report the exact improvement over the baseline.",
    manuscriptChange: {
        before: "significantly improves performance",
        after: "improves accuracy from 81.4% to 87.9%",
        anchor: claimAnchor,
    },
    status: "ready",
};
export const paperReviewResult = {
    manuscriptVersion: "demo-v3",
    categories: {
        structure: { label: "Structure", count: 1, status: "attention" },
        clarity: { label: "Clarity", count: 2, status: "attention" },
        evidence: { label: "Evidence", count: 3, status: "blocked" },
        citations: { label: "References", count: 1, status: "attention" },
        reproducibility: { label: "Reproducibility", count: 2, status: "attention" },
        latex: { label: "LaTeX", count: 0, status: "clear" },
        submission: { label: "Submission", count: 2, status: "attention" },
    },
    findings: [
        {
            id: "finding-sample-size",
            source: "latexdo-ai",
            severity: "review",
            filePath: "main.tex",
            title: "Sample size is not justified",
            explanation: "Methods line 114 introduces the sample size without explaining why it is sufficient.",
            evidence: [{ label: "Location", value: "Methods - line 114" }],
            state: "open",
        },
        {
            id: "finding-citation-support",
            source: "citation",
            severity: "warning",
            filePath: "references.bib",
            title: "Citation may not support the complete claim",
            explanation: "Related Work line 78 cites [14] for both retrieval and review automation.",
            evidence: [{ label: "Action", value: "Inspect citation" }],
            state: "open",
        },
        {
            id: "finding-page-limit",
            source: "submission",
            severity: "warning",
            title: "Page limit exceeded",
            explanation: "The compiled PDF has 9 pages. The target venue allows 8 pages.",
            evidence: [
                { label: "PDF", value: "page 9" },
                { label: "Limit", value: "8 pages" },
            ],
            state: "open",
        },
    ],
};
export const submissionReport = {
    id: "submission-ready-demo",
    passed: 7,
    total: 9,
    checks: [
        { id: "pdf-generated", category: "pdf", deterministic: true, status: "pass", title: "PDF generated" },
        { id: "no-compiler-errors", category: "compiler", deterministic: true, status: "pass", title: "No compiler errors" },
        { id: "references-resolved", category: "references", deterministic: true, status: "pass", title: "References resolved" },
        { id: "figures-embedded", category: "figures", deterministic: true, status: "pass", title: "Figures embedded" },
        { id: "fonts-embedded", category: "format", deterministic: true, status: "pass", title: "Fonts embedded" },
        { id: "anonymous", category: "anonymity", deterministic: false, status: "pass", title: "Anonymous manuscript" },
        { id: "metadata", category: "format", deterministic: true, status: "pass", title: "Metadata checked" },
        {
            id: "page-limit",
            category: "format",
            deterministic: true,
            status: "warning",
            title: "Page limit",
            explanation: "9 pages / maximum 8",
            location: { page: 9 },
        },
        {
            id: "supplement-missing",
            category: "figures",
            deterministic: true,
            status: "warning",
            title: "Supplement",
            explanation: "Referenced but not found",
        },
    ],
};
export const demoCapabilities = [
    {
        id: "inline-completion",
        status: "shipping",
        desktopReference: "Desktop editor inline completion tier",
        approvedForMarketing: true,
    },
    {
        id: "local-compile",
        status: "shipping",
        desktopReference: "Local LaTeX build pipeline",
        approvedForMarketing: true,
    },
    {
        id: "compiler-diagnostics",
        status: "beta",
        desktopReference: "Compiler output normalization",
        approvedForMarketing: true,
    },
    {
        id: "review-comments",
        status: "shipping",
        desktopReference: "Review comments anchored to editor ranges",
        approvedForMarketing: true,
    },
    {
        id: "selection-safe-proposals",
        status: "shipping",
        desktopReference: "Undoable guarded AI edit acceptance",
        approvedForMarketing: true,
    },
    {
        id: "rebuttal-linking",
        status: "beta",
        desktopReference: "Rebuttal data tracks reviewer comment and manuscript change",
        approvedForMarketing: true,
    },
    {
        id: "paper-review",
        status: "beta",
        desktopReference: "Structured paper review output",
        approvedForMarketing: true,
    },
    {
        id: "submission-readiness",
        status: "beta",
        desktopReference: "Submission checks and PDF validation",
        approvedForMarketing: true,
    },
    {
        id: "research-companion",
        status: "roadmap",
        desktopReference: "Long-horizon research workspace reasoning",
        approvedForMarketing: false,
    },
];
export const sceneCapabilities = {
    initial: ["local-compile"],
    writing: ["inline-completion"],
    completion: ["inline-completion"],
    compiling: ["local-compile"],
    compiled: ["local-compile"],
    "compiler-error": ["compiler-diagnostics"],
    "review-arrives": ["review-comments"],
    "review-open": ["review-comments"],
    "revision-proposed": ["selection-safe-proposals"],
    "revision-accepted": ["selection-safe-proposals"],
    rebuttal: ["rebuttal-linking"],
    "paper-review": ["paper-review"],
    "submission-check": ["submission-readiness"],
    complete: ["submission-readiness", "rebuttal-linking"],
};
export const aiTiers = [
    {
        name: "LatexDo AI",
        title: "Finish what you are writing.",
        points: ["Inline completion", "Quick fixes", "Lightweight help"],
    },
    {
        name: "LatexDo AI Plus",
        title: "Work with the project.",
        points: ["Project-aware agent", "Compile diagnostics", "Citation tools"],
    },
    {
        name: "LatexDo Pro",
        title: "Review the paper.",
        points: ["Structure review", "Submission checks", "Rebuttal workflow"],
    },
    {
        name: "LatexDo Pro Max",
        title: "Reason across the research workspace.",
        points: ["Long-form review", "Workspace reasoning", "Deep recommendations"],
    },
];
export const productRoutes = [
    { href: "/editor/", label: "Editor overview" },
    { href: "/ai/", label: "AI tiers" },
    { href: "/review/", label: "Review and rebuttal" },
    { href: "/compiler/", label: "Compiler diagnostics" },
    { href: "/research/", label: "Research notes" },
    { href: "/downloads/", label: "Installers" },
];
