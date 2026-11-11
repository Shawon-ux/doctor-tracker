"use client";

import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { useDoctorLookup } from "@/hooks/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Picked = { id: string; name: string };

/** Server-side search, so it scales past what a plain <select> could hold. */
export function DoctorPicker({
  value,
  onChange,
  id,
  invalid,
  placeholder = "Choose a doctor",
  variant = "field",
}: {
  value?: Picked;
  onChange: (v?: Picked) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  variant?: "field" | "filter";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);
  const { data = [], isFetching } = useDoctorLookup(dq, open);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          variant === "field"
            ? cn(controlClass, "flex h-9 items-center justify-between text-left")
            : cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-base whitespace-nowrap", value ? "border-pine/40 bg-pine-soft text-ink" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink"),
        )}
      >
        {variant === "filter" ? (
          <>
            Doctor {value && <span className="max-w-36 truncate font-medium">{value.name}</span>}
          </>
        ) : (
          <span className={cn("truncate", !value && "text-faint")}>{value?.name ?? placeholder}</span>
        )}
        <ChevronDown size={14} className="shrink-0 opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} collisionPadding={12} className="z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-16px_rgba(10,30,35,0.4)]">
          <div className="relative mb-1">
            <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctors"
              aria-label="Search doctors"
              className="h-8 w-full rounded-md bg-surface-2 pr-2 pl-8 text-sm outline-none"
            />
          </div>
          <div role="listbox" aria-busy={isFetching} className="max-h-64 overflow-y-auto">
            {variant === "filter" && value && (
              <button
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted hover:bg-surface-2"
              >
                Any Doctor
              </button>
            )}
            {data.length === 0 && !isFetching && <p className="px-2 py-3 text-sm text-muted">No Doctors Found</p>}
            {data.map((d) => (
              <button
                key={d._id}
                role="option"
                aria-selected={value?.id === d._id}
                onClick={() => {
                  onChange({ id: d._id, name: d.name });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.specialization}</span>
                </span>
                {value?.id === d._id && <Check size={14} className="shrink-0 text-pine" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
