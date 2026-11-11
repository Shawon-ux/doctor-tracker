/**
 * Creates a user, or resets an existing user's password and role.
 *   npm run create-user -- <email> <password> <admin|viewer> [name]
 */
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDb, disconnectDb } from '../db.js';
import { ROLES, User } from '../models/user.js';

const args = z
  .tuple([z.email(), z.string().min(8, 'Password must be 8+ characters'), z.enum(ROLES)])
  .rest(z.string())
  .safeParse(process.argv.slice(2));

if (!args.success) {
  console.error('Usage: npm run create-user -- <email> <password> <admin|viewer> [name]');
  console.error(args.error.issues.map((i) => i.message).join('\n'));
  process.exit(1);
}
const [rawEmail, password, role, ...nameParts] = args.data;
const email = rawEmail.toLowerCase();
const name = nameParts.join(' ') || email.split('@')[0]!;

await connectDb();
try {
  await User.updateOne(
    { email },
    // tokenVersion bump signs the user out everywhere after a reset.
    { $set: { passwordHash: await bcrypt.hash(password, 12), role }, $setOnInsert: { name, email }, $inc: { tokenVersion: 1 } },
    { upsert: true },
  );
  console.log(`${role} ready: ${email}`);
} finally {
  await disconnectDb();
}
