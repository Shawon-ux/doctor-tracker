"use client";

import { Popover } from "radix-ui";
import { Info } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Definitions live here instead of in the layout. Opens on hover and on tap. */
export function InfoTip({ children, label = "More info" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={label}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        className="inline-flex size-5 items-center justify-center rounded-full text-faint hover:text-muted"
      >
        <Info size={14} strokeWidth={2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 max-w-64 rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-canvas shadow-lg"
        >
          {children}
          <Popover.Arrow className="fill-ink" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
