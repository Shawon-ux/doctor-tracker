import { describe, expect, it } from 'vitest';
import { doctorInput, patientInput, signedIn, useDb } from './helpers.js';

useDb();

describe('stats', () => {
  it('aggregates totals, conditions, per-doctor load and a continuous series', async () => {
    const s = await signedIn();
    const a = (await s.post('/api/v1/doctors', doctorInput({ name: 'Dr. Busy' })).expect(201)).body._id;
    const b = (await s.post('/api/v1/doctors', doctorInput({ name: 'Dr. Quiet' })).expect(201)).body._id;
    for (let i = 0; i < 3; i++) await s.post('/api/v1/patients', patientInput({ doctor: a, condition: i ? 'stable' : 'critical' })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor: b })).expect(201);

    const res = await s.get('/api/v1/stats/overview?range=7d').expect(200);
    expect(res.body.totals).toMatchObject({ doctors: 2, patients: 4, critical: 1, avgPerDoctor: 2, admissions: 4 });
    expect(res.body.topDoctors[0]).toMatchObject({ name: 'Dr. Busy', patients: 3, critical: 1 });
    expect(res.body.series).toHaveLength(7);
    expect(res.body.series.reduce((n: number, x: { admissions: number }) => n + x.admissions, 0)).toBe(4);
    expect(res.body.conditions.map((c: { condition: string }) => c.condition)).toEqual([
      'critical', 'serious', 'stable', 'recovering', 'released',
    ]);
  });

  it('accepts a custom range and picks the bucket size from its length', async () => {
    const s = await signedIn();
    const doctor = (await s.post('/api/v1/doctors', doctorInput()).expect(201)).body._id;
    await s.post('/api/v1/patients', patientInput({ doctor, admittedAt: '2026-02-10' })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor, admittedAt: '2026-02-20' })).expect(201);
    await s.post('/api/v1/patients', patientInput({ doctor, admittedAt: '2026-03-05' })).expect(201);

    const feb = await s.get('/api/v1/stats/overview?from=2026-02-01&to=2026-02-28').expect(200);
    expect(feb.body.range).toMatchObject({ key: 'custom', unit: 'day' });
    expect(feb.body.series).toHaveLength(28);
    expect(feb.body.totals.admissions).toBe(2);

    const quarter = await s.get('/api/v1/stats/overview?from=2026-01-01&to=2026-03-31').expect(200);
    expect(quarter.body.range.unit).toBe('week');
    expect(quarter.body.totals.admissions).toBe(3);

    const year = await s.get('/api/v1/stats/overview?from=2025-06-01&to=2026-05-31').expect(200);
    expect(year.body.range.unit).toBe('month');
  });

  it('validates custom ranges', async () => {
    const s = await signedIn();
    await s.get('/api/v1/stats/overview?from=2026-03-01').expect(400);
    await s.get('/api/v1/stats/overview?from=2026-03-01&to=2026-02-01').expect(400);
    await s.get('/api/v1/stats/overview?from=2020-01-01&to=2026-01-01').expect(400);
    await s.get('/api/v1/stats/overview?from=2099-01-01&to=2099-01-02').expect(400);
  });

  it('rejects an unknown range', async () => {
    const s = await signedIn();
    await s.get('/api/v1/stats/overview?range=forever').expect(400);
  });
});
