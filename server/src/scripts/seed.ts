/**
 * Seeds an admin, a read-only viewer, and realistic demo data.
 *   npm run seed            create admin only if data exists, else admin + demo data
 *   npm run seed -- --reset wipe doctors and patients first
 */
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { connectDb, disconnectDb } from '../db.js';
import { User, type Role } from '../models/user.js';
import { Doctor } from '../models/doctor.js';
import { Patient } from '../models/patient.js';
import { CARE_CONDITIONS, SPECIALIZATIONS, type CareCondition } from '../models/constants.js';
import { toKeywords } from '../lib/search.js';
import { HOSPITALS, bdPhone, doctorEmail, patientDisplayName, personName, personalEmail, type Sex } from './bd-data.js';

faker.seed(2026);



const DIAGNOSES: Record<string, string[]> = {
  Cardiology: ['Hypertension', 'Atrial fibrillation', 'Angina', 'Heart failure', 'Myocardial infarction'],
  Dermatology: ['Psoriasis', 'Eczema', 'Cellulitis', 'Acne vulgaris'],
  Endocrinology: ['Type 2 diabetes', 'Hypothyroidism', 'Diabetic ketoacidosis', 'Graves disease'],
  ENT: ['Chronic sinusitis', 'Tonsillitis', 'Otitis media', 'Vertigo'],
  Gastroenterology: ['Gastritis', 'Peptic ulcer', 'Hepatitis B', 'Crohn disease', 'Acute pancreatitis'],
  'General Medicine': ['Dengue fever', 'Typhoid', 'Chikungunya', 'Viral fever', 'Anaemia', 'Urinary tract infection'],
  Gynecology: ['PCOS', 'Endometriosis', 'Pre-eclampsia', 'Uterine fibroids'],
  Nephrology: ['Chronic kidney disease', 'Acute kidney injury', 'Nephrotic syndrome'],
  Neurology: ['Migraine', 'Ischaemic stroke', 'Epilepsy', 'Parkinson disease'],
  Oncology: ['Breast cancer', 'Lung cancer', 'Lymphoma', 'Colorectal cancer'],
  Ophthalmology: ['Cataract', 'Glaucoma', 'Diabetic retinopathy'],
  Orthopedics: ['Femur fracture', 'Osteoarthritis', 'Lumbar disc herniation', 'ACL tear'],
  Pediatrics: ['Bronchiolitis', 'Acute watery diarrhoea', 'Pneumonia', 'Measles', 'Neonatal jaundice'],
  Psychiatry: ['Major depressive disorder', 'Generalised anxiety', 'Bipolar disorder'],
  Pulmonology: ['Asthma', 'COPD', 'Pneumonia', 'Tuberculosis'],
  Urology: ['Kidney stones', 'Benign prostatic hyperplasia', 'Urinary retention'],
};

const CONDITION_WEIGHTS: Record<CareCondition, number> = { critical: 8, serious: 16, stable: 44, recovering: 32 };
const DAY = 86_400_000;

const pickCondition = () =>
  faker.helpers.weightedArrayElement(CARE_CONDITIONS.map((c) => ({ value: c, weight: CONDITION_WEIGHTS[c] })));

/** Admissions skew recent, so the trend chart shows growth instead of flat noise. */
const admissionDate = (maxDaysAgo: number) =>
  new Date(Date.now() - Math.floor(maxDaysAgo * Math.pow(faker.number.float({ min: 0, max: 1 }), 1.6)) * DAY - faker.number.int({ min: 0, max: DAY - 1 }));

/** Typical stay in days by condition on arrival. */
const STAY: Record<CareCondition, [number, number]> = {
  critical: [7, 30],
  serious: [5, 20],
  stable: [2, 10],
  recovering: [3, 14],
};

/**
 * Most patients leave once their stay runs out and become Released.
 * About one in ten are long-stay and still in care whatever their admission date.
 */
function outcome(admittedAt: Date) {
  const condition = pickCondition();
  const [min, max] = STAY[condition];
  const leaves = new Date(admittedAt.getTime() + faker.number.float({ min, max }) * DAY);
  if (leaves.getTime() < Date.now() && faker.number.int(100) >= 10) {
    return { condition: 'released' as const, releasedAt: leaves };
  }
  return { condition, releasedAt: null };
}

async function ensureUser(role: Role, name: string, emailVar: string, passwordVar: string, required: boolean) {
  const email = process.env[emailVar]?.toLowerCase();
  const password = process.env[passwordVar];
  if (!email || !password) {
    if (required) throw new Error(`Set ${emailVar} and ${passwordVar} in server/.env`);
    return;
  }
  if (password.length < 10) throw new Error(`${passwordVar} must be 10+ characters`);
  const passwordHash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { email },
    { $set: { passwordHash, role }, $setOnInsert: { name, email }, $inc: { tokenVersion: 1 } },
    { upsert: true },
  );
  console.log(`${role} ready: ${email}`);
}

async function seedDemo() {
  const now = Date.now();
  const usedEmails = new Set<string>();
  const doctors = Array.from({ length: 28 }, (_, i) => {
    const sex: Sex = faker.datatype.boolean(0.45) ? 'female' : 'male';
    const { first, last } = personName(sex);
    const specialization = SPECIALIZATIONS[i % SPECIALIZATIONS.length]!;
    const h = faker.helpers.arrayElement(HOSPITALS);
    const hospital = h.name;
    // Doctor email is unique: a repeat name at the same hospital gets a number.
    let email = doctorEmail(first, last, h.domain);
    for (let n = 2; usedEmails.has(email); n++) email = doctorEmail(first, last, h.domain).replace('@', `${n}@`);
    usedEmails.add(email);
    const createdAt = new Date(now - faker.number.int({ min: 5, max: 540 }) * DAY);
    const name = `Dr. ${first} ${last}`;
    return {
      name,
      specialization,
      hospital,
      phone: bdPhone(),
      email,
      keywords: toKeywords(name, hospital, specialization, email.split('@')[0]),
      createdAt,
      updatedAt: createdAt,
    };
  });
  const inserted = await Doctor.insertMany(doctors, { timestamps: false });

  // Uneven load per doctor so "patients per doctor" says something.
  const weights = inserted.map(() => faker.number.int({ min: 1, max: 10 }));
  const patients = Array.from({ length: 1600 }, () => {
    const i = faker.helpers.weightedArrayElement(weights.map((w, idx) => ({ value: idx, weight: w })));
    const doc = inserted[i]!;
    const gender: Sex = faker.helpers.arrayElement(['female', 'male'] as const);
    const { first, last } = personName(gender);
    const name = patientDisplayName(first, last, gender);
    const diagnosis = faker.helpers.arrayElement(DIAGNOSES[doc.specialization] ?? ['Observation']);
    const phone = bdPhone();
    const admittedAt = admissionDate(420);
    const age = doc.specialization === 'Pediatrics' ? faker.number.int({ min: 0, max: 16 }) : faker.number.int({ min: 17, max: 92 });
    return {
      name,
      age,
      gender: faker.number.int(100) < 2 ? 'other' : gender,
      phone,
      email: faker.datatype.boolean(0.6) ? personalEmail(first, last) : undefined,
      ...outcome(admittedAt),
      diagnosis,
      doctor: doc._id,
      admittedAt,
      keywords: toKeywords(name, diagnosis, phone.replace(/\D/g, '')),
      createdAt: admittedAt,
      updatedAt: admittedAt,
    };
  });
  await Patient.insertMany(patients, { timestamps: false });
  console.log(`Seeded ${inserted.length} doctors and ${patients.length} patients`);
}

await connectDb();
try {
  await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);
  await ensureUser('admin', 'Clinic Admin', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', true);
  await ensureUser('viewer', 'Ward Viewer', 'VIEWER_EMAIL', 'VIEWER_PASSWORD', false);
  if (process.argv.includes('--reset')) {
    await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);
  }
  if ((await Doctor.estimatedDocumentCount()) === 0) await seedDemo();
  else console.log('Doctors already exist, skipping demo data. Use --reset to replace it.');
} finally {
  await disconnectDb();
}
