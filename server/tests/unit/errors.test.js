import { describe, it, expect } from 'vitest';
import AppError from '../../src/utils/errors.js';
import errorHandler from '../../src/middleware/errorHandler.js';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const err = new AppError('BOOKING_DATE_CONFLICT', 409, 'Date conflict', { conflicting_booking_id: 42 });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe('AppError');
    expect(err.errorCode).toBe('BOOKING_DATE_CONFLICT');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Date conflict');
    expect(err.details).toEqual({ conflicting_booking_id: 42 });
  });

  it('should default details to null', () => {
    const err = new AppError('VALIDATION_ERROR', 400, 'Validation failed');
    expect(err.details).toBeNull();
  });

  it('should have a stack trace', () => {
    const err = new AppError('INTERNAL_ERROR', 500, 'Something broke');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });
});

describe('errorHandler middleware', () => {
  function createMockRes() {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        res.statusCode = code;
        return res;
      },
      json(data) {
        res.body = data;
        return res;
      },
    };
    return res;
  }

  function createMockReq(overrides = {}) {
    return { path: '/api/test', method: 'GET', user: null, ...overrides };
  }

  it('should return structured response for AppError', () => {
    const err = new AppError('DUPLICATE_EMAIL', 409, 'Email already exists', { email: 'test@test.com' });
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      error_code: 'DUPLICATE_EMAIL',
      message: 'Email already exists',
      details: { email: 'test@test.com' },
    });
  });

  it('should return structured response for AppError without details', () => {
    const err = new AppError('FORBIDDEN', 403, 'Access denied');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error_code: 'FORBIDDEN',
      message: 'Access denied',
      details: null,
    });
  });

  it('should return 500 with generic message for unknown errors', () => {
    const err = new Error('Database connection failed');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('should not expose internal error details for unknown errors', () => {
    const err = new Error('SELECT * FROM users WHERE password_hash = ...');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.body.message).toBe('An unexpected error occurred');
    expect(res.body.details).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('SELECT');
  });

  it('should handle errors when req.user is present', () => {
    const err = new AppError('RESOURCE_NOT_FOUND', 404, 'Not found');
    const req = createMockReq({ user: { id: 5 } });
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(404);
    expect(res.body.error_code).toBe('RESOURCE_NOT_FOUND');
  });
});
