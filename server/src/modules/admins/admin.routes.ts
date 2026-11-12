import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../../models/user.js';
import { parse } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/auth.js';
import { HttpError, notFound } from '../../lib/http-error.js';
import { idParams, personName } from '../../lib/validators.js';

const adminBody = z.object({
  name: personName,
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(10, 'At least 10 characters').max(200),
});

const toDto = (u: { _id: unknown; name: string; email: string; createdAt?: Date; lastLoginAt?: Date | null }) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt ?? null,
});

/** Every admin can list, add and remove admins. Viewers get 403 even on reads. */
export const adminRouter = Router();
adminRouter.use(requireRole('admin'));

adminRouter.get('/', async (_req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 }).lean();
  res.json({ items: admins.map(toDto) });
});

adminRouter.post('/', async (req, res) => {
  const { name, email, password } = parse(adminBody, req.body);
  const created = await User.create({ name, email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json(toDto(created));
});

adminRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  if (id === req.user!.id) {
    throw new HttpError(409, 'self_delete', 'You cannot remove your own account. Ask another admin to do it');
  }
  const target = await User.findOne({ _id: id, role: 'admin' });
  if (!target) throw notFound('Admin');
  if ((await User.countDocuments({ role: 'admin' })) <= 1) {
    throw new HttpError(409, 'last_admin', 'At least one admin must remain');
  }
  await target.deleteOne(); // Deleting the user also invalidates their session on the next request.
  res.status(204).end();
});
