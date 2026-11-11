import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../../models/user.js';
import { parse } from '../../middleware/validate.js';
import { HttpError } from '../../lib/http-error.js';
import { clearSession, issueSession, requireAuth } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

const loginSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(200),
});

// Compared against when the email is unknown so response time does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) =>
    next(new HttpError(429, 'rate_limited', 'Too many sign-in attempts. Try again in 15 minutes')),
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');

  user.lastLoginAt = new Date();
  await user.save();
  issueSession(res, { id: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  // Revokes this token and any copies of it, not just the browser cookie.
  await User.updateOne({ _id: req.user!.id }, { $inc: { tokenVersion: 1 } });
  clearSession(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
