import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import pool from '../../models/db.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';

const router = Router();
router.use(authenticate);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// GET / — 列表
router.get('/', async (req, res, next) => {
  try {
    const { property_id, ad_status } = req.query;
    const params = [];
    const conditions = ['deleted_at IS NULL'];
    if (property_id) { params.push(property_id); conditions.push(`property_id = $${params.length}`); }
    if (ad_status) { params.push(ad_status); conditions.push(`ad_status = $${params.length}`); }
    const where = conditions.join(' AND ');
    const { rows } = await pool.query(`SELECT * FROM ad_materials WHERE ${where} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST / — 创建
router.post('/', async (req, res, next) => {
  try {
    const { title, description, property_id, tags, photo_ids, facebook_ad_id, facebook_campaign_id, facebook_ad_account_id } = req.body;
    if (!title || !description || !property_id) {
      return res.status(400).json({ message: 'title、description、property_id 为必填项' });
    }
    const { rows } = await pool.query(
      `INSERT INTO ad_materials (title, description, property_id, tags, photo_ids, ad_status, facebook_ad_id, facebook_campaign_id, facebook_ad_account_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9) RETURNING *`,
      [title, description, property_id, tags||null, photo_ids||null, facebook_ad_id||null, facebook_campaign_id||null, facebook_ad_account_id||null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /:id — 详情（含关联照片）
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ad_materials WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '广告素材不存在' });
    const material = rows[0];
    if (material.photo_ids && material.photo_ids.length > 0) {
      const { rows: photos } = await pool.query(
        'SELECT * FROM sales_property_photos WHERE id = ANY($1::int[])',
        [material.photo_ids]
      );
      // 按 photo_ids 顺序排列
      material.photos = material.photo_ids.map(id => photos.find(p => p.id === id)).filter(Boolean);
    } else {
      material.photos = [];
    }
    res.json(material);
  } catch (err) { next(err); }
});

// PUT /:id — 编辑
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT id FROM ad_materials WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: '广告素材不存在' });
    const { title, description, property_id, tags, photo_ids, facebook_ad_id, facebook_campaign_id, facebook_ad_account_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE ad_materials SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        property_id=COALESCE($3,property_id), tags=COALESCE($4,tags),
        photo_ids=COALESCE($5,photo_ids), facebook_ad_id=COALESCE($6,facebook_ad_id),
        facebook_campaign_id=COALESCE($7,facebook_campaign_id),
        facebook_ad_account_id=COALESCE($8,facebook_ad_account_id), updated_at=NOW()
       WHERE id=$9 AND deleted_at IS NULL RETURNING *`,
      [title||null, description||null, property_id||null, tags||null, photo_ids||null, facebook_ad_id||null, facebook_campaign_id||null, facebook_ad_account_id||null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /:id/status — 切换状态
router.put('/:id/status', async (req, res, next) => {
  try {
    const { ad_status } = req.body;
    const valid = ['draft', 'published', 'paused'];
    if (!valid.includes(ad_status)) return res.status(400).json({ message: `ad_status 必须为 ${valid.join('/')}` });
    const { rows } = await pool.query(
      `UPDATE ad_materials SET ad_status=$1, status_changed_at=NOW(), updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL RETURNING *`,
      [ad_status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '广告素材不存在' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id — 软删除
router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE ad_materials SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '广告素材不存在' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /:id/download — 生成 ZIP
router.get('/:id/download', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT am.*, sp.name AS property_name
       FROM ad_materials am
       JOIN sales_properties sp ON sp.id = am.property_id
       WHERE am.id=$1 AND am.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '广告素材不存在' });
    const material = rows[0];

    if (!material.photo_ids || material.photo_ids.length === 0) {
      return res.status(400).json({ message: '请先选择至少一张照片' });
    }

    const { rows: photos } = await pool.query(
      'SELECT * FROM sales_property_photos WHERE id = ANY($1::int[])',
      [material.photo_ids]
    );

    if (!photos.length) return res.status(400).json({ message: '请先选择至少一张照片' });

    const safeName = (s) => s.replace(/[^\w\u4e00-\u9fa5\-]/g, '_');
    const zipName = `${safeName(material.property_name)}_${safeName(material.title)}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => next(err));
    archive.pipe(res);

    for (const photo of photos) {
      const filename = path.basename(photo.url);
      const filepath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) {
        archive.file(filepath, { name: filename });
      }
    }

    await archive.finalize();
  } catch (err) { next(err); }
});

export default router;
