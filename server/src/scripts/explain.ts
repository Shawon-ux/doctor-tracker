/**
 * Prints the MongoDB query plan for each list, search and dashboard query the API runs,
 * as a Markdown table. Run against seeded data: npm run explain
 */
import { writeFileSync } from 'node:fs';
import type { Types } from 'mongoose';
import { connectDb, disconnectDb } from '../db.js';
import { Doctor } from '../models/doctor.js';
import { Patient } from '../models/patient.js';
import { keywordFilter, toKeywords } from '../lib/search.js';

type Row = { name: string; index: string; keys: number; docs: number; returned: number; ms: number };

/** Walks any explain shape (classic or SBE, find or aggregate) and collects what matters. */
function summarise(plan: unknown) {
  const indexes = new Set<string>();
  let keys = 0, docs = 0, returned = 0, ms = 0, collscan = false;
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    if (typeof o.indexName === 'string') indexes.add(o.indexName);
    if (o.stage === 'COLLSCAN') collscan = true;
    if (typeof o.totalKeysExamined === 'number') keys = Math.max(keys, o.totalKeysExamined);
    if (typeof o.totalDocsExamined === 'number') docs = Math.max(docs, o.totalDocsExamined);
    if (typeof o.executionTimeMillis === 'number') ms = Math.max(ms, o.executionTimeMillis);
    if (typeof o.nReturned === 'number' && 'executionTimeMillis' in o) returned = Math.max(returned, o.nReturned);
    for (const [k, v] of Object.entries(o)) if (k !== 'rejectedPlans') walk(v);
  };
  walk(plan);
  return { index: indexes.size ? [...indexes].join(', ') : collscan ? 'COLLSCAN' : 'none', keys, docs, returned, ms };
}

const rows: Row[] = [];
async function run(name: string, explain: Promise<unknown>) {
  rows.push({ name, ...summarise(await explain) });
}

await connectDb();
try {
  const patients = await Patient.estimatedDocumentCount();
  const doctors = await Doctor.estimatedDocumentCount();
  if (!patients) throw new Error('No data. Run `npm run seed` first.');

  const sample = await Doctor.findOne().sort({ _id: 1 }).lean();
  const word = toKeywords(sample!.name).find((w) => w !== 'dr')!.slice(0, 3);
  const pageIds = (await Doctor.find().sort({ createdAt: -1 }).limit(10).select('_id').lean()).map((d) => d._id as Types.ObjectId);
  const since = new Date(Date.now() - 30 * 86_400_000);
  const ex = 'executionStats';

  await run('Doctors: default page (newest first)', Doctor.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).explain(ex));
  await run(`Doctors: search "${word}"`, Doctor.find(keywordFilter(word)).sort({ createdAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Doctors: filter by specialty', Doctor.find({ specialization: { $in: ['Cardiology'] } }).sort({ createdAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Doctors: patient counts for one page', Patient.aggregate([{ $match: { doctor: { $in: pageIds } } }, { $group: { _id: '$doctor', n: { $sum: 1 } } }]).explain(ex));
  await run('Patients: default page (latest admitted)', Patient.find({}).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: deep page 100 (skip 990)', Patient.find({}).sort({ admittedAt: -1, _id: -1 }).skip(990).limit(10).explain(ex));
  await run('Patients: search "hyper"', Patient.find(keywordFilter('hyper')).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: condition = critical', Patient.find({ condition: { $in: ['critical'] } }).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: one doctor\'s list', Patient.find({ doctor: sample!._id }).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: admitted in last 30 days', Patient.find({ admittedAt: { $gte: since } }).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: critical + last 30 days', Patient.find({ condition: { $in: ['critical'] }, admittedAt: { $gte: since } }).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Patients: in care only', Patient.find({ releasedAt: null }).sort({ admittedAt: -1, _id: -1 }).limit(10).explain(ex));
  await run('Dashboard: releases per day, 30 days', Patient.aggregate([
    { $match: { releasedAt: { $gte: since } } },
    { $group: { _id: { $dateTrunc: { date: '$releasedAt', unit: 'day' } }, n: { $sum: 1 } } },
  ]).explain(ex));
  await run('Dashboard: admissions per day, 30 days', Patient.aggregate([
    { $match: { admittedAt: { $gte: since } } },
    { $group: { _id: { $dateTrunc: { date: '$admittedAt', unit: 'day' } }, n: { $sum: 1 } } },
  ]).explain(ex));

  const table = [
    `Plans on ${doctors} doctors and ${patients} patients (\`npm run explain\`).`,
    '',
    '| Query | Index used | Keys examined | Docs examined | Returned | ms |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
    ...rows.map((r) => `| ${r.name} | \`${r.index}\` | ${r.keys} | ${r.docs} | ${r.returned || ''} | ${r.ms} |`),
  ].join('\n');
  console.log(table);
  if (process.argv.includes('--write')) writeFileSync('../docs/query-plans.md', `# Query plans\n\n${table}\n`);
} finally {
  await disconnectDb();
}
