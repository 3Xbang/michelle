import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const roomService = await import('../../src/services/roomService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleRoom = {
  id: 1,
  room_name_cn: '海景别墅A',
  room_name_en: 'Sea View Villa A',
  room_type: 'villa',
  room_group_id: null,
  auto_assign: false,
  base_daily_rate: '1500.00',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getAll ─────────────────────────────────────────────────

describe('roomService.getAll', () => {
  it('should return all rooms ordered by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleRoom] });

    const result = await roomService.getAll();

    expect(result).toEqual([sampleRoom]);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY id'),
    );
  });

  it('should return empty array when no rooms', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await roomService.getAll();

    expect(result).toEqual([]);
  });
});

// ─── getById ────────────────────────────────────────────────

describe('roomService.getById', () => {
  it('should return room by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleRoom] });

    const result = await roomService.getById(1);

    expect(result).toEqual(sampleRoom);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should throw RESOURCE_NOT_FOUND when room not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await roomService.getById(999);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).toBe('Room not found');
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
    }
  });
});

// ─── create ─────────────────────────────────────────────────

describe('roomService.create', () => {
  it('should create a room with all fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleRoom] });

    const result = await roomService.create({
      room_name_cn: '海景别墅A',
      room_name_en: 'Sea View Villa A',
      room_type: 'villa',
      base_daily_rate: 1500,
      status: 'active',
      room_group_id: 2,
      auto_assign: true,
    });

    expect(result).toEqual(sampleRoom);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO rooms'),
      ['海景别墅A', 'Sea View Villa A', 'villa', 1500, 'active', 2, true],
    );
  });

  it('should use default status=active, room_group_id=null, auto_assign=false', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleRoom] });

    await roomService.create({
      room_name_cn: '测试房源',
      room_name_en: 'Test Room',
      room_type: 'homestay',
      base_daily_rate: 800,
    });

    const insertCall = mockQuery.mock.calls[0];
    expect(insertCall[1][4]).toBe('active');       // status default
    expect(insertCall[1][5]).toBeNull();            // room_group_id default
    expect(insertCall[1][6]).toBe(false);           // auto_assign default
  });
});

// ─── update ─────────────────────────────────────────────────

describe('roomService.update', () => {
  it('should update provided fields only', async () => {
    const updated = { ...sampleRoom, room_name_cn: '新名称' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await roomService.update(1, { room_name_cn: '新名称' });

    expect(result.room_name_cn).toBe('新名称');
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('room_name_cn = $1');
    expect(sql).toContain('WHERE id = $2');
    expect(mockQuery.mock.calls[0][1]).toEqual(['新名称', 1]);
  });

  it('should update multiple fields', async () => {
    const updated = { ...sampleRoom, status: 'maintenance', base_daily_rate: '2000.00' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await roomService.update(1, {
      base_daily_rate: 2000,
      status: 'maintenance',
    });

    expect(result.status).toBe('maintenance');
    const params = mockQuery.mock.calls[0][1];
    expect(params).toContain(2000);
    expect(params).toContain('maintenance');
    expect(params[params.length - 1]).toBe(1); // id is last
  });

  it('should support room_group_id and auto_assign fields', async () => {
    const updated = { ...sampleRoom, room_group_id: 3, auto_assign: true };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    await roomService.update(1, { room_group_id: 3, auto_assign: true });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('room_group_id');
    expect(sql).toContain('auto_assign');
  });

  it('should throw RESOURCE_NOT_FOUND when room not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await roomService.update(999, { status: 'maintenance' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).toBe('Room not found');
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
    }
  });

  it('should return existing room when no fields provided', async () => {
    // getById is called internally when no fields
    mockQuery.mockResolvedValueOnce({ rows: [sampleRoom] });

    const result = await roomService.update(1, {});

    expect(result).toEqual(sampleRoom);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should ignore unknown fields', async () => {
    const updated = { ...sampleRoom };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    await roomService.update(1, { unknown_field: 'value', room_name_en: 'New' });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).not.toContain('unknown_field');
    expect(sql).toContain('room_name_en');
  });
});
