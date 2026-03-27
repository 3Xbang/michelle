import { Router } from 'express';
import pool from '../../models/db.js';

const router = Router();

// GET /api/public/miraa/properties — published properties
router.get('/properties', async (req, res, next) => {
  try {
    const { type } = req.query;
    const params = [true];
    const conditions = ['p.deleted_at IS NULL', 'p.is_published = $1'];
    if (type) { params.push(type); conditions.push(`p.property_type = $${params.length}`); }
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.property_type AS type, p.price, p.currency,
        p.area_sqm, p.land_sqm, p.bedrooms, p.bathrooms, p.location, p.description,
        COALESCE(
          (SELECT url FROM miraa_property_photos WHERE property_id=p.id AND is_cover=true LIMIT 1),
          (SELECT url FROM miraa_property_photos WHERE property_id=p.id ORDER BY sort_order LIMIT 1)
        ) AS cover_image,
        (SELECT json_agg(url ORDER BY sort_order) FROM miraa_property_photos WHERE property_id=p.id) AS images
       FROM miraa_properties p WHERE ${conditions.join(' AND ')}
       ORDER BY p.sort_order ASC, p.created_at DESC`,
      params
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
});

// GET /api/public/miraa/properties/:id
router.get('/properties/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('id',id,'url',url,'is_cover',is_cover) ORDER BY sort_order)
         FROM miraa_property_photos WHERE property_id=p.id) AS photos
       FROM miraa_properties p WHERE p.id=$1 AND p.deleted_at IS NULL AND p.is_published=true`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '不存在' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/public/miraa/banners
router.get('/banners', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, url FROM miraa_banners WHERE is_active=true ORDER BY sort_order ASC'
    );
    res.json({ data: rows.map(r => r.url) });
  } catch (err) { next(err); }
});

// GET /api/public/miraa/settings
router.get('/settings', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT config_key, config_value FROM config WHERE config_key IN ('miraa_whatsapp','miraa_line_id')`
    );
    const settings = {};
    for (const row of rows) settings[row.config_key] = row.config_value;
    res.json(settings);
  } catch (err) { next(err); }
});

export default router;
