import { Types } from 'mongoose';
import type { z } from 'zod';
import { Patient } from '../../models/patient.js';
import { Doctor } from '../../models/doctor.js';
import { keywordFilter } from '../../lib/search.js';
import { dateRange, pageMeta, sortSpec } from '../../lib/pagination.js';
import { HttpError, notFound } from '../../lib/http-error.js';
import { assertDoctorExists } from '../doctors/doctor.service.js';
import { PATIENT_SORTS, type releaseBody, type patientBody, type patientListQuery, type patientPatch } from './patient.schemas.js';

type ListQuery = z.output<typeof patientListQuery>;
type ReleaseInput = z.output<typeof releaseBody>;
const DOCTOR_FIELDS = 'name specialization hospital';

export async function listPatients(q: ListQuery) {
  const age: Record<string, number> = {};
  if (q.ageMin !== undefined) age.$gte = q.ageMin;
  if (q.ageMax !== undefined) age.$lte = q.ageMax;

  // Specialty lives on the doctor: resolve it to doctor ids (small, indexed) so the patient query stays on its { doctor } index.
  let doctorIds: Types.ObjectId[] | undefined;
  if (q.specialization?.length) {
    doctorIds = await Doctor.find({ specialization: { $in: q.specialization } }).distinct('_id');
    if (q.doctor) doctorIds = doctorIds.filter((id) => id.equals(q.doctor!));
  } else if (q.doctor) {
    doctorIds = [new Types.ObjectId(q.doctor)];
  }

  const filter = {
    ...keywordFilter(q.q),
    ...(q.condition?.length ? { condition: { $in: q.condition } } : {}),
    ...(q.gender ? { gender: q.gender } : {}),
    ...(doctorIds ? { doctor: doctorIds.length === 1 ? doctorIds[0] : { $in: doctorIds } } : {}),
    ...(Object.keys(age).length ? { age } : {}),
    ...dateRange('admittedAt', q.from, q.to),
    ...(q.status === 'in_care' ? { releasedAt: null } : q.status === 'released' ? { releasedAt: { $ne: null } } : {}),
  };
  const [items, total] = await Promise.all([
    Patient.find(filter)
      .sort(sortSpec(q.sort, PATIENT_SORTS, '-admittedAt'))
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('doctor', DOCTOR_FIELDS)
      .lean(),
    Patient.countDocuments(filter),
  ]);
  return { items, ...pageMeta(q.page, q.limit, total) };
}

export async function getPatient(id: string) {
  const p = await Patient.findById(id).populate('doctor', DOCTOR_FIELDS).lean();
  if (!p) throw notFound('Patient');
  return p;
}

const clean = <T extends { email?: string }>(d: T) => (d.email === '' ? { ...d, email: undefined } : d);

export async function createPatient(data: z.output<typeof patientBody>) {
  await assertDoctorExists(data.doctor);
  const doc = await new Patient(clean(data)).save();
  return getPatient(doc.id);
}

export async function updatePatient(id: string, data: z.output<typeof patientPatch>, scopeDoctor?: string) {
  const doc = await Patient.findOne({ _id: id, ...(scopeDoctor ? { doctor: scopeDoctor } : {}) });
  if (!doc) throw notFound('Patient');
  if (data.doctor && String(doc.doctor) !== data.doctor) await assertDoctorExists(data.doctor);
  if (doc.releasedAt && data.condition) {
    throw new HttpError(409, 'released', 'Readmit the patient before changing their condition', { condition: ['Readmit first'] });
  }
  doc.set(clean(data));
  await doc.save();
  return getPatient(id);
}

/** `scopeDoctor` limits the delete to that doctor's list, so a mismatched pair is a 404 rather than a silent delete. */
export async function deletePatient(id: string, scopeDoctor?: string) {
  const res = await Patient.deleteOne({ _id: id, ...(scopeDoctor ? { doctor: scopeDoctor } : {}) });
  if (!res.deletedCount) throw notFound('Patient');
}

export async function releasePatient(id: string, data: ReleaseInput) {
  const doc = await Patient.findById(id);
  if (!doc) throw notFound('Patient');
  if (doc.releasedAt) throw new HttpError(409, 'already_released', 'This patient is already released');
  // Leaving care means released; the dashboard counts released patients that way.
  doc.set({ releasedAt: data.releasedAt ?? new Date(), condition: 'released' });
  await doc.save(); // runs the "not before admission" validator
  return getPatient(id);
}

export async function readmitPatient(id: string) {
  const doc = await Patient.findById(id);
  if (!doc) throw notFound('Patient');
  if (!doc.releasedAt) throw new HttpError(409, 'in_care', 'This patient is already in care');
  // Back in care, so no longer released. Stable until someone records otherwise.
  doc.set({ releasedAt: null, condition: 'stable' });
  await doc.save();
  return getPatient(id);
}
