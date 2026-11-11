process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ??= 'mongodb://placeholder';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
