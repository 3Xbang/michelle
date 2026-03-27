import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET / — 跟进提醒列表
router.get('/', async (req, res, next) => {
  try {
    // 从 config 表读取阈值，默认 7 天
    const { rows: cfg } = await pool.query(
      `SELECT config_value FROM config WHERE config_key='sales_followup_threshold_days' LIMIT 1`
    );
    const thresholdDays = cfg.length ? parseInt(cfg[0].config_value) || 7 : 7;

    let staffFilter = '';
    const params = [thresholdDays];
    if (req.user.role === 'Staff') {
      params.push(req.user.id);
      staffFilter = `AND pi.salesperson_id = $${params.length}`;
    }

    const query = `
      SELECT
        pi.id AS intent_id,
        pi.intent_level,
        pi.salesperson_id,
        c.id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        sp.id AS property_id,
        sp.name AS property_name,
        MAX(fu.followed_at) AS last_followed_at,
        EXTRACT(DAY FROM NOW() - COALESCE(MAX(fu.followed_at), pi.created_at))::int AS days_since_followup
      FROM purchase_intents pi
      JOIN customers c ON c.id = pi.customer_id AND c.deleted_at IS NULL
      JOIN sales_properties sp ON sp.id = pi.property_id AND sp.deleted_at IS NULL
      LEFT JOIN follow_ups fu ON fu.intent_id = pi.id
      WHERE pi.deleted_at IS NULL
        AND pi.intent_level IN ('warm','hot')
        ${staffFilter}
      GROUP BY pi.id, c.id, c.name, c.phone, sp.id, sp.name
      HAVING EXTRACT(DAY FROM NOW() - COALESCE(MAX(fu.followed_at), pi.created_at)) >= $1
      ORDER BY days_since_followup DESC
    `;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
