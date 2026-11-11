import { z } from 'zod';
import { CARE_CONDITIONS, CONDITIONS, GENDERS, SPECIALIZATIONS } from '../../models/constants.js';
import { paginationSchema } from '../../lib/pagination.js';
import { csv, dateFrom, dateTo, objectId, personName, phone } from '../../lib/validators.js';

const notInFuture = z.coerce
  .date()
  .refine((d) => d.getTime() <= Date.now() + 60_000, 'Admission date cannot be in the future');

export const patientBody = z.object({
  name: personName,
  age: z.coerce.number().int('Whole years only').min(0).max(120),
  gender: z.enum(GENDERS),
  phone,
  email: z.union([z.email('Enter a valid email').max(254), z.literal('')]).optional(),
  condition: z.enum(CARE_CONDITIONS, 'Use Release to mark a patient released'),
  diagnosis: z.string().trim().min(2, 'At least 2 characters').max(160),
  notes: z.string().trim().max(1000).optional(),
  admittedAt: notInFuture.optional(),
  doctor: objectId,
});

export const patientUnderDoctorBody = patientBody.omit({ doctor: true });
export const patientPatch = patientBody.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const PATIENT_SORTS = ['admittedAt', 'releasedAt', 'name', 'age', 'condition'] as const;

export const releaseBody = z.object({ releasedAt: notInFuture.optional() });

export const patientListQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  condition: csv(CONDITIONS),
  gender: z.enum(GENDERS).optional(),
  doctor: objectId.optional(),
  specialization: csv(SPECIALIZATIONS),
  status: z.enum(['in_care', 'released']).optional(),
  ageMin: z.coerce.number().int().min(0).max(120).optional(),
  ageMax: z.coerce.number().int().min(0).max(120).optional(),
  from: dateFrom,
  to: dateTo,
  sort: z.string().max(30).optional(),
});
