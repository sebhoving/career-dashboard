"use client";

import { useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useDashboard } from "@/lib/store";
import { createClient, hasSupabase } from "@/lib/supabase";
import { can, VIEWER_HINT } from "@/lib/rbac";

/** Tick or untick a problem in the log. Optimistic, same shape as task writes. */
export function useProblemActions() {
  const role = useDashboard((s) => s.role);
  const { push } = useToast();

  const toggle = useCallback(
    async (id: string) => {
      if (!can(role, "problem:update")) {
        push({ tone: "warn", title: "Read only", body: VIEWER_HINT });
        return;
      }

      const before = useDashboard.getState().problems.find((p) => p.id === id);
      if (!before) return;

      useDashboard.getState().toggleProblem(id);
      const after = useDashboard.getState().problems.find((p) => p.id === id)!;

      if (!hasSupabase) return;
      const { data, error } = await createClient()!
        .from("dsa_problems")
        .update({ solved_at: after.solvedAt })
        .eq("id", id)
        .select("id");

      // No rows means the list came from the built-in seed, not the table.
      if (error || !data?.length) {
        useDashboard.getState().replaceProblem(before);
        push({
          tone: "warn",
          title: "Not saved",
          body: error?.message ?? "This problem is not in your database yet. Insert the list first.",
        });
      }
    },
    [role, push],
  );

  return { toggle };
}
