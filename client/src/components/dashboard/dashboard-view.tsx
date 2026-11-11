"use client";

import Link from "next/link";
import { useOverview } from "@/hooks/queries";
import { useUrlState } from "@/hooks/use-url-state";
import type { Range } from "@/lib/types";
import { PageHeader } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";
import { FetchBar } from "@/components/ui/fetch-bar";
import { useMinDelay } from "@/hooks/use-min-delay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/format";
import { KpiBand } from "./kpi-band";
import { AdmissionsChart, ChartLegend, DEFAULT_VISIBLE, type Visible } from "./admissions-chart";
import { useState } from "react";
import { ConditionMix } from "./condition-mix";
import { DoctorLoad } from "./doctor-load";
import { SpecialtyChart } from "./specialty-chart";
import { RecentAdmissions } from "./recent-admissions";
import { RangeSwitch, rangeLabel } from "./range-switch";

const RANGES: Range[] = ["7d", "30d", "90d", "12m"];

export function DashboardView() {
  const url = useUrlState();
  const raw = url.get("range") as Range | undefined;
  const from = url.get("from");
  const to = url.get("to");
  const custom = from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) ? { from, to } : undefined;
  const range: Range | "custom" = custom ? "custom" : raw && RANGES.includes(raw) ? raw : "30d";
  const { data, isPending, isError, refetch, isPlaceholderData } = useOverview(custom ?? { range: range as Range });
  const ready = useMinDelay();
  const [lines, setLines] = useState<Visible>(DEFAULT_VISIBLE);

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          <RangeSwitch
            value={range}
            custom={custom}
            onChange={(r) => url.set({ range: r === "30d" ? undefined : r, from: undefined, to: undefined })}
            onCustom={(c) => url.set({ range: undefined, from: c.from, to: c.to })}
          />
        }
      >
        <p className="mt-1 text-muted">
          {/* A custom range shows the exact days picked; the API's UTC bounds could read as the next day locally. */}
          {custom
            ? `${rangeLabel(range)}, ${fmtDate(custom.from)} to ${fmtDate(custom.to)}`
            : data
              ? `${rangeLabel(range)}, ${fmtDate(data.range.from)} to ${fmtDate(data.range.to)}`
              : rangeLabel(range)}
        </p>
      </PageHeader>

      {isError ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center">
          <p className="font-medium">Dashboard Figures Did Not Load</p>
          <p className="mt-1 text-sm text-muted">The API may be unreachable. Your data is safe.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : isPending || !ready ? (
        <DashboardSkeleton />
      ) : (
        <div className={cn("relative flex animate-[fade_240ms_ease-out] flex-col gap-4 transition-opacity lg:gap-5", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
          <FetchBar active={isPlaceholderData} />
          <KpiBand data={data} />

          <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="Admissions and Releases"
              info="Patients admitted (blue) and released (dashed green, off by default) per day for 7D and 30D, per week for 90D, per month for 12M. The red line counts admitted patients who are critical now. Select a point to list that period's admissions. Select a legend item to show or hide its line."
              action={<ChartLegend visible={lines} onChange={setLines} />}
            >
              <AdmissionsChart data={data} visible={lines} />
            </Panel>
            <Panel title="Condition Mix" info="Current condition of every patient on record, most to least urgent. Released means the patient has left care. Select a row to filter the patient list.">
              <ConditionMix data={data} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            <Panel
              title="Patients per Doctor"
              info="The eight doctors with the most patients on record. Red shows how many of those are critical."
              action={
                <Link href="/doctors?sort=-createdAt" className="text-sm text-muted hover:text-ink">
                  All Doctors
                </Link>
              }
            >
              <DoctorLoad data={data} />
            </Panel>
            <Panel title="Patients by Specialty" info="All patients on record grouped by their doctor’s specialty. Top ten shown. Select a bar to list those patients.">
              <SpecialtyChart data={data} />
            </Panel>
          </div>

          <Panel
            title="Latest Admissions"
            action={
              <Link href="/patients" className="text-sm text-muted hover:text-ink">
                All Patients
              </Link>
            }
          >
            <RecentAdmissions data={data} />
          </Panel>
        </div>
      )}
    </>
  );
}

export function DashboardPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <DashboardSkeleton />
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:gap-5" role="status" aria-label="Loading dashboard">
      <div className="grid overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("flex flex-col gap-2.5 border-line px-5 py-4", i === 0 ? "border-b sm:col-span-3 xl:col-span-1 xl:border-r xl:border-b-0" : i < 3 ? "border-b sm:border-r sm:border-b-0" : "")}>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className={i === 0 ? "h-10 w-32" : "h-7 w-16"} />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:gap-5 xl:grid-cols-[2fr_1fr]">
        <PanelSkeleton title="w-24">
          <div className="flex h-[260px] items-end gap-1.5 px-5 pb-5 sm:h-[300px]">
            {[38, 52, 30, 61, 45, 70, 48, 57, 40, 66, 74, 50, 62, 80, 58, 68].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </PanelSkeleton>
        <PanelSkeleton title="w-28">
          <div className="px-5 pb-5">
            <Skeleton className="mt-2 h-3 rounded-full" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <Skeleton className="size-2.5 rounded-sm" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="ml-auto h-3.5 w-10" />
              </div>
            ))}
          </div>
        </PanelSkeleton>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <PanelSkeleton title="w-36">
          <div className="flex flex-col gap-4 px-5 pt-1 pb-5">
            {[92, 88, 80, 76, 70, 66, 60, 55].map((w, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-1.5 rounded-full" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </PanelSkeleton>
        <PanelSkeleton title="w-40">
          <div className="flex flex-col gap-3 px-5 pt-1 pb-5">
            {[95, 82, 78, 60, 58, 46, 42, 35, 30, 28].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24 shrink-0" />
                <Skeleton className="h-4 rounded-sm" style={{ width: `${w * 0.7}%` }} />
              </div>
            ))}
          </div>
        </PanelSkeleton>
      </div>
    </div>
  );
}

function PanelSkeleton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="px-5 pt-4 pb-3">
        <Skeleton className={cn("h-4", title)} />
      </div>
      {children}
    </div>
  );
}
