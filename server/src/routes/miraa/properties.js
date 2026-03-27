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
    cb(null, 'miraa-' + Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET / — list all
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];
    if (type) { params.push(type); conditions.push(`property_type = $${params.length}`); }
    const { rows } = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('id',id,'url',url,'is_cover',is_cover,'sort_order',sort_order) ORDER BY sort_order)
         FROM miraa_property_photos WHERE property_id = p.id) AS photos
       FROM miraa_properties p WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — create
router.post('/', async (req, res, next) => {
  try {
    const { title, property_type, price, currency, area_sqm, land_sqm, bedrooms, bathrooms, location, description, is_published, sort_order } = req.body;
    if (!title || !property_type || !price) return res.status(400).json({ message: 'title, property_type, price 为必填项' });
    const { rows } = await pool.query(
      `INSERT INTO miraa_properties (title, property_type, price, currency, area_sqm, land_sqm, bedrooms, bathrooms, location, description, is_published, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title, property_type, price, currency || 'USD', area_sqm || null, land_sqm || null, bedrooms || null, bathrooms || null, location || null, description || null, is_published || false, sort_order || 0, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('id',id,'url',url,'is_cover',is_cover,'sort_order',sort_order) ORDER BY sort_order)
         FROM miraa_property_photos WHERE property_id = p.id) AS photos
       FROM miraa_properties p WHERE p.id=$1 AND p.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '房源不存在' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, property_type, price, currency, area_sqm, land_sqm, bedrooms, bathrooms, location, description, is_published, sort_order } = req.body;
    const { rows } = await pool.query(
      `UPDATE miraa_properties SET
        title=COALESCE($1,title), property_type=COALESCE($2,property_type), price=COALESCE($3,price),
        currency=COALESCE($4,currency), area_sqm=COALESCE($5,area_sqm), land_sqm=COALESCE($6,land_sqm),
        bedrooms=COALESCE($7,bedrooms), bathrooms=COALESCE($8,bathrooms), location=COALESCE($9,location),
        description=COALESCE($10,description), is_published=COALESCE($11,is_published), sort_order=COALESCE($12,sort_order),
        updated_at=NOW()
       WHERE id=$13 AND deleted_at IS NULL RETURNING *`,
      [title||null, property_type||null, price||null, currency||null, area_sqm||null, land_sqm||null, bedrooms||null, bathrooms||null, location||null, description||null, is_published??null, sort_order??null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '房源不存在' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE miraa_properties SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '房源不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /:id/photos
router.post('/:id/photos', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传图片' });
    const url = '/mira/uploads/' + req.file.filename;
    const { rows: existing } = await pool.query('SELECT COUNT(*) FROM miraa_property_photos WHERE property_id=$1', [req.params.id]);
    const isCover = parseInt(existing[0].count) === 0;
    const { rows } = await pool.query(
      'INSERT INTO miraa_property_photos (property_id, url, sort_order, is_cover) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, url, parseInt(existing[0].count), isCover]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id/photos/:photoId
router.delete('/:id/photos/:photoId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM miraa_property_photos WHERE id=$1 AND property_id=$2', [req.params.photoId, req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// PUT /:id/photos/:photoId/cover
router.put('/:id/photos/:photoId/cover', async (req, res, next) => {
  try {
    await pool.query('UPDATE miraa_property_photos SET is_cover=false WHERE property_id=$1', [req.params.id]);
    await pool.query('UPDATE miraa_property_photos SET is_cover=true WHERE id=$1', [req.params.photoId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
