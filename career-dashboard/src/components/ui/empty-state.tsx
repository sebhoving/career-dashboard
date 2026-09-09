import { cn } from "@/lib/utils";

/** What a panel says instead of drawing nothing. Always says how to fill it. */
export function EmptyState({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-8 text-center", className)}>
      <p className="text-sm font-medium text-ink">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p> : null}
    </div>
  );
}
