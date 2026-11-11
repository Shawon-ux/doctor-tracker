import { CONDITION_META } from "@/lib/constants";
import type { Condition } from "@/lib/types";

export function ConditionBadge({ condition }: { condition: Condition }) {
  const m = CONDITION_META[condition];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap" title={m.hint}>
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ background: m.color, boxShadow: condition === "critical" ? `0 0 0 3px color-mix(in srgb, ${m.color} 22%, transparent)` : undefined }}
      />
      {m.label}
    </span>
  );
}
