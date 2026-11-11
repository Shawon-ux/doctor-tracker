import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.js';
import { Doctor } from '../src/models/doctor.js';
import { Patient } from '../src/models/patient.js';

export const app = createApp();
export const ADMIN = { email: 'admin@test.dev', password: 'CorrectHorse9!' };
export const VIEWER = { email: 'viewer@test.dev', password: 'ReadOnlyHorse9!' };

let mongo: MongoMemoryServer;

export function useDb() {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Patient.syncIndexes()]);
  });
  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);
    await User.create([
      { name: 'Admin', email: ADMIN.email, passwordHash: await bcrypt.hash(ADMIN.password, 4) },
      { name: 'Viewer', email: VIEWER.email, role: 'viewer', passwordHash: await bcrypt.hash(VIEWER.password, 4) },
    ]);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
}

/** A supertest agent that keeps the session cookie and sends the CSRF header. */
export async function signedIn(as: typeof ADMIN = ADMIN) {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').set('x-requested-with', 'fetch').send(as).expect(200);
  return {
    get: (url: string) => agent.get(url),
    post: (url: string, body?: object) => agent.post(url).set('x-requested-with', 'fetch').send(body),
    patch: (url: string, body: object) => agent.patch(url).set('x-requested-with', 'fetch').send(body),
    del: (url: string) => agent.delete(url).set('x-requested-with', 'fetch'),
  };
}

export const doctorInput = (over: Partial<Record<string, string>> = {}) => ({
  name: 'Dr. Amina Rahman',
  specialization: 'Cardiology',
  hospital: 'Riverside General Hospital',
  phone: '+880 1711 000000',
  email: `amina${Math.random().toString(36).slice(2, 8)}@example.com`,
  ...over,
});

export const patientInput = (over: Record<string, unknown> = {}) => ({
  name: 'Karim Hossain',
  age: 54,
  gender: 'male',
  phone: '+880 1811 111111',
  condition: 'stable',
  diagnosis: 'Hypertension',
  ...over,
});
