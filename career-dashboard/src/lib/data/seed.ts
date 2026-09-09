import { neetcode150 } from "@/lib/data/neetcode";
import type { Application, DailyMetric, Milestone, Module, Task } from "@/lib/types";

/**
 * The starting state, used when Supabase env vars are absent.
 *
 * Nothing is done: no tasks, no hours, no problems solved, no applications.
 * The roadmap, the problem list and the module list are the plan rather
 * than progress, so they are populated. Progress comes from what you tick.
 */

export const MILESTONES: Milestone[] = [
  {
    id: "m1",
    title: "NeetCode 150",
    category: "DSA",
    phase: "2026 · Foundations",
    startDate: "2026-09-14",
    endDate: "2027-05-31",
    progress: 0,
  },
  {
    id: "m2",
    title: "Maths refresh: linear algebra, probability",
    category: "PHYSICS",
    phase: "2026 · Foundations",
    startDate: "2026-09-14",
    endDate: "2026-11-15",
    progress: 0,
  },
  {
    id: "m3",
    title: "PyTorch foundations",
    category: "PYTORCH",
    phase: "2026 · Foundations",
    startDate: "2026-10-01",
    endDate: "2026-12-20",
    progress: 0,
  },
  {
    id: "m4",
    title: "Summer 2027 internship applications",
    category: "CAREER",
    phase: "2026 · Foundations",
    startDate: "2026-10-01",
    endDate: "2027-01-31",
    progress: 0,
  },
  {
    id: "m5",
    title: "Autograd and a transformer from scratch",
    category: "PYTORCH",
    phase: "2027 · Depth",
    startDate: "2027-01-10",
    endDate: "2027-03-31",
    progress: 0,
  },
  {
    id: "m6",
    title: "Paper reproduction and reading",
    category: "PYTORCH",
    phase: "2027 · Depth",
    startDate: "2027-03-01",
    endDate: "2027-06-30",
    progress: 0,
  },
  {
    id: "m9",
    title: "Modules with direct transfer: optimisation, RL, stat mech",
    category: "PHYSICS",
    phase: "2027 · Depth",
    startDate: "2027-01-10",
    endDate: "2028-03-31",
    progress: 0,
  },
  {
    id: "m7",
    title: "Research internship",
    category: "CAREER",
    phase: "2027 · Research",
    startDate: "2027-07-01",
    endDate: "2027-09-15",
    progress: 0,
  },
  {
    id: "m8",
    title: "Efficient inference project",
    category: "PYTORCH",
    phase: "2027 · Research",
    startDate: "2027-10-01",
    endDate: "2027-12-15",
    progress: 0,
  },
  {
    id: "m10",
    title: "Masters thesis",
    category: "PHYSICS",
    phase: "2028 · Conversion",
    startDate: "2028-01-08",
    endDate: "2028-06-20",
    progress: 0,
  },
  {
    id: "m11",
    title: "Applied Scientist applications and interviews",
    category: "CAREER",
    phase: "2028 · Conversion",
    startDate: "2028-01-15",
    endDate: "2028-08-30",
    progress: 0,
  },
];

export const TASKS: Task[] = [];

export const APPLICATIONS: Application[] = [];

export const DAILY_METRICS: DailyMetric[] = [];

/** The full NeetCode 150, nothing solved. */
export const buildDsaProblems = neetcode150;

export const MODULES: Module[] = [
  {
    id: "mod1",
    code: "PHYS60004",
    title: "Advanced Statistical Mechanics",
    term: "2027 Term 1",
    credits: 15,
    relevance: 5,
    carryOver: "Energy based models, sampling, partition functions",
  },
  {
    id: "mod2",
    code: "MATH70027",
    title: "Optimisation and Numerical Methods",
    term: "2026 Term 2",
    credits: 15,
    relevance: 5,
    carryOver: "Optimiser internals, conditioning, convergence proofs",
  },
  {
    id: "mod3",
    code: "PHYS70012",
    title: "Computational Physics",
    term: "2026 Term 1",
    credits: 15,
    relevance: 4,
    carryOver: "Numerical stability, vectorised simulation, profiling",
  },
  {
    id: "mod4",
    code: "COMP70050",
    title: "Introduction to Machine Learning",
    term: "2026 Term 2",
    credits: 15,
    relevance: 4,
    carryOver: "Baseline coverage, mostly revision by then",
  },
  {
    id: "mod5",
    code: "PHYS60011",
    title: "Quantum Field Theory",
    term: "2027 Term 2",
    credits: 15,
    relevance: 2,
    carryOver: "Signalling value only, weak direct transfer",
  },
  {
    id: "mod6",
    code: "COMP70028",
    title: "Reinforcement Learning",
    term: "2027 Term 1",
    credits: 15,
    relevance: 5,
    carryOver: "Post training, preference optimisation background",
  },
];
