import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'villa_pms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default config;
