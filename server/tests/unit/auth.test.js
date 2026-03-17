import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../../src/config/index.js';
import { authenticate } from '../../src/middleware/auth.js';
import { authorize } from '../../src/middleware/rbac.js';

// ─── Helpers ────────────────────────────────────────────────

function createMockReq(overrides = {}) {
  return { headers: {}, user: null, ...overrides };
}

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '1h', ...options });
}

// ─── authenticate middleware ────────────────────────────────

describe('authenticate middleware', () => {
  it('should attach user to req for a valid token', () => {
    const payload = { id: 1, role: 'Admin', preferred_lang: 'CN' };
    const token = signToken(payload);
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = vi.fn();

    authenticate(req, createMockRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject(payload);
  });

  it('should throw TOKEN_INVALID when no Authorization header', () => {
    const req = createMockReq();
    const next = vi.fn();

    expect(() => authenticate(req, createMockRes(), next)).toThrow('Missing or invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw TOKEN_INVALID when Authorization header has no Bearer prefix', () => {
    const req = createMockReq({ headers: { authorization: 'Basic abc123' } });
    const next = vi.fn();

    expect(() => authenticate(req, createMockRes(), next)).toThrow('Missing or invalid token');
  });

  it('should throw TOKEN_INVALID for a malformed token', () => {
    const req = createMockReq({ headers: { authorization: 'Bearer not.a.valid.token' } });
    const next = vi.fn();

    expect(() => authenticate(req, createMockRes(), next)).toThrow('Invalid token');
  });

  it('should throw TOKEN_EXPIRED for an expired token', () => {
    const token = jwt.sign(
      { id: 1, role: 'Staff', preferred_lang: 'EN' },
      config.jwt.secret,
      { expiresIn: '0s' },
    );
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = vi.fn();

    // Small delay to ensure token is expired
    expect(() => authenticate(req, createMockRes(), next)).toThrow('Token has expired');
  });

  it('should throw TOKEN_INVALID for a token signed with wrong secret', () => {
    const token = jwt.sign({ id: 1, role: 'Admin', preferred_lang: 'CN' }, 'wrong-secret');
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = vi.fn();

    expect(() => authenticate(req, createMockRes(), next)).toThrow('Invalid token');
  });

  it('should only extract id, role, preferred_lang from token', () => {
    const token = signToken({ id: 5, role: 'Staff', preferred_lang: 'EN', extra: 'data' });
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const next = vi.fn();

    authenticate(req, createMockRes(), next);

    expect(req.user).toEqual({ id: 5, role: 'Staff', preferred_lang: 'EN' });
    expect(req.user.extra).toBeUndefined();
  });
});

// ─── authorize (RBAC) middleware ────────────────────────────

describe('authorize middleware', () => {
  it('should call next when user role is in allowed list', () => {
    const middleware = authorize('Admin', 'Staff');
    const req = createMockReq({ user: { id: 1, role: 'Admin' } });
    const next = vi.fn();

    middleware(req, createMockRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should throw FORBIDDEN when user role is not in allowed list', () => {
    const middleware = authorize('Admin');
    const req = createMockReq({ user: { id: 2, role: 'Staff' } });
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow('Access denied');
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw FORBIDDEN when req.user is null', () => {
    const middleware = authorize('Admin');
    const req = createMockReq({ user: null });
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow('Access denied');
  });

  it('should throw FORBIDDEN when req.user is undefined', () => {
    const middleware = authorize('Admin');
    const req = createMockReq();
    delete req.user;
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow('Access denied');
  });

  it('should allow Staff when Staff is in the allowed roles', () => {
    const middleware = authorize('Staff');
    const req = createMockReq({ user: { id: 3, role: 'Staff' } });
    const next = vi.fn();

    middleware(req, createMockRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });
});
