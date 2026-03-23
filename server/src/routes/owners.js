import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as ownerService from '../services/ownerService.js';

const router = Router();
router.use(authenticate, requireRole('Admin'));

// Owners CRUD
router.get('/', async (req, res, next) => {
  try { res.json(await ownerService.getAll()); } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try { res.json(await ownerService.getById(req.params.id)); } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try { res.status(201).json(await ownerService.create(req.body)); } catch (e) { next(e); }
});
router.put('/:id', async (req, res, next) => {
  try { res.json(await ownerService.update(req.params.id, req.body)); } catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try { await ownerService.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); }
});

// Templates under owner
router.get('/:id/templates', async (req, res, next) => {
  try { res.json(await ownerService.getTemplatesByOwner(req.params.id)); } catch (e) { next(e); }
});
router.post('/:id/templates', async (req, res, next) => {
  try {
    res.status(201).json(await ownerService.createTemplate({ ...req.body, owner_id: req.params.id }));
  } catch (e) { next(e); }
});
router.put('/templates/:tid', async (req, res, next) => {
  try { res.json(await ownerService.updateTemplate(req.params.tid, req.body)); } catch (e) { next(e); }
});
router.delete('/templates/:tid', async (req, res, next) => {
  try { await ownerService.removeTemplate(req.params.tid); res.status(204).end(); } catch (e) { next(e); }
});

// Sync template prices to all rooms
router.post('/templates/:tid/sync-prices', async (req, res, next) => {
  try { res.json(await ownerService.syncTemplatePrices(req.params.tid)); } catch (e) { next(e); }
});

// Batch create rooms from template
router.post('/templates/:tid/batch-rooms', async (req, res, next) => {
  try { res.status(201).json(await ownerService.batchCreateRooms(req.params.tid, req.body)); } catch (e) { next(e); }
});

export default router;
