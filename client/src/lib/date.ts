/** "2026-11-05" -> "05-11-2026" */
export const isoToDmy = (iso: string) => (iso ? iso.split("-").reverse().join("-") : "");

/** "05-11-2026" -> "2026-11-05", or "" if it is not a real calendar date. */
export function dmyToIso(dmy: string) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy);
  if (!m) return "";
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  const ok = date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d);
  return ok ? `${y}-${mo}-${d}` : "";
}
