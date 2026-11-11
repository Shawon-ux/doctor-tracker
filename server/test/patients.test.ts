import { describe, expect, it } from 'vitest';
import { doctorInput, patientInput, signedIn, useDb } from './helpers.js';

useDb();

async function setup() {
  const s = await signedIn();
  const doctor = (await s.post('/api/v1/doctors', doctorInput()).expect(201)).body._id as string;
  return { s, doctor };
}

describe('patients', () => {
  it('creates, edits and deletes a patient', async () => {
    const { s, doctor } = await setup();
    const p = (await s.post('/api/v1/patients', patientInput({ doctor })).expect(201)).body;
    const edited = await s.patch(`/api/v1/patients/${p._id}`, { condition: 'critical', age: 55 }).expect(200);
    expect(edited.body).toMatchObject({ condition: 'critical', age: 55 });
    await s.del(`/api/v1/patients/${p._id}`).expect(204);
    await s.get(`/api/v1/patients/${p._id}`).expect(404);
  });

  it('rejects a patient for a doctor that does not exist', async () => {
    const { s } = await setup();
    const res = await s.post('/api/v1/patients', patientInput({ doctor: '64b7f0000000000000000000' })).expect(400);
    expect(res.body.error.details.doctor).toBeDefined();
  });

  it('rejects an admission date in the future', async () => {
    const { s, doctor } = await setup();
    const future = new Date(Date.now() + 86_400_000 * 3).toISOString();
    await s.post('/api/v1/patients', patientInput({ doctor, admittedAt: future })).expect(400);
  });

  it('filters by condition, gender, age and date range', async () => {
    const { s, doctor } = await setup();
    await s.post('/api/v1/patients', patientInput({ doctor, condition: 'critical', admittedAt: '2026-01-10' })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor, condition: 'stable', gender: 'female', age: 30, admittedAt: '2026-03-01' })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor, condition: 'serious', admittedAt: '2026-03-15' })).expect(201);

    expect((await s.get('/api/v1/patients?condition=critical,serious')).body.total).toBe(2);
    expect((await s.get('/api/v1/patients?gender=female')).body.total).toBe(1);
    expect((await s.get('/api/v1/patients?ageMax=40')).body.total).toBe(1);
    expect((await s.get('/api/v1/patients?from=2026-03-01&to=2026-03-01')).body.total).toBe(1);
    await s.get('/api/v1/patients?condition=bogus').expect(400);
  });

  it('filters by the doctor\'s specialty', async () => {
    const { s, doctor } = await setup();
    const neuro = (await s.post('/api/v1/doctors', doctorInput({ specialization: 'Neurology' })).expect(201)).body._id;
    await s.post('/api/v1/patients', patientInput({ doctor })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor: neuro })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor: neuro })).expect(201);
    expect((await s.get('/api/v1/patients?specialization=Neurology')).body.total).toBe(2);
    expect((await s.get(`/api/v1/patients?specialization=Neurology&doctor=${doctor}`)).body.total).toBe(0);
    expect((await s.get('/api/v1/patients?specialization=Cardiology,Neurology')).body.total).toBe(3);
  });

  it('ignores nested query objects', async () => {
    const { s } = await setup();
    const res = await s.get('/api/v1/patients?gender[$ne]=x');
    expect(res.status).toBe(200);
  });
});
