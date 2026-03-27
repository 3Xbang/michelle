import { Router } from 'express';
import pool from '../../models/db.js';
import { inquiryPhoneLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// POST / — 公开表单提交（无需认证）
router.post('/', inquiryPhoneLimiter, async (req, res, next) => {
  try {
    const { name, phone, wechat, budget_min, budget_max, preferences, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'name 和 phone 为必填项' });
    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, wechat, budget_min, budget_max, preferences, lead_source, assign_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,'web_form','pending',$7) RETURNING *`,
      [name, phone, wechat||null, budget_min||null, budget_max||null, preferences||null, notes||null]
    );
    res.status(201).json({ message: '提交成功，我们将尽快与您联系', id: rows[0].id });
  } catch (err) { next(err); }
});

export default router;
