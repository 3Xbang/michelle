import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);

const INTENT_ORDER = `CASE WHEN intent_level='signed' THEN 4 WHEN intent_level='hot' THEN 3 WHEN intent_level='warm' THEN 2 ELSE 1 END DESC`;

// GET / — 列表，按热度降序
router.get('/', async (req, res, next) => {
  try {
    const { property_id, customer_id, intent_level, salesperson_id } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];

    if (req.user.role === 'Staff') {
      params.push(req.user.id);
      conditions.push(`salesperson_id = $${params.length}`);
    } else if (salesperson_id) {
      params.push(salesperson_id);
      conditions.push(`salesperson_id = $${params.length}`);
    }
    if (property_id) { params.push(property_id); conditions.push(`property_id = $${params.length}`); }
    if (customer_id) { params.push(customer_id); conditions.push(`customer_id = $${params.length}`); }
    if (intent_level) { params.push(intent_level); conditions.push(`intent_level = $${params.length}`); }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(`SELECT * FROM purchase_intents WHERE ${where} ORDER BY ${INTENT_ORDER}`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — 创建
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, property_id, salesperson_id, intent_level, notes } = req.body;
    if (!customer_id || !property_id || !salesperson_id) {
      return res.status(400).json({ message: 'customer_id、property_id、salesperson_id 为必填项' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO purchase_intents (customer_id, property_id, salesperson_id, intent_level, notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [customer_id, property_id, salesperson_id, intent_level||'cold', notes||null]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ message: '该客户对此房源已存在意向记录' });
      throw e;
    }
  } catch (err) { next(err); }
});

// PUT /:id — 更新意向
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM purchase_intents WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: '意向记录不存在' });
    if (req.user.role === 'Staff' && existing[0].salesperson_id !== req.user.id) {
      return res.status(403).json({ message: '无权编辑该意向' });
    }
    const { intent_level, notes, salesperson_id } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE purchase_intents SET
          intent_level=COALESCE($1,intent_level), notes=COALESCE($2,notes),
          salesperson_id=COALESCE($3,salesperson_id), updated_at=NOW()
         WHERE id=$4 AND deleted_at IS NULL RETURNING *`,
        [intent_level||null, notes||null, salesperson_id||null, req.params.id]
      );
      if (intent_level === 'signed') {
        await client.query(`UPDATE sales_properties SET status='sold', updated_at=NOW() WHERE id=$1`, [existing[0].property_id]);
      }
      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { next(err); }
});

// DELETE /:id — 软删除，仅 Admin
router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE purchase_intents SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '意向记录不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /:id/follow-ups — 跟进记录列表
router.get('/:id/follow-ups', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM follow_ups WHERE intent_id=$1 ORDER BY followed_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /:id/follow-ups — 添加跟进记录
router.post('/:id/follow-ups', async (req, res, next) => {
  try {
    const { content, followed_at } = req.body;
    if (!content) return res.status(400).json({ message: 'content 为必填项' });
    const { rows: intent } = await pool.query('SELECT id FROM purchase_intents WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!intent.length) return res.status(404).json({ message: '意向记录不存在' });
    const { rows } = await pool.query(
      `INSERT INTO follow_ups (intent_id, content, followed_at, operator_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, content, followed_at||new Date(), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
