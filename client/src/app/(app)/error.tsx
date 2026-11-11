"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
      <p className="text-md font-medium">This Page Hit an Error</p>
      <p className="mt-1 text-sm text-muted">Reload it. If it keeps happening, the API may be down.</p>
      <Button className="mt-4" onClick={reset}>
        Reload Page
      </Button>
    </div>
  );
}
