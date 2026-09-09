import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded border border-line bg-surface px-2.5 text-sm text-ink placeholder:text-muted focus-visible:border-signal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
