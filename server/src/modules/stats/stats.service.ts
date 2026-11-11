import { Doctor } from '../../models/doctor.js';
import { Patient } from '../../models/patient.js';
import { CONDITIONS } from '../../models/constants.js';

export const RANGES = ['7d', '30d', '90d', '12m'] as const;
export type Range = (typeof RANGES)[number];

type Unit = 'day' | 'week' | 'month';
const SPEC: Record<Range, { days: number; unit: Unit }> = {
  '7d': { days: 7, unit: 'day' },
  '30d': { days: 30, unit: 'day' },
  '90d': { days: 91, unit: 'week' },
  '12m': { days: 365, unit: 'month' },
};
const DAY = 86_400_000;

function startOf(unit: Unit, d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (unit === 'week') x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // ISO week starts Monday
  if (unit === 'month') x.setUTCDate(1);
  return x;
}

function step(unit: Unit, d: Date) {
  const x = new Date(d);
  if (unit === 'day') x.setUTCDate(x.getUTCDate() + 1);
  else if (unit === 'week') x.setUTCDate(x.getUTCDate() + 7);
  else x.setUTCMonth(x.getUTCMonth() + 1);
  return x;
}

export const MAX_CUSTOM_DAYS = 731;

export type Window = { key: Range | 'custom'; from: Date; end: Date; unit: Unit };

/** Bucket size that keeps a custom chart readable: days up to a month, weeks up to ~4 months, then months. */
const unitFor = (days: number): Unit => (days <= 31 ? 'day' : days <= 120 ? 'week' : 'month');

/** A preset range ends now. A custom range runs from the start of `from` to the end of `to` (or now, if sooner). */
export function resolveWindow(q: { range?: Range; from?: Date; to?: Date }): Window {
  const now = new Date();
  if (q.from && q.to) {
    const end = new Date(Math.min(q.to.getTime(), now.getTime()));
    const days = Math.ceil((end.getTime() - q.from.getTime()) / DAY);
    const unit = unitFor(days);
    return { key: 'custom', from: startOf(unit, q.from), end, unit };
  }
  const key = q.range ?? '30d';
  const { days, unit } = SPEC[key];
  return { key, from: startOf(unit, new Date(now.getTime() - (days - 1) * DAY)), end: now, unit };
}

/** Every dashboard figure in one round of parallel, index-backed queries. Dates are bucketed in UTC. */
export async function overview(w: Window) {
  const { unit, from } = w;
  const now = w.end;
  // The comparison period is the same length, immediately before.
  const prevFrom = new Date(from.getTime() - (now.getTime() - from.getTime()));

  const [doctors, patients, conditionRows, current, previous, series, topDoctors, specialties, recent, inCare, releaseSeries] =
    await Promise.all([
      Doctor.estimatedDocumentCount(),
      Patient.estimatedDocumentCount(),
      Patient.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$condition', count: { $sum: 1 } } }]),
      Patient.countDocuments({ admittedAt: { $gte: from, $lte: now } }),
      Patient.countDocuments({ admittedAt: { $gte: prevFrom, $lt: from } }),
      Patient.aggregate<{ _id: Date; count: number; critical: number }>([
        { $match: { admittedAt: { $gte: from, $lte: now } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$admittedAt', unit, startOfWeek: 'monday', timezone: 'UTC' } },
            count: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$condition', 'critical'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Patient.aggregate([
        {
          $group: {
            _id: '$doctor',
            patients: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$condition', 'critical'] }, 1, 0] } },
          },
        },
        { $sort: { patients: -1, _id: 1 } },
        { $limit: 8 },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'd', pipeline: [{ $project: { name: 1, specialization: 1 } }] } },
        { $unwind: '$d' },
        { $project: { _id: 0, id: '$_id', name: '$d.name', specialization: '$d.specialization', patients: 1, critical: 1 } },
      ]),
      Patient.aggregate([
        { $group: { _id: '$doctor', patients: { $sum: 1 } } },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'd', pipeline: [{ $project: { specialization: 1 } }] } },
        { $unwind: '$d' },
        { $group: { _id: '$d.specialization', patients: { $sum: '$patients' } } },
        { $sort: { patients: -1 } },
        { $project: { _id: 0, specialization: '$_id', patients: 1 } },
      ]),
      Patient.find().sort({ admittedAt: -1, _id: -1 }).limit(6).select('name condition diagnosis admittedAt releasedAt doctor').populate('doctor', 'name').lean(),
      Patient.countDocuments({ releasedAt: null }),
      // Served by { releasedAt, admittedAt, _id }: a range on the leading key.
      Patient.aggregate<{ _id: Date; count: number; stayMs: number }>([
        { $match: { releasedAt: { $gte: from, $lte: now } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$releasedAt', unit, startOfWeek: 'monday', timezone: 'UTC' } },
            count: { $sum: 1 },
            stayMs: { $sum: { $subtract: ['$releasedAt', '$admittedAt'] } },
          },
        },
      ]),
    ]);

  // Fill empty buckets so the chart's x-axis is continuous.
  const byBucket = new Map(series.map((s) => [new Date(s._id).getTime(), s]));
  const outBucket = new Map(releaseSeries.map((s) => [new Date(s._id).getTime(), s.count]));
  const released = releaseSeries.reduce((n, s) => n + s.count, 0);
  const stayMs = releaseSeries.reduce((n, s) => n + s.stayMs, 0);
  const buckets = [];
  for (let t = from; t <= now; t = step(unit, t)) {
    const hit = byBucket.get(t.getTime());
    buckets.push({ date: t.toISOString(), admissions: hit?.count ?? 0, released: outBucket.get(t.getTime()) ?? 0, critical: hit?.critical ?? 0 });
  }

  const counts = Object.fromEntries(conditionRows.map((r) => [r._id, r.count]));
  return {
    range: { key: w.key, from: from.toISOString(), to: now.toISOString(), unit },
    totals: {
      doctors,
      patients,
      critical: counts.critical ?? 0,
      avgPerDoctor: doctors ? Math.round((patients / doctors) * 10) / 10 : 0,
      admissions: current,
      admissionsPrev: previous,
      inCare,
      released,
      avgStayDays: released ? Math.round((stayMs / released / DAY) * 10) / 10 : null,
    },
    conditions: CONDITIONS.map((c) => ({ condition: c, count: counts[c] ?? 0 })),
    series: buckets,
    topDoctors,
    specialties,
    recent,
  };
}
