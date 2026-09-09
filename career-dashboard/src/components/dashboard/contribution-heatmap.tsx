"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { dailySeries, useDashboard } from "@/lib/store";
import { RANGE_DAYS } from "@/lib/types";
import { addDays, iso, shortDate, today } from "@/lib/utils";

const LEVEL_ALPHA = [0.06, 0.28, 0.5, 0.72, 1];

function level(commits: number) {
  if (commits === 0) return 0;
  if (commits <= 2) return 1;
  if (commits <= 5) return 2;
  if (commits <= 9) return 3;
  return 4;
}

export function ContributionHeatmap() {
  const metrics = useDashboard((s) => s.metrics);
  const timeLog = useDashboard((s) => s.timeLog);
  const problems = useDashboard((s) => s.problems);
  const commitsByDate = useDashboard((s) => s.commitsByDate);
  const githubStatus = useDashboard((s) => s.githubStatus);
  const range = useDashboard((s) => s.range);
  const [hovered, setHovered] = useState<{ date: string; commits: number } | null>(null);

  const { weeks, months, total } = useMemo(() => {
    const days = Math.min(RANGE_DAYS[range], 371);
    const series = dailySeries(metrics, timeLog, problems, commitsByDate);
    const byDate = new Map(series.map((m) => [m.date, m.githubCommits]));
    const end = today();

    // Start on the Sunday on or before the window start so columns are weeks.
    const rawStart = addDays(end, -days);
    const start = addDays(rawStart, -rawStart.getUTCDay());

    const cells: { date: string; commits: number }[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const key = iso(d);
      cells.push({ date: key, commits: byDate.get(key) ?? 0 });
    }

    const grouped: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));

    const labels = grouped.map((week, i) => {
      const first = new Date(week[0].date);
      const prev = i > 0 ? new Date(grouped[i - 1][0].date) : null;
      const changed = !prev || prev.getUTCMonth() !== first.getUTCMonth();
      return changed && i < grouped.length - 1
        ? first.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
        : "";
    });

    return {
      weeks: grouped,
      months: labels,
      total: cells.reduce((sum, c) => sum + c.commits, 0),
    };
  }, [metrics, timeLog, problems, commitsByDate, range]);

  const unavailable =
    githubStatus === "unconfigured" ? (
      <EmptyState title="GitHub is not connected" className="py-10">
        Add GITHUB_USERNAME to .env.local (and a token with read:user scope), restart, and your
        commits will show up here.
      </EmptyState>
    ) : githubStatus === "error" ? (
      <EmptyState title="GitHub did not respond" className="py-10">
        Reload in a minute. The rest of the dashboard does not depend on it.
      </EmptyState>
    ) : null;

  return (
    <Panel>
      <PanelHeader
        title="Commits"
        hint={
          unavailable
            ? undefined
            : hovered
              ? `${hovered.commits} on ${shortDate(hovered.date)}`
              : `${total} in range`
        }
      />
      <PanelBody className="overflow-x-auto p-4">
        {unavailable ?? (
          <div className="min-w-fit">
            <div className="flex gap-[3px] pl-6 pb-1">
              {months.map((label, i) => (
                <span key={i} className="w-[11px] shrink-0 text-micro text-muted">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              <div className="flex w-6 shrink-0 flex-col gap-[3px] pr-1 text-micro text-muted">
                <span className="h-[11px]" />
                <span className="h-[11px] leading-[11px]">M</span>
                <span className="h-[11px]" />
                <span className="h-[11px] leading-[11px]">W</span>
                <span className="h-[11px]" />
                <span className="h-[11px] leading-[11px]">F</span>
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      aria-label={`${cell.commits} commits on ${cell.date}`}
                      onMouseEnter={() => setHovered(cell)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(cell)}
                      onBlur={() => setHovered(null)}
                      className="h-[11px] w-[11px] rounded-[2px] border border-line/60"
                      style={{
                        background: `color-mix(in srgb, var(--c-physics) ${
                          LEVEL_ALPHA[level(cell.commits)] * 100
                        }%, transparent)`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-micro text-muted">
              <span>Fewer</span>
              {LEVEL_ALPHA.map((alpha) => (
                <span
                  key={alpha}
                  className="h-[11px] w-[11px] rounded-[2px] border border-line/60"
                  style={{
                    background: `color-mix(in srgb, var(--c-physics) ${alpha * 100}%, transparent)`,
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
