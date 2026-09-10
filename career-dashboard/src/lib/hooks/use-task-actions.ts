"use client";

import { useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useDashboard } from "@/lib/store";
import { createClient, hasSupabase } from "@/lib/supabase";
import { can, VIEWER_HINT, type Permission } from "@/lib/rbac";
import type { Category, Task } from "@/lib/types";

/**
 * Every mutation is optimistic: the store changes first so the UI never waits
 * on the network, then the write goes out. A rejected write restores the
 * previous row and says so, rather than leaving the screen quietly wrong.
 */
export function useTaskActions() {
  const role = useDashboard((s) => s.role);
  const { push } = useToast();

  const guard = useCallback(
    (permission: Permission) => {
      if (can(role, permission)) return true;
      push({ tone: "warn", title: "Read only", body: VIEWER_HINT });
      return false;
    },
    [role, push],
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!guard("task:update")) return;

      const before = useDashboard.getState().tasks.find((t) => t.id === id);
      if (!before) return;

      useDashboard.getState().toggleTaskStatus(id);
      const after = useDashboard.getState().tasks.find((t) => t.id === id)!;

      if (!hasSupabase) return;
      const { error } = await createClient()!
        .from("tasks")
        .update({ status: after.status, updated_at: after.updatedAt })
        .eq("id", id);

      if (error) {
        useDashboard.getState().replaceTask(before);
        push({ tone: "warn", title: "Could not save that", body: error.message });
      }
    },
    [guard, push],
  );

  const logTime = useCallback(
    async (id: string, minutes: number) => {
      if (!guard("task:update")) return;

      const before = useDashboard.getState().tasks.find((t) => t.id === id);
      if (!before) return;

      useDashboard.getState().logMinutes(id, minutes);
      const after = useDashboard.getState().tasks.find((t) => t.id === id)!;
      // logMinutes appends the entry that drives the hours chart.
      const log = useDashboard.getState().timeLog;
      const entry = log[log.length - 1];

      if (!hasSupabase) return;
      const supabase = createClient()!;
      const userId = useDashboard.getState().profile?.id;

      const [task, logged] = await Promise.all([
        supabase
          .from("tasks")
          .update({
            time_spent_minutes: after.timeSpentMinutes,
            status: after.status,
            updated_at: after.updatedAt,
          })
          .eq("id", id),
        supabase
          .from("time_entries")
          .insert({
            user_id: userId,
            task_id: id,
            entry_date: entry.date,
            minutes: entry.minutes,
            category: entry.category,
          })
          .select("id")
          .single(),
      ]);

      if (task.error || logged.error) {
        useDashboard.getState().replaceTask(before);
        useDashboard.getState().removeTimeEntry(entry);
        push({
          tone: "warn",
          title: "Time not saved",
          body: (task.error ?? logged.error)!.message,
        });
        return;
      }

      // Keep the row id so the entry can be edited or removed later.
      useDashboard.getState().replaceTimeEntry(entry, { ...entry, id: String(logged.data.id) });
    },
    [guard, push],
  );

  const create = useCallback(
    async (title: string, category: Category, dueDate: string | null = null) => {
      if (!guard("task:create")) return;

      useDashboard.getState().addTask({
        title,
        category,
        status: "TODO",
        dueDate,
        timeSpentMinutes: 0,
      });
      const optimistic = useDashboard.getState().tasks[0] as Task;

      if (!hasSupabase) return;
      const profile = useDashboard.getState().profile;
      const { data, error } = await createClient()!
        .from("tasks")
        .insert({ title, category, status: "TODO", due_date: dueDate, user_id: profile?.id })
        .select()
        .single();

      if (error || !data) {
        useDashboard.getState().removeTask(optimistic.id);
        push({
          tone: "warn",
          title: "Task not saved",
          body: error?.message ?? "The server rejected it.",
        });
        return;
      }

      // Swap the temporary id for the real one so later edits target the row.
      useDashboard.getState().replaceTask({ ...optimistic, id: String(data.id) });
    },
    [guard, push],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!guard("task:delete")) return;

      const before = useDashboard.getState().tasks.find((t) => t.id === id);
      if (!before) return;
      useDashboard.getState().removeTask(id);

      if (!hasSupabase) return;
      const { error } = await createClient()!.from("tasks").delete().eq("id", id);
      if (error) {
        // Put the row back under its own id. addTask would mint a new one and
        // the restored task would no longer match the database row.
        useDashboard.getState().mergeRemote({
          tasks: [before, ...useDashboard.getState().tasks],
        });
        push({ tone: "warn", title: "Could not delete that", body: error.message });
      }
    },
    [guard, push],
  );

  return { toggle, logTime, create, remove };
}
