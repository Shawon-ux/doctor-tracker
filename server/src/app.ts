import express, { Router } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requireAuth, writeRequiresAdmin } from './middleware/auth.js';
import { csrfGuard } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminRouter } from './modules/admins/admin.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import { patientRouter } from './modules/patients/patient.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');
  app.set('query parser', 'simple'); // no nested objects from ?a[b]=c

  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1;
    res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db });
  });

  const api = Router();
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  api.use(csrfGuard);
  api.use('/auth', authRouter);
  api.use(requireAuth, writeRequiresAdmin);
  api.use('/admins', adminRouter);
  api.use('/doctors', doctorRouter);
  api.use('/patients', patientRouter);
  api.use('/stats', statsRouter);

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
