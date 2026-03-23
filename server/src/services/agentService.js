import pool from '../models/db.js';
import AppError from '../utils/errors.js';

export async function getAll() {
  const result = await pool.query('SELECT * FROM agents ORDER BY id');
  return result.rows;
}

export async function getById(id) {
  const result = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Agent not found');
  return result.rows[0];
}

export async function create(data) {
  const { name, phone = null, notes = null } = data;
  const result = await pool.query(
    `INSERT INTO agents (name, phone, notes) VALUES ($1, $2, $3) RETURNING *`,
    [name, phone, notes],
  );
  return result.rows[0];
}

export async function update(id, data) {
  const existing = await getById(id);
  const name = data.name !== undefined ? data.name : existing.name;
  const phone = data.phone !== undefined ? data.phone : existing.phone;
  const notes = data.notes !== undefined ? data.notes : existing.notes;

  const result = await pool.query(
    `UPDATE agents SET name=$1, phone=$2, notes=$3, updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [name, phone, notes, id],
  );
  return result.rows[0];
}

export async function remove(id) {
  const result = await pool.query('DELETE FROM agents WHERE id=$1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Agent not found');
}

export async function getBookings(id) {
  await getById(id);
  const result = await pool.query(
    `SELECT b.id, b.guest_name, b.check_in, b.check_out, b.total_revenue,
            b.agent_fee, b.net_income, b.booking_status, b.created_at,
            r.room_name_cn
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE b.agent_id = $1
     ORDER BY b.check_in DESC`,
    [id],
  );
  return result.rows;
}
