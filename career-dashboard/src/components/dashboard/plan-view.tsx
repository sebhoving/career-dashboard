"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTag } from "@/components/ui/badge";
import { PLAN_PHASES, PLAN_STEPS, stepNumber } from "@/lib/data/plan";
import { planProgress, useDashboard } from "@/lib/store";
import { can, VIEWER_HINT } from "@/lib/rbac";
import { cn, shortDate } from "@/lib/utils";
import type { PlanStep } from "@/lib/types";

/**
 * The plan, top to bottom. One step is open at a time. Until you choose
 * one, the first unticked step is open, so ticking a step reveals the next.
 */
export function PlanView() {
  const planDone = useDashboard((s) => s.planDone);
  const togglePlanStep = useDashboard((s) => s.togglePlanStep);
  const focusedStepId = useDashboard((s) => s.focusedStepId);
  const focusStep = useDashboard((s) => s.focusStep);
  const role = useDashboard((s) => s.role);
  const editable = can(role, "plan:update");

  const [hideDone, setHideDone] = useState(false);
  // undefined means "follow the next open step"; null means "all collapsed".
  const [chosen, setChosen] = useState<string | null | undefined>(
    () => focusedStepId ?? undefined,
  );

  useEffect(() => {
    if (focusedStepId) focusStep(null);
  }, [focusedStepId, focusStep]);

  const progress = planProgress(planDone);
  const nextId = useMemo(() => PLAN_STEPS.find((s) => !planDone[s.id])?.id ?? null, [planDone]);
  const openId = chosen === undefined ? nextId : chosen;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">The plan</h2>
          <p className="mt-1 text-sm text-muted">
            Work top to bottom. Open a step to see how to do it and when it counts as done, then
            tick it.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex items-baseline justify-between text-micro text-muted">
            <span data-numeric>
              {progress.done} of {progress.total} steps done
            </span>
            <button type="button" onClick={() => setHideDone((v) => !v)} className="hover:text-ink">
              {hideDone ? "Show done" : "Hide done"}
            </button>
          </div>
          <div className="mt-1.5 h-1 w-full bg-line">
            <div
              className="h-full bg-signal transition-[width]"
              style={{ width: `${Math.round(progress.fraction * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {!editable ? <p className="text-micro text-muted">{VIEWER_HINT}</p> : null}

      {PLAN_PHASES.map((phase) => {
        const steps = PLAN_STEPS.filter((s) => s.phase === phase.key);
        const shown = hideDone ? steps.filter((s) => !planDone[s.id]) : steps;
        const phaseDone = steps.filter((s) => planDone[s.id]).length;

        return (
          <section key={phase.key} aria-labelledby={`phase-${phase.key}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 id={`phase-${phase.key}`} className="text-base font-semibold text-ink">
                {phase.title}
              </h3>
              <span className="text-micro text-muted">{phase.window}</span>
              <span className="ml-auto text-micro text-muted" data-numeric>
                {phaseDone} / {steps.length}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted">{phase.summary}</p>

            {shown.length ? (
              <ol className="mt-3 border border-line bg-surface">
                {shown.map((step) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    doneOn={planDone[step.id]}
                    isNext={step.id === nextId}
                    open={step.id === openId}
                    scrollTo={step.id === focusedStepId}
                    editable={editable}
                    onToggleOpen={() => setChosen(step.id === openId ? null : step.id)}
                    onToggleDone={() => togglePlanStep(step.id)}
                  />
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-micro text-muted">Everything in this phase is done.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function StepRow({
  step,
  doneOn,
  isNext,
  open,
  scrollTo,
  editable,
  onToggleOpen,
  onToggleDone,
}: {
  step: PlanStep;
  doneOn: string | undefined;
  isNext: boolean;
  open: boolean;
  scrollTo: boolean;
  editable: boolean;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const done = Boolean(doneOn);

  useEffect(() => {
    if (scrollTo) ref.current?.scrollIntoView({ block: "center" });
  }, [scrollTo]);

  return (
    <li
      ref={ref}
      className={cn("border-b border-line last:border-b-0", isNext && "bg-signal/[0.04]")}
    >
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <button
          type="button"
          disabled={!editable}
          onClick={onToggleDone}
          aria-label={done ? `Mark ${step.title} as not done` : `Mark ${step.title} as done`}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            done ? "border-good bg-good text-white" : "border-line text-transparent",
            editable && !done && "hover:border-good hover:text-good",
            !editable && "opacity-40",
          )}
        >
          <Check size={13} />
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span data-numeric className="mt-px w-6 shrink-0 text-micro text-muted">
            {stepNumber(step.id)}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-[0.9375rem] leading-snug",
                done ? "text-muted line-through" : "text-ink",
                isNext && "font-medium",
              )}
            >
              {step.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted">
              {isNext ? (
                <span className="rounded bg-signal px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-white">
                  Next
                </span>
              ) : null}
              <CategoryTag category={step.category} />
              <span>{step.estimate}</span>
              {done ? <span>Done {shortDate(doneOn!)}</span> : null}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 text-muted">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-paper/70 px-4 py-4 text-[0.9375rem] leading-relaxed text-ink sm:pl-[68px] sm:pr-8">
          <p>
            <span className="font-medium">Why. </span>
            {step.why}
          </p>

          <p className="mt-4 font-medium">How</p>
          <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 marker:text-muted">
            {step.how.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>

          <p className="mt-4">
            <span className="font-medium">Done when. </span>
            {step.doneWhen}
          </p>

          {step.resources?.length ? (
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {step.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-signal hover:underline"
                >
                  {r.label}
                  <ExternalLink size={12} />
                </a>
              ))}
            </p>
          ) : null}

          {editable ? (
            <Button
              size="sm"
              variant={done ? "outline" : "solid"}
              className="mt-5"
              onClick={onToggleDone}
            >
              {done ? "Mark as not done" : "Mark as done"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
