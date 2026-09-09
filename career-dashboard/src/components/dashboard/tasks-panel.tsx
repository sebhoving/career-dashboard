"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTag } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useDashboard } from "@/lib/store";
import { useTaskActions } from "@/lib/hooks/use-task-actions";
import { can, VIEWER_HINT } from "@/lib/rbac";
import { cn, daysBetween, hours, longDate, today } from "@/lib/utils";
import { CATEGORY_LABEL, type Category, type Task } from "@/lib/types";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "DSA", label: "DSA" },
  { key: "PYTORCH", label: "ML" },
  { key: "PHYSICS", label: "Physics" },
  { key: "CAREER", label: "Career" },
];

function dueLabel(dueDate: string) {
  const days = daysBetween(today(), dueDate);
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, urgent: true };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days === 1) return { text: "Due tomorrow", urgent: true };
  return { text: `Due in ${days} days`, urgent: days <= 3 };
}

/** Ad hoc tasks for the day. Time logged here feeds the hours chart. */
export function TasksPanel() {
  const tasks = useDashboard((s) => s.tasks);
  const role = useDashboard((s) => s.role);
  const { toggle, logTime, create, remove } = useTaskActions();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("DSA");
  const [dueDate, setDueDate] = useState("");
  const [showDone, setShowDone] = useState(false);

  const editable = can(role, "task:update");

  const { open, done } = useMemo(() => {
    const open = tasks
      .filter((t) => t.status !== "DONE")
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
    const done = tasks
      .filter((t) => t.status === "DONE")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { open, done };
  }, [tasks]);

  const submit = () => {
    if (!title.trim()) return;
    void create(title.trim(), category, dueDate || null);
    setTitle("");
    setDueDate("");
  };

  return (
    <Panel>
      <PanelHeader title="Tasks" hint={longDate(today())} />
      <PanelBody className="p-0">
        {editable ? (
          <div className="space-y-2 border-b border-line p-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Add a task, for example: Two Sum and Valid Anagram"
              aria-label="New task"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((c) => (
                <Button
                  key={c.key}
                  size="sm"
                  variant={category === c.key ? "accent" : "outline"}
                  onClick={() => setCategory(c.key)}
                  aria-pressed={category === c.key}
                  title={CATEGORY_LABEL[c.key]}
                  className="h-8"
                >
                  {c.label}
                </Button>
              ))}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Due date"
                className="h-8 rounded border border-line bg-surface px-2 text-micro text-ink"
              />
              <Button
                size="sm"
                variant="solid"
                onClick={submit}
                disabled={!title.trim()}
                className="ml-auto h-8"
              >
                <Plus size={14} />
                Add
              </Button>
            </div>
          </div>
        ) : (
          <p className="border-b border-line px-3 py-2.5 text-micro text-muted">{VIEWER_HINT}</p>
        )}

        {open.length ? (
          <ul className="divide-y divide-line">
            {open.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                editable={editable}
                onToggle={() => void toggle(task.id)}
                onLog={(m) => void logTime(task.id, m)}
                onRemove={() => void remove(task.id)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="No open tasks">
            Add one above. If you are not sure what, the plan has the next thing to do.
          </EmptyState>
        )}

        {done.length ? (
          <div className="border-t border-line">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              aria-expanded={showDone}
              className="flex w-full items-center justify-between px-3 py-2 text-micro text-muted hover:text-ink"
            >
              <span data-numeric>
                {done.length} done
              </span>
              {showDone ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showDone ? (
              <ul className="divide-y divide-line border-t border-line">
                {done.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    editable={editable}
                    onToggle={() => void toggle(task.id)}
                    onLog={(m) => void logTime(task.id, m)}
                    onRemove={() => void remove(task.id)}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

function TaskRow({
  task,
  editable,
  onToggle,
  onLog,
  onRemove,
}: {
  task: Task;
  editable: boolean;
  onToggle: () => void;
  onLog: (minutes: number) => void;
  onRemove: () => void;
}) {
  const done = task.status === "DONE";
  const due = task.dueDate && !done ? dueLabel(task.dueDate) : null;

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        disabled={!editable}
        onClick={onToggle}
        aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} as done`}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          done ? "border-good bg-good text-white" : "border-line text-transparent",
          editable && !done && "hover:border-good hover:text-good",
          !editable && "opacity-40",
        )}
      >
        <Check size={13} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", done ? "text-muted line-through" : "text-ink")}>
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <CategoryTag category={task.category} />
          {due ? (
            <span className={cn("text-micro", due.urgent ? "text-risk" : "text-muted")}>
              {due.text}
            </span>
          ) : null}
          {task.timeSpentMinutes > 0 ? (
            <span data-numeric className="text-micro text-muted">
              {hours(task.timeSpentMinutes)}h logged
            </span>
          ) : null}
        </p>
      </div>

      {editable ? (
        <div className="flex shrink-0 items-center gap-0.5">
          {!done
            ? [25, 50].map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant="ghost"
                  onClick={() => onLog(mins)}
                  aria-label={`Log ${mins} minutes on ${task.title}`}
                >
                  +{mins}m
                </Button>
              ))
            : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label={`Delete ${task.title}`}
            className="text-muted hover:text-risk"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ) : null}
    </li>
  );
}
