import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../../src/config/index.js';

// Mock the db pool before importing authService
vi.mock('../../src/models/db.js', () => {
  return {
    default: {
      query: vi.fn(),
    },
  };
});

// Import after mock setup
const { login } = await import('../../src/services/authService.js');
const pool = (await import('../../src/models/db.js')).default;

describe('authService.login', () => {
  const testUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@villapms.com',
    password_hash: null, // set in beforeEach
    role: 'Admin',
    preferred_lang: 'CN',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    testUser.password_hash = await bcrypt.hash('correct-password', 10);
  });

  it('should return token and user on valid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [testUser] });

    const result = await login('admin@villapms.com', 'correct-password');

    expect(result).toHaveProperty('token');
    expect(result.user).toEqual({
      id: 1,
      name: 'Admin User',
      role: 'Admin',
      preferred_lang: 'CN',
    });

    // Verify the token contains correct claims
    const decoded = jwt.verify(result.token, config.jwt.secret);
    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe('Admin');
    expect(decoded.preferred_lang).toBe('CN');
  });

  it('should throw INVALID_CREDENTIALS for non-existent email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(login('nobody@test.com', 'password'))
      .rejects.toThrow('Invalid email or password');
  });

  it('should throw INVALID_CREDENTIALS for wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [testUser] });

    await expect(login('admin@villapms.com', 'wrong-password'))
      .rejects.toThrow('Invalid email or password');
  });

  it('should query the database with the provided email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    try { await login('test@example.com', 'pw'); } catch { /* expected */ }

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com'],
    );
  });

  it('should sign JWT with configured secret and expiry', async () => {
    pool.query.mockResolvedValueOnce({ rows: [testUser] });

    const result = await login('admin@villapms.com', 'correct-password');
    const decoded = jwt.verify(result.token, config.jwt.secret);

    // Token should have exp claim
    expect(decoded).toHaveProperty('exp');
    expect(decoded).toHaveProperty('iat');
  });

  it('should return Staff user data correctly', async () => {
    const staffUser = {
      ...testUser,
      id: 2,
      name: 'Staff User',
      email: 'staff@villapms.com',
      role: 'Staff',
      preferred_lang: 'EN',
    };
    staffUser.password_hash = await bcrypt.hash('staff-pass', 10);
    pool.query.mockResolvedValueOnce({ rows: [staffUser] });

    const result = await login('staff@villapms.com', 'staff-pass');

    expect(result.user.role).toBe('Staff');
    expect(result.user.preferred_lang).toBe('EN');

    const decoded = jwt.verify(result.token, config.jwt.secret);
    expect(decoded.role).toBe('Staff');
    expect(decoded.preferred_lang).toBe('EN');
  });
});
