"use client";

import { useMemo } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { CategoryTag, StatusPill } from "@/components/ui/badge";
import { PLAN_STEPS, stepNumber } from "@/lib/data/plan";
import { milestoneProgress, useDashboard } from "@/lib/store";
import { CATEGORY_VAR, type Milestone } from "@/lib/types";
import { cn, daysBetween, shortDate, today } from "@/lib/utils";

/**
 * The axis, every bar and the today marker share one coordinate space:
 * LABEL_W on the left, PROGRESS_W on the right, timeline in between. Anything
 * positioned by date lives inside a container with those exact insets, so the
 * gridlines cannot drift away from the bars.
 */
const LABEL_W = 280;
const PROGRESS_W = 48;

const quarterStart = (d: Date, offsetQuarters = 0) =>
  new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3 + offsetQuarters * 3, 1));

export function GanttChart() {
  const milestones = useDashboard((s) => s.milestones);
  const tasks = useDashboard((s) => s.tasks);
  const planDone = useDashboard((s) => s.planDone);
  const focused = useDashboard((s) => s.focusedMilestoneId);
  const focusMilestone = useDashboard((s) => s.focusMilestone);
  const setTab = useDashboard((s) => s.setTab);
  const focusStep = useDashboard((s) => s.focusStep);

  const phases = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    milestones.forEach((m) => map.set(m.phase, [...(map.get(m.phase) ?? []), m]));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [milestones]);

  // The axis runs from the quarter the first milestone starts in to the end
  // of the quarter the last one finishes in, so the bars fill the width.
  const { rangeStart, span, ticks } = useMemo(() => {
    const starts = milestones.map((m) => m.startDate).sort();
    const ends = milestones.map((m) => m.endDate).sort();
    const rangeStart = quarterStart(new Date(starts[0] ?? "2026-09-01"));
    const rangeEnd = quarterStart(new Date(ends[ends.length - 1] ?? "2028-12-31"), 1);
    const span = Math.max(1, daysBetween(rangeStart, rangeEnd));

    const ticks: { key: string; label: string; left: number; major: boolean }[] = [];
    for (let d = rangeStart, i = 0; d < rangeEnd; d = quarterStart(d, 1), i += 1) {
      const q = d.getUTCMonth() / 3;
      const year = d.getUTCFullYear();
      ticks.push({
        key: `${year}-${q}`,
        label: q === 0 ? String(year) : i === 0 ? `Q${q + 1} ${year}` : `Q${q + 1}`,
        left: (daysBetween(rangeStart, d) / span) * 100,
        major: q === 0,
      });
    }
    return { rangeStart, span, ticks };
  }, [milestones]);

  const pct = (date: string | Date) =>
    Math.min(100, Math.max(0, (daysBetween(rangeStart, date) / span) * 100));
  const trackStyle = { left: LABEL_W, right: PROGRESS_W };
  const now = today();

  return (
    <Panel>
      <PanelHeader
        title="Roadmap to 2028"
        hint="Progress comes from the plan steps under each milestone"
      />
      <PanelBody className="p-0">
        {/* Narrow screens get a plain list. The timeline needs width to read. */}
        <ul className="divide-y divide-line md:hidden">
          {milestones.map((m) => {
            const progress = milestoneProgress(m, planDone);
            return (
              <li key={m.id} className="px-4 py-3">
                <p className="text-sm text-ink">{m.title}</p>
                <p className="mt-1 flex items-center gap-3 text-micro text-muted">
                  <CategoryTag category={m.category} />
                  <span>
                    {shortDate(m.startDate)} to {shortDate(m.endDate)}
                  </span>
                  <span data-numeric className="ml-auto">
                    {progress}%
                  </span>
                </p>
                <div className="mt-2 h-1 w-full bg-line">
                  <div
                    className="h-full"
                    style={{ width: `${progress}%`, background: CATEGORY_VAR[m.category] }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <div className="relative min-w-[860px]">
            <div className="relative h-9 border-b border-line">
              <div className="absolute inset-y-0" style={trackStyle}>
                {ticks.map((tick) => (
                  <div key={tick.key} className="absolute inset-y-0" style={{ left: `${tick.left}%` }}>
                    <span
                      aria-hidden
                      className={cn("absolute inset-y-0 w-px", tick.major ? "bg-line" : "bg-line/50")}
                    />
                    <span
                      className={cn(
                        "absolute left-1.5 top-2.5 whitespace-nowrap text-micro",
                        tick.major ? "font-semibold text-ink" : "text-muted",
                      )}
                    >
                      {tick.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div aria-hidden className="pointer-events-none absolute inset-y-0" style={trackStyle}>
                {ticks.map((tick) => (
                  <span
                    key={tick.key}
                    className={cn("absolute inset-y-0 w-px", tick.major ? "bg-line" : "bg-line/40")}
                    style={{ left: `${tick.left}%` }}
                  />
                ))}
                <span className="absolute inset-y-0 z-10 w-px bg-risk" style={{ left: `${pct(now)}%` }}>
                  <span className="absolute left-1 top-1 rounded bg-risk px-1 py-px text-[10px] leading-tight text-white">
                    Today
                  </span>
                </span>
              </div>

              {phases.map(([phase, items]) => (
                <div key={phase} className="relative">
                  <div className="relative z-[1] border-b border-line bg-paper px-3 py-1.5 text-micro font-medium text-ink/70">
                    {phase}
                  </div>
                  {items.map((m) => {
                    const left = pct(m.startDate);
                    const width = Math.max(0.8, pct(m.endDate) - left);
                    const isOpen = focused === m.id;
                    const progress = milestoneProgress(m, planDone);
                    const steps = PLAN_STEPS.filter((s) => s.milestoneId === m.id);
                    const children = tasks.filter((t) => t.milestoneId === m.id);

                    return (
                      <div key={m.id} className="border-b border-line last:border-b-0">
                        <button
                          type="button"
                          onClick={() => focusMilestone(isOpen ? null : m.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center py-2 text-left hover:bg-paper/70"
                        >
                          <span
                            className="flex shrink-0 items-center gap-1.5 pl-3 pr-3"
                            style={{ width: LABEL_W }}
                          >
                            {isOpen ? (
                              <ChevronDown size={13} className="shrink-0 text-muted" />
                            ) : (
                              <ChevronRight size={13} className="shrink-0 text-muted" />
                            )}
                            <span className="truncate text-sm text-ink">{m.title}</span>
                          </span>

                          <span className="relative h-5 flex-1">
                            <span
                              className="absolute top-1/2 h-[15px] -translate-y-1/2 overflow-hidden rounded-[3px]"
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                background: `color-mix(in srgb, ${CATEGORY_VAR[m.category]} 16%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${CATEGORY_VAR[m.category]} 50%, transparent)`,
                              }}
                            >
                              <span
                                className="absolute inset-y-0 left-0"
                                style={{
                                  width: `${progress}%`,
                                  background: CATEGORY_VAR[m.category],
                                  opacity: 0.85,
                                }}
                              />
                            </span>
                          </span>

                          <span
                            data-numeric
                            className="shrink-0 pr-3 text-right text-micro text-muted"
                            style={{ width: PROGRESS_W }}
                          >
                            {progress}%
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="relative z-[1] border-t border-line bg-paper/80 px-3 py-3">
                            <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-micro text-muted">
                              <div className="flex gap-1.5">
                                <dt>Window</dt>
                                <dd className="text-ink">
                                  {shortDate(m.startDate)} to {shortDate(m.endDate)}
                                </dd>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <dt>Track</dt>
                                <dd>
                                  <CategoryTag category={m.category} />
                                </dd>
                              </div>
                              <div className="flex gap-1.5">
                                <dt>Days remaining</dt>
                                <dd className="text-ink" data-numeric>
                                  {Math.max(0, daysBetween(now, m.endDate))}
                                </dd>
                              </div>
                            </dl>

                            {steps.length ? (
                              <ul className="space-y-1.5">
                                {steps.map((s) => {
                                  const done = Boolean(planDone[s.id]);
                                  return (
                                    <li key={s.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          focusStep(s.id);
                                          setTab("plan");
                                        }}
                                        className="flex w-full items-center gap-2.5 border border-line bg-surface px-2.5 py-1.5 text-left hover:bg-paper"
                                      >
                                        <span
                                          className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                            done ? "border-good bg-good text-white" : "border-line text-transparent",
                                          )}
                                        >
                                          <Check size={11} />
                                        </span>
                                        <span data-numeric className="w-5 shrink-0 text-micro text-muted">
                                          {stepNumber(s.id)}
                                        </span>
                                        <span
                                          className={cn(
                                            "truncate text-sm",
                                            done ? "text-muted line-through" : "text-ink",
                                          )}
                                        >
                                          {s.title}
                                        </span>
                                        <span className="ml-auto shrink-0 text-micro text-muted">
                                          {s.estimate}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-micro text-muted">No plan steps link to this milestone.</p>
                            )}

                            {children.length ? (
                              <ul className="mt-3 space-y-1.5">
                                {children.map((t) => (
                                  <li
                                    key={t.id}
                                    className="flex items-center justify-between gap-3 border border-line bg-surface px-2.5 py-1.5"
                                  >
                                    <span className="truncate text-sm text-ink">{t.title}</span>
                                    <span className="flex shrink-0 items-center gap-2">
                                      <span data-numeric className="text-micro text-muted">
                                        {shortDate(t.dueDate)}
                                      </span>
                                      <StatusPill status={t.status} />
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
