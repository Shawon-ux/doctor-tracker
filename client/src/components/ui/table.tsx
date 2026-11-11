import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const th = "px-4 py-2.5 text-left text-sm font-medium text-muted whitespace-nowrap";
export const td = "px-4 py-3 align-middle";

export function SortHeader({
  field,
  sort,
  onSort,
  children,
  className,
}: {
  field: string;
  sort: string;
  onSort: (s: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sort.replace(/^-/, "") === field;
  const desc = sort.startsWith("-");
  return (
    <th className={cn(th, className)} aria-sort={active ? (desc ? "descending" : "ascending") : "none"}>
      <button onClick={() => onSort(active && !desc ? `-${field}` : field)} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>
        {children}
        {active && (desc ? <ArrowDown size={13} /> : <ArrowUp size={13} />)}
      </button>
    </th>
  );
}

export function Avatar({ name, tone = "pine" }: { name: string; tone?: "pine" | "series" }) {
  const letters = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tone === "pine" ? "bg-pine-soft text-pine" : "bg-series-soft text-series",
      )}
    >
      {letters}
    </span>
  );
}
