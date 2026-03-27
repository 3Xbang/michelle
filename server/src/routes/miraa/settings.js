import { Router } from 'express';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

const MIRAA_KEYS = ['miraa_whatsapp', 'miraa_line_id'];

// GET / — get miraa settings
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT config_key, config_value FROM config WHERE config_key = ANY($1)`,
      [MIRAA_KEYS]
    );
    const settings = {};
    for (const row of rows) settings[row.config_key] = row.config_value;
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT / — update miraa settings
router.put('/', async (req, res, next) => {
  try {
    const { miraa_whatsapp, miraa_line_id } = req.body;
    const updates = { miraa_whatsapp, miraa_line_id };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await pool.query(
          `INSERT INTO config (config_key, config_value) VALUES ($1,$2)
           ON CONFLICT (config_key) DO UPDATE SET config_value=$2, updated_at=NOW()`,
          [key, value]
        );
      }
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
