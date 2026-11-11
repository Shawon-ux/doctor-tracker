import type { z } from "zod";
import { ApiError } from "./api";

export type FieldErrors = Record<string, string | undefined>;

/** First message per field, from either client-side zod or the API's 400/409 details. */
export function toFieldErrors(err: unknown): FieldErrors {
  if (err instanceof ApiError && err.details) {
    return Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v[0]]));
  }
  return {};
}

export function zodErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    out[k] ??= issue.message;
  }
  return out;
}
