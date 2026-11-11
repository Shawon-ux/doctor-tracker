import { describe, expect, it } from 'vitest';
import { VIEWER, doctorInput, patientInput, signedIn, useDb } from './helpers.js';

useDb();

async function setup() {
  const s = await signedIn();
  const doctor = (await s.post('/api/v1/doctors', doctorInput()).expect(201)).body._id as string;
  const p = (await s.post('/api/v1/patients', patientInput({ doctor, condition: 'serious', admittedAt: '2026-01-10' })).expect(201)).body;
  return { s, doctor, p };
}

describe('release', () => {
  it('releases a patient and can readmit', async () => {
    const { s, p } = await setup();
    expect(p.releasedAt).toBeNull();
    const out = await s.post(`/api/v1/patients/${p._id}/release`, { releasedAt: '2026-01-20' }).expect(200);
    expect(out.body.condition).toBe('released');
    expect(out.body.releasedAt).toMatch(/^2026-01-20/);
    await s.post(`/api/v1/patients/${p._id}/release`, {}).expect(409);

    const back = await s.post(`/api/v1/patients/${p._id}/readmit`).expect(200);
    expect(back.body).toMatchObject({ releasedAt: null, condition: 'stable' });
    await s.post(`/api/v1/patients/${p._id}/readmit`).expect(409);
  });

  it('rejects a release before admission or in the future', async () => {
    const { s, p } = await setup();
    const before = await s.post(`/api/v1/patients/${p._id}/release`, { releasedAt: '2026-01-01' }).expect(400);
    expect(before.body.error.details.releasedAt).toBeDefined();
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await s.post(`/api/v1/patients/${p._id}/release`, { releasedAt: future }).expect(400);
  });

  it('filters by status', async () => {
    const { s, doctor, p } = await setup();
    await s.post('/api/v1/patients', patientInput({ doctor })).expect(201);
    await s.post(`/api/v1/patients/${p._id}/release`, {}).expect(200);
    expect((await s.get('/api/v1/patients?status=in_care')).body.total).toBe(1);
    expect((await s.get('/api/v1/patients?status=released')).body.total).toBe(1);
    expect((await s.get(`/api/v1/doctors/${doctor}`)).body.patients).toMatchObject({ total: 2, inCare: 1 });
    await s.get('/api/v1/patients?status=gone').expect(400);
  });

  it('counts releases and length of stay on the dashboard', async () => {
    const { s, doctor } = await setup();
    const admitted = new Date(Date.now() - 4 * 86_400_000).toISOString();
    const q = (await s.post('/api/v1/patients', patientInput({ doctor, admittedAt: admitted })).expect(201)).body;
    await s.post(`/api/v1/patients/${q._id}/release`, {}).expect(200);
    const res = await s.get('/api/v1/stats/overview?range=7d').expect(200);
    expect(res.body.totals).toMatchObject({ released: 1, inCare: 1 });
    expect(res.body.totals.avgStayDays).toBeCloseTo(4, 0);
    expect(res.body.series.reduce((n: number, b: { released: number }) => n + b.released, 0)).toBe(1);
  });

  it('cannot be set or changed by hand', async () => {
    const { s, doctor, p } = await setup();
    await s.post('/api/v1/patients', patientInput({ doctor, condition: 'released' })).expect(400);
    await s.post(`/api/v1/patients/${p._id}/release`, {}).expect(200);
    const res = await s.patch(`/api/v1/patients/${p._id}`, { condition: 'critical' }).expect(409);
    expect(res.body.error.code).toBe('released');
    await s.patch(`/api/v1/patients/${p._id}`, { diagnosis: 'Asthma' }).expect(200);
  });

  it('is admin only', async () => {
    const { p } = await setup();
    const viewer = await signedIn(VIEWER);
    await viewer.post(`/api/v1/patients/${p._id}/release`, {}).expect(403);
    await viewer.post(`/api/v1/patients/${p._id}/readmit`).expect(403);
  });
});
