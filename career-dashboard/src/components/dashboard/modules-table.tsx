"use client";

import { useMemo } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useDashboard } from "@/lib/store";
import type { Module } from "@/lib/types";

/** Five dots, filled to the relevance score. Reads faster than a number. */
function Relevance({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={`${score} of 5 toward the target role`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: i <= score ? "var(--c-physics)" : "hsl(var(--line))",
          }}
        />
      ))}
    </span>
  );
}

const columns: Column<Module>[] = [
  {
    key: "title",
    header: "Module",
    className: "flex-1 min-w-0",
    sortValue: (m) => m.title,
    cell: (m) => (
      <span className="block truncate" title={m.title}>
        {m.title}
        <span data-numeric className="block truncate text-micro text-muted">
          {m.code} · {m.credits} ECTS
        </span>
      </span>
    ),
  },
  {
    key: "term",
    header: "Term",
    className: "w-[110px] shrink-0",
    sortValue: (m) => `${m.academicYear} ${m.term}`,
    cell: (m) => <span className="text-micro text-muted">{m.term}</span>,
  },
  {
    key: "relevance",
    header: "Fit",
    className: "w-[70px] shrink-0",
    sortValue: (m) => -m.relevance,
    cell: (m) => <Relevance score={m.relevance} />,
  },
  {
    key: "carryOver",
    header: "What transfers",
    className: "flex-1 min-w-0",
    secondary: true,
    cell: (m) => (
      <span className="text-micro text-muted" title={m.carryOver}>
        {m.carryOver}
      </span>
    ),
  },
];

/** ECTS per term within each academic year, so a heavy term is visible before it starts. */
function termLoad(modules: Module[]) {
  const years = new Map<string, Map<string, number>>();
  modules.forEach((m) => {
    const terms = years.get(m.academicYear) ?? new Map<string, number>();
    terms.set(m.term, (terms.get(m.term) ?? 0) + m.credits);
    years.set(m.academicYear, terms);
  });
  return [...years.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, terms]) => ({
      year,
      terms: [...terms.entries()].sort(([a], [b]) => a.localeCompare(b)),
      total: [...terms.values()].reduce((sum, n) => sum + n, 0),
    }));
}

export function ModulesTable() {
  const modules = useDashboard((s) => s.modules);
  const load = useMemo(() => termLoad(modules), [modules]);

  return (
    <Panel>
      <PanelHeader title="Degree modules" hint="Ranked by what carries into the target role" />
      <PanelBody className="p-0">
        {load.map(({ year, terms, total }) => (
          <dl
            key={year}
            className="flex flex-wrap gap-x-5 gap-y-1 border-b border-line px-3 py-2 text-micro text-muted"
          >
            <div className="flex gap-1.5 text-ink">
              <dt className="font-medium">{year || "Year not set"}</dt>
              <dd data-numeric>{total} ECTS</dd>
            </div>
            {terms.map(([term, ects]) => (
              <div key={term} className="flex gap-1.5">
                <dt>{term}</dt>
                <dd data-numeric className="text-ink">
                  {ects}
                </dd>
              </div>
            ))}
          </dl>
        ))}
        <DataTable rows={modules} columns={columns} rowKey={(m) => m.id} pageSize={10} />
      </PanelBody>
    </Panel>
  );
}
