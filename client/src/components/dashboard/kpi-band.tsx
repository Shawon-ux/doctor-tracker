import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Overview } from "@/lib/types";
import { fmtNumber, pctChange } from "@/lib/format";
import { InfoTip } from "@/components/ui/info-tip";
import { cn } from "@/lib/cn";
import { rangeLabel } from "./range-switch";

function Cell({ label, info, children, className }: { label: string; info: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex min-w-0 flex-col gap-1 px-5 py-4", className)}>
      <div className="flex items-center gap-1 text-sm text-muted">
        {label}
        <InfoTip label={`About ${label}`}>{info}</InfoTip>
      </div>
      {children}
    </div>
  );
}

/**
 * One band, read left to right by importance: total load, who is critical, then capacity.
 * The headline cell is the only one with weight; the rest stay quiet.
 */
export function KpiBand({ data }: { data: Overview }) {
  const t = data.totals;
  const change = pctChange(t.admissions, t.admissionsPrev);
  const up = (change ?? 1) >= 0;
  const criticalShare = t.patients ? ((t.critical / t.patients) * 100).toFixed(1) : "0";

  return (
    <section aria-label="Key figures" className="grid overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr] [&>*]:border-line">
      <Cell
        label="Patients"
        info="All patients on record across every doctor, in care or released. The line below counts admissions and releases in the selected range; the arrow compares admissions with the range before it."
        className="border-b sm:col-span-3 xl:col-span-1 xl:border-r xl:border-b-0"
      >
        <div aria-hidden className="recorder-paper pointer-events-none absolute inset-0" />
        <p className="num relative text-2xl leading-none font-semibold tracking-tight">{fmtNumber(t.patients)}</p>
        <p className="relative mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {/* One inline run of text, so the flex gap applies only between it and the change badge. */}
          <span>
            <span className="num font-medium text-ink">+{fmtNumber(t.admissions)}</span> admitted,{" "}
            <span className="num font-medium text-ink">{fmtNumber(t.released)}</span> released,{" "}
            {data.range.key === "custom" ? "in this range" : rangeLabel(data.range.key).toLowerCase()}
          </span>
          {change !== null && change !== 0 && (
            <span className={cn("num inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium", up ? "bg-pine-soft text-pine" : "bg-danger-soft text-danger")}>
              {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(change)}%
            </span>
          )}
        </p>
      </Cell>

      <Cell
        label="Critical Now"
        info="Patients whose current condition is Critical. Select to see the list."
        className="border-b sm:border-r sm:border-b-0"
      >
        <Link href="/patients?condition=critical" className="group">
          <p className="num text-xl leading-tight font-semibold text-danger group-hover:underline group-hover:underline-offset-4">
            {fmtNumber(t.critical)}
          </p>
          <p className="num text-sm text-muted">{criticalShare}% of patients</p>
        </Link>
      </Cell>

      <Cell label="Doctors" info="Doctors registered in the system." className="border-b sm:border-r sm:border-b-0">
        <p className="num text-xl leading-tight font-semibold">{fmtNumber(t.doctors)}</p>
        <p className="text-sm text-muted">
          <span className="num">{t.avgPerDoctor}</span> patients each on average
        </p>
      </Cell>

      <Cell label="In Care Now" info="Patients admitted and not yet released. Average stay covers patients released in the selected range, from admission to release.">
        <Link href="/patients?status=in_care" className="group">
          <p className="num text-xl leading-tight font-semibold group-hover:underline group-hover:underline-offset-4">{fmtNumber(t.inCare)}</p>
          <p className="text-sm text-muted">
            {t.avgStayDays === null ? "No releases in range" : <>Average stay <span className="num">{t.avgStayDays}</span> days</>}
          </p>
        </Link>
      </Cell>
    </section>
  );
}
