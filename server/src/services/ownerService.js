import pool from '../models/db.js';
import AppError from '../utils/errors.js';

const OWNER_COLS = 'id, name, name_en, phone, wechat, contacts, notes, management_fee_rate, created_at, updated_at';

export async function getAll() {
  const result = await pool.query(
    `SELECT o.id, o.name, o.name_en, o.phone, o.wechat, o.contacts, o.notes, o.management_fee_rate, o.created_at, o.updated_at,
            COUNT(r.id)::int AS room_count
     FROM owners o
     LEFT JOIN rooms r ON r.owner_id = o.id
     GROUP BY o.id
     ORDER BY o.id`
  );
  return result.rows;
}

export async function getById(id) {
  const result = await pool.query(`SELECT ${OWNER_COLS} FROM owners WHERE id = $1`, [id]);
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Owner not found');
  return result.rows[0];
}

export async function create(data) {
  const { name, name_en = null, phone = null, wechat = null, contacts = [], notes = null, management_fee_rate = 0 } = data;
  const result = await pool.query(
    `INSERT INTO owners (name, name_en, phone, wechat, contacts, notes, management_fee_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${OWNER_COLS}`,
    [name, name_en, phone, wechat, JSON.stringify(contacts), notes, management_fee_rate]
  );
  return result.rows[0];
}

export async function update(id, data) {
  const allowed = ['name', 'name_en', 'phone', 'wechat', 'contacts', 'notes', 'management_fee_rate'];
  const fields = [], values = [];
  let idx = 1;
  for (const f of allowed) {
    if (data[f] !== undefined) {
      fields.push(f + ' = $' + idx++);
      values.push(f === 'contacts' ? JSON.stringify(data[f]) : data[f]);
    }
  }
  if (!fields.length) return getById(id);
  fields.push('updated_at = NOW()');
  values.push(id);
  const result = await pool.query(
    'UPDATE owners SET ' + fields.join(', ') + ' WHERE id = $' + idx + ' RETURNING ' + OWNER_COLS,
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
const TPL_COLS = 'id, owner_id, template_name, project_name, project_name_en, project_type, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, notes, created_at, updated_at';

export async function getTemplatesByOwner(ownerId) {
  const result = await pool.query(
    `SELECT t.id, t.owner_id, t.template_name, t.project_name, t.project_name_en, t.project_type,
            t.bedrooms, t.bathrooms, t.kitchens,
            t.daily_rate, t.monthly_rate, t.yearly_rate, t.notes, t.created_at, t.updated_at,
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
  const result = await pool.query('SELECT ' + TPL_COLS + ' FROM room_templates WHERE id = $1', [id]);
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
  return result.rows[0];
}

function toNum(val, fallback) {
  if (fallback === undefined) fallback = 0;
  if (val === '' || val === null || val === undefined) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export async function createTemplate(data) {
  const owner_id = data.owner_id;
  const template_name = data.template_name;
  const project_name = data.project_name || null;
  const project_name_en = data.project_name_en || null;
  const project_type = data.project_type || 'apartment';
  const notes = data.notes || null;
  const bedrooms = toNum(data.bedrooms, 1);
  const bathrooms = toNum(data.bathrooms, 1);
  const kitchens = toNum(data.kitchens, 0);
  const daily_rate = toNum(data.daily_rate, 0);
  const monthly_rate = toNum(data.monthly_rate, 0);
  const yearly_rate = toNum(data.yearly_rate, 0);
  const result = await pool.query(
    'INSERT INTO room_templates (owner_id, template_name, project_name, project_name_en, project_type, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ' + TPL_COLS,
    [owner_id, template_name, project_name, project_name_en, project_type, bedrooms, bathrooms, kitchens, daily_rate, monthly_rate, yearly_rate, notes]
  );
  return result.rows[0];
}

export async function updateTemplate(id, data) {
  const allowed = ['template_name', 'project_name', 'project_name_en', 'project_type', 'bedrooms', 'bathrooms', 'kitchens', 'daily_rate', 'monthly_rate', 'yearly_rate', 'notes'];
  const numericFields = ['bedrooms', 'bathrooms', 'kitchens', 'daily_rate', 'monthly_rate', 'yearly_rate'];
  const fields = [], values = [];
  let idx = 1;
  for (const f of allowed) {
    if (data[f] !== undefined) {
      const val = numericFields.includes(f) ? toNum(data[f]) : data[f];
      fields.push(f + ' = $' + idx++);
      values.push(val);
    }
  }
  if (!fields.length) return getTemplateById(id);
  fields.push('updated_at = NOW()');
  values.push(id);
  const result = await pool.query(
    'UPDATE room_templates SET ' + fields.join(', ') + ' WHERE id = $' + idx + ' RETURNING ' + TPL_COLS,
    values
  );
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
  return result.rows[0];
}

export async function removeTemplate(id) {
  const result = await pool.query('DELETE FROM room_templates WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) throw new AppError('RESOURCE_NOT_FOUND', 404, 'Template not found');
}

export async function syncTemplatePrices(templateId) {
  const tpl = await getTemplateById(templateId);
  const result = await pool.query(
    'UPDATE rooms SET base_daily_rate = $1, updated_at = NOW() WHERE template_id = $2 RETURNING id',
    [tpl.daily_rate, templateId]
  );
  return { updated: result.rowCount, template: tpl };
}

export async function syncTemplateRooms(templateId, roomNumbers) {
  const tpl = await getTemplateById(templateId);
  const safeRate = toNum(tpl.daily_rate, 0);
  const created = [];
  for (const item of roomNumbers) {
    const name_cn = item.name_cn;
    const name_en = item.name_en;
    if (!name_cn) continue;
    const existing = await pool.query(
      'SELECT id FROM rooms WHERE template_id = $1 AND room_name_cn = $2',
      [templateId, name_cn]
    );
    if (existing.rows.length === 0) {
      const r = await pool.query(
        "INSERT INTO rooms (room_name_cn, room_name_en, room_type, base_daily_rate, status, owner_id, template_id) VALUES ($1,$2,$3,$4,'active',$5,$6) RETURNING id, room_name_cn, room_name_en",
        [name_cn, name_en || name_cn, tpl.project_type || 'apartment', safeRate, tpl.owner_id, templateId]
      );
      created.push(r.rows[0]);
    }
  }
  return { created: created.length, rooms: created };
}

export async function getRoomsByTemplate(templateId) {
  const result = await pool.query(
    'SELECT id, room_name_cn, room_name_en, room_type, base_daily_rate, status FROM rooms WHERE template_id = $1 ORDER BY id',
    [templateId]
  );
  return result.rows;
}

export async function getUnassignedRoomsByOwner(ownerId) {
  const result = await pool.query(
    'SELECT id, room_name_cn, room_name_en, room_type, base_daily_rate, status FROM rooms WHERE owner_id = $1 AND template_id IS NULL ORDER BY id',
    [ownerId]
  );
  return result.rows;
}

export async function assignRoomsToTemplate(templateId, roomIds) {
  if (!roomIds.length) return { updated: 0 };
  const tpl = await getTemplateById(templateId);
  const placeholders = roomIds.map(function(_, i) { return '$' + (i + 3); }).join(', ');
  const result = await pool.query(
    'UPDATE rooms SET template_id = $1, room_type = $2, updated_at = NOW() WHERE id IN (' + placeholders + ') RETURNING id',
    [templateId, tpl.project_type || 'apartment'].concat(roomIds)
  );
  return { updated: result.rowCount };
}
