import { claimAnchor, compilerDiagnostic, demoCapabilities, demoFileSources, demoScenes, figureAnchor, mainSourceAccepted, mainSourceCompilerError, mainSourceInitial, mainSourceRevised, mainSourceWriting, paperReviewResult, rebuttalItem, reviewProposal, reviewThreadsBase, sceneCapabilities, sceneMeta, submissionReport, } from "./data.js";
export const demoTimeline = [
    { at: 0, event: { type: "START" } },
    { at: 500, event: { type: "SET_SCENE", scene: "initial" } },
    { at: 1200, event: { type: "SET_SCENE", scene: "writing" } },
    { at: 5200, event: { type: "SHOW_COMPLETION", text: " across heterogeneous environments." } },
    { at: 6500, event: { type: "ACCEPT_COMPLETION" } },
    { at: 7800, event: { type: "START_COMPILE" } },
    { at: 8800, event: { type: "COMPILE_SUCCESS" } },
    { at: 9400, event: { type: "PDF_BLOCK_SELECTED", blockId: "results-claim-1" } },
    { at: 10500, event: { type: "SET_SCENE", scene: "review-arrives" } },
    { at: 11300, event: { type: "OPEN_REVIEW", id: "review-r2-precision" } },
    { at: 14000, event: { type: "SHOW_PROPOSAL", id: "proposal-claim-precision" } },
    { at: 18000, event: { type: "ACCEPT_PROPOSAL", id: "proposal-claim-precision" } },
    { at: 21000, event: { type: "OPEN_REBUTTAL" } },
    { at: 24500, event: { type: "RUN_PAPER_REVIEW" } },
    { at: 28500, event: { type: "RUN_SUBMISSION_CHECK" } },
    { at: 30000, event: { type: "AUTOPLAY_COMPLETE" } },
];
function sceneIndex(scene) {
    return demoScenes.indexOf(scene);
}
function sceneAtLeast(scene, target) {
    return sceneIndex(scene) >= sceneIndex(target);
}
function cloneProposal(proposal, status = proposal.status) {
    return {
        ...proposal,
        status,
        target: {
            ...proposal.target,
            range: { ...proposal.target.range },
        },
    };
}
function cloneFinding(finding, state = finding.state) {
    return {
        ...finding,
        state,
        anchor: finding.anchor
            ? {
                ...finding.anchor,
                range: { ...finding.anchor.range },
            }
            : undefined,
        proposal: finding.proposal ? cloneProposal(finding.proposal) : undefined,
        evidence: finding.evidence?.map((item) => ({ ...item })),
    };
}
function buildReviewThreads(scene) {
    if (!sceneAtLeast(scene, "review-arrives"))
        return [];
    return reviewThreadsBase.map((thread) => {
        const resolved = sceneAtLeast(scene, "revision-accepted");
        return {
            ...thread,
            status: resolved ? "resolved" : "open",
            anchor: {
                ...thread.anchor,
                range: { ...thread.anchor.range },
            },
            comments: thread.comments.map((comment) => ({ ...comment })),
            proposedEdit: cloneProposal(reviewProposal, resolved ? "accepted" : "pending"),
            resolvedAt: resolved ? 1789506000000 : undefined,
        };
    });
}
function buildHistory(scene) {
    const history = [
        { id: "history-write", label: "Manuscript text edited", scene: "writing" },
    ];
    if (sceneAtLeast(scene, "compiled")) {
        history.push({ id: "history-compile", label: "PDF rebuilt from source", scene: "compiled" });
    }
    if (scene === "compiler-error") {
        history.push({ id: "history-diagnostic", label: "Compiler diagnostic opened", scene });
    }
    if (sceneAtLeast(scene, "revision-accepted")) {
        history.push({
            id: "history-proposal",
            label: "Reviewer proposal accepted with undo history",
            scene: "revision-accepted",
        });
    }
    if (sceneAtLeast(scene, "rebuttal")) {
        history.push({ id: "history-rebuttal", label: "Rebuttal linked to source edit", scene: "rebuttal" });
    }
    return history;
}
function getMainSourceForScene(scene) {
    if (scene === "initial")
        return mainSourceInitial;
    if (scene === "writing")
        return mainSourceWriting;
    if (scene === "completion")
        return mainSourceWriting;
    if (scene === "compiler-error")
        return mainSourceCompilerError;
    if (sceneAtLeast(scene, "revision-accepted"))
        return mainSourceRevised;
    return mainSourceAccepted;
}
function getSourceForFile(file, scene) {
    if (file === "main.tex")
        return getMainSourceForScene(scene);
    return demoFileSources[file] ?? demoFileSources["main.tex"] ?? mainSourceAccepted;
}
function defaultStageForScene(scene) {
    return sceneMeta[scene].stage;
}
function buildSceneState(scene, previous, overrides = {}) {
    const meta = sceneMeta[scene];
    const activeFile = overrides.activeFile ?? previous?.activeFile ?? "main.tex";
    const activeStage = overrides.activeStage ?? defaultStageForScene(scene);
    const reducedMotion = previous?.playback.reducedMotion ?? false;
    const playing = previous?.playback.playing ?? false;
    const userInterrupted = previous?.playback.userInterrupted ?? false;
    const source = getSourceForFile(activeFile, scene);
    const proposalVisible = scene === "revision-proposed";
    const proposalAccepted = sceneAtLeast(scene, "revision-accepted");
    const diagnostics = scene === "compiler-error"
        ? [cloneFinding(compilerDiagnostic)]
        : [];
    return {
        scene,
        mode: meta.mode,
        activeFile,
        activeStage,
        editor: {
            source,
            cursor: scene === "writing" || scene === "completion" ? { line: 22, column: 64 } : undefined,
            selection: scene === "review-open" || proposalVisible
                ? { ...claimAnchor.range }
                : scene === "compiler-error"
                    ? { ...figureAnchor.range }
                    : undefined,
            highlightedRange: scene === "compiled" || sceneAtLeast(scene, "review-arrives")
                ? { ...claimAnchor.range }
                : undefined,
            ghostText: scene === "completion" ? " across heterogeneous environments." : undefined,
        },
        pdf: {
            version: proposalAccepted ? 2 : 1,
            highlightedBlock: meta.highlightedBlock,
            compiling: scene === "compiling",
        },
        reviews: buildReviewThreads(scene),
        diagnostics,
        suggestion: proposalVisible || proposalAccepted
            ? cloneProposal(reviewProposal, proposalAccepted ? "accepted" : "pending")
            : undefined,
        rebuttal: sceneAtLeast(scene, "rebuttal")
            ? {
                ...rebuttalItem,
                manuscriptChange: rebuttalItem.manuscriptChange
                    ? {
                        ...rebuttalItem.manuscriptChange,
                        anchor: {
                            ...rebuttalItem.manuscriptChange.anchor,
                            range: { ...rebuttalItem.manuscriptChange.anchor.range },
                        },
                    }
                    : undefined,
            }
            : undefined,
        paperReview: sceneAtLeast(scene, "paper-review") ? paperReviewResult : undefined,
        submission: sceneAtLeast(scene, "submission-check") ? submissionReport : undefined,
        history: buildHistory(scene),
        playback: {
            playing,
            userInterrupted,
            reducedMotion,
        },
    };
}
export function createDemoState(reducedMotion = false) {
    const scene = reducedMotion ? "complete" : "initial";
    const state = buildSceneState(scene);
    return {
        ...state,
        playback: {
            playing: false,
            userInterrupted: false,
            reducedMotion,
        },
    };
}
export function demoReducer(state, event) {
    switch (event.type) {
        case "START":
            if (state.playback.userInterrupted)
                return state;
            if (state.playback.reducedMotion) {
                const complete = buildSceneState("complete", state);
                return {
                    ...complete,
                    playback: {
                        ...complete.playback,
                        playing: false,
                        userInterrupted: false,
                        reducedMotion: true,
                    },
                };
            }
            return {
                ...state,
                playback: {
                    ...state.playback,
                    playing: true,
                },
            };
        case "RESUME_AUTOPLAY":
            if (state.playback.userInterrupted || state.playback.reducedMotion || state.scene === "complete") {
                return state;
            }
            return {
                ...state,
                playback: {
                    ...state.playback,
                    playing: true,
                },
            };
        case "TYPE_TEXT":
            return {
                ...state,
                editor: {
                    ...state.editor,
                    source: state.editor.source.replace(mainSourceWriting, `${mainSourceWriting}${event.text}`),
                },
            };
        case "SHOW_COMPLETION":
            return buildSceneState("completion", state);
        case "ACCEPT_COMPLETION":
            return buildSceneState("compiled", state, { activeStage: state.activeStage });
        case "START_COMPILE":
            return buildSceneState("compiling", state);
        case "COMPILE_SUCCESS":
            return buildSceneState("compiled", state);
        case "OPEN_REVIEW":
            return buildSceneState("review-open", state);
        case "SHOW_PROPOSAL":
            return buildSceneState("revision-proposed", state);
        case "ACCEPT_PROPOSAL":
            return buildSceneState("revision-accepted", state);
        case "OPEN_REBUTTAL":
            return buildSceneState("rebuttal", state);
        case "RUN_PAPER_REVIEW":
            return buildSceneState("paper-review", state);
        case "RUN_SUBMISSION_CHECK":
            return buildSceneState("submission-check", state);
        case "APPLY_FIX":
            return buildSceneState("compiled", state);
        case "PDF_BLOCK_SELECTED":
            return {
                ...buildSceneState(state.scene, state),
                editor: {
                    ...state.editor,
                    highlightedRange: { ...claimAnchor.range },
                },
                pdf: {
                    ...state.pdf,
                    highlightedBlock: event.blockId,
                },
            };
        case "SET_SCENE": {
            const next = buildSceneState(event.scene, state);
            return {
                ...next,
                playback: {
                    ...next.playback,
                    playing: event.userInitiated ? false : next.playback.playing,
                    userInterrupted: event.userInitiated ? true : next.playback.userInterrupted,
                },
            };
        }
        case "SET_STAGE":
            return {
                ...state,
                activeStage: event.stage,
            };
        case "SET_FILE":
            return buildSceneState(state.scene, state, { activeFile: event.file });
        case "SET_REDUCED_MOTION": {
            const target = event.reducedMotion ? "complete" : state.scene;
            const next = buildSceneState(target, state);
            return {
                ...next,
                playback: {
                    ...next.playback,
                    playing: false,
                    reducedMotion: event.reducedMotion,
                },
            };
        }
        case "STOP_AUTOPLAY":
            return {
                ...state,
                playback: {
                    ...state.playback,
                    playing: false,
                    userInterrupted: true,
                },
            };
        case "AUTOPLAY_COMPLETE": {
            const next = buildSceneState("complete", state);
            return {
                ...next,
                playback: {
                    ...next.playback,
                    playing: false,
                    userInterrupted: false,
                },
            };
        }
        case "PAUSE":
            return {
                ...state,
                playback: {
                    ...state.playback,
                    playing: false,
                },
            };
        case "RESET":
            return createDemoState(state.playback.reducedMotion);
        default:
            return state;
    }
}
export function getUnapprovedSceneCapabilities() {
    const approved = new Set(demoCapabilities
        .filter((capability) => capability.approvedForMarketing && capability.status !== "roadmap")
        .map((capability) => capability.id));
    return Object.values(sceneCapabilities)
        .flat()
        .filter((id, index, all) => !approved.has(id) && all.indexOf(id) === index);
}
function rangeForLineMatch(lineNumber, line, selectedText) {
    const index = line.indexOf(selectedText);
    if (index < 0)
        return undefined;
    return {
        startLine: lineNumber,
        startColumn: index + 1,
        endLine: lineNumber,
        endColumn: index + selectedText.length + 1,
    };
}
function normalizedSimilarity(a, b) {
    const left = a.toLowerCase().replace(/\s+/g, " ").trim();
    const right = b.toLowerCase().replace(/\s+/g, " ").trim();
    if (!left || !right)
        return 0;
    const shorter = left.length < right.length ? left : right;
    const longer = left.length >= right.length ? left : right;
    let matches = 0;
    for (let index = 0; index < shorter.length; index += 1) {
        if (shorter[index] === longer[index])
            matches += 1;
    }
    return matches / longer.length;
}
export function recoverTextAnchor(source, anchor) {
    const lines = source.split(/\r?\n/);
    const exactLine = lines[anchor.range.startLine - 1];
    if (exactLine) {
        const exactRange = rangeForLineMatch(anchor.range.startLine, exactLine, anchor.selectedText);
        if (exactRange)
            return { status: "exact", range: exactRange };
    }
    const nearbyStart = Math.max(1, anchor.range.startLine - 8);
    const nearbyEnd = Math.min(lines.length, anchor.range.startLine + 8);
    for (let lineNumber = nearbyStart; lineNumber <= nearbyEnd; lineNumber += 1) {
        const range = rangeForLineMatch(lineNumber, lines[lineNumber - 1] ?? "", anchor.selectedText);
        if (range)
            return { status: "nearby", range };
    }
    const contextNeedle = `${anchor.contextBefore}${anchor.selectedText}${anchor.contextAfter}`;
    const contextIndex = source.indexOf(contextNeedle);
    if (contextIndex >= 0) {
        const before = source.slice(0, contextIndex + anchor.contextBefore.length);
        const lineNumber = before.split(/\r?\n/).length;
        const beforeLines = before.split(/\r?\n/);
        const column = beforeLines[beforeLines.length - 1]?.length ?? 0;
        return {
            status: "context",
            range: {
                startLine: lineNumber,
                startColumn: column + 1,
                endLine: lineNumber,
                endColumn: column + anchor.selectedText.length + 1,
            },
        };
    }
    let best = null;
    let bestScore = 0;
    lines.forEach((line, index) => {
        const score = normalizedSimilarity(line, anchor.selectedText);
        if (score > bestScore) {
            bestScore = score;
            best = {
                status: "fuzzy",
                range: {
                    startLine: index + 1,
                    startColumn: 1,
                    endLine: index + 1,
                    endColumn: line.length + 1,
                },
            };
        }
    });
    if (best && bestScore >= 0.72)
        return best;
    return { status: "outdated" };
}
export function getTimelineDuration() {
    return Math.max(...demoTimeline.map((item) => item.at));
}
