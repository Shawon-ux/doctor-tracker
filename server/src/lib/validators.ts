import { z } from 'zod';
import { Types } from 'mongoose';

export const objectId = z.string().refine((v) => Types.ObjectId.isValid(v) && /^[a-f\d]{24}$/i.test(v), 'Invalid id');
export const idParams = z.object({ id: objectId });

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number');

export const personName = z.string().trim().min(2, 'At least 2 characters').max(80);

/** Accepts YYYY-MM-DD or ISO. A bare date as `to` means end of that day. */
export const dateFrom = z.coerce.date().optional();
export const dateTo = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Invalid date' });
      return z.NEVER;
    }
    return d;
  });

export const csv = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : undefined))
    .pipe(z.array(z.enum(values)).max(values.length).optional());
