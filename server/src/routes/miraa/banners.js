import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'banner-' + Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET / — list all banners
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM miraa_banners ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — upload new banner
router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传图片' });
    const url = '/mira/uploads/' + req.file.filename;
    const { rows: existing } = await pool.query('SELECT COUNT(*) FROM miraa_banners');
    const { rows } = await pool.query(
      'INSERT INTO miraa_banners (url, sort_order, is_active) VALUES ($1,$2,true) RETURNING *',
      [url, parseInt(existing[0].count)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT url FROM miraa_banners WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '不存在' });
    await pool.query('DELETE FROM miraa_banners WHERE id=$1', [req.params.id]);
    // Delete file
    const filename = path.basename(rows[0].url);
    const filepath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.status(204).end();
  } catch (err) { next(err); }
});

// PUT /order — update sort order
router.put('/order', async (req, res, next) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) return res.status(400).json({ message: 'orders 必须为数组' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, sort_order } of orders) {
        await client.query('UPDATE miraa_banners SET sort_order=$1 WHERE id=$2', [sort_order, id]);
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
