import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const userService = await import('../../src/services/userService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'Staff',
  preferred_lang: 'CN',
  phone: '1234567890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getAll ─────────────────────────────────────────────────

describe('userService.getAll', () => {
  it('should return all users', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const result = await userService.getAll();

    expect(result).toEqual([sampleUser]);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
    );
  });

  it('should return empty array when no users', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await userService.getAll();

    expect(result).toEqual([]);
  });
});

// ─── getById ────────────────────────────────────────────────

describe('userService.getById', () => {
  it('should return user by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const result = await userService.getById(1);

    expect(result).toEqual(sampleUser);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should throw RESOURCE_NOT_FOUND when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(userService.getById(999)).rejects.toThrow('User not found');
  });
});

// ─── create ─────────────────────────────────────────────────

describe('userService.create', () => {
  it('should create user with hashed password', async () => {
    // Email uniqueness check
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // INSERT
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const result = await userService.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'secret123',
      role: 'Staff',
    });

    expect(result).toEqual(sampleUser);
    // Verify the INSERT call has a bcrypt hash (starts with $2)
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1][2]).toMatch(/^\$2[aby]\$/);
  });

  it('should throw DUPLICATE_EMAIL when email exists', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await expect(
      userService.create({
        name: 'Dup',
        email: 'existing@example.com',
        password: 'pass',
        role: 'Staff',
      }),
    ).rejects.toThrow('Email already exists');
  });

  it('should use default preferred_lang CN when not provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    await userService.create({
      name: 'Test',
      email: 'new@example.com',
      password: 'pass',
      role: 'Staff',
    });

    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1][4]).toBe('CN');
  });
});

// ─── update ─────────────────────────────────────────────────

describe('userService.update', () => {
  it('should update user fields', async () => {
    const updated = { ...sampleUser, name: 'Updated Name' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await userService.update(1, { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
  });

  it('should throw RESOURCE_NOT_FOUND when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(userService.update(999, { name: 'X' })).rejects.toThrow('User not found');
  });

  it('should return existing user when no fields provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const result = await userService.update(1, {});

    expect(result).toEqual(sampleUser);
  });
});

// ─── getMe ──────────────────────────────────────────────────

describe('userService.getMe', () => {
  it('should return current user profile', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const result = await userService.getMe(1);

    expect(result).toEqual(sampleUser);
  });
});

// ─── updateMe ───────────────────────────────────────────────

describe('userService.updateMe', () => {
  it('should update own profile fields', async () => {
    const updated = { ...sampleUser, name: 'New Name' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await userService.updateMe(1, { name: 'New Name' });

    expect(result.name).toBe('New Name');
  });

  it('should only allow name, phone, preferred_lang', async () => {
    const updated = { ...sampleUser, phone: '999' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    await userService.updateMe(1, { phone: '999', email: 'hack@evil.com', role: 'Admin' });

    // The SET clause should only contain phone, not email or role
    const sql = mockQuery.mock.calls[0][0];
    const setClause = sql.split('SET')[1].split('WHERE')[0];
    expect(setClause).toContain('phone');
    expect(setClause).not.toContain('email');
    expect(setClause).not.toContain('role');
  });
});

// ─── changePassword ─────────────────────────────────────────

describe('userService.changePassword', () => {
  it('should change password when old password is correct', async () => {
    const hash = await bcrypt.hash('oldpass', 10);
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      userService.changePassword(1, 'oldpass', 'newpass'),
    ).resolves.toBeUndefined();

    // Verify the UPDATE call has a bcrypt hash
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1][0]).toMatch(/^\$2[aby]\$/);
  });

  it('should throw INVALID_OLD_PASSWORD when old password is wrong', async () => {
    const hash = await bcrypt.hash('correct', 10);
    mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: hash }] });

    await expect(
      userService.changePassword(1, 'wrong', 'newpass'),
    ).rejects.toThrow('Old password is incorrect');
  });

  it('should throw RESOURCE_NOT_FOUND when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      userService.changePassword(999, 'old', 'new'),
    ).rejects.toThrow('User not found');
  });
});
