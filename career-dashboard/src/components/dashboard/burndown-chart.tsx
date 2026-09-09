"use client";

import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { burndownSeries, solvedCount, useDashboard } from "@/lib/store";
import { daysBetween, downsample, shortDate, today } from "@/lib/utils";

const FALLBACK = { startDate: "2026-09-14", endDate: "2027-05-31" };

/**
 * Problems left against the pace needed to finish by the NeetCode milestone.
 * Drawn even before the first solve: the dashed line is the pace to keep.
 */
export function BurndownChart() {
  const problems = useDashboard((s) => s.problems);
  const milestones = useDashboard((s) => s.milestones);

  const target = useMemo(
    () => milestones.find((m) => m.category === "DSA") ?? FALLBACK,
    [milestones],
  );

  const { data, solved, perWeek, behind } = useMemo(() => {
    const raw = burndownSeries(problems, target.startDate, target.endDate);
    // Keep today's point: the downsample takes the last row of each bucket.
    const reduced = downsample(raw, 180, (chunk) => chunk[chunk.length - 1]);
    const live = raw.filter((d) => !Number.isNaN(d.remaining));
    const last = live[live.length - 1];
    const remaining = last ? last.remaining : problems.length;
    const daysLeft = Math.max(1, daysBetween(today(), target.endDate));
    return {
      data: reduced,
      solved: solvedCount(problems),
      perWeek: Math.round((remaining / daysLeft) * 7 * 10) / 10,
      behind: last ? Math.round(last.remaining - last.ideal) : 0,
    };
  }, [problems, target]);

  const hint =
    solved === 0
      ? `${perWeek} a week finishes by ${shortDate(target.endDate)}`
      : behind > 0
        ? `${behind} behind pace. ${perWeek} a week to finish by ${shortDate(target.endDate)}`
        : `${Math.abs(behind)} ahead of pace`;

  return (
    <Panel>
      <PanelHeader title="NeetCode 150 burndown" hint={hint} />
      <PanelBody className="p-2 pr-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="burndownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--c-dsa)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--c-dsa)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) =>
                  new Date(d).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
                }
                minTickGap={56}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, problems.length]}
                ticks={[0, 50, 100, 150]}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <ReferenceLine y={0} stroke="var(--grid-line)" />
              <Tooltip
                cursor={{ stroke: "var(--grid-line)" }}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--line))",
                  borderRadius: 5,
                  fontSize: 12,
                }}
                labelFormatter={(d) => shortDate(String(d))}
                formatter={(value: number, name) => [
                  Math.round(value),
                  name === "remaining" ? "Remaining" : "On pace",
                ]}
              />
              <Line
                type="linear"
                dataKey="ideal"
                stroke="hsl(var(--muted))"
                strokeDasharray="3 4"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="stepAfter"
                dataKey="remaining"
                stroke="var(--c-dsa)"
                strokeWidth={2}
                fill="url(#burndownFill)"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </PanelBody>
    </Panel>
  );
}
