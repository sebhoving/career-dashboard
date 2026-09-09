"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/lib/store";

/**
 * Pulls the server snapshot once on mount. Until it lands the store holds
 * seed data, so the page paints immediately rather than showing a spinner
 * over an empty shell.
 */
export function useBootstrap() {
  const hydrate = useDashboard((s) => s.hydrate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        if (res.status === 401) {
          window.location.assign("/sign-in");
          return;
        }
        if (!res.ok) throw new Error(`Bootstrap failed with ${res.status}`);
        const snapshot = await res.json();
        if (!cancelled) hydrate(snapshot);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your data");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return { error };
}
