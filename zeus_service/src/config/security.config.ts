import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  apiKey: process.env.API_KEY || 'dev-api-key',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['*'],
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
}));
