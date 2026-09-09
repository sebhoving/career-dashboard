"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useApplicationActions } from "@/lib/hooks/use-application-actions";
import { useDashboard } from "@/lib/store";
import { can } from "@/lib/rbac";
import { STAGE_LABEL, STAGE_ORDER, type Application, type Stage } from "@/lib/types";
import { cn, daysBetween, shortDate, today, todayIso } from "@/lib/utils";

function StageTrack({ stage }: { stage: Stage }) {
  const index = STAGE_ORDER.indexOf(stage);
  const closed = stage === "REJECTED";
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {STAGE_ORDER.slice(0, 6).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 w-3 rounded-[1px]",
            closed ? "bg-line" : i <= index ? "bg-signal" : "bg-line",
          )}
        />
      ))}
    </span>
  );
}

const selectClass =
  "h-7 rounded border border-line bg-surface px-1.5 text-micro text-ink disabled:opacity-60";

/** Target roles and where each one stands. Add rows as the plan asks for them. */
export function ApplicationsPanel() {
  const applications = useDashboard((s) => s.applications);
  const role = useDashboard((s) => s.role);
  const { create, update, remove } = useApplicationActions();
  const editable = can(role, "application:update");

  const [adding, setAdding] = useState(false);
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextDue, setNextDue] = useState("");

  const reset = () => {
    setCompany("");
    setRoleTitle("");
    setNextStep("");
    setNextDue("");
    setAdding(false);
  };

  const submit = () => {
    if (!company.trim() || !roleTitle.trim()) return;
    void create({
      company: company.trim(),
      roleTitle: roleTitle.trim(),
      stage: "RESEARCH",
      appliedOn: null,
      nextStep: nextStep.trim() || null,
      nextDue: nextDue || null,
    });
    reset();
  };

  const columns = useMemo<Column<Application>[]>(
    () => [
      {
        key: "company",
        header: "Company",
        className: "w-[150px] shrink-0",
        sortValue: (a) => a.company,
        cell: (a) => (
          <span className="block truncate">
            <span className="font-medium">{a.company}</span>
            <span className="block truncate text-micro text-muted">{a.roleTitle}</span>
          </span>
        ),
      },
      {
        key: "stage",
        header: "Stage",
        className: "w-[150px] shrink-0",
        sortValue: (a) => STAGE_ORDER.indexOf(a.stage),
        cell: (a) => (
          <span className="flex flex-col gap-1">
            <select
              value={a.stage}
              disabled={!editable}
              aria-label={`Stage for ${a.company}`}
              onChange={(e) => {
                const stage = e.target.value as Stage;
                void update(a.id, {
                  stage,
                  // Moving past research is the moment the application went in.
                  appliedOn:
                    a.appliedOn ?? (stage !== "RESEARCH" && stage !== "REJECTED" ? todayIso() : null),
                });
              }}
              className={selectClass}
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <StageTrack stage={a.stage} />
          </span>
        ),
      },
      {
        key: "next",
        header: "Next step",
        className: "flex-1 min-w-0",
        secondary: true,
        cell: (a) => <span className="text-micro text-muted">{a.nextStep ?? "-"}</span>,
      },
      {
        key: "due",
        header: "Due",
        className: "w-[74px] shrink-0 text-right",
        sortValue: (a) => a.nextDue ?? "9999",
        cell: (a) => {
          if (!a.nextDue) return <span className="text-micro text-muted">-</span>;
          const days = daysBetween(today(), a.nextDue);
          return (
            <span data-numeric className={cn("text-micro", days <= 3 ? "text-risk" : "text-muted")}>
              {shortDate(a.nextDue)}
            </span>
          );
        },
      },
      {
        key: "remove",
        header: "",
        className: "w-9 shrink-0",
        cell: (a) =>
          editable ? (
            <button
              type="button"
              onClick={() => void remove(a.id)}
              aria-label={`Remove ${a.company}`}
              className="text-muted hover:text-risk"
            >
              <Trash2 size={13} />
            </button>
          ) : null,
      },
    ],
    [editable, update, remove],
  );

  return (
    <Panel>
      <PanelHeader
        title="Applications"
        hint={applications.length ? `${applications.length} tracked` : "Nothing tracked yet"}
        actions={
          editable ? (
            <Button size="sm" variant={adding ? "ghost" : "outline"} onClick={() => (adding ? reset() : setAdding(true))}>
              {adding ? <X size={13} /> : <Plus size={13} />}
              {adding ? "Cancel" : "Add"}
            </Button>
          ) : null
        }
      />
      <PanelBody className="p-0">
        {adding ? (
          <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2">
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company or group"
              aria-label="Company"
              autoFocus
            />
            <Input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Role"
              aria-label="Role"
            />
            <Input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="Next step, for example: check when it opens"
              aria-label="Next step"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                aria-label="Next step due"
                className="h-9 flex-1 rounded border border-line bg-surface px-2 text-sm text-ink"
              />
              <Button
                variant="solid"
                onClick={submit}
                disabled={!company.trim() || !roleTitle.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : null}
        <DataTable
          rows={applications}
          columns={columns}
          rowKey={(a) => a.id}
          pageSize={10}
          emptyMessage="No applications yet. Step 9 of the plan builds the target list; add each one here."
        />
      </PanelBody>
    </Panel>
  );
}
