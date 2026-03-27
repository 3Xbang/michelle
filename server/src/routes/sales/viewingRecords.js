import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET / — 列表
router.get('/', async (req, res, next) => {
  try {
    const { property_id, customer_id } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];

    if (req.user.role === 'Staff') {
      params.push(req.user.id);
      conditions.push(`salesperson_id = $${params.length}`);
    }
    if (property_id) { params.push(property_id); conditions.push(`property_id = $${params.length}`); }
    if (customer_id) { params.push(customer_id); conditions.push(`customer_id = $${params.length}`); }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(`SELECT * FROM viewing_records WHERE ${where} ORDER BY viewed_at DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — 创建
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, property_id, viewed_at, salesperson_id, notes } = req.body;
    if (!customer_id || !property_id || !viewed_at || !salesperson_id) {
      return res.status(400).json({ message: 'customer_id、property_id、viewed_at、salesperson_id 为必填项' });
    }
    const { rows } = await pool.query(
      `INSERT INTO viewing_records (customer_id, property_id, viewed_at, salesperson_id, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [customer_id, property_id, viewed_at, salesperson_id, notes||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /:id — 编辑
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT id FROM viewing_records WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: '看房记录不存在' });
    const { customer_id, property_id, viewed_at, salesperson_id, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE viewing_records SET
        customer_id=COALESCE($1,customer_id), property_id=COALESCE($2,property_id),
        viewed_at=COALESCE($3,viewed_at), salesperson_id=COALESCE($4,salesperson_id),
        notes=COALESCE($5,notes), updated_at=NOW()
       WHERE id=$6 AND deleted_at IS NULL RETURNING *`,
      [customer_id||null, property_id||null, viewed_at||null, salesperson_id||null, notes||null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id — 软删除
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE viewing_records SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '看房记录不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
