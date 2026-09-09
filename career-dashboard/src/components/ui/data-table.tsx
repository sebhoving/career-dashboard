"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Columns marked secondary drop out below the md breakpoint. */
  secondary?: boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  pageSize?: number;
  /**
   * Switch to windowed rendering above this row count. Below it, plain rows
   * are cheaper and keep native find-in-page working.
   */
  virtualizeAbove?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = 25,
  virtualizeAbove = 100,
  emptyMessage = "Nothing here yet.",
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = column.sortValue!(a);
      const y = column.sortValue!(b);
      if (x === y) return 0;
      return (x > y ? 1 : -1) * factor;
    });
  }, [rows, columns, sort]);

  const virtualize = sorted.length > virtualizeAbove;
  const pageCount = virtualize ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = virtualize
    ? sorted
    : sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 12,
    enabled: virtualize,
  });

  if (!rows.length) {
    return <p className="px-4 py-6 text-sm text-muted">{emptyMessage}</p>;
  }

  const header = (
    <div className="flex border-b border-line bg-paper">
      {columns.map((col) => (
        <div
          key={col.key}
          className={cn(
            "px-3 py-2 text-micro font-medium text-muted",
            col.secondary && "hidden md:block",
            col.className,
          )}
        >
          {col.sortValue ? (
            <button
              type="button"
              onClick={() => toggleSort(col.key)}
              className="flex items-center gap-1 hover:text-ink"
              aria-label={`Sort by ${col.header}`}
            >
              {col.header}
              {sort?.key === col.key ? (
                sort.dir === "asc" ? (
                  <ArrowUp size={11} />
                ) : (
                  <ArrowDown size={11} />
                )
              ) : null}
            </button>
          ) : (
            col.header
          )}
        </div>
      ))}
    </div>
  );

  const renderRow = (row: T, style?: React.CSSProperties) => (
    <div
      key={rowKey(row)}
      style={style}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      className={cn(
        "flex items-center border-b border-line last:border-b-0",
        onRowClick && "cursor-pointer hover:bg-paper",
      )}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className={cn(
            "truncate px-3 py-2 text-sm text-ink",
            col.secondary && "hidden md:block",
            col.className,
          )}
        >
          {col.cell(row)}
        </div>
      ))}
    </div>
  );

  return (
    <div role="table" aria-rowcount={sorted.length}>
      {header}

      {virtualize ? (
        <div ref={scrollRef} className="max-h-[420px] overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((item) =>
              renderRow(visible[item.index], {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }),
            )}
          </div>
        </div>
      ) : (
        <div>{visible.map((row) => renderRow(row))}</div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between px-3 py-2 text-micro text-muted">
          <span data-numeric>
            {current * pageSize + 1} to {Math.min(sorted.length, (current + 1) * pageSize)} of{" "}
            {sorted.length}
          </span>
          <span className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              aria-label="Previous page"
              className="rounded border border-line p-1 disabled:opacity-40"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              aria-label="Next page"
              className="rounded border border-line p-1 disabled:opacity-40"
            >
              <ChevronRight size={13} />
            </button>
          </span>
        </div>
      ) : (
        <p className="px-3 py-2 text-micro text-muted" data-numeric>
          {sorted.length} rows
          {virtualize ? ", windowed" : ""}
        </p>
      )}
    </div>
  );
}
