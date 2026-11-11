import Link from "next/link";
import type { Overview } from "@/lib/types";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { fmtRelative } from "@/lib/format";

export function RecentAdmissions({ data }: { data: Overview }) {
  return (
    <ul className="divide-y divide-line">
      {data.recent.map((p) => (
        <li key={p._id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-5 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_6rem] sm:items-center">
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-sm text-muted">{p.diagnosis}</p>
          </div>
          <Link href={`/doctors/${p.doctor._id}`} className="hidden truncate text-sm text-muted hover:text-ink hover:underline sm:block">
            {p.doctor.name}
          </Link>
          <div className="row-span-2 self-center sm:row-span-1">
            <ConditionBadge condition={p.condition} />
          </div>
          <p className="text-sm text-faint sm:text-right">{fmtRelative(p.admittedAt)}</p>
        </li>
      ))}
    </ul>
  );
}
