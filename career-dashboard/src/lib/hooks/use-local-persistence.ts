"use client";

import { useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useDashboard, type LocalState } from "@/lib/store";
import { hasSupabase } from "@/lib/supabase";

const KEY = "dashboard-local-v1";

/**
 * Keeps what you tick between visits.
 *
 * Without Supabase this browser is the database: tasks, applications, plan
 * steps, problem solves and logged time all live in localStorage. With
 * Supabase the tables own tasks, applications and problems, and only the
 * two things the schema has no home for (plan steps and logged time) are
 * kept here.
 *
 * Load runs once on mount, before the bootstrap fetch can resolve, so the
 * saved state is in place before anything else touches the store.
 */
export function useLocalPersistence() {
  const loadLocal = useDashboard((s) => s.loadLocal);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as LocalState;
        loadLocal(hasSupabase ? { planDone: saved.planDone, timeLog: saved.timeLog } : saved);
      }
    } catch {
      // Blocked or corrupt storage. Start from the empty state.
    }

    return useDashboard.subscribe(
      (s) => ({
        tasks: s.tasks,
        applications: s.applications,
        planDone: s.planDone,
        timeLog: s.timeLog,
        problems: s.problems,
      }),
      (slice) => {
        const local: LocalState = { planDone: slice.planDone, timeLog: slice.timeLog };
        if (!hasSupabase) {
          local.tasks = slice.tasks;
          local.applications = slice.applications;
          local.solved = Object.fromEntries(
            slice.problems.filter((p) => p.solvedAt).map((p) => [p.id, p.solvedAt!]),
          );
        }
        try {
          window.localStorage.setItem(KEY, JSON.stringify(local));
        } catch {
          // Quota or private mode. The in-memory state still works for this visit.
        }
      },
      { equalityFn: shallow },
    );
  }, [loadLocal]);
}

/** Wipes everything this browser has saved and reloads to the starting state. */
export function clearLocalState() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
  window.location.reload();
}
