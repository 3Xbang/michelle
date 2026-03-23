import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as agentService from '../services/agentService.js';

const router = Router();
router.use(authenticate);

// Public read
router.get('/', async (req, res, next) => {
  try { res.json(await agentService.getAll()); } catch (err) { next(err); }
});

router.get('/:id/bookings', async (req, res, next) => {
  try { res.json(await agentService.getBookings(req.params.id)); } catch (err) { next(err); }
});

// Admin only for mutations
router.post('/', authorize('Admin'), async (req, res, next) => {
  try { res.status(201).json(await agentService.create(req.body)); } catch (err) { next(err); }
});

router.put('/:id', authorize('Admin'), async (req, res, next) => {
  try { res.json(await agentService.update(req.params.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try { await agentService.remove(req.params.id); res.status(204).end(); } catch (err) { next(err); }
});

export default router;
