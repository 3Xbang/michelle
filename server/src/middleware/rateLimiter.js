import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter.
 * Limits the same IP to 10 requests per 15-minute window.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error_code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for phone-based rate limiting (public inquiry form)
const phoneSubmitMap = new Map();

/**
 * Public inquiry form rate limiter by phone number.
 * Same phone number can only submit once per 10 minutes.
 */
export function inquiryPhoneLimiter(req, res, next) {
  const phone = req.body?.phone;
  if (!phone) return next();

  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const last = phoneSubmitMap.get(phone);

  if (last && now - last < windowMs) {
    return res.status(429).json({ message: '提交过于频繁，请稍后再试' });
  }

  phoneSubmitMap.set(phone, now);
  // Clean up old entries periodically
  if (phoneSubmitMap.size > 10000) {
    for (const [k, v] of phoneSubmitMap) {
      if (now - v > windowMs) phoneSubmitMap.delete(k);
    }
  }
  next();
}
