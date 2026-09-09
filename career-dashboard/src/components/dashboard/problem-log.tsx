"use client";

import { useMemo, useState } from "react";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { NEETCODE_PATTERNS } from "@/lib/data/neetcode";
import { useProblemActions } from "@/lib/hooks/use-problem-actions";
import { solvedCount, useDashboard } from "@/lib/store";
import { can } from "@/lib/rbac";
import { downloadCsv, toCsv } from "@/lib/csv";
import { cn, shortDate } from "@/lib/utils";
import type { Difficulty, DsaProblem } from "@/lib/types";

const LEVEL_COLOR: Record<Difficulty, string> = {
  EASY: "var(--c-physics)",
  MEDIUM: "var(--c-career)",
  HARD: "hsl(var(--risk))",
};

/** The NeetCode 150 in list order. Tick a problem when you have solved it. */
export function ProblemLog() {
  const problems = useDashboard((s) => s.problems);
  const role = useDashboard((s) => s.role);
  const { toggle } = useProblemActions();
  const editable = can(role, "problem:update");

  const [filter, setFilter] = useState("");
  const [pattern, setPattern] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const patterns = useMemo(() => {
    const seen = new Set(problems.map((p) => p.pattern));
    // Keep the teaching order for the known patterns, append anything new.
    return [
      ...NEETCODE_PATTERNS.filter((p) => seen.has(p)),
      ...[...seen].filter((p) => !NEETCODE_PATTERNS.includes(p)),
    ];
  }, [problems]);

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return problems.filter((p) => {
      if (onlyOpen && p.solvedAt) return false;
      if (pattern && p.pattern !== pattern) return false;
      if (!needle) return true;
      return p.title.toLowerCase().includes(needle) || p.pattern.toLowerCase().includes(needle);
    });
  }, [problems, filter, pattern, onlyOpen]);

  const columns = useMemo<Column<DsaProblem>[]>(
    () => [
      {
        key: "done",
        header: "",
        className: "w-11 shrink-0",
        cell: (p) => (
          <button
            type="button"
            disabled={!editable}
            onClick={() => void toggle(p.id)}
            aria-label={p.solvedAt ? `Mark ${p.title} unsolved` : `Mark ${p.title} solved`}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border transition-colors",
              p.solvedAt ? "border-good bg-good text-white" : "border-line text-transparent",
              editable && !p.solvedAt && "hover:border-good hover:text-good",
              !editable && "opacity-40",
            )}
          >
            <Check size={13} />
          </button>
        ),
      },
      {
        key: "title",
        header: "Problem",
        className: "flex-1 min-w-0",
        sortValue: (p) => p.title,
        cell: (p) => (
          <span className={cn("block truncate", p.solvedAt && "text-muted")}>{p.title}</span>
        ),
      },
      {
        key: "pattern",
        header: "Pattern",
        className: "w-[190px] shrink-0",
        secondary: true,
        cell: (p) => <span className="text-micro text-muted">{p.pattern}</span>,
      },
      {
        key: "level",
        header: "Level",
        className: "w-[84px] shrink-0",
        sortValue: (p) => ({ EASY: 0, MEDIUM: 1, HARD: 2 })[p.level],
        cell: (p) => (
          <span className="inline-flex items-center gap-1.5 text-micro">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: LEVEL_COLOR[p.level] }} />
            {p.level[0] + p.level.slice(1).toLowerCase()}
          </span>
        ),
      },
      {
        key: "solvedAt",
        header: "Solved",
        className: "w-[84px] shrink-0 text-right",
        sortValue: (p) => p.solvedAt ?? "9999",
        cell: (p) =>
          p.solvedAt ? (
            <span data-numeric className="text-micro text-muted">
              {shortDate(p.solvedAt)}
            </span>
          ) : (
            <span className="text-micro text-muted">Open</span>
          ),
      },
    ],
    [editable, toggle],
  );

  const exportCsv = () =>
    downloadCsv(
      "neetcode-150.csv",
      toCsv(rows as unknown as Record<string, unknown>[], [
        { key: "title", header: "Problem" },
        { key: "pattern", header: "Pattern" },
        { key: "level", header: "Level" },
        { key: "solvedAt", header: "Solved on" },
      ]),
    );

  const solved = solvedCount(problems);

  return (
    <Panel>
      <PanelHeader
        title="NeetCode 150"
        hint={`${solved} of ${problems.length} solved. Tick a problem when it is done.`}
        actions={
          <>
            <Button
              size="sm"
              variant={onlyOpen ? "accent" : "ghost"}
              onClick={() => setOnlyOpen((v) => !v)}
              aria-pressed={onlyOpen}
            >
              Unsolved only
            </Button>
            {can(role, "export:csv") ? (
              <Button size="sm" variant="ghost" onClick={exportCsv}>
                <Download size={13} />
                Export
              </Button>
            ) : null}
          </>
        }
      />
      <PanelBody className="space-y-3 p-0">
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            aria-label="Pattern"
            className="h-9 rounded border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">All patterns</option>
            {patterns.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a problem"
            aria-label="Filter problems"
            className="min-w-[180px] flex-1"
          />
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(p) => p.id}
          pageSize={50}
          virtualizeAbove={60}
          emptyMessage="Nothing matches. Clear the filter to see the whole list."
        />
      </PanelBody>
    </Panel>
  );
}
