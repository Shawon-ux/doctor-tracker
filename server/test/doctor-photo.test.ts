import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { VIEWER, app, doctorInput, signedIn, useDb } from './helpers.js';

useDb();

// Smallest bytes that pass the JPEG signature check.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

async function setup() {
  const admin = await signedIn();
  const id = (await admin.post('/api/v1/doctors', doctorInput()).expect(201)).body._id as string;
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').set('x-requested-with', 'fetch').send({ email: 'admin@test.dev', password: 'CorrectHorse9!' }).expect(200);
  const put = (body: Buffer, type = 'image/jpeg') =>
    agent.put(`/api/v1/doctors/${id}/photo`).set('x-requested-with', 'fetch').set('Content-Type', type).send(body);
  return { admin, id, put, agent };
}

describe('doctor photo (optional)', () => {
  it('works without a photo: doctors are created and listed with no photoAt', async () => {
    const { admin, id } = await setup();
    const list = (await admin.get('/api/v1/doctors').expect(200)).body.items;
    expect(list[0].photoAt).toBeUndefined();
    expect(list[0]).not.toHaveProperty('photo');
    await admin.get(`/api/v1/doctors/${id}/photo`).expect(404);
  });

  it('uploads, serves, lists as photoAt only, and removes a photo', async () => {
    const { admin, id, put } = await setup();
    await put(JPEG).expect(200);

    const res = await admin.get(`/api/v1/doctors/${id}/photo`).expect(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.headers['cache-control']).toContain('max-age');

    const row = (await admin.get('/api/v1/doctors').expect(200)).body.items[0];
    expect(row.photoAt).toBeTruthy();
    expect(row).not.toHaveProperty('photo');
    expect((await admin.get(`/api/v1/doctors/${id}`).expect(200)).body).not.toHaveProperty('photo');

    await admin.del(`/api/v1/doctors/${id}/photo`).expect(204);
    await admin.get(`/api/v1/doctors/${id}/photo`).expect(404);
    expect((await admin.get('/api/v1/doctors').expect(200)).body.items[0].photoAt).toBeUndefined();
  });

  it('rejects non-JPEG bytes, wrong content types and oversized files', async () => {
    const { put } = await setup();
    await put(Buffer.from('not an image at all')).expect(400);
    const noSig = await put(Buffer.alloc(0)).expect(400);
    expect(noSig.body.error.code).toBe('validation_error');
    await put(JPEG, 'image/png').expect(400);
    await put(Buffer.concat([JPEG, Buffer.alloc(310 * 1024)])).expect(413);
  });

  it('lets viewers see photos but not change them', async () => {
    const { admin, id, put } = await setup();
    await put(JPEG).expect(200);
    const viewer = await signedIn(VIEWER);
    await viewer.get(`/api/v1/doctors/${id}/photo`).expect(200);
    await viewer.del(`/api/v1/doctors/${id}/photo`).expect(403);
    await admin.get(`/api/v1/doctors/${id}/photo`).expect(200);
  });
});
