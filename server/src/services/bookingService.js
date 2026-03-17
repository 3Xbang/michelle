import pool from '../models/db.js';
import AppError from '../utils/errors.js';
import { calculateNetIncome } from '../utils/income.js';

/**
 * Valid status transitions map.
 * pending → checked_in → checked_out (terminal).
 */
const STATUS_TRANSITIONS = {
  pending: ['checked_in'],
  checked_in: ['checked_out'],
  checked_out: [],
};

/**
 * Validate that a status transition is allowed.
 * @param {string} currentStatus
 * @param {string} newStatus
 * @throws {AppError} INVALID_STATUS_TRANSITION (400)
 */
export function validateStatusTransition(currentStatus, newStatus) {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError('INVALID_STATUS_TRANSITION', 400, 'Invalid status transition');
  }
}

/**
 * Check for date conflicts with existing bookings for the same room.
 * Overlap condition: existing.check_in < new.check_out AND existing.check_out > new.check_in
 * @param {number} roomId
 * @param {string} checkIn
 * @param {string} checkOut
 * @param {number|null} excludeBookingId - Exclude this booking (for edits)
 * @throws {AppError} BOOKING_DATE_CONFLICT (409)
 */
async function checkDateConflict(roomId, checkIn, checkOut, excludeBookingId = null) {
  let query;
  let params;

  if (excludeBookingId) {
    query = `
      SELECT id FROM bookings
      WHERE room_id = $1
        AND check_in < $3
        AND check_out > $2
        AND id != $4
      LIMIT 1
    `;
    params = [roomId, checkIn, checkOut, excludeBookingId];
  } else {
    query = `
      SELECT id FROM bookings
      WHERE room_id = $1
        AND check_in < $3
        AND check_out > $2
      LIMIT 1
    `;
    params = [roomId, checkIn, checkOut];
  }

  const result = await pool.query(query, params);
  if (result.rows.length > 0) {
    throw new AppError('BOOKING_DATE_CONFLICT', 409, 'Booking date conflict', {
      conflicting_booking_id: result.rows[0].id,
    });
  }
}

const BOOKING_COLUMNS = `id, room_id, created_by, guest_name, check_in, check_out,
  rental_type, platform_source, total_revenue, commission, net_income,
  external_order_id, raw_email_content, currency, booking_status, created_at, updated_at`;

/**
 * Create a new booking.
 * Auto-calculates net_income and checks for date conflicts.
 */
export async function create(data, userId) {
  const {
    room_id,
    guest_name,
    check_in,
    check_out,
    rental_type,
    platform_source,
    total_revenue,
    commission = 0,
    booking_status = 'pending',
    external_order_id = null,
    raw_email_content = null,
    currency = 'THB',
  } = data;

  // Check date conflict
  await checkDateConflict(room_id, check_in, check_out);

  // Auto-calculate net income
  const net_income = calculateNetIncome(total_revenue, commission);

  const result = await pool.query(
    `INSERT INTO bookings (room_id, created_by, guest_name, check_in, check_out,
      rental_type, platform_source, total_revenue, commission, net_income,
      external_order_id, raw_email_content, currency, booking_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING ${BOOKING_COLUMNS}`,
    [room_id, userId, guest_name, check_in, check_out, rental_type, platform_source,
     total_revenue, commission, net_income, external_order_id, raw_email_content,
     currency, booking_status],
  );
  return result.rows[0];
}

/**
 * Update an existing booking.
 * Re-runs date conflict detection (excluding self) and recalculates net_income.
 */
export async function update(id, data) {
  // Fetch existing booking first
  const existing = await getById(id);

  const room_id = data.room_id !== undefined ? data.room_id : existing.room_id;
  const check_in = data.check_in !== undefined ? data.check_in : existing.check_in;
  const check_out = data.check_out !== undefined ? data.check_out : existing.check_out;
  const total_revenue = data.total_revenue !== undefined ? data.total_revenue : parseFloat(existing.total_revenue);
  const commission = data.commission !== undefined ? data.commission : parseFloat(existing.commission);

  // Re-run date conflict detection excluding self
  await checkDateConflict(room_id, check_in, check_out, id);

  // Recalculate net income
  const net_income = calculateNetIncome(total_revenue, commission);

  const guest_name = data.guest_name !== undefined ? data.guest_name : existing.guest_name;
  const rental_type = data.rental_type !== undefined ? data.rental_type : existing.rental_type;
  const platform_source = data.platform_source !== undefined ? data.platform_source : existing.platform_source;
  const booking_status = data.booking_status !== undefined ? data.booking_status : existing.booking_status;
  const external_order_id = data.external_order_id !== undefined ? data.external_order_id : existing.external_order_id;
  const raw_email_content = data.raw_email_content !== undefined ? data.raw_email_content : existing.raw_email_content;
  const currency = data.currency !== undefined ? data.currency : existing.currency;

  const result = await pool.query(
    `UPDATE bookings SET
      room_id = $1, guest_name = $2, check_in = $3, check_out = $4,
      rental_type = $5, platform_source = $6, total_revenue = $7, commission = $8,
      net_income = $9, external_order_id = $10, raw_email_content = $11,
      currency = $12, booking_status = $13, updated_at = NOW()
     WHERE id = $14
     RETURNING ${BOOKING_COLUMNS}`,
    [room_id, guest_name, check_in, check_out, rental_type, platform_source,
     total_revenue, commission, net_income, external_order_id, raw_email_content,
     currency, booking_status, id],
  );

  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Booking not found');
  }
  return result.rows[0];
}

/**
 * Update booking status with transition validation.
 */
export async function updateStatus(id, newStatus) {
  const booking = await getById(id);
  validateStatusTransition(booking.booking_status, newStatus);

  const result = await pool.query(
    `UPDATE bookings SET booking_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${BOOKING_COLUMNS}`,
    [newStatus, id],
  );
  return result.rows[0];
}

/**
 * Get a single booking by ID.
 * @throws {AppError} RESOURCE_NOT_FOUND (404)
 */
export async function getById(id) {
  const result = await pool.query(
    `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Booking not found');
  }
  return result.rows[0];
}

/**
 * List bookings with filters, sorting, and pagination.
 * Supports: room_id, status, platform_source, date range (from/to),
 * sort (check_in, check_out, created_at, total_revenue), order (asc/desc),
 * page, page_size.
 */
export async function list(query = {}) {
  const {
    room_id,
    status,
    platform,
    from,
    to,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    page_size = 20,
  } = query;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (room_id) {
    conditions.push(`room_id = $${idx++}`);
    params.push(room_id);
  }
  if (status) {
    conditions.push(`booking_status = $${idx++}`);
    params.push(status);
  }
  if (platform) {
    conditions.push(`platform_source = $${idx++}`);
    params.push(platform);
  }
  if (from) {
    conditions.push(`check_out > $${idx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`check_in < $${idx++}`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort column to prevent SQL injection
  const allowedSorts = ['check_in', 'check_out', 'created_at', 'total_revenue'];
  const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  // Count total
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM bookings ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.max(1, Math.min(100, parseInt(page_size, 10) || 20));
  const total_pages = Math.ceil(total / pageSizeNum) || 0;
  const offset = (pageNum - 1) * pageSizeNum;

  const dataResult = await pool.query(
    `SELECT ${BOOKING_COLUMNS} FROM bookings ${whereClause}
     ORDER BY ${sortColumn} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, pageSizeNum, offset],
  );

  return {
    data: dataResult.rows,
    total,
    total_pages,
    page: pageNum,
    page_size: pageSizeNum,
  };
}

/**
 * Get calendar data for a given month.
 * Returns bookings for all active rooms within the specified month.
 */
export async function getCalendarData(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Calculate end of month
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const result = await pool.query(
    `SELECT b.id, b.room_id, b.guest_name, b.check_in, b.check_out,
            b.rental_type, b.platform_source, b.total_revenue, b.commission,
            b.net_income, b.booking_status, b.created_at,
            r.room_name_cn, r.room_name_en, r.status AS room_status
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE r.status = 'active'
       AND b.check_in < $2
       AND b.check_out > $1
     ORDER BY r.id, b.check_in`,
    [startDate, endDate],
  );
  return result.rows;
}
