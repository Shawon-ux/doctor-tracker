"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtNumber } from "@/lib/format";
import { PAGE_SIZES } from "@/lib/constants";

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
  onLimit,
  noun,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
  noun: string;
}) {
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
      <p className="num">
        {fmtNumber(from)}–{fmtNumber(to)} of {fmtNumber(total)} {noun}
      </p>
      <div className="flex items-center gap-3">
        <label className="hidden items-center gap-2 sm:flex">
          Rows
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="h-8 rounded-md border border-line bg-surface px-2 text-sm text-ink"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-ink disabled:opacity-40"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="num min-w-16 text-center text-ink">
            {page} / {pages}
          </span>
          <button
            className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-ink disabled:opacity-40"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
