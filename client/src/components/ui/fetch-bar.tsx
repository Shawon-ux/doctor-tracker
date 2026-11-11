/** Thin indeterminate bar along the top edge of a panel while its data refreshes. */
export function FetchBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-pine/10">
      <span className="block h-full w-1/3 animate-[nav-progress_900ms_ease-in-out_infinite] bg-pine" />
    </span>
  );
}
