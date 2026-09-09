"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { dailySeries, metricsInRange, totalHours, useDashboard, zeroFilled } from "@/lib/store";
import { RANGE_LABEL, type DailyMetric } from "@/lib/types";
import { downsample, shortDate } from "@/lib/utils";

/** Average a bucket of days into one point, keeping the last date as the label. */
function mergeDays(chunk: DailyMetric[]): DailyMetric {
  const n = chunk.length;
  return {
    date: chunk[n - 1].date,
    studyHours: Math.round((chunk.reduce((s, d) => s + d.studyHours, 0) / n) * 10) / 10,
    leetcodeSolved: chunk.reduce((s, d) => s + d.leetcodeSolved, 0),
    githubCommits: chunk.reduce((s, d) => s + d.githubCommits, 0),
  };
}

export function EffortChart() {
  const metrics = useDashboard((s) => s.metrics);
  const timeLog = useDashboard((s) => s.timeLog);
  const problems = useDashboard((s) => s.problems);
  const commitsByDate = useDashboard((s) => s.commitsByDate);
  const range = useDashboard((s) => s.range);

  const { data, total, bucketed } = useMemo(() => {
    const series = dailySeries(metrics, timeLog, problems, commitsByDate);
    const windowed = zeroFilled(metricsInRange(series, range), range);
    // Never draw more than ~150 points. At ALL that turns daily rows into
    // weekly averages with the same visible shape.
    const reduced = downsample(windowed, 150, mergeDays);
    return { data: reduced, total: totalHours(windowed), bucketed: reduced.length < windowed.length };
  }, [metrics, timeLog, problems, commitsByDate, range]);

  return (
    <Panel>
      <PanelHeader
        title="Study hours"
        hint={
          total === 0
            ? `Nothing logged in the ${RANGE_LABEL[range]}`
            : `${total}h in the ${RANGE_LABEL[range]}${bucketed ? ", averaged per bucket" : ""}`
        }
      />
      <PanelBody className="p-2 pr-4">
        {total === 0 ? (
          <EmptyState title="No hours yet" className="py-14">
            Press +25m or +50m on a task in Today. Each press lands on this chart.
          </EmptyState>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="effortFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--c-pytorch)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--c-pytorch)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) =>
                    new Date(d).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    })
                  }
                  minTickGap={44}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "var(--grid-line)" }}
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--line))",
                    borderRadius: 5,
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => shortDate(String(d))}
                  formatter={(v: number) => [`${v}h`, "Study"]}
                />
                <Area
                  type="monotone"
                  dataKey="studyHours"
                  stroke="var(--c-pytorch)"
                  strokeWidth={1.75}
                  fill="url(#effortFill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
