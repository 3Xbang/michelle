import pool from '../models/db.js';
import AppError from '../utils/errors.js';

/**
 * Get all rooms ordered by id, with owner name joined.
 */
export async function getAll() {
  const result = await pool.query(
    `SELECT r.id, r.room_name_cn, r.room_name_en, r.room_type, r.room_group_id, r.auto_assign,
            r.base_daily_rate, r.status, r.owner_id, r.template_id, r.created_at, r.updated_at,
            o.name AS owner_name
     FROM rooms r
     LEFT JOIN owners o ON o.id = r.owner_id
     ORDER BY r.id`,
  );
  return result.rows;
}

/**
 * Get a single room by ID, with owner name joined.
 * Throws RESOURCE_NOT_FOUND (404) if not found.
 */
export async function getById(id) {
  const result = await pool.query(
    `SELECT r.id, r.room_name_cn, r.room_name_en, r.room_type, r.room_group_id, r.auto_assign,
            r.base_daily_rate, r.status, r.owner_id, r.template_id, r.created_at, r.updated_at,
            o.name AS owner_name
     FROM rooms r
     LEFT JOIN owners o ON o.id = r.owner_id
     WHERE r.id = $1`,
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
    owner_id = null,
    template_id = null,
  } = data;

  const result = await pool.query(
    `INSERT INTO rooms (room_name_cn, room_name_en, room_type, base_daily_rate, status, room_group_id, auto_assign, owner_id, template_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, room_name_cn, room_name_en, room_type, room_group_id, auto_assign, base_daily_rate, status, owner_id, template_id, created_at, updated_at`,
    [room_name_cn, room_name_en, room_type, base_daily_rate, status, room_group_id, auto_assign, owner_id || null, template_id || null],
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
    'owner_id', 'template_id',
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

/**
 * Delete a room by ID.
 * Throws RESOURCE_NOT_FOUND (404) if room not found.
 */
export async function remove(id) {
  const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Room not found');
  }
}
