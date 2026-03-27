import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);

// GET /pending — 待分配列表，仅 Admin（必须在 /:id 之前注册）
router.get('/pending', authorize('Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM customers WHERE assign_status='pending' AND deleted_at IS NULL ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET / — 列表
router.get('/', async (req, res, next) => {
  try {
    const { salesperson_id, lead_source, q } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];

    if (req.user.role === 'Staff') {
      params.push(req.user.id);
      conditions.push(`salesperson_id = $${params.length}`);
    } else if (salesperson_id) {
      params.push(salesperson_id);
      conditions.push(`salesperson_id = $${params.length}`);
    }

    if (lead_source) { params.push(lead_source); conditions.push(`lead_source = $${params.length}`); }
    if (q) { params.push(`%${q}%`); conditions.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length})`); }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(`SELECT * FROM customers WHERE ${where} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — 创建
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, wechat, budget_min, budget_max, preferences, lead_source, salesperson_id, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'name 和 phone 为必填项' });
    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, wechat, budget_min, budget_max, preferences, lead_source, salesperson_id, assign_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'normal',$9) RETURNING *`,
      [name, phone, wechat||null, budget_min||null, budget_max||null, preferences||null, lead_source||'other', salesperson_id||null, notes||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /:id — 详情
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '客户不存在' });
    if (req.user.role === 'Staff' && rows[0].salesperson_id !== req.user.id) {
      return res.status(403).json({ message: '无权访问该客户' });
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /:id — 编辑
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM customers WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: '客户不存在' });
    if (req.user.role === 'Staff' && existing[0].salesperson_id !== req.user.id) {
      return res.status(403).json({ message: '无权编辑该客户' });
    }
    const { name, phone, wechat, budget_min, budget_max, preferences, lead_source, salesperson_id, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE customers SET
        name=COALESCE($1,name), phone=COALESCE($2,phone), wechat=COALESCE($3,wechat),
        budget_min=COALESCE($4,budget_min), budget_max=COALESCE($5,budget_max),
        preferences=COALESCE($6,preferences), lead_source=COALESCE($7,lead_source),
        salesperson_id=COALESCE($8,salesperson_id), notes=COALESCE($9,notes), updated_at=NOW()
       WHERE id=$10 AND deleted_at IS NULL RETURNING *`,
      [name||null, phone||null, wechat||null, budget_min||null, budget_max||null, preferences||null, lead_source||null, salesperson_id||null, notes||null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id — 软删除，仅 Admin
router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE customers SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '客户不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// PUT /:id/assign — 分配销售员，仅 Admin
router.put('/:id/assign', authorize('Admin'), async (req, res, next) => {
  try {
    const { salesperson_id } = req.body;
    if (!salesperson_id) return res.status(400).json({ message: 'salesperson_id 为必填项' });
    const { rows } = await pool.query(
      `UPDATE customers SET salesperson_id=$1, assign_status='normal', updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL RETURNING *`,
      [salesperson_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '客户不存在' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
