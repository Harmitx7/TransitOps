import dotenv from 'dotenv';
dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
