"use client";

import { useMemo } from "react";
import {
  commitStreak,
  dailySeries,
  metricsInRange,
  planProgress,
  solvedCount,
  totalHours,
  useDashboard,
} from "@/lib/store";
import { RANGE_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Kpi {
  label: string;
  value: string;
  unit?: string;
  context: string;
  /** Fraction 0-1 drawn as a thin rule under the number. Omit for plain stats. */
  fill?: number;
  tone?: "signal" | "good";
}

export function KpiHeader() {
  const metrics = useDashboard((s) => s.metrics);
  const timeLog = useDashboard((s) => s.timeLog);
  const problems = useDashboard((s) => s.problems);
  const commitsByDate = useDashboard((s) => s.commitsByDate);
  const githubStatus = useDashboard((s) => s.githubStatus);
  const planDone = useDashboard((s) => s.planDone);
  const range = useDashboard((s) => s.range);

  const kpis = useMemo<Kpi[]>(() => {
    const series = dailySeries(metrics, timeLog, problems, commitsByDate);
    const windowed = metricsInRange(series, range);
    const plan = planProgress(planDone);
    const solved = solvedCount(problems);
    const hoursInRange = totalHours(windowed);
    const activeDays = windowed.filter((d) => d.studyHours > 0).length;
    const streak = commitStreak(series);
    const connected = githubStatus === "connected";

    return [
      {
        label: "Plan",
        value: String(plan.done),
        unit: `/ ${plan.total} steps`,
        context: plan.done ? `${plan.total - plan.done} to go` : "Nothing ticked yet",
        fill: plan.fraction,
        tone: "signal",
      },
      {
        label: "NeetCode 150",
        value: String(solved),
        unit: `/ ${problems.length}`,
        context: solved ? `${problems.length - solved} left` : "None solved yet",
        fill: problems.length ? solved / problems.length : 0,
        tone: "good",
      },
      {
        label: `Hours, ${RANGE_LABEL[range]}`,
        value: String(hoursInRange),
        unit: "h",
        context: hoursInRange
          ? `${Math.round((hoursInRange / Math.max(1, activeDays)) * 10) / 10}h on each day you worked`
          : "Log time on a task to count it",
      },
      {
        label: "Commit streak",
        value: connected ? String(streak) : "–",
        unit: connected ? (streak === 1 ? "day" : "days") : undefined,
        context: connected
          ? streak
            ? "Push today to keep it"
            : "No commits yet"
          : githubStatus === "unconfigured"
            ? "GitHub not connected"
            : githubStatus === "error"
              ? "GitHub did not respond"
              : "Checking GitHub",
      },
    ];
  }, [metrics, timeLog, problems, commitsByDate, githubStatus, planDone, range]);

  return (
    <section
      aria-label="Key figures"
      className="grid grid-cols-2 border border-line bg-surface lg:grid-cols-4"
    >
      {kpis.map((kpi, i) => (
        <article
          key={kpi.label}
          className={cn(
            "px-4 py-3.5",
            i % 2 === 1 && "border-l border-line",
            i > 1 && "border-t border-line lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <p className="text-micro text-muted">{kpi.label}</p>
          <p data-numeric className="mt-1 flex items-baseline gap-1">
            <span className="text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink">
              {kpi.value}
            </span>
            {kpi.unit ? <span className="text-sm text-muted">{kpi.unit}</span> : null}
          </p>
          {kpi.fill !== undefined ? (
            <div className="mt-2.5 h-[3px] w-full bg-paper">
              <div
                className={cn("h-full", kpi.tone === "good" ? "bg-good" : "bg-signal")}
                style={{ width: `${Math.round(kpi.fill * 100)}%` }}
              />
            </div>
          ) : null}
          <p className="mt-2 text-micro text-muted">{kpi.context}</p>
        </article>
      ))}
    </section>
  );
}
