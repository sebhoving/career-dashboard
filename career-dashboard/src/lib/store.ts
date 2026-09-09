"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  APPLICATIONS,
  DAILY_METRICS,
  MILESTONES,
  MODULES,
  TASKS,
  buildDsaProblems,
} from "@/lib/data/seed";
import { PLAN_STEPS } from "@/lib/data/plan";
import { addDays, daysBetween, iso, today, todayIso } from "@/lib/utils";
import {
  RANGE_DAYS,
  type Application,
  type DailyMetric,
  type DsaProblem,
  type Milestone,
  type Module,
  type PlanStep,
  type Profile,
  type RangeKey,
  type Role,
  type TabKey,
  type Task,
  type TimeEntry,
} from "@/lib/types";
import type { Snapshot } from "@/lib/data/repository";

export type GithubStatus = "unknown" | "unconfigured" | "connected" | "error";

/** What this browser remembers between visits. See useLocalPersistence. */
export interface LocalState {
  tasks?: Task[];
  applications?: Application[];
  planDone?: Record<string, string>;
  timeLog?: TimeEntry[];
  /** Problem id to the date it was solved. Only solved problems are stored. */
  solved?: Record<string, string>;
}

interface DashboardState {
  tab: TabKey;
  role: Role;
  profile: Profile | null;
  source: "supabase" | "seed";
  hydrated: boolean;
  range: RangeKey;
  focusedMilestoneId: string | null;
  /** Set by "Next up" so the plan opens on that step. Cleared once the plan has read it. */
  focusedStepId: string | null;
  lastSyncedAt: string | null;
  githubStatus: GithubStatus;

  tasks: Task[];
  milestones: Milestone[];
  metrics: DailyMetric[];
  problems: DsaProblem[];
  applications: Application[];
  modules: Module[];
  /** Plan step id to the date it was ticked. */
  planDone: Record<string, string>;
  timeLog: TimeEntry[];
  commitsByDate: Record<string, number>;

  setTab: (tab: TabKey) => void;
  hydrate: (snapshot: Snapshot) => void;
  loadLocal: (local: LocalState) => void;
  setRange: (range: RangeKey) => void;
  focusMilestone: (id: string | null) => void;
  focusStep: (id: string | null) => void;

  toggleTaskStatus: (id: string) => void;
  logMinutes: (id: string, minutes: number) => void;
  addTask: (task: Omit<Task, "id" | "updatedAt">) => void;
  replaceTask: (task: Task) => void;
  removeTask: (id: string) => void;

  togglePlanStep: (id: string) => void;
  toggleProblem: (id: string) => void;
  replaceProblem: (problem: DsaProblem) => void;

  addApplication: (app: Omit<Application, "id">) => void;
  replaceApplication: (app: Application) => void;
  removeApplication: (id: string) => void;

  setCommits: (commitsByDate: Record<string, number>, status: GithubStatus) => void;
  mergeRemote: (
    patch: Partial<Pick<DashboardState, "tasks" | "milestones" | "metrics" | "applications">>,
  ) => void;
  markSynced: () => void;
}

const stamp = () => new Date().toISOString();

export const useDashboard = create<DashboardState>()(
  subscribeWithSelector((set) => ({
    tab: "plan",
    role: "ADMIN",
    profile: null,
    source: "seed",
    hydrated: false,
    range: "1M",
    focusedMilestoneId: null,
    focusedStepId: null,
    lastSyncedAt: null,
    githubStatus: "unknown",

    tasks: TASKS,
    milestones: MILESTONES,
    metrics: DAILY_METRICS,
    problems: buildDsaProblems(),
    applications: APPLICATIONS,
    modules: MODULES,
    planDone: {},
    timeLog: [],
    commitsByDate: {},

    setTab: (tab) => set({ tab }),

    // With a backend, the server snapshot wins, including the role, which is
    // read from the profile row rather than trusted from the client. Without
    // one there is nothing to load: the store already holds the starting
    // state plus whatever this browser has saved.
    hydrate: (snapshot) =>
      set(
        snapshot.source === "seed"
          ? { profile: snapshot.profile, source: "seed", hydrated: true }
          : {
              profile: snapshot.profile,
              role: snapshot.profile?.role ?? "VIEWER",
              source: "supabase",
              hydrated: true,
              tasks: snapshot.tasks,
              applications: snapshot.applications,
              metrics: snapshot.metrics,
              // Reference data falls back to the built-in plan when a table is empty.
              milestones: snapshot.milestones.length ? snapshot.milestones : MILESTONES,
              problems: snapshot.problems.length ? snapshot.problems : buildDsaProblems(),
              modules: snapshot.modules.length ? snapshot.modules : MODULES,
            },
      ),

    loadLocal: (local) =>
      set((s) => ({
        tasks: local.tasks ?? s.tasks,
        applications: local.applications ?? s.applications,
        planDone: local.planDone ?? s.planDone,
        timeLog: local.timeLog ?? s.timeLog,
        problems: local.solved
          ? s.problems.map((p) => ({ ...p, solvedAt: local.solved![p.id] ?? null }))
          : s.problems,
      })),

    setRange: (range) => set({ range }),
    focusMilestone: (focusedMilestoneId) => set({ focusedMilestoneId }),
    focusStep: (focusedStepId) => set({ focusedStepId }),

    // Optimistic. The action hooks reconcile if a write is rejected.
    toggleTaskStatus: (id) =>
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, status: t.status === "DONE" ? "TODO" : "DONE", updatedAt: stamp() }
            : t,
        ),
      })),

    logMinutes: (id, minutes) =>
      set((s) => {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return {};
        return {
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  timeSpentMinutes: Math.max(0, t.timeSpentMinutes + minutes),
                  status: t.status === "TODO" ? "IN_PROGRESS" : t.status,
                  updatedAt: stamp(),
                }
              : t,
          ),
          timeLog: [
            ...s.timeLog,
            { date: todayIso(), minutes, taskId: id, category: task.category },
          ],
        };
      }),

    addTask: (task) =>
      set((s) => ({
        tasks: [{ ...task, id: `t${Date.now()}`, updatedAt: stamp() }, ...s.tasks],
      })),

    replaceTask: (task) =>
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) })),

    removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

    togglePlanStep: (id) =>
      set((s) => {
        const planDone = { ...s.planDone };
        if (planDone[id]) delete planDone[id];
        else planDone[id] = todayIso();
        return { planDone };
      }),

    toggleProblem: (id) =>
      set((s) => ({
        problems: s.problems.map((p) =>
          p.id === id ? { ...p, solvedAt: p.solvedAt ? null : todayIso() } : p,
        ),
      })),

    replaceProblem: (problem) =>
      set((s) => ({ problems: s.problems.map((p) => (p.id === problem.id ? problem : p)) })),

    addApplication: (app) =>
      set((s) => ({ applications: [...s.applications, { ...app, id: `a${Date.now()}` }] })),

    replaceApplication: (app) =>
      set((s) => ({
        applications: s.applications.map((a) => (a.id === app.id ? app : a)),
      })),

    removeApplication: (id) =>
      set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),

    setCommits: (commitsByDate, githubStatus) => set({ commitsByDate, githubStatus }),
    mergeRemote: (patch) => set((s) => ({ ...s, ...patch })),
    markSynced: () => set({ lastSyncedAt: stamp() }),
  })),
);

// ------------------------------------------------------------------ plan

export function planProgress(done: Record<string, string>, steps: PlanStep[] = PLAN_STEPS) {
  const complete = steps.filter((s) => done[s.id]).length;
  return {
    done: complete,
    total: steps.length,
    fraction: steps.length ? complete / steps.length : 0,
  };
}

/** The first `n` steps not yet ticked, in plan order. */
export function nextSteps(done: Record<string, string>, n = 3, steps: PlanStep[] = PLAN_STEPS) {
  return steps.filter((s) => !done[s.id]).slice(0, n);
}

/**
 * Milestone progress is derived from its plan steps when it has any, so the
 * roadmap and the plan cannot disagree. Milestones with no steps (for
 * example rows added in Supabase) keep their stored value.
 */
export function milestoneProgress(
  milestone: Milestone,
  done: Record<string, string>,
  steps: PlanStep[] = PLAN_STEPS,
) {
  const linked = steps.filter((s) => s.milestoneId === milestone.id);
  if (!linked.length) return milestone.progress;
  return Math.round((linked.filter((s) => done[s.id]).length / linked.length) * 100);
}

// ------------------------------------------------------------------ series

/**
 * One row per day that has anything on it, merging the metrics table with
 * what this browser has logged: task time, ticked problems and, when GitHub
 * is connected, commits. When GitHub is the source it replaces the metrics
 * table's commit column rather than adding to it.
 */
export function dailySeries(
  metrics: DailyMetric[],
  timeLog: TimeEntry[],
  problems: DsaProblem[],
  commitsByDate: Record<string, number>,
): DailyMetric[] {
  const byDate = new Map<string, DailyMetric>();
  const row = (date: string) => {
    let r = byDate.get(date);
    if (!r) {
      r = { date, studyHours: 0, leetcodeSolved: 0, githubCommits: 0 };
      byDate.set(date, r);
    }
    return r;
  };

  const github = Object.keys(commitsByDate).length > 0;
  metrics.forEach((m) => {
    const r = row(m.date);
    r.studyHours += m.studyHours;
    r.leetcodeSolved += m.leetcodeSolved;
    if (!github) r.githubCommits += m.githubCommits;
  });
  timeLog.forEach((e) => {
    row(e.date).studyHours += e.minutes / 60;
  });
  problems.forEach((p) => {
    if (p.solvedAt) row(p.solvedAt).leetcodeSolved += 1;
  });
  Object.entries(commitsByDate).forEach(([date, n]) => {
    row(date).githubCommits += n;
  });

  return [...byDate.values()]
    .map((r) => ({ ...r, studyHours: Math.round(r.studyHours * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function metricsInRange(series: DailyMetric[], range: RangeKey) {
  const cutoff = iso(addDays(today(), -RANGE_DAYS[range]));
  return series.filter((m) => m.date >= cutoff && m.date <= todayIso());
}

/** Every day in the range, zero where nothing happened, so charts have a continuous axis. */
export function zeroFilled(series: DailyMetric[], range: RangeKey): DailyMetric[] {
  const byDate = new Map(series.map((m) => [m.date, m]));
  const out: DailyMetric[] = [];
  const end = today();
  for (let d = RANGE_DAYS[range] - 1; d >= 0; d -= 1) {
    const date = iso(addDays(end, -d));
    out.push(byDate.get(date) ?? { date, studyHours: 0, leetcodeSolved: 0, githubCommits: 0 });
  }
  return out;
}

export function solvedCount(problems: DsaProblem[]) {
  return problems.filter((p) => p.solvedAt).length;
}

/** Consecutive days with a commit, ending today or yesterday. */
export function commitStreak(series: DailyMetric[]) {
  const commits = new Map(series.map((m) => [m.date, m.githubCommits]));
  let cursor = today();
  if (!(commits.get(iso(cursor)) ?? 0)) cursor = addDays(cursor, -1);
  let streak = 0;
  while ((commits.get(iso(cursor)) ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function totalHours(series: DailyMetric[]) {
  return Math.round(series.reduce((sum, m) => sum + m.studyHours, 0) * 10) / 10;
}

/**
 * Burndown: problems remaining against the straight line from the full list
 * at `start` to zero at `end`. Remaining is only drawn up to today.
 */
export function burndownSeries(problems: DsaProblem[], start: string, end: string) {
  const solvedByDate = new Map<string, number>();
  let firstSolve: string | null = null;
  problems.forEach((p) => {
    if (!p.solvedAt) return;
    solvedByDate.set(p.solvedAt, (solvedByDate.get(p.solvedAt) ?? 0) + 1);
    if (!firstSolve || p.solvedAt < firstSolve) firstSolve = p.solvedAt;
  });

  const now = todayIso();
  const from = [start, now, firstSolve ?? start].sort()[0];
  const span = Math.max(1, daysBetween(from, end));
  const total = problems.length;

  const out: { date: string; remaining: number; ideal: number }[] = [];
  let remaining = total;
  for (let d = 0; d <= span; d += 1) {
    const date = iso(addDays(new Date(from), d));
    remaining -= solvedByDate.get(date) ?? 0;
    const sinceStart = daysBetween(start, date);
    const planSpan = Math.max(1, daysBetween(start, end));
    out.push({
      date,
      remaining: date > now ? NaN : remaining,
      ideal: sinceStart < 0 ? total : Math.max(0, total * (1 - sinceStart / planSpan)),
    });
  }
  return out;
}

/** Tasks due inside `days`, not done, soonest first. Drives the toast queue. */
export function upcomingDeadlines(tasks: Task[], days = 7) {
  const now = today();
  return tasks
    .filter((t) => t.status !== "DONE" && t.dueDate)
    .map((t) => ({ task: t, inDays: daysBetween(now, t.dueDate!) }))
    .filter((x) => x.inDays >= 0 && x.inDays <= days)
    .sort((a, b) => a.inDays - b.inDays);
}
