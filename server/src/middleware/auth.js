import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../utils/errors.js';

/**
 * JWT authentication middleware.
 * Verifies the Authorization: Bearer <token> header,
 * decodes the JWT and attaches { id, role, preferred_lang } to req.user.
 * Returns 401 for missing, invalid, or expired tokens.
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('TOKEN_INVALID', 401, 'Missing or invalid token');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      preferred_lang: decoded.preferred_lang,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('TOKEN_EXPIRED', 401, 'Token has expired');
    }
    throw new AppError('TOKEN_INVALID', 401, 'Invalid token');
  }
}
