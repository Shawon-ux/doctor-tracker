import { describe, expect, it } from 'vitest';
import { ADMIN, VIEWER, signedIn, useDb } from './helpers.js';

useDb();

const newAdmin = { name: 'Second Admin', email: 'Second@Test.dev', password: 'AnotherHorse99!' };

describe('admin management', () => {
  it('lets an admin add, list, sign in as, and remove another admin', async () => {
    const admin = await signedIn();
    const created = await admin.post('/api/v1/admins', newAdmin).expect(201);
    expect(created.body.email).toBe('second@test.dev');
    expect(created.body).not.toHaveProperty('passwordHash');

    const list = (await admin.get('/api/v1/admins').expect(200)).body.items;
    expect(list.map((a: { email: string }) => a.email)).toEqual(['admin@test.dev', 'second@test.dev']);

    const second = await signedIn({ email: 'second@test.dev', password: newAdmin.password });
    await second.get('/api/v1/admins').expect(200);

    await admin.del(`/api/v1/admins/${created.body.id}`).expect(204);
    await second.get('/api/v1/admins').expect(401); // their session died with the account
  });

  it('rejects duplicates and weak passwords', async () => {
    const admin = await signedIn();
    await admin.post('/api/v1/admins', newAdmin).expect(201);
    await admin.post('/api/v1/admins', newAdmin).expect(409);
    await admin.post('/api/v1/admins', { ...newAdmin, email: 'x@test.dev', password: 'short' }).expect(400);
  });

  it('refuses to remove yourself', async () => {
    const admin = await signedIn();
    const me = (await admin.get('/api/v1/auth/me').expect(200)).body.user.id;
    const res = await admin.del(`/api/v1/admins/${me}`).expect(409);
    expect(res.body.error.code).toBe('self_delete');
  });

  it('keeps viewers out entirely', async () => {
    const viewer = await signedIn(VIEWER);
    await viewer.get('/api/v1/admins').expect(403);
    await viewer.post('/api/v1/admins', newAdmin).expect(403);
  });

  it('does not touch viewers through the admin endpoint', async () => {
    const admin = await signedIn();
    const list = (await admin.get('/api/v1/admins').expect(200)).body.items;
    expect(list.some((a: { email: string }) => a.email === ADMIN.email)).toBe(true);
    expect(list.some((a: { email: string }) => a.email === VIEWER.email)).toBe(false);
  });
});
