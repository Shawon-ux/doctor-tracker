import { createApp } from './app.js';
import { connectDb, disconnectDb } from './db.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

await connectDb();
const server = createApp().listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
