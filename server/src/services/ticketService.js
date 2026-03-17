import pool from '../models/db.js';
import AppError from '../utils/errors.js';

const TICKET_COLUMNS = `id, room_id, created_by, issue_type, description, priority,
  ticket_status, photo_urls, completed_at, created_at, updated_at`;

/**
 * Create a new ticket.
 * @param {object} data - Ticket data
 * @param {number} userId - ID of the user creating the ticket
 * @param {string[]} [photoUrls=[]] - Array of uploaded photo URLs
 */
export async function create(data, userId, photoUrls = []) {
  const {
    room_id,
    issue_type,
    description,
    priority = 'normal',
  } = data;

  const result = await pool.query(
    `INSERT INTO tickets (room_id, created_by, issue_type, description, priority, photo_urls)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING ${TICKET_COLUMNS}`,
    [room_id, userId, issue_type, description, priority, JSON.stringify(photoUrls)],
  );
  return result.rows[0];
}

/**
 * List tickets with optional filters.
 * Supports: status (ticket_status), issue_type, room_id.
 */
export async function list(query = {}) {
  const { status, issue_type, room_id } = query;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`ticket_status = $${idx++}`);
    params.push(status);
  }
  if (issue_type) {
    conditions.push(`issue_type = $${idx++}`);
    params.push(issue_type);
  }
  if (room_id) {
    conditions.push(`room_id = $${idx++}`);
    params.push(room_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT ${TICKET_COLUMNS} FROM tickets ${whereClause} ORDER BY created_at DESC`,
    params,
  );
  return result.rows;
}

/**
 * Get a single ticket by ID.
 * @throws {AppError} RESOURCE_NOT_FOUND (404)
 */
export async function getById(id) {
  const result = await pool.query(
    `SELECT ${TICKET_COLUMNS} FROM tickets WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Ticket not found');
  }
  return result.rows[0];
}

/**
 * Mark a ticket as completed (Admin only).
 * Sets ticket_status='completed' and records completed_at timestamp.
 */
export async function markComplete(id) {
  const ticket = await getById(id);

  if (ticket.ticket_status === 'completed') {
    return ticket;
  }

  const result = await pool.query(
    `UPDATE tickets SET ticket_status = 'completed', completed_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING ${TICKET_COLUMNS}`,
    [id],
  );
  return result.rows[0];
}
