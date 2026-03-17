import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as configService from '../services/configService.js';

const router = Router();

// All config routes require authentication + Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * GET /api/config
 * Admin only - list all config entries.
 */
router.get('/', async (req, res, next) => {
  try {
    const configs = await configService.getAll();
    res.json(configs);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/config
 * Admin only - create a new config entry.
 */
router.post('/', async (req, res, next) => {
  try {
    const config = await configService.create(req.body);
    res.status(201).json(config);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/config/:id
 * Admin only - update a config entry.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const config = await configService.update(req.params.id, req.body);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

export default router;
