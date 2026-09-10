"use client";

import { useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useDashboard } from "@/lib/store";
import { createClient, hasSupabase } from "@/lib/supabase";
import { can, VIEWER_HINT } from "@/lib/rbac";

/**
 * Ticking a plan step. The plan itself lives in the code, so only the tick
 * and its date are stored: one row in `plan_progress` per completed step.
 */
export function usePlanActions() {
  const role = useDashboard((s) => s.role);
  const { push } = useToast();

  const toggle = useCallback(
    async (stepId: string) => {
      if (!can(role, "plan:update")) {
        push({ tone: "warn", title: "Read only", body: VIEWER_HINT });
        return;
      }

      const before = useDashboard.getState().planDone[stepId] ?? null;
      useDashboard.getState().togglePlanStep(stepId);
      const after = useDashboard.getState().planDone[stepId] ?? null;

      if (!hasSupabase) return;
      const supabase = createClient()!;
      const userId = useDashboard.getState().profile?.id;

      const { error } = after
        ? await supabase
            .from("plan_progress")
            .upsert({ step_id: stepId, user_id: userId, done_on: after }, {
              onConflict: "user_id,step_id",
            })
        : await supabase
            .from("plan_progress")
            .delete()
            .eq("step_id", stepId)
            .eq("user_id", userId!);

      if (error) {
        useDashboard.getState().setPlanStep(stepId, before);
        push({ tone: "warn", title: "Not saved", body: error.message });
      }
    },
    [role, push],
  );

  return { toggle };
}
