"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { upcomingDeadlines, useDashboard } from "@/lib/store";

/**
 * Fires one toast per task approaching its due date, at most once per session.
 * Sorted soonest first so the most urgent lands last and sits on top.
 */
export function useDeadlineToasts(windowDays = 3) {
  const tasks = useDashboard((s) => s.tasks);
  const { push } = useToast();
  const announced = useRef(new Set<string>());

  useEffect(() => {
    // Two at a time. A wall of toasts on load gets dismissed without reading.
    const due = upcomingDeadlines(tasks, windowDays).slice(0, 2);
    due.forEach(({ task, inDays }) => {
      if (announced.current.has(task.id)) return;
      announced.current.add(task.id);
      push({
        tone: inDays <= 1 ? "warn" : "info",
        title:
          inDays === 0
            ? `${task.title} is due today`
            : inDays === 1
              ? `${task.title} is due tomorrow`
              : `${task.title} is due in ${inDays} days`,
        body: task.detail,
        duration: inDays <= 1 ? 12000 : 8000,
      });
    });
  }, [tasks, push, windowDays]);
}
