import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const reportService = await import('../../src/services/reportService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleByRoom = [
  {
    room_id: 1,
    room_name_cn: '海景别墅A',
    room_name_en: 'Sea View Villa A',
    total_revenue: '15000.00',
    total_commission: '2250.00',
    total_net_income: '12750.00',
  },
  {
    room_id: 2,
    room_name_cn: '花园公寓B',
    room_name_en: 'Garden Apartment B',
    total_revenue: '8000.00',
    total_commission: '800.00',
    total_net_income: '7200.00',
  },
];

const sampleByRentalType = [
  { rental_type: 'daily', total_revenue: '10000.00', total_commission: '1500.00', total_net_income: '8500.00' },
  { rental_type: 'monthly', total_revenue: '30000.00', total_commission: '3000.00', total_net_income: '27000.00' },
];

const sampleByPlatform = [
  { platform_source: 'Airbnb', total_revenue: '20000.00', total_commission: '3000.00', total_net_income: '17000.00' },
  { platform_source: 'Agoda', total_revenue: '5000.00', total_commission: '500.00', total_net_income: '4500.00' },
];

const sampleByMonth = [
  { month: '2024-01', total_revenue: '12000.00', total_commission: '1800.00', total_net_income: '10200.00' },
  { month: '2024-02', total_revenue: '9000.00', total_commission: '900.00', total_net_income: '8100.00' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── aggregateByRoom ────────────────────────────────────────

describe('reportService.aggregateByRoom', () => {
  it('should return aggregated data grouped by room', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByRoom });

    const result = await reportService.aggregateByRoom();

    expect(result).toEqual(sampleByRoom);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('room_id');
    expect(result[0]).toHaveProperty('room_name_cn');
    expect(result[0]).toHaveProperty('room_name_en');
    expect(result[0]).toHaveProperty('total_revenue');
    expect(result[0]).toHaveProperty('total_commission');
    expect(result[0]).toHaveProperty('total_net_income');
  });

  it('should apply date range filter when from/to provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByRoom });

    await reportService.aggregateByRoom('2024-01-01', '2024-12-31');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('b.check_in >= $1');
    expect(sql).toContain('b.check_out <= $2');
    expect(mockQuery.mock.calls[0][1]).toEqual(['2024-01-01', '2024-12-31']);
  });

  it('should return empty array when no bookings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await reportService.aggregateByRoom();

    expect(result).toEqual([]);
  });
});

// ─── aggregateByRentalType ──────────────────────────────────

describe('reportService.aggregateByRentalType', () => {
  it('should return aggregated data grouped by rental type', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByRentalType });

    const result = await reportService.aggregateByRentalType();

    expect(result).toEqual(sampleByRentalType);
    expect(result[0]).toHaveProperty('rental_type');
    expect(result[0]).toHaveProperty('total_revenue');
    expect(result[0]).toHaveProperty('total_commission');
    expect(result[0]).toHaveProperty('total_net_income');
  });

  it('should apply date range filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await reportService.aggregateByRentalType('2024-06-01', '2024-06-30');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('b.check_in >= $1');
    expect(sql).toContain('b.check_out <= $2');
  });

  it('should return empty array when no bookings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await reportService.aggregateByRentalType();

    expect(result).toEqual([]);
  });
});


// ─── aggregateByPlatform ────────────────────────────────────

describe('reportService.aggregateByPlatform', () => {
  it('should return aggregated data grouped by platform', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByPlatform });

    const result = await reportService.aggregateByPlatform();

    expect(result).toEqual(sampleByPlatform);
    expect(result[0]).toHaveProperty('platform_source');
    expect(result[0]).toHaveProperty('total_revenue');
  });

  it('should apply date range filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await reportService.aggregateByPlatform('2024-01-01', '2024-03-31');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('b.check_in >= $1');
    expect(sql).toContain('b.check_out <= $2');
    expect(mockQuery.mock.calls[0][1]).toEqual(['2024-01-01', '2024-03-31']);
  });

  it('should return empty array when no bookings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await reportService.aggregateByPlatform();

    expect(result).toEqual([]);
  });
});

// ─── aggregateByMonth ───────────────────────────────────────

describe('reportService.aggregateByMonth', () => {
  it('should return aggregated data grouped by month', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByMonth });

    const result = await reportService.aggregateByMonth();

    expect(result).toEqual(sampleByMonth);
    expect(result[0]).toHaveProperty('month');
    expect(result[0]).toHaveProperty('total_revenue');
    expect(result[0]).toHaveProperty('total_commission');
    expect(result[0]).toHaveProperty('total_net_income');
  });

  it('should apply date range filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await reportService.aggregateByMonth('2024-01-01', '2024-12-31');

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('b.check_in >= $1');
    expect(sql).toContain('b.check_out <= $2');
  });

  it('should return empty array when no bookings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await reportService.aggregateByMonth();

    expect(result).toEqual([]);
  });
});


// ─── generateCsv ────────────────────────────────────────────

describe('reportService.generateCsv', () => {
  it('should generate CSV with BOM for room dimension', () => {
    const csv = reportService.generateCsv('room', sampleByRoom);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('房源ID,房源名称(中),房源名称(英),总收入,总佣金,总净收入');
    expect(csv).toContain('1,海景别墅A,Sea View Villa A,15000.00,2250.00,12750.00');
    expect(csv).toContain('2,花园公寓B,Garden Apartment B,8000.00,800.00,7200.00');
  });

  it('should generate CSV for rental_type dimension', () => {
    const csv = reportService.generateCsv('rental_type', sampleByRentalType);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('租期类型,总收入,总佣金,总净收入');
    expect(csv).toContain('daily,10000.00,1500.00,8500.00');
    expect(csv).toContain('monthly,30000.00,3000.00,27000.00');
  });

  it('should generate CSV for platform dimension', () => {
    const csv = reportService.generateCsv('platform', sampleByPlatform);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('平台来源,总收入,总佣金,总净收入');
    expect(csv).toContain('Airbnb,20000.00,3000.00,17000.00');
  });

  it('should generate CSV for month dimension', () => {
    const csv = reportService.generateCsv('month', sampleByMonth);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('月份,总收入,总佣金,总净收入');
    expect(csv).toContain('2024-01,12000.00,1800.00,10200.00');
  });

  it('should handle empty data array', () => {
    const csv = reportService.generateCsv('room', []);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    // Should only have header line
    const lines = csv.replace('\uFEFF', '').split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('房源ID');
  });

  it('should escape CSV fields with commas', () => {
    const data = [{
      room_id: 1,
      room_name_cn: '海景,别墅A',
      room_name_en: 'Sea View Villa A',
      total_revenue: '1000.00',
      total_commission: '100.00',
      total_net_income: '900.00',
    }];

    const csv = reportService.generateCsv('room', data);

    expect(csv).toContain('"海景,别墅A"');
  });

  it('should escape CSV fields with quotes', () => {
    const data = [{
      room_id: 1,
      room_name_cn: '海景"别墅"A',
      room_name_en: 'Villa A',
      total_revenue: '1000.00',
      total_commission: '100.00',
      total_net_income: '900.00',
    }];

    const csv = reportService.generateCsv('room', data);

    expect(csv).toContain('"海景""别墅""A"');
  });

  it('should throw for unknown dimension', () => {
    expect(() => reportService.generateCsv('unknown', [])).toThrow('Unknown dimension: unknown');
  });
});

// ─── exportCsv ──────────────────────────────────────────────

describe('reportService.exportCsv', () => {
  it('should export CSV for room dimension', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByRoom });

    const csv = await reportService.exportCsv('room', 'monthly');

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('房源ID');
    expect(csv).toContain('海景别墅A');
  });

  it('should export CSV for rental_type dimension', async () => {
    mockQuery.mockResolvedValueOnce({ rows: sampleByRentalType });

    const csv = await reportService.exportCsv('rental_type', 'weekly');

    expect(csv).toContain('租期类型');
    expect(csv).toContain('daily');
  });

  it('should pass date range to aggregator', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await reportService.exportCsv('platform', 'monthly', '2024-01-01', '2024-06-30');

    expect(mockQuery.mock.calls[0][1]).toEqual(['2024-01-01', '2024-06-30']);
  });

  it('should throw for unknown dimension', async () => {
    await expect(reportService.exportCsv('invalid', 'monthly')).rejects.toThrow('Unknown dimension: invalid');
  });
});
