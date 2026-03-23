import pool from '../models/db.js';
import AppError from '../utils/errors.js';

const OWNER_COLS = 'id, name, phone, wechat, notes, management_fee_rate, created_at, updated_at';

export async function getAll() {
  const result = await pool.query(
    `SELECT o.${OWNER_COLS.split(', ').map(c => 'o.' + c).join(', ')},
            COUNT(r.id)::int AS room_count
     FROM owners o
     LEFT JOIN rooms r ON r.owner_id = o.id
     GROUP BY o.id
     ORDER BY o.id`
  );
  return result.rows;
}

export async function getById(id) {
  const result = await pool.query(
    `SELECT ${OWNER_COLS} FROM owners WHERE id = $1`, [id]
  );
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Owner not found');
  return result.rows[0];
}

export async function create(data) {
  const { name, phone = null, wechat = null, notes = null, management_fee_rate = 0 } = data;
  const result = await pool.query(
    `INSERT INTO owners (name, phone, wechat, notes, management_fee_rate)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${OWNER_COLS}`,
    [name, phone, wechat, notes, management_fee_rate]
  );
  return result.rows[0];
}

export async function update(id, data) {
  const allowed = ['name', 'phone', 'wechat', 'notes', 'management_fee_rate'];
  const fields = [], values = [];
  let idx = 1;
  for (const f of allowed) {
    if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(data[f]); }
  }
  if (!fields.length) return getById(id);
  fields.push('updated_at = NOW()');
  values.push(id);
  const result = await pool.query(
    `UPDATE owners SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${OWNER_COLS}`,
    values
  );
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Owner not found');
  return result.rows[0];
}

export async function remove(id) {
  const result = await pool.query('DELETE FROM owners WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Owner not found');
}

// --- Templates ---
const TPL_COLS = 'id, owner_id, template_name, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, room_prefix, notes, created_at, updated_at';

export async function getTemplatesByOwner(ownerId) {
  const result = await pool.query(
    `SELECT t.${TPL_COLS.split(', ').map(c => 't.' + c).join(', ')},
            COUNT(r.id)::int AS room_count
     FROM room_templates t
     LEFT JOIN rooms r ON r.template_id = t.id
     WHERE t.owner_id = $1
     GROUP BY t.id ORDER BY t.id`,
    [ownerId]
  );
  return result.rows;
}

export async function getTemplateById(id) {
  const result = await pool.query(
    `SELECT ${TPL_COLS} FROM room_templates WHERE id = $1`, [id]
  );
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
  return result.rows[0];
}

export async function createTemplate(data) {
  const {
    owner_id, template_name, bedrooms = 1, bathrooms = 1, kitchens = 0,
    daily_rate = 0, monthly_rate = 0, yearly_rate = 0, room_prefix = null, notes = null
  } = data;
  const result = await pool.query(
    `INSERT INTO room_templates (owner_id, template_name, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, room_prefix, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${TPL_COLS}`,
    [owner_id, template_name, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, room_prefix, notes]
  );
  return result.rows[0];
}

export async function updateTemplate(id, data) {
  const allowed = ['template_name', 'bedrooms', 'bathrooms', 'kitchens', 'daily_rate', 'monthly_rate', 'yearly_rate', 'room_prefix', 'notes'];
  const fields = [], values = [];
  let idx = 1;
  for (const f of allowed) {
    if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(data[f]); }
  }
  if (!fields.length) return getTemplateById(id);
  fields.push('updated_at = NOW()');
  values.push(id);
  const result = await pool.query(
    `UPDATE room_templates SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${TPL_COLS}`,
    values
  );
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
  return result.rows[0];
}

export async function removeTemplate(id) {
  const result = await pool.query('DELETE FROM room_templates WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
}

// Sync template prices to all rooms using this template
export async function syncTemplatePrices(templateId) {
  const tpl = await getTemplateById(templateId);
  const result = await pool.query(
    `UPDATE rooms SET base_daily_rate = $1, updated_at = NOW()
     WHERE template_id = $2 RETURNING id`,
    [tpl.daily_rate, templateId]
  );
  return { updated: result.rowCount, template: tpl };
}

// Batch create rooms from template
export async function batchCreateRooms(templateId, { count, start_number, name_cn_prefix, name_en_prefix, room_type, status = 'active' }) {
  const tpl = await getTemplateById(templateId);
  const created = [];
  for (let i = 0; i < count; i++) {
    const num = start_number + i;
    const nameCn = `${name_cn_prefix || tpl.room_prefix || ''}${num}`;
    const nameEn = `${name_en_prefix || tpl.room_prefix || ''}${num}`;
    const r = await pool.query(
      `INSERT INTO rooms (room_name_cn, room_name_en, room_type, base_daily_rate, status, owner_id, template_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, room_name_cn, room_name_en`,
      [nameCn, nameEn, room_type || 'apartment', tpl.daily_rate, status, tpl.owner_id, templateId]
    );
    created.push(r.rows[0]);
  }
  return created;
}
