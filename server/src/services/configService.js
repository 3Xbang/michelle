import pool from '../models/db.js';
import AppError from '../utils/errors.js';

/**
 * Get all config entries ordered by id.
 */
export async function getAll() {
  const result = await pool.query(
    'SELECT id, config_key, config_value, feature_switch, updated_at FROM config ORDER BY id',
  );
  return result.rows;
}

/**
 * Create a new config entry.
 * Throws DUPLICATE_CONFIG_KEY (409) if config_key already exists.
 */
export async function create(data) {
  const { config_key, config_value = null, feature_switch = true } = data;

  try {
    const result = await pool.query(
      `INSERT INTO config (config_key, config_value, feature_switch)
       VALUES ($1, $2, $3)
       RETURNING id, config_key, config_value, feature_switch, updated_at`,
      [config_key, config_value, feature_switch],
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('DUPLICATE_CONFIG_KEY', 409, 'Config key already exists');
    }
    throw err;
  }
}

/**
 * Update a config entry by ID.
 * Allows updating config_value and/or feature_switch.
 * Throws RESOURCE_NOT_FOUND (404) if not found.
 */
export async function update(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.config_value !== undefined) {
    fields.push(`config_value = $${idx++}`);
    values.push(data.config_value);
  }
  if (data.feature_switch !== undefined) {
    fields.push(`feature_switch = $${idx++}`);
    values.push(data.feature_switch);
  }

  if (fields.length === 0) {
    // Nothing to update — return existing record
    const existing = await pool.query(
      'SELECT id, config_key, config_value, feature_switch, updated_at FROM config WHERE id = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      throw new AppError('RESOURCE_NOT_FOUND', 404, 'Config not found');
    }
    return existing.rows[0];
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE config SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, config_key, config_value, feature_switch, updated_at`,
    values,
  );

  if (result.rows.length === 0) {
    throw new AppError('RESOURCE_NOT_FOUND', 404, 'Config not found');
  }
  return result.rows[0];
}
