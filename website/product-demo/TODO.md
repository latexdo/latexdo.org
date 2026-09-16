# Product Demo Implementation Todo

This checklist tracks the website implementation requested from the product-demo spec.

- [x] Dedicated product-demo subsystem exists without Monaco, PDF.js, video, canvas loops, or Electron embedding.
- [x] Demo state machine and semantic reducer events drive all rendered product states.
- [x] Autoplay timeline is deterministic, starts on viewport visibility, pauses on hidden tabs, finishes within 32 seconds, and does not loop.
- [x] User interaction stops autoplay immediately.
- [x] Reduced Motion skips the automatic animation while preserving manual scene navigation.
- [x] Semantic HTML editor renders tokenized LaTeX, deterministic typing, ghost completion, selection anchors, and inline diffs.
- [x] Compile states and actionable compiler diagnostic/fix are represented.
- [x] Universal Finding, ReviewThread v2, TextAnchor, EditProposal, RebuttalItem, PaperReviewResult, and SubmissionCheck models are present in fixtures/types.
- [x] Review comment, AI proposal, reversible acceptance, and review resolution are connected.
- [x] Rebuttal scene links reviewer comment, manuscript revision, and author response.
- [x] Paper Review is structured as findings, filters, and category counts rather than chat.
- [x] Submission readiness shows deterministic checks with pass/warning/fail status.
- [x] PDF preview is HTML-rendered and source/PDF synchronization can be demonstrated.
- [x] Sticky narrative chapters trigger semantic scenes.
- [x] Mobile uses Source, Preview, Review stage switching.
- [x] Accessibility states and keyboard scene navigation are implemented.
- [x] Analytics events use product-understanding names.
- [x] Feature truth registry prevents roadmap-only capabilities from being shown.
- [x] AI tier presentation and route links are represented on the homepage.
- [x] Unit-style checks cover reducer behavior, reduced motion, proposal acceptance, anchors, marketing capability truth, and timeline duration.
- [x] Build/test verification passes.
