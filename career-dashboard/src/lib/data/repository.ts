import type { SupabaseClient } from "@supabase/supabase-js";
import {
  APPLICATIONS,
  DAILY_METRICS,
  MILESTONES,
  MODULES,
  TASKS,
  buildDsaProblems,
} from "@/lib/data/seed";
import type {
  Application,
  DailyMetric,
  DsaProblem,
  Milestone,
  Module,
  Profile,
  Task,
  TimeEntry,
} from "@/lib/types";

export interface Snapshot {
  profile: Profile | null;
  tasks: Task[];
  milestones: Milestone[];
  metrics: DailyMetric[];
  problems: DsaProblem[];
  applications: Application[];
  modules: Module[];
  /** Plan step id to the date it was ticked. */
  planDone: Record<string, string>;
  timeLog: TimeEntry[];
  /** Where the data came from. Surfaced in the UI so nobody mistakes one for the other. */
  source: "supabase" | "seed";
}

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));
const date = (v: unknown) => (v ? str(v).slice(0, 10) : null);

export const mapTask = (r: Row): Task => ({
  id: str(r.id),
  title: str(r.title),
  detail: r.detail ? str(r.detail) : undefined,
  category: r.category as Task["category"],
  status: r.status as Task["status"],
  dueDate: date(r.due_date),
  timeSpentMinutes: num(r.time_spent_minutes),
  milestoneId: r.milestone_id ? str(r.milestone_id) : null,
  updatedAt: str(r.updated_at, new Date().toISOString()),
});

export const mapMilestone = (r: Row): Milestone => ({
  id: str(r.id),
  key: r.key ? str(r.key) : undefined,
  title: str(r.title),
  category: r.category as Milestone["category"],
  phase: str(r.phase),
  startDate: str(r.start_date).slice(0, 10),
  endDate: str(r.end_date).slice(0, 10),
  progress: num(r.progress),
});

export const mapMetric = (r: Row): DailyMetric => ({
  date: str(r.date).slice(0, 10),
  leetcodeSolved: num(r.leetcode_solved),
  githubCommits: num(r.github_commits),
  studyHours: num(r.study_hours),
});

export const mapProblem = (r: Row): DsaProblem => ({
  id: str(r.id),
  slug: str(r.slug),
  title: str(r.title),
  pattern: str(r.pattern),
  level: r.level as DsaProblem["level"],
  solvedAt: date(r.solved_at),
});

export const mapApplication = (r: Row): Application => ({
  id: str(r.id),
  company: str(r.company),
  roleTitle: str(r.role_title),
  stage: r.stage as Application["stage"],
  appliedOn: date(r.applied_on),
  nextStep: r.next_step ? str(r.next_step) : null,
  nextDue: date(r.next_due),
  notes: r.notes ? str(r.notes) : undefined,
});

export const mapModule = (r: Row): Module => ({
  id: str(r.id),
  code: str(r.code),
  title: str(r.title),
  academicYear: str(r.academic_year),
  term: str(r.term),
  credits: num(r.credits),
  relevance: num(r.relevance),
  carryOver: str(r.carry_over),
});

export const mapTimeEntry = (r: Row): TimeEntry => ({
  id: str(r.id),
  date: str(r.entry_date).slice(0, 10),
  minutes: num(r.minutes),
  taskId: str(r.task_id),
  category: r.category as TimeEntry["category"],
});

/** The starting state: the plan, and nothing done. */
export function seedSnapshot(): Snapshot {
  return {
    profile: { id: "local", name: "Sebastian", role: "ADMIN" },
    tasks: TASKS,
    milestones: MILESTONES,
    metrics: DAILY_METRICS,
    problems: buildDsaProblems(),
    applications: APPLICATIONS,
    modules: MODULES,
    planDone: {},
    timeLog: [],
    source: "seed",
  };
}

/**
 * One round trip per table, issued in parallel. RLS decides what comes back,
 * so this same call is correct for the owner and for a mentor.
 */
export async function loadSnapshot(supabase: SupabaseClient, userId: string): Promise<Snapshot> {
  const [
    profile,
    tasks,
    milestones,
    metrics,
    problems,
    applications,
    modules,
    planProgress,
    timeEntries,
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, role").eq("id", userId).maybeSingle(),
    supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    supabase.from("milestones").select("*").order("start_date", { ascending: true }),
    supabase.from("daily_metrics").select("*").order("date", { ascending: true }),
    supabase.from("dsa_problems").select("*").order("position", { ascending: true }),
    supabase.from("applications").select("*").order("next_due", { ascending: true }),
    supabase
      .from("modules")
      .select("*")
      .order("relevance", { ascending: false })
      .order("term", { ascending: true }),
    supabase.from("plan_progress").select("step_id, done_on"),
    supabase.from("time_entries").select("*").order("entry_date", { ascending: true }),
  ]);

  // supabase-js reports failures in the result instead of throwing. Without
  // this check a missing table reads as an empty one, and the dashboard
  // renders blank with nothing to say why.
  const failure = [
    profile,
    tasks,
    milestones,
    metrics,
    problems,
    applications,
    modules,
    planProgress,
    timeEntries,
  ].find((r) => r.error)?.error;
  if (failure) throw new Error(failure.message);

  // Without a profile the role falls back to VIEWER and every write is
  // refused as "read only", which looks like a permissions bug rather than
  // the missing row it is.
  if (!profile.data) {
    throw new Error(
      "Your account has no profile row. Run supabase/schema.sql again, which creates one for every existing account",
    );
  }

  const planDone: Record<string, string> = {};
  (planProgress.data ?? []).forEach((r: Row) => {
    planDone[str(r.step_id)] = str(r.done_on).slice(0, 10);
  });

  return {
    profile: {
      id: str(profile.data.id),
      name: str(profile.data.name),
      role: profile.data.role as Profile["role"],
    },
    tasks: (tasks.data ?? []).map(mapTask),
    milestones: (milestones.data ?? []).map(mapMilestone),
    metrics: (metrics.data ?? []).map(mapMetric),
    problems: (problems.data ?? []).map(mapProblem),
    applications: (applications.data ?? []).map(mapApplication),
    modules: (modules.data ?? []).map(mapModule),
    planDone,
    timeLog: (timeEntries.data ?? []).map(mapTimeEntry),
    source: "supabase",
  };
}
