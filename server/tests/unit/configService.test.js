import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const configService = await import('../../src/services/configService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleConfig = {
  id: 1,
  config_key: 'site_name',
  config_value: 'Villa PMS',
  feature_switch: true,
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getAll ─────────────────────────────────────────────────

describe('configService.getAll', () => {
  it('should return all configs ordered by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleConfig] });

    const result = await configService.getAll();

    expect(result).toEqual([sampleConfig]);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY id'),
    );
  });

  it('should return empty array when no configs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await configService.getAll();

    expect(result).toEqual([]);
  });
});

// ─── create ─────────────────────────────────────────────────

describe('configService.create', () => {
  it('should create a config entry successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleConfig] });

    const result = await configService.create({
      config_key: 'site_name',
      config_value: 'Villa PMS',
      feature_switch: true,
    });

    expect(result).toEqual(sampleConfig);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO config'),
      ['site_name', 'Villa PMS', true],
    );
  });

  it('should use defaults for config_value and feature_switch', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...sampleConfig, config_value: null }] });

    await configService.create({ config_key: 'new_key' });

    const insertCall = mockQuery.mock.calls[0];
    expect(insertCall[1][1]).toBeNull();   // config_value default
    expect(insertCall[1][2]).toBe(true);   // feature_switch default
  });

  it('should throw DUPLICATE_CONFIG_KEY on duplicate config_key', async () => {
    const pgError = new Error('duplicate key');
    pgError.code = '23505';
    mockQuery.mockRejectedValueOnce(pgError);

    try {
      await configService.create({ config_key: 'existing_key' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('DUPLICATE_CONFIG_KEY');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Config key already exists');
    }
  });

  it('should rethrow non-duplicate errors', async () => {
    const genericError = new Error('connection lost');
    mockQuery.mockRejectedValueOnce(genericError);

    await expect(
      configService.create({ config_key: 'key' }),
    ).rejects.toThrow('connection lost');
  });
});

// ─── update ─────────────────────────────────────────────────

describe('configService.update', () => {
  it('should update config_value', async () => {
    const updated = { ...sampleConfig, config_value: 'New Value' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await configService.update(1, { config_value: 'New Value' });

    expect(result.config_value).toBe('New Value');
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('config_value = $1');
    expect(sql).toContain('WHERE id = $2');
  });

  it('should update feature_switch', async () => {
    const updated = { ...sampleConfig, feature_switch: false };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await configService.update(1, { feature_switch: false });

    expect(result.feature_switch).toBe(false);
    const params = mockQuery.mock.calls[0][1];
    expect(params).toContain(false);
  });

  it('should update both config_value and feature_switch', async () => {
    const updated = { ...sampleConfig, config_value: 'Updated', feature_switch: false };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await configService.update(1, {
      config_value: 'Updated',
      feature_switch: false,
    });

    expect(result.config_value).toBe('Updated');
    expect(result.feature_switch).toBe(false);
    const params = mockQuery.mock.calls[0][1];
    expect(params).toContain('Updated');
    expect(params).toContain(false);
    expect(params[params.length - 1]).toBe(1); // id is last
  });

  it('should throw RESOURCE_NOT_FOUND when config not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await configService.update(999, { config_value: 'x' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Config not found');
    }
  });

  it('should return existing config when no fields provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleConfig] });

    const result = await configService.update(1, {});

    expect(result).toEqual(sampleConfig);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should throw RESOURCE_NOT_FOUND when no fields and config not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await configService.update(999, {});
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
    }
  });
});
