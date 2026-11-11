import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';
import { User, type Role } from '../models/user.js';
import { HttpError } from '../lib/http-error.js';

export const SESSION_COOKIE = 'dt_session';

type TokenPayload = { sub: string; role: Role; v: number };

export type AuthUser = { id: string; name: string; email: string; role: Role };

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function issueSession(res: Response, user: { id: string; role: Role; tokenVersion: number }) {
  const token = jwt.sign({ role: user.role, v: user.tokenVersion } satisfies Omit<TokenPayload, 'sub'>, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: `${env.JWT_TTL_HOURS}h`,
    algorithm: 'HS256',
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: env.JWT_TTL_HOURS * 3600 * 1000,
  });
}

export const clearSession = (res: Response) =>
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string') return next(new HttpError(401, 'unauthenticated', 'Sign in to continue'));

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return next(new HttpError(401, 'session_expired', 'Your session has expired. Sign in again'));
  }

  // One indexed lookup per request lets logout and role changes take effect immediately.
  const user = await User.findById(payload.sub).select('name email role tokenVersion').lean();
  if (!user || user.tokenVersion !== payload.v) {
    return next(new HttpError(401, 'session_expired', 'Your session has expired. Sign in again'));
  }
  req.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
}

export const requireRole =
  (...roles: AuthUser['role'][]) =>
  (req: Request, _res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new HttpError(403, 'forbidden', 'You do not have access to this action'));

const READ = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Every signed-in role can read. Only admins can create, change or delete. */
export const writeRequiresAdmin = (req: Request, res: Response, next: NextFunction) =>
  READ.has(req.method) ? next() : requireRole('admin')(req, res, next);
