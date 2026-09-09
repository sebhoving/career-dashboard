import { cn } from "@/lib/utils";
import { CATEGORY_VAR, type Category, type Status } from "@/lib/types";

const CATEGORY_SHORT: Record<Category, string> = {
  DSA: "DSA",
  PYTORCH: "PyTorch",
  PHYSICS: "Physics",
  CAREER: "Career",
};

export function CategoryTag({ category, className }: { category: Category; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-micro text-ink/75", className)}>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-[1px]"
        style={{ background: CATEGORY_VAR[category] }}
      />
      {CATEGORY_SHORT[category]}
    </span>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  TODO: "border-line text-muted",
  IN_PROGRESS: "border-signal/40 text-signal",
  DONE: "border-good/40 text-good",
};

const STATUS_LABEL: Record<Status, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-micro", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
