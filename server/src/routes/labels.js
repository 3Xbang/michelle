import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../models/db.js';

const router = Router();
router.use(authenticate);

/**
 * GET /api/labels
 * Authenticated (any role) – return all system_labels records.
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, label_key, label_cn, label_en, label_th, category FROM system_labels ORDER BY category, label_key'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
