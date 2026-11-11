import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 20 });
  logger.info('MongoDB connected');
}

export const disconnectDb = () => mongoose.disconnect();
