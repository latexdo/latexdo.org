export type DemoScene =
  | "initial"
  | "writing"
  | "completion"
  | "compiling"
  | "compiled"
  | "compiler-error"
  | "review-arrives"
  | "review-open"
  | "revision-proposed"
  | "revision-accepted"
  | "rebuttal"
  | "paper-review"
  | "submission-check"
  | "complete";

export type DemoMode = "write" | "review" | "respond";
export type DemoStage = "source" | "preview" | "review";

export interface DemoPosition {
  line: number;
  column: number;
}

export interface DemoRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface DemoToken {
  type: "plain" | "command" | "argument" | "comment" | "citation" | "math";
  text: string;
}

export interface TextAnchor {
  filePath: string;
  range: DemoRange;
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  contentHash: string;
}

export interface HumanIdentity {
  kind: "human";
  name: string;
  role: string;
}

export interface AiIdentity {
  kind: "ai";
  name: "LatexDo";
}

export interface ReviewComment {
  id: string;
  author: HumanIdentity | AiIdentity;
  body: string;
  createdAt: number;
}

export interface ReviewThread {
  id: string;
  anchor: TextAnchor;
  author: HumanIdentity | AiIdentity;
  status: "open" | "resolved" | "outdated";
  comments: ReviewComment[];
  proposedEdit?: EditProposal;
  createdAt: number;
  resolvedAt?: number;
}

export type FindingSource =
  | "compiler"
  | "proofreading"
  | "reviewer"
  | "latexdo-ai"
  | "citation"
  | "submission";

export type FindingSeverity = "error" | "warning" | "review" | "suggestion" | "info";

export interface Evidence {
  label: string;
  value: string;
}

export interface EditProposal {
  id: string;
  target: TextAnchor;
  before: string;
  after: string;
  reason: string;
  source: "ai" | "review" | "compiler" | "proofreading";
  status: "pending" | "accepted" | "rejected" | "stale";
}

export interface Finding {
  id: string;
  source: FindingSource;
  severity: FindingSeverity;
  filePath?: string;
  anchor?: TextAnchor;
  title: string;
  explanation: string;
  proposal?: EditProposal;
  evidence?: Evidence[];
  state: "open" | "accepted" | "dismissed" | "resolved";
}

export type DemoDiagnostic = Finding & {
  source: "compiler";
  severity: "error" | "warning";
};

export interface RebuttalItem {
  id: string;
  reviewer: string;
  reviewThreadId?: string;
  reviewerComment: string;
  authorResponse: string;
  manuscriptChange?: {
    before: string;
    after: string;
    anchor: TextAnchor;
  };
  status: "draft" | "ready" | "resolved";
}

export interface ReviewCategory {
  label: string;
  count: number;
  status: "clear" | "attention" | "blocked";
}

export interface PaperReviewResult {
  manuscriptVersion: string;
  categories: {
    structure: ReviewCategory;
    clarity: ReviewCategory;
    evidence: ReviewCategory;
    citations: ReviewCategory;
    reproducibility: ReviewCategory;
    latex: ReviewCategory;
    submission: ReviewCategory;
  };
  findings: Finding[];
}

export interface SubmissionCheck {
  id: string;
  category: "pdf" | "format" | "references" | "anonymity" | "figures" | "compiler";
  deterministic: boolean;
  status: "pass" | "warning" | "fail" | "unknown";
  title: string;
  explanation?: string;
  location?: {
    page?: number;
    file?: string;
    line?: number;
  };
}

export interface SubmissionReport {
  id: string;
  passed: number;
  total: number;
  checks: SubmissionCheck[];
}

export interface DemoCapability {
  id: string;
  status: "shipping" | "beta" | "roadmap";
  desktopReference: string;
  approvedForMarketing: boolean;
}

export interface DemoHistoryEntry {
  id: string;
  label: string;
  scene: DemoScene;
}

export interface ProductDemoState {
  scene: DemoScene;
  mode: DemoMode;
  activeFile: string;
  activeStage: DemoStage;
  editor: {
    source: string;
    cursor?: DemoPosition;
    selection?: DemoRange;
    highlightedRange?: DemoRange;
    ghostText?: string;
  };
  pdf: {
    version: number;
    highlightedBlock?: string;
    compiling: boolean;
  };
  reviews: ReviewThread[];
  diagnostics: DemoDiagnostic[];
  suggestion?: EditProposal;
  rebuttal?: RebuttalItem;
  paperReview?: PaperReviewResult;
  submission?: SubmissionReport;
  history: DemoHistoryEntry[];
  playback: {
    playing: boolean;
    userInterrupted: boolean;
    reducedMotion: boolean;
  };
}

export type DemoEvent =
  | { type: "START" }
  | { type: "RESUME_AUTOPLAY" }
  | { type: "TYPE_TEXT"; text: string }
  | { type: "SHOW_COMPLETION"; text: string }
  | { type: "ACCEPT_COMPLETION" }
  | { type: "START_COMPILE" }
  | { type: "COMPILE_SUCCESS" }
  | { type: "OPEN_REVIEW"; id: string }
  | { type: "SHOW_PROPOSAL"; id: string }
  | { type: "ACCEPT_PROPOSAL"; id: string }
  | { type: "OPEN_REBUTTAL" }
  | { type: "RUN_PAPER_REVIEW" }
  | { type: "RUN_SUBMISSION_CHECK" }
  | { type: "APPLY_FIX"; id: string }
  | { type: "PDF_BLOCK_SELECTED"; blockId: string }
  | { type: "SET_SCENE"; scene: DemoScene; userInitiated?: boolean }
  | { type: "SET_STAGE"; stage: DemoStage }
  | { type: "SET_FILE"; file: string }
  | { type: "SET_REDUCED_MOTION"; reducedMotion: boolean }
  | { type: "STOP_AUTOPLAY" }
  | { type: "AUTOPLAY_COMPLETE" }
  | { type: "PAUSE" }
  | { type: "RESET" };
