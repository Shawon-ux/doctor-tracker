"use client";

import { DropdownMenu } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function RowMenu({ label, items }: { label: string; items: { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean }[] }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink data-[state=open]:bg-surface-2"
      >
        <MoreHorizontal size={18} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="z-50 min-w-40 rounded-lg border border-line bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(10,30,35,0.35)]"
        >
          {items.map((it) => (
            <DropdownMenu.Item
              key={it.label}
              onSelect={it.onSelect}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-surface-2",
                it.danger ? "text-danger" : "text-ink",
              )}
            >
              {it.icon}
              {it.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
