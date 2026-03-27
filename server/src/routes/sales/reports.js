import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET / — 业绩统计
router.get('/', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [];
    const dateConditions = [];

    if (start_date) { params.push(start_date); dateConditions.push(`$${params.length}`); }
    else { params.push(null); dateConditions.push(`$${params.length}`); }

    if (end_date) { params.push(end_date); dateConditions.push(`$${params.length}`); }
    else { params.push(null); dateConditions.push(`$${params.length}`); }

    // Staff 只能看自己
    let staffFilter = '';
    if (req.user.role === 'Staff') {
      params.push(req.user.id);
      staffFilter = `AND u.id = $${params.length}`;
    }

    const query = `
      SELECT
        u.id AS salesperson_id,
        u.name AS salesperson_name,
        COUNT(DISTINCT vr.id) AS viewing_count,
        COUNT(DISTINCT CASE WHEN pi.intent_level IN ('warm','hot','signed') THEN pi.id END) AS intent_count,
        COUNT(DISTINCT CASE WHEN pi.intent_level = 'signed' THEN pi.id END) AS signed_count
      FROM users u
      LEFT JOIN viewing_records vr ON vr.salesperson_id = u.id
        AND vr.deleted_at IS NULL
        AND ($1::date IS NULL OR vr.viewed_at >= $1::date)
        AND ($2::date IS NULL OR vr.viewed_at <= ($2::date + INTERVAL '1 day'))
      LEFT JOIN purchase_intents pi ON pi.salesperson_id = u.id
        AND pi.deleted_at IS NULL
        AND ($1::date IS NULL OR pi.created_at >= $1::date)
        AND ($2::date IS NULL OR pi.created_at <= ($2::date + INTERVAL '1 day'))
      WHERE u.role IN ('Admin','Staff') ${staffFilter}
      GROUP BY u.id, u.name
      ORDER BY signed_count DESC, viewing_count DESC
    `;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
