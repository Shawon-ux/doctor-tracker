import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'not_found', 'Route not found'));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
    return res.status(400).json({ error: { code: 'validation_error', message: 'Some fields are invalid', details } });
  }
  if (typeof err === 'object' && err && 'code' in err && err.code === 11000) {
    const field = Object.keys((err as { keyPattern?: object }).keyPattern ?? {})[0] ?? 'field';
    return res.status(409).json({
      error: { code: 'duplicate', message: `That ${field} is already in use`, details: { [field]: ['Already in use'] } },
    });
  }
  if (typeof err === 'object' && err && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'bad_json', message: 'Malformed JSON body' } });
  }
  if (typeof err === 'object' && err && 'type' in err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'too_large', message: 'Request body too large' } });
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side' } });
}
