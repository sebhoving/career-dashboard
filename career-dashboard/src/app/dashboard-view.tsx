"use client";

import { useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ApplicationsPanel } from "@/components/dashboard/applications-panel";
import { BurndownChart } from "@/components/dashboard/burndown-chart";
import { ContributionHeatmap } from "@/components/dashboard/contribution-heatmap";
import { EffortChart } from "@/components/dashboard/effort-chart";
import { GanttChart } from "@/components/dashboard/gantt-chart";
import { KpiHeader } from "@/components/dashboard/kpi-header";
import { ModulesTable } from "@/components/dashboard/modules-table";
import { NextUp } from "@/components/dashboard/next-up";
import { PlanView } from "@/components/dashboard/plan-view";
import { ProblemLog } from "@/components/dashboard/problem-log";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { TopBar } from "@/components/dashboard/top-bar";
import { useBootstrap } from "@/lib/hooks/use-bootstrap";
import { useDeadlineToasts } from "@/lib/hooks/use-deadline-toasts";
import { useGithubCommits } from "@/lib/hooks/use-github-commits";
import { clearLocalState, useLocalPersistence } from "@/lib/hooks/use-local-persistence";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { useDashboard } from "@/lib/store";
import { TABS, type TabKey } from "@/lib/types";

const isTab = (value: string): value is TabKey => TABS.some((t) => t.key === value);

/**
 * Four tabs, one job each:
 *   Plan      the ordered steps and how to do them
 *   Today     tasks for the day, plus the next open step
 *   Progress  the numbers and charts, all driven by what you tick
 *   Roadmap   the timeline, the modules and the application pipeline
 */
export function DashboardView() {
  const tab = useDashboard((s) => s.tab);
  const setTab = useDashboard((s) => s.setTab);
  const source = useDashboard((s) => s.source);

  // Order matters: the local load runs before the bootstrap fetch can land.
  useLocalPersistence();
  const { error } = useBootstrap();
  useRealtime();
  useGithubCommits();
  useDeadlineToasts();

  // The hash remembers the open tab across reloads and makes one linkable.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (isTab(fromHash)) setTab(fromHash);
    return useDashboard.subscribe(
      (s) => s.tab,
      (next) => window.history.replaceState(null, "", `#${next}`),
    );
  }, [setTab]);

  return (
    <Tabs.Root value={tab} onValueChange={(v) => isTab(v) && setTab(v)}>
      <TopBar />
      <main id="main" className="mx-auto max-w-[1180px] px-4 py-5 sm:py-6">
        {error ? (
          <p role="alert" className="mb-4 border border-risk/40 bg-surface px-3 py-2 text-micro text-risk">
            {error}. Showing what this browser has saved.
          </p>
        ) : null}

        <Tabs.Content value="plan" className="outline-none">
          <PlanView />
        </Tabs.Content>

        <Tabs.Content value="today" className="outline-none">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TasksPanel />
            </div>
            <div className="lg:col-span-5">
              <NextUp />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="progress" className="space-y-4 outline-none">
          <KpiHeader />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              Everything here comes from what you tick: plan steps, problems and time on tasks.
            </p>
            <RangeSelector />
          </div>
          <div className="hidden md:grid md:gap-4 xl:grid-cols-2">
            <BurndownChart />
            <EffortChart />
          </div>
          <div className="hidden md:block">
            <ContributionHeatmap />
          </div>
          <ProblemLog />
          <footer className="flex flex-wrap items-center justify-between gap-2 pb-6 pt-2 text-micro text-muted">
            <span className="md:hidden">Charts need a wider screen.</span>
            {source === "seed" ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear everything saved in this browser and start again?")) {
                    clearLocalState();
                  }
                }}
                className="ml-auto hover:text-risk"
              >
                Reset saved progress
              </button>
            ) : null}
          </footer>
        </Tabs.Content>

        <Tabs.Content value="roadmap" className="space-y-4 outline-none">
          <GanttChart />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModulesTable />
            <ApplicationsPanel />
          </div>
        </Tabs.Content>
      </main>
    </Tabs.Root>
  );
}
