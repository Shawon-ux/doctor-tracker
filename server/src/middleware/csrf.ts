import type { NextFunction, Request, Response } from 'express';
import { env, isProd } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
// Outside production any localhost port is accepted, since Next moves to a free port when 3000 is busy.
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const allowed = (origin: string) => env.CLIENT_ORIGIN.includes(origin) || (!isProd && LOCAL.test(origin));

/**
 * Defence in depth on top of SameSite=Lax: state-changing requests must carry a
 * custom header (cross-site forms cannot set one) and, if the browser sends an
 * Origin, it must be a known client.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !allowed(origin)) {
    return next(new HttpError(403, 'bad_origin', 'Request origin not allowed'));
  }
  if (req.get('x-requested-with') !== 'fetch') {
    return next(new HttpError(403, 'csrf', 'Missing request header'));
  }
  next();
}
