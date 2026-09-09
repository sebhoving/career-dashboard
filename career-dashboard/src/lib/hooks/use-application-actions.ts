"use client";

import { useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useDashboard } from "@/lib/store";
import { createClient, hasSupabase } from "@/lib/supabase";
import { can, VIEWER_HINT } from "@/lib/rbac";
import type { Application } from "@/lib/types";

/** Add a target role, or move one through the pipeline. Optimistic with rollback. */
export function useApplicationActions() {
  const role = useDashboard((s) => s.role);
  const { push } = useToast();

  const guard = useCallback(() => {
    if (can(role, "application:update")) return true;
    push({ tone: "warn", title: "Read only", body: VIEWER_HINT });
    return false;
  }, [role, push]);

  const create = useCallback(
    async (app: Omit<Application, "id">) => {
      if (!guard()) return;

      useDashboard.getState().addApplication(app);
      const list = useDashboard.getState().applications;
      const optimistic = list[list.length - 1];

      if (!hasSupabase) return;
      const profile = useDashboard.getState().profile;
      const { data, error } = await createClient()!
        .from("applications")
        .insert({
          company: app.company,
          role_title: app.roleTitle,
          stage: app.stage,
          applied_on: app.appliedOn,
          next_step: app.nextStep,
          next_due: app.nextDue,
          notes: app.notes ?? null,
          user_id: profile?.id,
        })
        .select()
        .single();

      if (error || !data) {
        useDashboard.getState().removeApplication(optimistic.id);
        push({ tone: "warn", title: "Not saved", body: error?.message ?? "The server rejected it." });
        return;
      }
      useDashboard.getState().replaceApplication({ ...optimistic, id: String(data.id) });
    },
    [guard, push],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Omit<Application, "id">>) => {
      if (!guard()) return;

      const before = useDashboard.getState().applications.find((a) => a.id === id);
      if (!before) return;
      const after = { ...before, ...patch };
      useDashboard.getState().replaceApplication(after);

      if (!hasSupabase) return;
      const { error } = await createClient()!
        .from("applications")
        .update({
          stage: after.stage,
          applied_on: after.appliedOn,
          next_step: after.nextStep,
          next_due: after.nextDue,
          notes: after.notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        useDashboard.getState().replaceApplication(before);
        push({ tone: "warn", title: "Not saved", body: error.message });
      }
    },
    [guard, push],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!guard()) return;

      const before = useDashboard.getState().applications.find((a) => a.id === id);
      if (!before) return;
      useDashboard.getState().removeApplication(id);

      if (!hasSupabase) return;
      const { error } = await createClient()!.from("applications").delete().eq("id", id);
      if (error) {
        // Restore under the original id; addApplication would mint a new one.
        useDashboard.getState().mergeRemote({
          applications: [...useDashboard.getState().applications, before],
        });
        push({ tone: "warn", title: "Could not delete that", body: error.message });
      }
    },
    [guard, push],
  );

  return { create, update, remove };
}
