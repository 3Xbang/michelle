import AppError from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Global error handling middleware.
 * - AppError instances return structured error responses with error_code, message, details.
 * - Unknown errors return 500 with a generic message, never exposing internal details.
 */
function errorHandler(err, req, res, _next) {
  logger.error({
    request_path: req.path,
    method: req.method,
    user_id: req.user?.id || null,
    error: err.message,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error_code: err.errorCode,
      message: err.message,
      details: err.details,
    });
  }

  // Unknown error: return generic message, don't expose internals
  res.status(500).json({
    error_code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

export default errorHandler;
