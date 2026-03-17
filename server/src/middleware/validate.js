import { validationResult } from 'express-validator';

/**
 * Validation middleware factory.
 * Runs an array of express-validator validation chains, then checks for errors.
 * On failure returns 400 with error_code: 'VALIDATION_ERROR' and field-level details.
 *
 * @param {import('express-validator').ValidationChain[]} validations
 * @returns {import('express').RequestHandler}
 */
export function validate(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fields = {};
      errors.array().forEach((err) => {
        fields[err.path] = err.msg;
      });
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: { fields },
      });
    }

    next();
  };
}
