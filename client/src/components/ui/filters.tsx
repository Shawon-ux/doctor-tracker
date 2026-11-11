"use client";

import { Popover } from "radix-ui";
import { DateField } from "./date-field";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fmtShort, toDateInput } from "@/lib/format";

/** Local input state, URL updated after a pause so each keystroke is not a request. */
export function SearchBox({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value ?? "");
  const [synced, setSynced] = useState(value);
  // Back button or "clear filters" changed the URL: show that value.
  if (value !== synced) {
    setSynced(value);
    if ((value ?? "") !== text.trim()) setText(value ?? "");
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const update = (t: string) => {
    setText(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(t.trim()), 300);
  };

  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        className="h-9 w-full rounded-lg border border-line bg-surface pr-8 pl-9 text-base placeholder:text-faint hover:border-line-strong focus:border-series focus:ring-2 focus:ring-series/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button onClick={() => update("")} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-faint hover:text-ink">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function Trigger({ label, active, summary }: { label: string; active: boolean; summary?: string }) {
  return (
    <Popover.Trigger
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-base whitespace-nowrap",
        active ? "border-pine/40 bg-pine-soft text-ink" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {label}
      {summary && <span className="max-w-32 truncate font-medium text-ink">{summary}</span>}
      <ChevronDown size={14} className="opacity-60" />
    </Popover.Trigger>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Popover.Portal>
      <Popover.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className={cn("z-40 rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-16px_rgba(10,30,35,0.4)]", className)}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

export function MultiFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  render?: (v: T) => ReactNode;
}) {
  const summary = value.length === 1 ? String(render ? value[0] : value[0]) : value.length > 1 ? `${value.length}` : undefined;
  return (
    <Popover.Root>
      <Trigger label={label} active={value.length > 0} summary={value.length === 1 && render ? undefined : summary} />
      <Panel className="max-h-80 w-60 overflow-y-auto">
        <div role="group" aria-label={label}>
          {options.map((o) => {
            const on = value.includes(o);
            return (
              <button
                key={o}
                role="checkbox"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2"
              >
                <span className={cn("flex size-4 items-center justify-center rounded border", on ? "border-pine bg-pine text-pine-ink" : "border-line-strong")}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                {render ? render(o) : o}
              </button>
            );
          })}
        </div>
        {value.length > 0 && (
          <button onClick={() => onChange([])} className="mt-1 w-full rounded-md border-t border-line px-2 pt-2 pb-1 text-left text-sm text-muted hover:text-ink">
            Clear {label}
          </button>
        )}
      </Panel>
    </Popover.Root>
  );
}

export function SingleFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (v?: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Popover.Root>
      <Trigger label={label} active={!!current} summary={current?.label} />
      <Panel className="max-h-80 w-64 overflow-y-auto">
        {[{ value: "", label: "Any" }, ...options].map((o) => (
          <Popover.Close
            key={o.value || "any"}
            onClick={() => onChange(o.value || undefined)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2"
          >
            {o.label}
            {(value ?? "") === o.value && <Check size={14} className="text-pine" />}
          </Popover.Close>
        ))}
      </Panel>
    </Popover.Root>
  );
}

const PRESETS = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "This Year", days: -1 },
];

function presetRange(days: number) {
  const now = new Date();
  const start = days === -1 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getTime() - (days - 1) * 86_400_000);
  return { from: toDateInput(start), to: toDateInput(now) };
}

export function DateFilter({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from?: string;
  to?: string;
  onChange: (r: { from?: string; to?: string }) => void;
}) {
  const today = toDateInput(new Date());
  const summary = from && to ? `${from} to ${to}` : from ? `From ${from}` : to ? `Until ${to}` : undefined;
  const f = from && fmtShort(from);
  const t = to && fmtShort(to);
  const short = f && t ? `${f} to ${t}` : f ? `from ${f}` : t ? `until ${t}` : undefined;
  const preset = (days: number) => onChange(presetRange(days));
  return (
    <Popover.Root>
      <Trigger label={label} active={!!summary} summary={short} />
      <Panel className="w-72 p-3">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => preset(p.days)} className="rounded-md border border-line px-2 py-1.5 text-sm hover:border-line-strong hover:bg-surface-2">
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            From
            <DateField value={from ?? ""} max={to ?? today} onChange={(v) => onChange({ from: v || undefined, to })} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            To
            <DateField value={to ?? ""} min={from} max={today} onChange={(v) => onChange({ from, to: v || undefined })} />
          </label>
        </div>
        {summary && (
          <p className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted">{summary}</span>
            <button onClick={() => onChange({})} className="text-muted underline-offset-2 hover:text-ink hover:underline">
              Clear
            </button>
          </p>
        )}
      </Panel>
    </Popover.Root>
  );
}

export function ClearFilters({ count, onClear }: { count: number; onClear: () => void }) {
  if (!count) return null;
  return (
    <button onClick={onClear} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:text-ink">
      <X size={14} /> Clear {count > 1 ? `${count} Filters` : "Filter"}
    </button>
  );
}
