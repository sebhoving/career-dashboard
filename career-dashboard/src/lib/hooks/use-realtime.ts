"use client";

import { useEffect } from "react";
import { useDashboard } from "@/lib/store";
import { createClient, hasSupabase } from "@/lib/supabase";
import { mapApplication, mapTask } from "@/lib/data/repository";

/**
 * Live sync of tasks and applications over a Postgres changes channel.
 * Without Supabase there is nothing remote to listen to: this browser is
 * the only writer, and useLocalPersistence already keeps it in sync with
 * itself.
 */
export function useRealtime() {
  const mergeRemote = useDashboard((s) => s.mergeRemote);
  const markSynced = useDashboard((s) => s.markSynced);

  useEffect(() => {
    if (!hasSupabase) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("dashboard-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        const state = useDashboard.getState();
        if (payload.eventType === "DELETE") {
          const id = String((payload.old as { id?: string }).id ?? "");
          mergeRemote({ tasks: state.tasks.filter((t) => t.id !== id) });
        } else {
          const row = mapTask(payload.new as Record<string, unknown>);
          mergeRemote({
            tasks: state.tasks.some((t) => t.id === row.id)
              ? state.tasks.map((t) => (t.id === row.id ? row : t))
              : [row, ...state.tasks],
          });
        }
        markSynced();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        (payload) => {
          const state = useDashboard.getState();
          if (payload.eventType === "DELETE") {
            const id = String((payload.old as { id?: string }).id ?? "");
            mergeRemote({ applications: state.applications.filter((a) => a.id !== id) });
          } else {
            const row = mapApplication(payload.new as Record<string, unknown>);
            mergeRemote({
              applications: state.applications.some((a) => a.id === row.id)
                ? state.applications.map((a) => (a.id === row.id ? row : a))
                : [...state.applications, row],
            });
          }
          markSynced();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mergeRemote, markSynced]);
}
