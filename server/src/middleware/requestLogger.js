import logger from '../utils/logger.js';

/**
 * Express middleware that logs every API request.
 * Uses the response 'finish' event to capture the status code
 * after the response has been sent.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      request_path: req.path,
      method: req.method,
      user_id: req.user?.id || null,
      response_status_code: res.statusCode,
      response_time_ms: Date.now() - start,
    });
  });

  next();
}

export default requestLogger;
