import { cn } from "@/lib/cn";

export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  // Default radius only when the caller sets none, so rounded-full is never overridden.
  <div aria-hidden style={style} className={cn("animate-pulse bg-line/60", !className?.includes("rounded") && "rounded-md", className)} />
);

/** Mirrors the real table: header strip, avatar + two-line cell, then value columns. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <div className="hidden items-center gap-6 border-b border-line bg-surface-2/60 px-4 py-3 md:flex">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-[22%] h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-14" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex w-48 flex-col gap-1.5">
              <Skeleton className="h-3.5" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="ml-auto hidden h-3.5 w-24 md:block" />
            <Skeleton className="hidden h-3.5 w-28 lg:block" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      {action && <Skeleton className="h-9 w-32 rounded-lg" />}
    </div>
  );
}

export function FilterBarSkeleton({ pills = 4 }: { pills?: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Skeleton className="h-9 w-full rounded-lg sm:w-72" />
      {Array.from({ length: pills }, (_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-lg" />
      ))}
    </div>
  );
}

export function ListPageSkeleton({ pills = 4 }: { pills?: number }) {
  return (
    <div role="status" aria-label="Loading page">
      <PageHeaderSkeleton />
      <FilterBarSkeleton pills={pills} />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <TableSkeleton rows={10} />
      </div>
    </div>
  );
}

export function DoctorHeaderSkeleton() {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-line bg-surface" role="status" aria-label="Loading doctor">
      <div className="flex items-center gap-4 p-5">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="ml-auto hidden h-9 w-64 rounded-lg sm:block" />
      </div>
      <div className="grid border-t border-line sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2 border-line px-5 py-3 sm:border-r last:border-r-0">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="grid border-t border-line lg:grid-cols-2">
        <div className="flex flex-col gap-3 border-line px-5 py-4 lg:border-r">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          <Skeleton className="h-4 w-56" />
          <div className="flex h-20 items-end gap-1">
            {[30, 55, 40, 20, 35, 60, 45, 25, 50, 38, 42, 65].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorPageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-20" />
      <DoctorHeaderSkeleton />
      <Skeleton className="mb-3 h-5 w-24" />
      <FilterBarSkeleton />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
