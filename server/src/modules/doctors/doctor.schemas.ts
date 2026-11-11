import { z } from 'zod';
import { SPECIALIZATIONS } from '../../models/constants.js';
import { paginationSchema } from '../../lib/pagination.js';
import { csv, dateFrom, dateTo, personName, phone } from '../../lib/validators.js';

export const doctorBody = z.object({
  name: personName,
  specialization: z.enum(SPECIALIZATIONS),
  hospital: z.string().trim().min(2, 'At least 2 characters').max(120),
  phone,
  email: z.email('Enter a valid email').max(254),
});

export const doctorPatch = doctorBody.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const DOCTOR_SORTS = ['createdAt', 'name', 'specialization', 'hospital'] as const;

export const doctorListQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  specialization: csv(SPECIALIZATIONS),
  hospital: z.string().trim().max(120).optional(),
  from: dateFrom,
  to: dateTo,
  sort: z.string().max(30).optional(),
});

export const lookupQuery = z.object({ q: z.string().trim().max(100).optional() });
