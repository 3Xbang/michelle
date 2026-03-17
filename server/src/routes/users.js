import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createUserValidation, updateUserValidation } from '../validators/userValidator.js';
import * as userService from '../services/userService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── /me routes MUST be defined BEFORE /:id routes ─────────

/**
 * GET /api/users/me
 * Authenticated - get current user profile.
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/me
 * Authenticated - update own profile (name, phone, preferred_lang).
 */
router.put('/me', async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/me/password
 * Authenticated - change own password.
 */
router.put('/me/password', async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    await userService.changePassword(req.user.id, old_password, new_password);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── Admin-only routes ──────────────────────────────────────

/**
 * GET /api/users
 * Admin only - list all users.
 */
router.get('/', authorize('Admin'), async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Admin only - create a new user.
 */
router.post(
  '/',
  authorize('Admin'),
  validate([
    ...createUserValidation,
    body('password').notEmpty().withMessage('密码不能为空'),
  ]),
  async (req, res, next) => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/users/:id
 * Admin only - update a user.
 */
router.put(
  '/:id',
  authorize('Admin'),
  validate(updateUserValidation),
  async (req, res, next) => {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
