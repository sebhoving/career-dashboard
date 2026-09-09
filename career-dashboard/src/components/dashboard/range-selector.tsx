"use client";

import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/types";

const RANGES: RangeKey[] = ["1W", "1M", "6M", "1Y", "ALL"];

/** Window for the hours chart, the heatmap and the hours KPI. */
export function RangeSelector() {
  const range = useDashboard((s) => s.range);
  const setRange = useDashboard((s) => s.setRange);

  return (
    <div role="group" aria-label="Time range" className="flex overflow-hidden rounded border border-line bg-surface">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRange(r)}
          aria-pressed={range === r}
          className={cn(
            "px-2.5 py-1.5 text-micro transition-colors",
            range === r ? "bg-ink text-paper" : "text-muted hover:bg-paper hover:text-ink",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
