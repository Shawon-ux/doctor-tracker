import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { InfoTip } from "./info-tip";

export function Panel({
  title,
  info,
  action,
  className,
  children,
}: {
  title: string;
  info?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface", className)} aria-label={title}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold">{title}</h2>
          {info && <InfoTip label={`About ${title}`}>{info}</InfoTip>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
