import type { SupabaseClient } from "@supabase/supabase-js";
import {
  APPLICATIONS,
  MILESTONES,
  MODULES,
  TASKS,
  DAILY_METRICS,
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
} from "@/lib/types";

export interface Snapshot {
  profile: Profile | null;
  tasks: Task[];
  milestones: Milestone[];
  metrics: DailyMetric[];
  problems: DsaProblem[];
  applications: Application[];
  modules: Module[];
  /** Where the data came from. Surfaced in the UI so nobody mistakes seed for real. */
  source: "supabase" | "seed";
}

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));

export const mapTask = (r: Row): Task => ({
  id: str(r.id),
  title: str(r.title),
  detail: r.detail ? str(r.detail) : undefined,
  category: r.category as Task["category"],
  status: r.status as Task["status"],
  dueDate: r.due_date ? str(r.due_date).slice(0, 10) : null,
  timeSpentMinutes: num(r.time_spent_minutes),
  milestoneId: r.milestone_id ? str(r.milestone_id) : null,
  updatedAt: str(r.updated_at, new Date().toISOString()),
});

export const mapMilestone = (r: Row): Milestone => ({
  id: str(r.id),
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
  solvedAt: r.solved_at ? str(r.solved_at).slice(0, 10) : null,
});

export const mapApplication = (r: Row): Application => ({
  id: str(r.id),
  company: str(r.company),
  roleTitle: str(r.role_title),
  stage: r.stage as Application["stage"],
  appliedOn: r.applied_on ? str(r.applied_on).slice(0, 10) : null,
  nextStep: r.next_step ? str(r.next_step) : null,
  nextDue: r.next_due ? str(r.next_due).slice(0, 10) : null,
  notes: r.notes ? str(r.notes) : undefined,
});

export const mapModule = (r: Row): Module => ({
  id: str(r.id),
  code: str(r.code),
  title: str(r.title),
  term: str(r.term),
  credits: num(r.credits),
  relevance: num(r.relevance),
  carryOver: str(r.carry_over),
});

/** The seed snapshot. Also the shape every test fixture is built from. */
export function seedSnapshot(): Snapshot {
  return {
    profile: { id: "local", name: "Sebastian", role: "ADMIN" },
    tasks: TASKS,
    milestones: MILESTONES,
    metrics: DAILY_METRICS,
    problems: buildDsaProblems(),
    applications: APPLICATIONS,
    modules: MODULES,
    source: "seed",
  };
}

/**
 * One round trip per table, issued in parallel. RLS decides what comes back,
 * so this same call is correct for an admin and for a mentor.
 */
export async function loadSnapshot(supabase: SupabaseClient, userId: string): Promise<Snapshot> {
  const [profile, tasks, milestones, metrics, problems, applications, modules] = await Promise.all([
    supabase.from("profiles").select("id, name, role").eq("id", userId).single(),
    supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    supabase.from("milestones").select("*").order("start_date", { ascending: true }),
    supabase.from("daily_metrics").select("*").order("date", { ascending: true }),
    supabase.from("dsa_problems").select("*"),
    supabase.from("applications").select("*").order("next_due", { ascending: true }),
    supabase.from("modules").select("*").order("term", { ascending: true }),
  ]);

  return {
    profile: profile.data
      ? {
          id: str(profile.data.id),
          name: str(profile.data.name),
          role: profile.data.role as Profile["role"],
        }
      : null,
    tasks: (tasks.data ?? []).map(mapTask),
    milestones: (milestones.data ?? []).map(mapMilestone),
    metrics: (metrics.data ?? []).map(mapMetric),
    problems: (problems.data ?? []).map(mapProblem),
    applications: (applications.data ?? []).map(mapApplication),
    modules: (modules.data ?? []).map(mapModule),
    source: "supabase",
  };
}
