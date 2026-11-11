"use client";

import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Overview } from "@/lib/types";
import { fmtDate, fmtMonth, fmtNumber, fmtShort } from "@/lib/format";
import { cn } from "@/lib/cn";

type Point = Overview["series"][number];

export type SeriesKey = "admissions" | "released" | "critical";
export type Visible = Record<SeriesKey, boolean>;
export const DEFAULT_VISIBLE: Visible = { admissions: true, released: false, critical: true };

const SERIES: { key: SeriesKey; label: string; tipLabel: string; color: string; dashed?: boolean; value: (p: Point) => number }[] = [
  { key: "admissions", label: "Admitted", tipLabel: "Admitted", color: "var(--series)", value: (p) => p.admissions },
  { key: "released", label: "Released", tipLabel: "Released", color: "var(--pine)", dashed: true, value: (p) => p.released },
  { key: "critical", label: "Critical", tipLabel: "Now Critical", color: "var(--c-critical)", value: (p) => p.critical },
];

function Tip({ active, payload, unit, visible }: { active?: boolean; payload?: { payload: Point }[]; unit: Overview["range"]["unit"]; visible: Visible }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  const label = unit === "month" ? fmtMonth(p.date) : unit === "week" ? `Week of ${fmtShort(p.date)}` : fmtDate(p.date);
  return (
    <div className="min-w-44 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      {SERIES.filter((x) => visible[x.key]).map((x) => (
        <p key={x.key} className="flex items-center gap-2 py-0.5">
          <span className="size-2 rounded-full" style={{ background: x.color }} />
          <span className="flex-1">{x.tipLabel}</span>
          <span className="num font-medium">{fmtNumber(x.value(p))}</span>
        </p>
      ))}
      <p className="mt-1.5 border-t border-line pt-1.5 text-xs text-faint">Click to list these admissions</p>
    </div>
  );
}

/** Last calendar day of the bucket that starts at `iso` (UTC, matching the API's buckets). */
function bucketEnd(iso: string, unit: Overview["range"]["unit"]) {
  const d = new Date(iso);
  if (unit === "week") d.setUTCDate(d.getUTCDate() + 6);
  if (unit === "month") d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

export function AdmissionsChart({ data, visible }: { data: Overview; visible: Visible }) {
  const router = useRouter();
  const unit = data.range.unit;
  const open = (iso?: unknown) => {
    if (typeof iso !== "string") return;
    router.push(`/patients?from=${iso.slice(0, 10)}&to=${bucketEnd(iso, unit)}`);
  };
  const tick = (iso: string) => (unit === "month" ? fmtMonth(iso) : fmtShort(iso));
  return (
    <div className="h-[260px] w-full px-2 pb-3 sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.series}
          margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
          onClick={(s) => {
            const i = Number(s?.activeTooltipIndex ?? s?.activeIndex);
            open(Number.isInteger(i) ? data.series[i]?.date : s?.activeLabel);
          }}
          style={{ cursor: "pointer" }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tickFormatter={tick}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            minTickGap={24}
            tickMargin={8}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} width={44} />
          <Tooltip content={<Tip unit={unit} visible={visible} />} cursor={{ stroke: "var(--line-strong)" }} />
          <Area hide={!visible.admissions} type="monotone" dataKey="admissions" stroke="var(--series)" strokeWidth={2} fill="var(--series)" fillOpacity={0.08} isAnimationActive={false} />
          <Line hide={!visible.released} type="monotone" dataKey="released" stroke="var(--pine)" strokeWidth={1.75} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          <Line hide={!visible.critical} type="monotone" dataKey="critical" stroke="var(--c-critical)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legend doubles as the series toggle. The last visible series cannot be hidden. */
export function ChartLegend({ visible, onChange }: { visible: Visible; onChange: (v: Visible) => void }) {
  const shown = SERIES.filter((x) => visible[x.key]).length;
  return (
    <div role="group" aria-label="Lines shown" className="flex flex-wrap items-center gap-1">
      {SERIES.map((x) => {
        const on = visible[x.key];
        return (
          <button
            key={x.key}
            type="button"
            aria-pressed={on}
            disabled={on && shown === 1}
            title={on ? `Hide ${x.label.toLowerCase()}` : `Show ${x.label.toLowerCase()}`}
            onClick={() => onChange({ ...visible, [x.key]: !on })}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors disabled:cursor-default",
              on ? "text-ink hover:bg-surface-2" : "text-faint line-through decoration-faint/60 hover:bg-surface-2 hover:text-muted",
            )}
          >
            <span
              aria-hidden
              className={cn("w-3", x.dashed ? "h-0 border-t-2 border-dashed" : "h-0.5 rounded", !on && "opacity-40")}
              style={x.dashed ? { borderColor: x.color } : { background: x.color }}
            />
            {x.label}
          </button>
        );
      })}
    </div>
  );
}
