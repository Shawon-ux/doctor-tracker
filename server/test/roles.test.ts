import { describe, expect, it } from 'vitest';
import { VIEWER, doctorInput, patientInput, signedIn, useDb } from './helpers.js';

useDb();

describe('viewer role', () => {
  it('can read everything but cannot create, change or delete', async () => {
    const admin = await signedIn();
    const doctor = (await admin.post('/api/v1/doctors', doctorInput()).expect(201)).body._id;
    const patient = (await admin.post('/api/v1/patients', patientInput({ doctor })).expect(201)).body._id;

    const viewer = await signedIn(VIEWER);
    expect((await viewer.get('/api/v1/auth/me').expect(200)).body.user.role).toBe('viewer');
    await viewer.get('/api/v1/doctors').expect(200);
    await viewer.get(`/api/v1/doctors/${doctor}`).expect(200);
    await viewer.get('/api/v1/patients').expect(200);
    await viewer.get('/api/v1/stats/overview').expect(200);

    const denied = await viewer.post('/api/v1/doctors', doctorInput()).expect(403);
    expect(denied.body.error.code).toBe('forbidden');
    await viewer.patch(`/api/v1/doctors/${doctor}`, { hospital: 'X Hospital' }).expect(403);
    await viewer.del(`/api/v1/doctors/${doctor}`).expect(403);
    await viewer.post(`/api/v1/doctors/${doctor}/patients`, patientInput()).expect(403);
    await viewer.patch(`/api/v1/patients/${patient}`, { age: 1 }).expect(403);
    await viewer.del(`/api/v1/patients/${patient}`).expect(403);
    await viewer.del(`/api/v1/doctors/${doctor}/patients/${patient}`).expect(403);

    await admin.get(`/api/v1/patients/${patient}`).expect(200);
  });

  it('can still sign out', async () => {
    const viewer = await signedIn(VIEWER);
    await viewer.post('/api/v1/auth/logout').expect(204);
  });
});
