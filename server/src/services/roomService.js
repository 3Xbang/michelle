import pool from '../models/db.js';
import AppError from '../utils/errors.js';

/**
 * Get all rooms ordered by id.
 */
export async function getAll() {
  const result = await pool.query(
    'SELECT id, room_name_cn, room_name_en, room_type, room_group_id, auto_assign, base_daily_rate, status, created_at, updated_at FROM rooms ORDER BY id',
  );
  return result.rows;
}

/**
 * Get a single room by ID.
 * Throws RESOURCE_NOT_FOUND (404) if not found.
 */
export async function getById(id) {
  const result = await pool.query(
    'SELECT id, room_name_cn, room_name_en, room_type, room_group_id, auto_assign, base_daily_rate, status, created_at, updated_at FROM rooms WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Room not found');
  }
  return result.rows[0];
}

/**
 * Create a new room.
 */
export async function create(data) {
  const {
    room_name_cn,
    room_name_en,
    room_type,
    base_daily_rate,
    status = 'active',
    room_group_id = null,
    auto_assign = false,
  } = data;

  const result = await pool.query(
    `INSERT INTO rooms (room_name_cn, room_name_en, room_type, base_daily_rate, status, room_group_id, auto_assign)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, room_name_cn, room_name_en, room_type, room_group_id, auto_assign, base_daily_rate, status, created_at, updated_at`,
    [room_name_cn, room_name_en, room_type, base_daily_rate, status, room_group_id, auto_assign],
  );
  return result.rows[0];
}

/**
 * Update a room by ID. Only provided fields are updated.
 * Throws RESOURCE_NOT_FOUND (404) if room not found.
 */
export async function update(id, data) {
  const allowedFields = [
    'room_name_cn', 'room_name_en', 'room_type',
    'base_daily_rate', 'status', 'room_group_id', 'auto_assign',
  ];

  const fields = [];
  const values = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return getById(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query(
    `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, room_name_cn, room_name_en, room_type, room_group_id, auto_assign, base_daily_rate, status, created_at, updated_at`,
    values,
  );

  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Room not found');
  }
  return result.rows[0];
}
