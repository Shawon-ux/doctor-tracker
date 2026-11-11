import Link from "next/link";
import type { Overview } from "@/lib/types";
import { CONDITION_META } from "@/lib/constants";
import { fmtNumber } from "@/lib/format";

/** Severity is ordinal, so a single ordered bar reads better than a pie. */
export function ConditionMix({ data }: { data: Overview }) {
  const total = data.conditions.reduce((n, c) => n + c.count, 0) || 1;
  return (
    <div className="px-5 pb-5">
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label="Patients by condition">
        {data.conditions.map((c) =>
          c.count ? <div key={c.condition} style={{ width: `${(c.count / total) * 100}%`, background: CONDITION_META[c.condition].color }} /> : null,
        )}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {data.conditions.map((c) => {
          const m = CONDITION_META[c.condition];
          return (
            <li key={c.condition}>
              <Link href={`/patients?condition=${c.condition}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-surface-2">
                <span className="size-2.5 rounded-sm" style={{ background: m.color }} aria-hidden />
                <span className="flex-1">{m.label}</span>
                <span className="num font-medium">{fmtNumber(c.count)}</span>
                <span className="num w-12 text-right text-sm text-muted">{((c.count / total) * 100).toFixed(0)}%</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
