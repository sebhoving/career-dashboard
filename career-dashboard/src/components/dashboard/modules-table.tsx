"use client";

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
      <span className="block truncate">
        {m.title}
        <span data-numeric className="ml-2 text-micro text-muted">
          {m.code}
        </span>
      </span>
    ),
  },
  {
    key: "term",
    header: "Term",
    className: "w-[110px] shrink-0",
    sortValue: (m) => m.term,
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
    cell: (m) => <span className="text-micro text-muted">{m.carryOver}</span>,
  },
];

export function ModulesTable() {
  const modules = useDashboard((s) => s.modules);

  return (
    <Panel>
      <PanelHeader title="Degree modules" hint="Ranked by what carries into the target role" />
      <PanelBody className="p-0">
        <DataTable rows={modules} columns={columns} rowKey={(m) => m.id} pageSize={10} />
      </PanelBody>
    </Panel>
  );
}
