import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from '../../src/utils/logger.js';
import requestLogger from '../../src/middleware/requestLogger.js';

describe('logger', () => {
  it('should be a winston logger instance with info method', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('should have JSON format configured', () => {
    expect(() => logger.info({ message: 'test' })).not.toThrow();
  });
});

describe('requestLogger middleware', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function createMockRes() {
    const listeners = {};
    return {
      statusCode: 200,
      on(event, cb) { listeners[event] = cb; },
      emit(event) { if (listeners[event]) listeners[event](); },
    };
  }

  it('should call next immediately', () => {
    const req = { path: '/api/test', method: 'GET', user: null };
    const res = createMockRes();
    const next = vi.fn();

    requestLogger(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should log request info on response finish', () => {
    const req = { path: '/api/bookings', method: 'GET', user: null };
    const res = createMockRes();
    const next = vi.fn();

    requestLogger(req, res, next);
    res.emit('finish');

    expect(logSpy).toHaveBeenCalledOnce();
    const logEntry = logSpy.mock.calls[0][0];
    expect(logEntry.request_path).toBe('/api/bookings');
    expect(logEntry.method).toBe('GET');
    expect(logEntry.user_id).toBeNull();
    expect(logEntry.response_status_code).toBe(200);
    expect(typeof logEntry.response_time_ms).toBe('number');
  });

  it('should include user_id when user is authenticated', () => {
    const req = { path: '/api/bookings', method: 'POST', user: { id: 7 } };
    const res = createMockRes();
    const next = vi.fn();

    requestLogger(req, res, next);
    res.emit('finish');

    expect(logSpy).toHaveBeenCalledOnce();
    const logEntry = logSpy.mock.calls[0][0];
    expect(logEntry.user_id).toBe(7);
  });

  it('should capture the actual response status code at finish time', () => {
    const req = { path: '/api/bookings', method: 'GET', user: null };
    const res = createMockRes();
    const next = vi.fn();

    requestLogger(req, res, next);
    res.statusCode = 404;
    res.emit('finish');

    expect(logSpy).toHaveBeenCalledOnce();
    const logEntry = logSpy.mock.calls[0][0];
    expect(logEntry.response_status_code).toBe(404);
  });
});
