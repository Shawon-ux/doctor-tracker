"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Overview } from "@/lib/types";
import { fmtNumber } from "@/lib/format";

export function SpecialtyChart({ data }: { data: Overview }) {
  const router = useRouter();
  const rows = data.specialties.slice(0, 10);
  return (
    <div className="w-full px-2 pb-4" style={{ height: Math.max(160, rows.length * 30 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="specialization"
            width={128}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="min-w-40 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
                  <p className="mb-1 text-xs font-medium text-muted">{(payload[0].payload as { specialization: string }).specialization}</p>
                  <p className="flex items-center justify-between gap-4">
                    Patients <span className="num font-medium">{fmtNumber(payload[0].value as number)}</span>
                  </p>
                  <p className="mt-1.5 border-t border-line pt-1.5 text-xs text-faint">Click to list them</p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="patients"
            fill="var(--series)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            cursor="pointer"
            onClick={(entry: { payload?: { specialization?: string } }) => {
              const s = entry?.payload?.specialization;
              if (s) router.push(`/patients?specialization=${encodeURIComponent(s)}`);
            }}
            label={{ position: "right", fill: "var(--ink)", fontSize: 12, formatter: (v: unknown) => fmtNumber(Number(v)) }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
