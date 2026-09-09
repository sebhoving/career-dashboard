"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-ink">The dashboard could not load</h1>
      <p className="mt-2 text-sm text-muted">
        Your logged data is safe. This is a rendering failure, not a data loss.
      </p>
      <Button variant="solid" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
