import assert from "node:assert/strict";

import {
  createDemoState,
  demoReducer,
  getTimelineDuration,
  getUnapprovedSceneCapabilities,
  recoverTextAnchor,
} from "../assets/product-demo/engine.js";
import { claimAnchor } from "../assets/product-demo/data.js";

let state = createDemoState(false);
assert.equal(state.scene, "initial");
assert.equal(state.playback.playing, false);

state = demoReducer(state, { type: "SHOW_PROPOSAL", id: "proposal-claim-precision" });
assert.equal(state.scene, "revision-proposed");
assert.match(state.editor.source, /significantly improves performance/);
assert.doesNotMatch(state.editor.source, /87\.9%/);

state = demoReducer(state, { type: "ACCEPT_PROPOSAL", id: "proposal-claim-precision" });
assert.equal(state.scene, "revision-accepted");
assert.match(state.editor.source, /87\.9%/);
assert.equal(state.reviews[0]?.status, "resolved");

state = demoReducer(createDemoState(false), { type: "START" });
assert.equal(state.playback.playing, true);
state = demoReducer(state, { type: "STOP_AUTOPLAY" });
assert.equal(state.playback.playing, false);
assert.equal(state.playback.userInterrupted, true);
state = demoReducer(state, { type: "START" });
assert.equal(state.playback.playing, false);

state = demoReducer(state, { type: "RESET" });
state = demoReducer(state, { type: "START" });
assert.equal(state.playback.playing, true);

state = createDemoState(true);
assert.equal(state.scene, "complete");
assert.equal(state.playback.reducedMotion, true);
state = demoReducer(state, { type: "SET_SCENE", scene: "writing", userInitiated: true });
assert.equal(state.scene, "writing");
assert.equal(state.playback.reducedMotion, true);

state = demoReducer(createDemoState(false), { type: "SET_SCENE", scene: "compiler-error" });
assert.equal(state.diagnostics.length, 1);
assert.equal(state.diagnostics[0]?.proposal?.after, "\\includegraphics{figures/results.pdf}");

state = demoReducer(createDemoState(false), { type: "ACCEPT_PROPOSAL", id: "proposal-claim-precision" });
state = demoReducer(state, { type: "OPEN_REBUTTAL" });
assert.equal(state.rebuttal?.reviewThreadId, "review-r2-precision");
assert.match(state.rebuttal?.authorResponse ?? "", /revised Section 3/);

state = demoReducer(createDemoState(false), { type: "RUN_SUBMISSION_CHECK" });
assert.equal(state.submission?.passed, 7);
assert.equal(state.submission?.total, 9);

assert.ok(getTimelineDuration() <= 32000);
assert.deepEqual(getUnapprovedSceneCapabilities(), []);

const exactLines = Array.from({ length: 60 }, (_, index) =>
  index === 41 ? "Our method significantly improves performance over the baseline." : `Line ${index + 1}`,
);
assert.equal(recoverTextAnchor(exactLines.join("\n"), claimAnchor).status, "exact");

const shiftedLines = [
  ...Array.from({ length: 20 }, (_, index) => `Inserted ${index + 1}`),
  ...exactLines,
];
assert.equal(recoverTextAnchor(shiftedLines.join("\n"), claimAnchor).status, "context");

console.log("Product demo checks passed");
