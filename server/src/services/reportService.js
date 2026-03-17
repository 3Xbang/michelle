import pool from '../models/db.js';

/**
 * Build optional WHERE clause for date range filtering.
 * @param {string|undefined} from - Start date (inclusive)
 * @param {string|undefined} to - End date (inclusive)
 * @returns {{ whereClause: string, params: Array }}
 */
function buildDateFilter(from, to) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (from) {
    conditions.push(`b.check_in >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`b.check_out <= $${idx++}`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

/**
 * Aggregate financials by room.
 * Groups bookings by room_id, joins rooms table for room names.
 */
export async function aggregateByRoom(from, to) {
  const { whereClause, params } = buildDateFilter(from, to);

  const result = await pool.query(
    `SELECT b.room_id,
            r.room_name_cn,
            r.room_name_en,
            SUM(b.total_revenue) AS total_revenue,
            SUM(b.commission) AS total_commission,
            SUM(b.net_income) AS total_net_income
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     ${whereClause}
     GROUP BY b.room_id, r.room_name_cn, r.room_name_en
     ORDER BY b.room_id`,
    params,
  );
  return result.rows;
}


/**
 * Aggregate financials by rental type (daily/monthly/yearly).
 */
export async function aggregateByRentalType(from, to) {
  const { whereClause, params } = buildDateFilter(from, to);

  const result = await pool.query(
    `SELECT b.rental_type,
            SUM(b.total_revenue) AS total_revenue,
            SUM(b.commission) AS total_commission,
            SUM(b.net_income) AS total_net_income
     FROM bookings b
     ${whereClause}
     GROUP BY b.rental_type
     ORDER BY b.rental_type`,
    params,
  );
  return result.rows;
}

/**
 * Aggregate financials by platform source.
 */
export async function aggregateByPlatform(from, to) {
  const { whereClause, params } = buildDateFilter(from, to);

  const result = await pool.query(
    `SELECT b.platform_source,
            SUM(b.total_revenue) AS total_revenue,
            SUM(b.commission) AS total_commission,
            SUM(b.net_income) AS total_net_income
     FROM bookings b
     ${whereClause}
     GROUP BY b.platform_source
     ORDER BY b.platform_source`,
    params,
  );
  return result.rows;
}

/**
 * Aggregate financials by month (YYYY-MM).
 */
export async function aggregateByMonth(from, to) {
  const { whereClause, params } = buildDateFilter(from, to);

  const result = await pool.query(
    `SELECT TO_CHAR(b.check_in, 'YYYY-MM') AS month,
            SUM(b.total_revenue) AS total_revenue,
            SUM(b.commission) AS total_commission,
            SUM(b.net_income) AS total_net_income
     FROM bookings b
     ${whereClause}
     GROUP BY TO_CHAR(b.check_in, 'YYYY-MM')
     ORDER BY month`,
    params,
  );
  return result.rows;
}


/**
 * CSV column definitions per dimension.
 */
const CSV_COLUMNS = {
  room: {
    headers: ['房源ID', '房源名称(中)', '房源名称(英)', '总收入', '总佣金', '总净收入'],
    fields: ['room_id', 'room_name_cn', 'room_name_en', 'total_revenue', 'total_commission', 'total_net_income'],
  },
  rental_type: {
    headers: ['租期类型', '总收入', '总佣金', '总净收入'],
    fields: ['rental_type', 'total_revenue', 'total_commission', 'total_net_income'],
  },
  platform: {
    headers: ['平台来源', '总收入', '总佣金', '总净收入'],
    fields: ['platform_source', 'total_revenue', 'total_commission', 'total_net_income'],
  },
  month: {
    headers: ['月份', '总收入', '总佣金', '总净收入'],
    fields: ['month', 'total_revenue', 'total_commission', 'total_net_income'],
  },
};

/**
 * Escape a CSV field value (handle commas, quotes, newlines).
 */
function escapeCsvField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV content string for a given dimension.
 * Adds BOM for Excel compatibility with Chinese characters.
 * @param {string} dimension - room | rental_type | platform | month
 * @param {Array} data - Aggregated data rows
 * @returns {string} CSV content with BOM
 */
export function generateCsv(dimension, data) {
  const config = CSV_COLUMNS[dimension];
  if (!config) {
    throw new Error(`Unknown dimension: ${dimension}`);
  }

  const BOM = '\uFEFF';
  const headerLine = config.headers.map(escapeCsvField).join(',');
  const dataLines = data.map((row) =>
    config.fields.map((field) => escapeCsvField(row[field])).join(','),
  );

  return BOM + [headerLine, ...dataLines].join('\n');
}

/**
 * Export report as CSV for a given dimension and granularity.
 * @param {string} dimension - room | rental_type | platform | month
 * @param {string} granularity - weekly | monthly
 * @param {string|undefined} from
 * @param {string|undefined} to
 * @returns {Promise<string>} CSV content string
 */
export async function exportCsv(dimension, granularity, from, to) {
  const aggregators = {
    room: aggregateByRoom,
    rental_type: aggregateByRentalType,
    platform: aggregateByPlatform,
    month: aggregateByMonth,
  };

  const aggregator = aggregators[dimension];
  if (!aggregator) {
    throw new Error(`Unknown dimension: ${dimension}`);
  }

  const data = await aggregator(from, to);
  return generateCsv(dimension, data);
}
