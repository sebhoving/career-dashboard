import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The single surface primitive. Hairline border, no shadow.
 * Hierarchy comes from size and position, not from stacked card shadows.
 */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("border border-line bg-surface", className)} {...props} />;
}

export function PanelHeader({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {hint ? <p className="text-micro text-muted">{hint}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
