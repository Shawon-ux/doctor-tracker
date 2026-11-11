import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN, app, signedIn, useDb } from './helpers.js';

useDb();
const csrf = { 'x-requested-with': 'fetch' };

describe('auth', () => {
  it('rejects unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/v1/doctors');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthenticated');
  });

  it('sets an httpOnly, SameSite=Lax session cookie on login', async () => {
    const res = await request(app).post('/api/v1/auth/login').set(csrf).send(ADMIN).expect(200);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/dt_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'admin' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('gives the same error for unknown email and wrong password', async () => {
    const a = await request(app).post('/api/v1/auth/login').set(csrf).send({ ...ADMIN, password: 'nope' });
    const b = await request(app).post('/api/v1/auth/login').set(csrf).send({ email: 'ghost@test.dev', password: 'nope' });
    expect(a.status).toBe(401);
    expect(b.body).toEqual(a.body);
  });

  it('blocks mutating requests without the CSRF header or from a foreign origin', async () => {
    await request(app).post('/api/v1/auth/login').send(ADMIN).expect(403);
    await request(app).post('/api/v1/auth/login').set(csrf).set('origin', 'https://evil.example').send(ADMIN).expect(403);
  });

  it('rejects operator injection in the login body', async () => {
    await request(app).post('/api/v1/auth/login').set(csrf).send({ email: { $ne: null }, password: { $ne: null } }).expect(400);
  });

  it('revokes the token on logout, even if the cookie is replayed', async () => {
    const login = await request(app).post('/api/v1/auth/login').set(csrf).send(ADMIN);
    const cookie = login.headers['set-cookie']!;
    await request(app).get('/api/v1/auth/me').set('cookie', cookie).expect(200);
    await request(app).post('/api/v1/auth/logout').set(csrf).set('cookie', cookie).expect(204);
    await request(app).get('/api/v1/auth/me').set('cookie', cookie).expect(401);
  });

  it('rejects a tampered token', async () => {
    await request(app).get('/api/v1/auth/me').set('cookie', 'dt_session=eyJhbGciOiJub25lIn0.e30.').expect(401);
  });

  it('returns the current user', async () => {
    const s = await signedIn();
    const res = await s.get('/api/v1/auth/me').expect(200);
    expect(res.body.user.email).toBe(ADMIN.email);
  });
});
