/**
 * Custom application error class for structured error responses.
 * All business errors should use this class to ensure consistent
 * error_code + statusCode + message + details format.
 */
class AppError extends Error {
  /**
   * @param {string} errorCode - Business error code (e.g. 'BOOKING_DATE_CONFLICT')
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {*} [details=null] - Optional additional error details
   */
  constructor(errorCode, statusCode, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export default AppError;
