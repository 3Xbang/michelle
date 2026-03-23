import pool from '../models/db.js';
import AppError from '../utils/errors.js';

export async function getAll() {
  const result = await pool.query('SELECT * FROM platforms ORDER BY id');
  return result.rows;
}

export async function getById(id) {
  const result = await pool.query('SELECT * FROM platforms WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Platform not found');
  return result.rows[0];
}

export async function create(data) {
  const { name, commission_rate = 0, tax_rate = 0, notes = null } = data;
  const result = await pool.query(
    `INSERT INTO platforms (name, commission_rate, tax_rate, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, commission_rate, tax_rate, notes],
  );
  return result.rows[0];
}

export async function update(id, data) {
  const existing = await getById(id);
  const name = data.name !== undefined ? data.name : existing.name;
  const commission_rate = data.commission_rate !== undefined ? data.commission_rate : existing.commission_rate;
  const tax_rate = data.tax_rate !== undefined ? data.tax_rate : existing.tax_rate;
  const notes = data.notes !== undefined ? data.notes : existing.notes;

  const result = await pool.query(
    `UPDATE platforms SET name=$1, commission_rate=$2, tax_rate=$3, notes=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [name, commission_rate, tax_rate, notes, id],
  );
  return result.rows[0];
}

export async function remove(id) {
  const result = await pool.query('DELETE FROM platforms WHERE id=$1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Platform not found');
}

export async function getBookings(id) {
  await getById(id);
  const result = await pool.query(
    `SELECT b.id, b.guest_name, b.check_in, b.check_out, b.total_revenue,
            b.commission, b.net_income, b.booking_status, b.created_at,
            r.room_name_cn
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE b.platform_id = $1
     ORDER BY b.check_in DESC`,
    [id],
  );
  return result.rows;
}
