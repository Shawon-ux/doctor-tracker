"use client";

import { Popover } from "radix-ui";
import { DateField } from "@/components/ui/date-field";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import type { Range } from "@/lib/types";
import { cn } from "@/lib/cn";
import { fmtShort, toDateInput } from "@/lib/format";

const OPTIONS: { value: Range; label: string; long: string }[] = [
  { value: "7d", label: "7D", long: "Last 7 Days" },
  { value: "30d", label: "30D", long: "Last 30 Days" },
  { value: "90d", label: "90D", long: "Last 90 Days" },
  { value: "12m", label: "12M", long: "Last 12 Months" },
];

/** Same cap as the API. */
const MAX_DAYS = 731;

export type Custom = { from: string; to: string };

export const rangeLabel = (r: Range | "custom") => (r === "custom" ? "Custom Range" : OPTIONS.find((o) => o.value === r)!.long);

function presets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = (yy: number, mm: number, dd: number) => toDateInput(new Date(yy, mm, dd));
  return [
    { label: "This Month", from: d(y, m, 1), to: toDateInput(now) },
    { label: "Last Month", from: d(y, m - 1, 1), to: d(y, m, 0) },
    { label: "This Year", from: d(y, 0, 1), to: toDateInput(now) },
    { label: "Last Year", from: d(y - 1, 0, 1), to: d(y - 1, 11, 31) },
  ];
}

function validate(from: string, to: string) {
  if (!from || !to) return "Choose both dates";
  if (from > to) return "Start must be on or before end";
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  if (days > MAX_DAYS) return "Choose two years or less";
  return null;
}

export function RangeSwitch({
  value,
  custom,
  onChange,
  onCustom,
}: {
  value: Range | "custom";
  custom?: Custom;
  onChange: (r: Range) => void;
  onCustom: (c: Custom) => void;
}) {
  const [open, setOpen] = useState(false);
  const isCustom = value === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
        <div role="radiogroup" aria-label="Date range" className="inline-flex">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={value === o.value}
            aria-label={o.long}
            title={o.long}
            onClick={() => onChange(o.value)}
            className={cn("num h-8 min-w-12 rounded-md px-2.5 text-sm font-medium", value === o.value ? "bg-ink text-canvas" : "text-muted hover:text-ink")}
          >
            {o.label}
          </button>
        ))}
        </div>
        {/* A toggle, not a radio: it opens a popup, which a radio cannot announce. */}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            aria-pressed={isCustom}
            aria-label={isCustom && custom ? `Custom range, ${fmtShort(custom.from)} to ${fmtShort(custom.to)}` : "Custom range"}
            className={cn(
              "num inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
              isCustom ? "bg-ink text-canvas" : "text-muted hover:text-ink",
            )}
          >
            <CalendarRange size={14} />
            {isCustom && custom ? `${fmtShort(custom.from)} to ${fmtShort(custom.to)}` : "Custom"}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={6} collisionPadding={12} className="z-40 w-80 rounded-xl border border-line bg-surface p-3 shadow-[0_16px_40px_-16px_rgba(10,30,35,0.4)]">
              {/* Keyed so each open starts from the applied range. */}
              <CustomForm
                key={open ? "open" : "closed"}
                initial={custom}
                onApply={(c) => {
                  onCustom(c);
                  setOpen(false);
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}

function CustomForm({ initial, onApply }: { initial?: Custom; onApply: (c: Custom) => void }) {
  const today = toDateInput(new Date());
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? today);
  const [error, setError] = useState<string | null>(null);

  const apply = (f: string, t: string) => {
    const e = validate(f, t);
    if (e) return setError(e);
    onApply({ from: f, to: t });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        apply(from, to);
      }}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {presets().map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => apply(p.from, p.to)}
            className="rounded-md border border-line px-2 py-1.5 text-sm hover:border-line-strong hover:bg-surface-2"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          From
          <DateField
            value={from}
            max={to || today}
            onChange={(v) => {
              setFrom(v);
              setError(null);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          To
          <DateField
            value={to}
            min={from}
            max={today}
            onChange={(v) => {
              setTo(v);
              setError(null);
            }}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <button type="submit" className="mt-3 h-9 w-full rounded-lg bg-pine text-sm font-medium text-pine-ink hover:brightness-110">
        Apply Range
      </button>
    </form>
  );
}
