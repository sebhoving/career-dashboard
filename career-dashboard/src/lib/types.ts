export type Role = "ADMIN" | "VIEWER";
export type Category = "DSA" | "PYTORCH" | "PHYSICS" | "CAREER";
export type Status = "TODO" | "IN_PROGRESS" | "DONE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Stage =
  | "RESEARCH"
  | "APPLIED"
  | "SCREEN"
  | "TECHNICAL"
  | "ONSITE"
  | "OFFER"
  | "REJECTED";

export type TabKey = "plan" | "today" | "progress" | "roadmap";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "plan", label: "Plan" },
  { key: "today", label: "Today" },
  { key: "progress", label: "Progress" },
  { key: "roadmap", label: "Roadmap" },
];

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  detail?: string;
  category: Category;
  status: Status;
  dueDate: string | null; // ISO
  timeSpentMinutes: number;
  milestoneId?: string | null;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  category: Category;
  phase: string;
  startDate: string; // ISO date
  endDate: string;
  /** Stored value. When plan steps link to the milestone, progress is derived from them instead. */
  progress: number; // 0-100
}

export interface DailyMetric {
  date: string; // yyyy-MM-dd
  leetcodeSolved: number;
  githubCommits: number;
  studyHours: number;
}

/** One press of a "+25m" button. Kept per day so the hours chart has a series to draw. */
export interface TimeEntry {
  date: string; // yyyy-MM-dd
  minutes: number;
  taskId: string;
  category: Category;
}

export interface DsaProblem {
  id: string;
  slug: string;
  title: string;
  pattern: string;
  level: Difficulty;
  solvedAt: string | null;
}

export interface Application {
  id: string;
  company: string;
  roleTitle: string;
  stage: Stage;
  appliedOn: string | null;
  nextStep: string | null;
  nextDue: string | null;
  notes?: string;
}

export interface Module {
  id: string;
  code: string;
  title: string;
  term: string;
  credits: number;
  relevance: number; // 1-5, weight toward the target role
  carryOver: string;
}

/** One step of the ordered plan. Content lives in lib/data/plan.ts. */
export interface PlanStep {
  id: string;
  phase: string; // key into PLAN_PHASES
  title: string;
  category: Category;
  milestoneId?: string;
  estimate: string;
  why: string;
  how: string[];
  doneWhen: string;
  resources?: { label: string; url: string }[];
}

export interface PlanPhase {
  key: string;
  title: string;
  window: string;
  summary: string;
}

export type RangeKey = "1W" | "1M" | "6M" | "1Y" | "ALL";

export const RANGE_DAYS: Record<RangeKey, number> = {
  "1W": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  ALL: 1096,
};

export const CATEGORY_LABEL: Record<Category, string> = {
  DSA: "Algorithms",
  PYTORCH: "PyTorch and ML",
  PHYSICS: "Physics and maths",
  CAREER: "Career",
};

export const CATEGORY_VAR: Record<Category, string> = {
  DSA: "var(--c-dsa)",
  PYTORCH: "var(--c-pytorch)",
  PHYSICS: "var(--c-physics)",
  CAREER: "var(--c-career)",
};

export const STAGE_ORDER: Stage[] = [
  "RESEARCH",
  "APPLIED",
  "SCREEN",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "REJECTED",
];

export const STAGE_LABEL: Record<Stage, string> = {
  RESEARCH: "Researching",
  APPLIED: "Applied",
  SCREEN: "Screen",
  TECHNICAL: "Technical",
  ONSITE: "Onsite",
  OFFER: "Offer",
  REJECTED: "Closed",
};

export const NEETCODE_TOTAL = 150;

export const RANGE_LABEL: Record<RangeKey, string> = {
  "1W": "last 7 days",
  "1M": "last 30 days",
  "6M": "last 6 months",
  "1Y": "last year",
  ALL: "all time",
};
