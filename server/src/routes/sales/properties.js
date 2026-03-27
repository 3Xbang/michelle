import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(ext)) cb(null, true);
  else cb(new Error('只允许上传 JPG/PNG 格式图片'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// GET / — 列表
router.get('/', async (req, res, next) => {
  try {
    const { status, property_type } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (property_type) { params.push(property_type); conditions.push(`property_type = $${params.length}`); }
    const where = conditions.join(' AND ');
    const { rows } = await pool.query(`SELECT * FROM sales_properties WHERE ${where} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — 创建
router.post('/', async (req, res, next) => {
  try {
    const { name, unit_type, area_sqm, price, floor, orientation, property_type, status, owner_name, owner_contact, notes } = req.body;
    if (!name || !unit_type || !area_sqm || !price) {
      return res.status(400).json({ message: 'name、unit_type、area_sqm、price 为必填项' });
    }
    if (property_type === 'external' && (!owner_name || !owner_contact)) {
      return res.status(400).json({ message: '外来房源必须填写 owner_name 和 owner_contact' });
    }
    const { rows } = await pool.query(
      `INSERT INTO sales_properties (name, unit_type, area_sqm, price, floor, orientation, property_type, status, owner_name, owner_contact, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, unit_type, area_sqm, price, floor || null, orientation || null, property_type || 'own', status || 'available', owner_name || null, owner_contact || null, notes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /:id — 详情（含照片）
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sales_properties WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '房源不存在' });
    const property = rows[0];
    const { rows: photos } = await pool.query(
      'SELECT * FROM sales_property_photos WHERE property_id=$1 ORDER BY sort_order ASC',
      [req.params.id]
    );
    property.photos = photos;
    res.json(property);
  } catch (err) { next(err); }
});

// PUT /:id — 编辑
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM sales_properties WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: '房源不存在' });
    const { name, unit_type, area_sqm, price, floor, orientation, property_type, status, owner_name, owner_contact, notes } = req.body;
    const pt = property_type !== undefined ? property_type : existing[0].property_type;
    if (pt === 'external' && (!owner_name && !existing[0].owner_name || !owner_contact && !existing[0].owner_contact)) {
      const on = owner_name !== undefined ? owner_name : existing[0].owner_name;
      const oc = owner_contact !== undefined ? owner_contact : existing[0].owner_contact;
      if (!on || !oc) return res.status(400).json({ message: '外来房源必须填写 owner_name 和 owner_contact' });
    }
    const { rows } = await pool.query(
      `UPDATE sales_properties SET
        name=COALESCE($1,name), unit_type=COALESCE($2,unit_type), area_sqm=COALESCE($3,area_sqm),
        price=COALESCE($4,price), floor=COALESCE($5,floor), orientation=COALESCE($6,orientation),
        property_type=COALESCE($7,property_type), status=COALESCE($8,status),
        owner_name=COALESCE($9,owner_name), owner_contact=COALESCE($10,owner_contact),
        notes=COALESCE($11,notes), updated_at=NOW()
       WHERE id=$12 AND deleted_at IS NULL RETURNING *`,
      [name||null, unit_type||null, area_sqm||null, price||null, floor||null, orientation||null, property_type||null, status||null, owner_name||null, owner_contact||null, notes||null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id — 软删除，仅 Admin
router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE sales_properties SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '房源不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /:id/photos — 上传照片
router.post('/:id/photos', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传图片文件' });
    const { rows: prop } = await pool.query('SELECT id FROM sales_properties WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!prop.length) return res.status(404).json({ message: '房源不存在' });
    const url = '/mira/uploads/' + req.file.filename;
    const { rows: existing } = await pool.query('SELECT COUNT(*) FROM sales_property_photos WHERE property_id=$1', [req.params.id]);
    const isCover = parseInt(existing[0].count) === 0;
    const { rows } = await pool.query(
      'INSERT INTO sales_property_photos (property_id, url, sort_order, is_cover) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, url, parseInt(existing[0].count), isCover]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /:id/photos/order — 批量更新 sort_order
router.put('/:id/photos/order', async (req, res, next) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) return res.status(400).json({ message: 'orders 必须为数组' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, sort_order } of orders) {
        await client.query('UPDATE sales_property_photos SET sort_order=$1 WHERE id=$2 AND property_id=$3', [sort_order, id, req.params.id]);
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT /:id/photos/:photoId/cover — 设置封面图
router.put('/:id/photos/:photoId/cover', async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE sales_property_photos SET is_cover=false WHERE property_id=$1', [req.params.id]);
      const { rows } = await client.query('UPDATE sales_property_photos SET is_cover=true WHERE id=$1 AND property_id=$2 RETURNING *', [req.params.photoId, req.params.id]);
      if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: '照片不存在' }); }
      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { next(err); }
});

// DELETE /:id/photos/:photoId — 删除照片
router.delete('/:id/photos/:photoId', async (req, res, next) => {
  try {
    const { rows: photo } = await pool.query('SELECT * FROM sales_property_photos WHERE id=$1 AND property_id=$2', [req.params.photoId, req.params.id]);
    if (!photo.length) return res.status(404).json({ message: '照片不存在' });
    await pool.query('DELETE FROM sales_property_photos WHERE id=$1', [req.params.photoId]);
    if (photo[0].is_cover) {
      const { rows: others } = await pool.query('SELECT id FROM sales_property_photos WHERE property_id=$1 ORDER BY sort_order ASC LIMIT 1', [req.params.id]);
      if (others.length) {
        await pool.query('UPDATE sales_property_photos SET is_cover=true WHERE id=$1', [others[0].id]);
      }
    }
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
