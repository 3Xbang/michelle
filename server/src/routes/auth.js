import { Router } from 'express';
import { login } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/auth/login
 * Public endpoint. Validates email/password and returns JWT + user profile.
 * Rate-limited to 10 attempts per 15 minutes per IP.
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Authenticated endpoint. Server-side acknowledgement of logout.
 * Actual token invalidation is handled client-side by clearing localStorage.
 */
router.post('/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
