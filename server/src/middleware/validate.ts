import { z } from 'zod';
import { HttpError } from '../lib/http-error.js';

/** Parses untrusted input. Unknown keys are stripped, so operator objects never reach a query. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new HttpError(400, 'validation_error', 'Some fields are invalid', z.flattenError(r.error).fieldErrors);
  }
  return r.data;
}
