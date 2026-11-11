"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DoctorDetail } from "@/lib/types";
import { fmtMonth, fmtNumber } from "@/lib/format";

/** Twelve monthly bars; the current, still-filling month is drawn lighter. */
export function DoctorTrend({ trend }: { trend: DoctorDetail["trend"] }) {
  const last = trend.length - 1;
  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={3}>
          <XAxis dataKey="date" hide />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as DoctorDetail["trend"][number] | undefined;
              return active && p ? (
                <div className="min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
                  <p className="mb-1 text-xs font-medium text-muted">{fmtMonth(p.date)}</p>
                  <p className="flex items-center justify-between gap-4">
                    Admitted <span className="num font-medium">{fmtNumber(p.admissions)}</span>
                  </p>
                </div>
              ) : null;
            }}
          />
          <Bar
            dataKey="admissions"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
            shape={(props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => (
              <rect
                x={props.x}
                y={props.y}
                width={props.width}
                height={Math.max(0, props.height ?? 0)}
                rx={2}
                fill="var(--pine)"
                opacity={props.index === last ? 0.45 : 1}
              />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
