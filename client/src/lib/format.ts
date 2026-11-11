const nf = new Intl.NumberFormat("en");
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" });
const rel = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const fmtNumber = (n: number) => nf.format(n);
/** A bare YYYY-MM-DD is a calendar day, so read it in local time; anything else is an instant. */
const toDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
};

export const fmtDate = (iso: string) => dateFmt.format(toDate(iso));
export const fmtShort = (iso: string) => shortFmt.format(toDate(iso));
export const fmtMonth = (iso: string) => monthFmt.format(new Date(iso));

export function fmtRelative(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 3600) return rel.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rel.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rel.format(Math.round(diff / 86400), "day");
  return fmtDate(iso);
}

/** Whole days between two dates (end defaults to now). */
export function daysBetween(fromIso: string, toIso?: string | null) {
  const end = toIso ? new Date(toIso).getTime() : Date.now();
  return Math.max(0, Math.floor((end - new Date(fromIso).getTime()) / 86_400_000));
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Length of stay in words: "same day", "1 day", "7 days". */
export const stay = (days: number) => (days === 0 ? "same day" : plural(days, "day"));

export function pctChange(now: number, prev: number) {
  if (!prev) return now ? null : 0;
  return Math.round(((now - prev) / prev) * 100);
}

/** YYYY-MM-DD in local time, for <input type="date">. */
export const toDateInput = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
