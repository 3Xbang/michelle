import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';
import config from '../config/index.js';
import AppError from '../utils/errors.js';

/**
 * Authenticate a user by email and password.
 * Returns a signed JWT token and user profile on success.
 * Throws INVALID_CREDENTIALS (401) for wrong email or password.
 */
export async function login(email, password) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, preferred_lang: user.preferred_lang },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      preferred_lang: user.preferred_lang,
    },
  };
}
