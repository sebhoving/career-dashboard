"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTag } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { stepNumber } from "@/lib/data/plan";
import { nextSteps, planProgress, useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

/** The next three open steps. Selecting one opens the plan on it. */
export function NextUp() {
  const planDone = useDashboard((s) => s.planDone);
  const setTab = useDashboard((s) => s.setTab);
  const focusStep = useDashboard((s) => s.focusStep);

  const steps = nextSteps(planDone, 3);
  const progress = planProgress(planDone);

  const openStep = (id: string | null) => {
    focusStep(id);
    setTab("plan");
  };

  return (
    <Panel>
      <PanelHeader
        title="Next in the plan"
        hint={`${progress.done} of ${progress.total} done`}
        actions={
          <Button size="sm" variant="ghost" onClick={() => openStep(null)}>
            Open plan
            <ArrowRight size={13} />
          </Button>
        }
      />
      <PanelBody className="p-0">
        {steps.length ? (
          <ol className="divide-y divide-line">
            {steps.map((step, i) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => openStep(step.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper"
                >
                  <span data-numeric className="mt-0.5 w-6 shrink-0 text-micro text-muted">
                    {stepNumber(step.id)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm text-ink", i === 0 && "font-medium")}>
                      {step.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted">
                      <CategoryTag category={step.category} />
                      <span>{step.estimate}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="Every step is done">That was the whole plan.</EmptyState>
        )}
      </PanelBody>
    </Panel>
  );
}
