"use client";

import { useEffect } from "react";
import { useDashboard } from "@/lib/store";

/**
 * Pulls commit counts from /api/github once on mount. The route reports
 * whether GITHUB_USERNAME is set, so the heatmap can say how to connect it
 * rather than drawing an empty grid.
 */
export function useGithubCommits() {
  const setCommits = useDashboard((s) => s.setCommits);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/github");
        const data = (await res.json()) as {
          commitsByDate?: Record<string, number>;
          source?: string;
        };
        if (cancelled) return;
        if (data.source === "unconfigured") setCommits({}, "unconfigured");
        else if (!res.ok) setCommits({}, "error");
        else setCommits(data.commitsByDate ?? {}, "connected");
      } catch {
        if (!cancelled) setCommits({}, "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setCommits]);
}
