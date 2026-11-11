/** Only same-site relative paths, so `?next=` cannot bounce the user to another site. */
export const safeNext = (v: string | null | undefined) =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
