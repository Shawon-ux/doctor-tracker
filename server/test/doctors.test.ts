import { describe, expect, it } from 'vitest';
import { doctorInput, patientInput, signedIn, useDb } from './helpers.js';

useDb();

describe('doctors', () => {
  it('creates, reads and updates a doctor', async () => {
    const s = await signedIn();
    const created = await s.post('/api/v1/doctors', doctorInput()).expect(201);
    expect(created.body.keywords).toBeUndefined();
    const id = created.body._id;
    await s.patch(`/api/v1/doctors/${id}`, { hospital: 'Northgate Medical Centre' }).expect(200);
    const got = await s.get(`/api/v1/doctors/${id}`).expect(200);
    expect(got.body.hospital).toBe('Northgate Medical Centre');
    expect(got.body.patients.total).toBe(0);
    expect(got.body.trend).toHaveLength(12);
  });

  it('validates input and reports field errors', async () => {
    const s = await signedIn();
    const res = await s.post('/api/v1/doctors', { ...doctorInput(), email: 'bad', specialization: 'Wizardry' }).expect(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['email', 'specialization']));
  });

  it('rejects a duplicate email with 409', async () => {
    const s = await signedIn();
    const body = doctorInput({ email: 'dup@example.com' });
    await s.post('/api/v1/doctors', body).expect(201);
    const res = await s.post('/api/v1/doctors', body).expect(409);
    expect(res.body.error.details.email).toBeDefined();
  });

  it('searches by word prefix, filters, and paginates', async () => {
    const s = await signedIn();
    await s.post('/api/v1/doctors', doctorInput({ name: 'Dr. Farhana Kabir', specialization: 'Neurology' })).expect(201);
    await s.post('/api/v1/doctors', doctorInput({ name: 'Dr. Imran Kabir', specialization: 'Oncology' })).expect(201);
    await s.post('/api/v1/doctors', doctorInput({ name: 'Dr. Lina Das', specialization: 'Neurology' })).expect(201);

    const q = await s.get('/api/v1/doctors?q=kab').expect(200);
    expect(q.body.total).toBe(2);
    const multi = await s.get('/api/v1/doctors?q=far%20kab').expect(200);
    expect(multi.body.items.map((d: { name: string }) => d.name)).toEqual(['Dr. Farhana Kabir']);

    const f = await s.get('/api/v1/doctors?specialization=Neurology').expect(200);
    expect(f.body.total).toBe(2);

    const p = await s.get('/api/v1/doctors?limit=2&page=2&sort=name').expect(200);
    expect(p.body).toMatchObject({ page: 2, limit: 2, total: 3, pages: 2 });
    expect(p.body.items).toHaveLength(1);
  });

  it('ignores regex metacharacters in search instead of executing them', async () => {
    const s = await signedIn();
    await s.post('/api/v1/doctors', doctorInput()).expect(201);
    expect((await s.get('/api/v1/doctors?q=(a').expect(200)).body.total).toBe(1);
    expect((await s.get('/api/v1/doctors?q=zz.*').expect(200)).body.total).toBe(0);
  });

  it('manages patients under a doctor and refuses to delete a doctor who has patients', async () => {
    const s = await signedIn();
    const a = (await s.post('/api/v1/doctors', doctorInput()).expect(201)).body._id;
    const b = (await s.post('/api/v1/doctors', doctorInput()).expect(201)).body._id;
    const p = (await s.post(`/api/v1/doctors/${a}/patients`, patientInput()).expect(201)).body;
    expect(p.doctor.name).toBe('Dr. Amina Rahman');

    const list = await s.get(`/api/v1/doctors/${a}/patients`).expect(200);
    expect(list.body.total).toBe(1);
    const listed = await s.get('/api/v1/doctors').expect(200);
    expect(listed.body.items.find((d: { _id: string }) => d._id === a).patients.total).toBe(1);

    await s.del(`/api/v1/doctors/${a}`).expect(409);
    await s.del(`/api/v1/doctors/${b}/patients/${p._id}`).expect(404); // wrong doctor
    await s.del(`/api/v1/doctors/${a}/patients/${p._id}`).expect(204);
    await s.del(`/api/v1/doctors/${a}`).expect(204);
  });

  it('returns 400 for a malformed id and 404 for a missing one', async () => {
    const s = await signedIn();
    await s.get('/api/v1/doctors/not-an-id').expect(400);
    await s.get('/api/v1/doctors/64b7f0000000000000000000').expect(404);
  });
});
