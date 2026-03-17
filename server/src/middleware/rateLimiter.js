import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter.
 * Limits the same IP to 10 requests per 15-minute window.
 * Returns 429 with RATE_LIMIT_EXCEEDED error when exceeded.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error_code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
