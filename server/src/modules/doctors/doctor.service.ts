import { Types } from 'mongoose';
import type { z } from 'zod';
import { Doctor } from '../../models/doctor.js';
import { Patient } from '../../models/patient.js';
import { keywordFilter } from '../../lib/search.js';
import { dateRange, pageMeta, sortSpec } from '../../lib/pagination.js';
import { HttpError, notFound } from '../../lib/http-error.js';
import { DOCTOR_SORTS, type doctorBody, type doctorListQuery, type doctorPatch } from './doctor.schemas.js';

type ListQuery = z.output<typeof doctorListQuery>;

const publicDoctor = <T extends { keywords?: unknown }>({ keywords: _k, ...rest }: T) => rest;

/** Patient counts for a page of doctors in one grouped query on the { doctor, admittedAt } index. */
async function patientCounts(ids: Types.ObjectId[]) {
  if (!ids.length) return new Map<string, { total: number; critical: number }>();
  const rows = await Patient.aggregate<{ _id: Types.ObjectId; total: number; critical: number }>([
    { $match: { doctor: { $in: ids } } },
    {
      $group: {
        _id: '$doctor',
        total: { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$condition', 'critical'] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { total: r.total, critical: r.critical }]));
}

export async function listDoctors(q: ListQuery) {
  const filter = {
    ...keywordFilter(q.q),
    ...(q.specialization?.length ? { specialization: { $in: q.specialization } } : {}),
    ...(q.hospital ? { hospital: q.hospital } : {}),
    ...dateRange('createdAt', q.from, q.to),
  };
  const [items, total] = await Promise.all([
    Doctor.find(filter)
      .sort(sortSpec(q.sort, DOCTOR_SORTS, '-createdAt'))
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);
  const counts = await patientCounts(items.map((d) => d._id));
  return {
    items: items.map((d) => ({ ...d, patients: counts.get(String(d._id)) ?? { total: 0, critical: 0 } })),
    ...pageMeta(q.page, q.limit, total),
  };
}

export async function lookupDoctors(q?: string) {
  return Doctor.find(keywordFilter(q)).select('name specialization hospital').sort({ name: 1 }).limit(20).lean();
}

export async function doctorFacets() {
  const hospitals = await Doctor.distinct('hospital');
  return { hospitals: hospitals.sort() };
}

export async function getDoctor(id: string) {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw notFound('Doctor');
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1));
  const [byCondition, monthly] = await Promise.all([
    Patient.aggregate<{ _id: string; count: number; inCare: number }>([
      { $match: { doctor: doctor._id } },
      { $group: { _id: '$condition', count: { $sum: 1 }, inCare: { $sum: { $cond: [{ $eq: ['$releasedAt', null] }, 1, 0] } } } },
    ]),
    // Served by the { doctor, admittedAt } index.
    Patient.aggregate<{ _id: Date; count: number }>([
      { $match: { doctor: doctor._id, admittedAt: { $gte: since } } },
      { $group: { _id: { $dateTrunc: { date: '$admittedAt', unit: 'month', timezone: 'UTC' } }, count: { $sum: 1 } } },
    ]),
  ]);
  const byMonth = new Map(monthly.map((m) => [new Date(m._id).getTime(), m.count]));
  const trend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + i, 1));
    return { date: d.toISOString(), admissions: byMonth.get(d.getTime()) ?? 0 };
  });
  const total = byCondition.reduce((n, r) => n + r.count, 0);
  const inCare = byCondition.reduce((n, r) => n + r.inCare, 0);
  return { ...doctor, trend, patients: { total, inCare, byCondition: Object.fromEntries(byCondition.map((r) => [r._id, r.count])) } };
}

export async function createDoctor(data: z.output<typeof doctorBody>) {
  const doc = await new Doctor(data).save();
  return publicDoctor(doc.toObject());
}

export async function updateDoctor(id: string, data: z.output<typeof doctorPatch>) {
  const doc = await Doctor.findById(id);
  if (!doc) throw notFound('Doctor');
  doc.set(data);
  await doc.save(); // save() so the keywords hook and validators run
  return publicDoctor(doc.toObject());
}

export async function deleteDoctor(id: string) {
  const _id = new Types.ObjectId(id);
  const assigned = await Patient.countDocuments({ doctor: _id }).limit(1);
  if (assigned) {
    throw new HttpError(409, 'has_patients', 'Move or remove this doctor’s patients before deleting the doctor');
  }
  const res = await Doctor.deleteOne({ _id });
  if (!res.deletedCount) throw notFound('Doctor');
}

export async function assertDoctorExists(id: string | Types.ObjectId) {
  if (!(await Doctor.exists({ _id: id }))) throw new HttpError(400, 'validation_error', 'Doctor does not exist', { doctor: ['Doctor does not exist'] });
}

export async function getDoctorOr404(id: string) {
  if (!(await Doctor.exists({ _id: id }))) throw notFound('Doctor');
}
