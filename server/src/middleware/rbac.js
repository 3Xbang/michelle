import AppError from '../utils/errors.js';

/**
 * Role-based access control middleware factory.
 * Accepts an array of allowed roles and returns middleware
 * that checks req.user.role against the allowed list.
 * Returns 403 if the user's role is not permitted.
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }
    next();
  };
}
