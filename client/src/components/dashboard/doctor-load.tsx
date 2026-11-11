import Link from "next/link";
import type { Overview } from "@/lib/types";
import { fmtNumber } from "@/lib/format";

export function DoctorLoad({ data }: { data: Overview }) {
  const max = Math.max(1, ...data.topDoctors.map((d) => d.patients));
  if (!data.topDoctors.length) return <p className="px-5 pb-5 text-sm text-muted">No patients assigned yet.</p>;
  return (
    <ol className="px-3 pb-3">
      {data.topDoctors.map((d) => (
        <li key={d.id}>
          <Link href={`/doctors/${d.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-2 py-2 hover:bg-surface-2">
            <span className="min-w-0 truncate">
              <span className="font-medium">{d.name}</span>
              <span className="ml-2 text-sm text-muted">{d.specialization}</span>
            </span>
            <span className="num text-right font-medium">
              {fmtNumber(d.patients)}
              {d.critical > 0 && <span className="ml-2 text-sm font-normal text-danger">{d.critical} critical</span>}
            </span>
            <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-pine" style={{ width: `${(d.patients / max) * 100}%` }} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
