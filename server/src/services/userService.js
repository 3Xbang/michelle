import bcrypt from 'bcryptjs';
import pool from '../models/db.js';
import AppError from '../utils/errors.js';

const SALT_ROUNDS = 10;

/**
 * Get all users (Admin only).
 * Returns user list without password_hash.
 */
export async function getAll() {
  const result = await pool.query(
    'SELECT id, name, email, role, preferred_lang, phone, created_at, updated_at FROM users ORDER BY id',
  );
  return result.rows;
}

/**
 * Get a single user by ID.
 * Throws RESOURCE_NOT_FOUND (404) if not found.
 */
export async function getById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, preferred_lang, phone, created_at, updated_at FROM users WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'User not found');
  }
  return result.rows[0];
}

/**
 * Create a new user.
 * Hashes password with bcrypt, checks email uniqueness.
 * Throws DUPLICATE_EMAIL (409) if email already exists.
 */
export async function create(data) {
  const { name, email, password, role, preferred_lang = 'CN', phone = null } = data;

  // Check email uniqueness
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('DUPLICATE_EMAIL', 409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, preferred_lang, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, preferred_lang, phone, created_at, updated_at`,
    [name, email, passwordHash, role, preferred_lang, phone],
  );
  return result.rows[0];
}

/**
 * Update a user by ID (Admin operation).
 * Allows updating name, email, role, preferred_lang, phone.
 * Throws RESOURCE_NOT_FOUND (404) if user not found.
 */
export async function update(id, data) {
  const { name, email, role, preferred_lang, phone } = data;

  // Build dynamic SET clause from provided fields
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
  if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
  if (preferred_lang !== undefined) { fields.push(`preferred_lang = $${idx++}`); values.push(preferred_lang); }
  if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }

  if (fields.length === 0) {
    return getById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, role, preferred_lang, phone, created_at, updated_at`,
    values,
  );

  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'User not found');
  }
  return result.rows[0];
}

/**
 * Get current user profile.
 */
export async function getMe(userId) {
  return getById(userId);
}

/**
 * Update own profile (name, phone, preferred_lang only).
 */
export async function updateMe(userId, data) {
  const { name, phone, preferred_lang } = data;

  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
  if (preferred_lang !== undefined) { fields.push(`preferred_lang = $${idx++}`); values.push(preferred_lang); }

  if (fields.length === 0) {
    return getById(userId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, role, preferred_lang, phone, created_at, updated_at`,
    values,
  );

  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'User not found');
  }
  return result.rows[0];
}

/**
 * Change password for the current user.
 * Verifies old password, then hashes and stores the new one.
 * Throws INVALID_OLD_PASSWORD (400) if old password is wrong.
 */
export async function changePassword(userId, oldPassword, newPassword) {
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'User not found');
  }

  const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
  if (!valid) {
    throw new AppError('INVALID_OLD_PASSWORD', 400, 'Old password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newHash, userId],
  );
}
