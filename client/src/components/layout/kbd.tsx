"use client";

import { useEffect, type ReactNode } from "react";

/** Opens with Ctrl+K or Cmd+K from anywhere in the app. */
export function useCommandShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-line bg-surface-2 px-1.5 py-px font-sans text-[11px] text-muted">{children}</kbd>
);
