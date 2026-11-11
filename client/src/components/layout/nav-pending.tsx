"use client";

import { useLinkStatus } from "next/link";

/** Thin bar across the top of the window while a nav link's route is loading. */
export function NavPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden bg-pine/15">
      <span className="block h-full w-1/3 animate-[nav-progress_900ms_ease-in-out_infinite] bg-pine" />
    </span>
  );
}
