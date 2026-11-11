import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../middleware/validate.js';
import { dateFrom, dateTo } from '../../lib/validators.js';
import { MAX_CUSTOM_DAYS, overview, RANGES, resolveWindow } from './stats.service.js';

const query = z
  .object({ range: z.enum(RANGES).optional(), from: dateFrom, to: dateTo })
  .refine((q) => !q.from === !q.to, { message: 'Send both from and to', path: ['to'] })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'Start must be on or before end', path: ['from'] })
  .refine((q) => !q.from || q.from.getTime() <= Date.now(), { message: 'Start cannot be in the future', path: ['from'] })
  .refine((q) => !q.from || !q.to || q.to.getTime() - q.from.getTime() <= MAX_CUSTOM_DAYS * 86_400_000, {
    message: `Choose a range of ${MAX_CUSTOM_DAYS} days or less`,
    path: ['to'],
  });

export const statsRouter = Router();

statsRouter.get('/overview', async (req, res) => {
  res.set('Cache-Control', 'private, max-age=30');
  res.json(await overview(resolveWindow(parse(query, req.query))));
});
