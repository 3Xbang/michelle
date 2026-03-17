import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createRoomValidation, updateRoomValidation } from '../validators/roomValidator.js';
import * as roomService from '../services/roomService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/rooms
 * Authenticated - list all rooms.
 */
router.get('/', async (req, res, next) => {
  try {
    const rooms = await roomService.getAll();
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rooms/:id
 * Authenticated - get room by id.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const room = await roomService.getById(req.params.id);
    res.json(room);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rooms
 * Admin only - create a new room.
 */
router.post(
  '/',
  authorize('Admin'),
  validate(createRoomValidation),
  async (req, res, next) => {
    try {
      const room = await roomService.create(req.body);
      res.status(201).json(room);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/rooms/:id
 * Admin only - update a room.
 */
router.put(
  '/:id',
  authorize('Admin'),
  validate(updateRoomValidation),
  async (req, res, next) => {
    try {
      const room = await roomService.update(req.params.id, req.body);
      res.json(room);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
