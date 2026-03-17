import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const bookingService = await import('../../src/services/bookingService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleBooking = {
  id: 1,
  room_id: 1,
  created_by: 1,
  guest_name: 'John Doe',
  check_in: '2024-03-01',
  check_out: '2024-03-05',
  rental_type: 'daily',
  platform_source: 'Airbnb',
  total_revenue: '5000.00',
  commission: '750.00',
  net_income: '4250.00',
  external_order_id: null,
  raw_email_content: null,
  currency: 'THB',
  booking_status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── validateStatusTransition ───────────────────────────────

describe('bookingService.validateStatusTransition', () => {
  it('should allow pending → checked_in', () => {
    expect(() => bookingService.validateStatusTransition('pending', 'checked_in')).not.toThrow();
  });

  it('should allow checked_in → checked_out', () => {
    expect(() => bookingService.validateStatusTransition('checked_in', 'checked_out')).not.toThrow();
  });

  it('should reject pending → checked_out (skip)', () => {
    try {
      bookingService.validateStatusTransition('pending', 'checked_out');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('INVALID_STATUS_TRANSITION');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should reject checked_out → pending (reverse)', () => {
    try {
      bookingService.validateStatusTransition('checked_out', 'pending');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('INVALID_STATUS_TRANSITION');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should reject checked_out → checked_in (reverse)', () => {
    try {
      bookingService.validateStatusTransition('checked_out', 'checked_in');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('INVALID_STATUS_TRANSITION');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should reject checked_in → pending (reverse)', () => {
    try {
      bookingService.validateStatusTransition('checked_in', 'pending');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('INVALID_STATUS_TRANSITION');
      expect(err.statusCode).toBe(400);
    }
  });
});

// ─── getById ────────────────────────────────────────────────

describe('bookingService.getById', () => {
  it('should return booking when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    const result = await bookingService.getById(1);

    expect(result).toEqual(sampleBooking);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should throw RESOURCE_NOT_FOUND when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await bookingService.getById(999);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Booking not found');
    }
  });
});

// ─── create ─────────────────────────────────────────────────

describe('bookingService.create', () => {
  it('should create booking with auto-calculated net_income', async () => {
    // First call: date conflict check (no conflicts)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Second call: INSERT
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    const result = await bookingService.create({
      room_id: 1,
      guest_name: 'John Doe',
      check_in: '2024-03-01',
      check_out: '2024-03-05',
      rental_type: 'daily',
      platform_source: 'Airbnb',
      total_revenue: 5000,
      commission: 750,
    }, 1);

    expect(result).toEqual(sampleBooking);

    // Verify INSERT was called with calculated net_income = 5000 - 750 = 4250
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO bookings');
    expect(insertCall[1][8]).toBe(750);    // commission
    expect(insertCall[1][9]).toBe(4250);   // net_income
  });

  it('should throw BOOKING_DATE_CONFLICT when dates overlap', async () => {
    // Date conflict check returns a conflicting booking
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] });

    try {
      await bookingService.create({
        room_id: 1,
        guest_name: 'Jane Doe',
        check_in: '2024-03-02',
        check_out: '2024-03-06',
        rental_type: 'daily',
        platform_source: 'Agoda',
        total_revenue: 3000,
        commission: 300,
      }, 1);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('BOOKING_DATE_CONFLICT');
      expect(err.statusCode).toBe(409);
      expect(err.details.conflicting_booking_id).toBe(42);
    }
  });

  it('should use default values for optional fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    await bookingService.create({
      room_id: 1,
      guest_name: 'Test',
      check_in: '2024-04-01',
      check_out: '2024-04-05',
      rental_type: 'daily',
      platform_source: 'Airbnb',
      total_revenue: 1000,
      commission: 100,
    }, 1);

    const insertParams = mockQuery.mock.calls[1][1];
    // booking_status default = 'pending'
    expect(insertParams[13]).toBe('pending');
    // currency default = 'THB'
    expect(insertParams[12]).toBe('THB');
  });
});

// ─── update ─────────────────────────────────────────────────

describe('bookingService.update', () => {
  it('should update booking and recalculate net_income', async () => {
    // First call: getById (existing booking)
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });
    // Second call: date conflict check (no conflicts)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Third call: UPDATE
    const updatedBooking = { ...sampleBooking, total_revenue: '6000.00', net_income: '5250.00' };
    mockQuery.mockResolvedValueOnce({ rows: [updatedBooking] });

    const result = await bookingService.update(1, { total_revenue: 6000 });

    expect(result.total_revenue).toBe('6000.00');
    // Verify UPDATE was called with recalculated net_income = 6000 - 750 = 5250
    const updateCall = mockQuery.mock.calls[2];
    expect(updateCall[0]).toContain('UPDATE bookings SET');
    expect(updateCall[1][6]).toBe(6000);   // total_revenue
    expect(updateCall[1][8]).toBe(5250);   // net_income
  });

  it('should exclude self in date conflict check during edit', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    await bookingService.update(1, { guest_name: 'Updated Name' });

    // Date conflict query should include AND id != $4
    const conflictCall = mockQuery.mock.calls[1];
    expect(conflictCall[0]).toContain('AND id != $4');
    expect(conflictCall[1][3]).toBe(1); // excludeBookingId
  });

  it('should throw BOOKING_DATE_CONFLICT when edit causes overlap', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] });

    try {
      await bookingService.update(1, { check_in: '2024-03-10', check_out: '2024-03-15' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('BOOKING_DATE_CONFLICT');
      expect(err.statusCode).toBe(409);
    }
  });
});

// ─── updateStatus ───────────────────────────────────────────

describe('bookingService.updateStatus', () => {
  it('should update status with valid transition', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] }); // getById
    const updated = { ...sampleBooking, booking_status: 'checked_in' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] }); // UPDATE

    const result = await bookingService.updateStatus(1, 'checked_in');

    expect(result.booking_status).toBe('checked_in');
    expect(mockQuery.mock.calls[1][0]).toContain('UPDATE bookings SET booking_status');
  });

  it('should throw INVALID_STATUS_TRANSITION for invalid transition', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] }); // getById (pending)

    try {
      await bookingService.updateStatus(1, 'checked_out');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('INVALID_STATUS_TRANSITION');
      expect(err.statusCode).toBe(400);
    }
  });
});

// ─── list ───────────────────────────────────────────────────

describe('bookingService.list', () => {
  it('should return paginated results with defaults', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '50' }] }); // COUNT
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });   // SELECT

    const result = await bookingService.list({});

    expect(result.total).toBe(50);
    expect(result.total_pages).toBe(3); // ceil(50/20)
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.data).toEqual([sampleBooking]);
  });

  it('should apply room_id filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '5' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ room_id: 3 });

    const countSql = mockQuery.mock.calls[0][0];
    expect(countSql).toContain('room_id = $1');
    expect(mockQuery.mock.calls[0][1]).toEqual([3]);
  });

  it('should apply status filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ status: 'pending' });

    const countSql = mockQuery.mock.calls[0][0];
    expect(countSql).toContain('booking_status = $1');
  });

  it('should apply platform filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '3' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ platform: 'Airbnb' });

    const countSql = mockQuery.mock.calls[0][0];
    expect(countSql).toContain('platform_source = $1');
  });

  it('should apply date range filters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '10' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ from: '2024-01-01', to: '2024-01-31' });

    const countSql = mockQuery.mock.calls[0][0];
    expect(countSql).toContain('check_out > $1');
    expect(countSql).toContain('check_in < $2');
  });

  it('should apply multiple filters together', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ room_id: 1, status: 'pending', platform: 'Airbnb' });

    const countSql = mockQuery.mock.calls[0][0];
    expect(countSql).toContain('room_id = $1');
    expect(countSql).toContain('booking_status = $2');
    expect(countSql).toContain('platform_source = $3');
  });

  it('should handle custom sort and order', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '10' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ sort: 'check_in', order: 'asc' });

    const dataSql = mockQuery.mock.calls[1][0];
    expect(dataSql).toContain('ORDER BY check_in ASC');
  });

  it('should fallback to created_at for invalid sort column', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '10' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.list({ sort: 'malicious_column' });

    const dataSql = mockQuery.mock.calls[1][0];
    expect(dataSql).toContain('ORDER BY created_at');
  });

  it('should calculate total_pages correctly', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '21' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await bookingService.list({ page_size: 10 });

    expect(result.total_pages).toBe(3); // ceil(21/10)
  });

  it('should return 0 total_pages when no results', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await bookingService.list({});

    expect(result.total).toBe(0);
    expect(result.total_pages).toBe(0);
  });

  it('should handle custom page and page_size', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '100' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await bookingService.list({ page: 3, page_size: 10 });

    expect(result.page).toBe(3);
    expect(result.page_size).toBe(10);
    expect(result.total_pages).toBe(10);

    // Verify OFFSET = (3-1) * 10 = 20
    const dataParams = mockQuery.mock.calls[1][1];
    expect(dataParams[dataParams.length - 1]).toBe(20); // offset
    expect(dataParams[dataParams.length - 2]).toBe(10); // limit
  });
});

// ─── getCalendarData ────────────────────────────────────────

describe('bookingService.getCalendarData', () => {
  it('should query bookings for the given month with active rooms', async () => {
    const calendarBooking = {
      ...sampleBooking,
      room_name_cn: '海景别墅A',
      room_name_en: 'Sea View Villa A',
      room_status: 'active',
    };
    mockQuery.mockResolvedValueOnce({ rows: [calendarBooking] });

    const result = await bookingService.getCalendarData(2024, 3);

    expect(result).toEqual([calendarBooking]);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain("r.status = 'active'");
    expect(sql).toContain('b.check_in < $2');
    expect(sql).toContain('b.check_out > $1');
    // Params: startDate = 2024-03-01, endDate = 2024-04-01
    expect(mockQuery.mock.calls[0][1]).toEqual(['2024-03-01', '2024-04-01']);
  });

  it('should handle December correctly (year rollover)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await bookingService.getCalendarData(2024, 12);

    // endDate should be 2025-01-01
    expect(mockQuery.mock.calls[0][1]).toEqual(['2024-12-01', '2025-01-01']);
  });

  it('should return empty array when no bookings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await bookingService.getCalendarData(2024, 6);

    expect(result).toEqual([]);
  });
});

// ─── Date conflict detection (non-overlapping) ─────────────

describe('date conflict detection', () => {
  it('should not conflict when dates do not overlap (new after existing)', async () => {
    // No conflict found
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // INSERT succeeds
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    // Existing: Mar 1-5, New: Mar 6-10 (no overlap)
    const result = await bookingService.create({
      room_id: 1,
      guest_name: 'Test',
      check_in: '2024-03-06',
      check_out: '2024-03-10',
      rental_type: 'daily',
      platform_source: 'Airbnb',
      total_revenue: 1000,
      commission: 100,
    }, 1);

    expect(result).toEqual(sampleBooking);
  });

  it('should not conflict when new booking ends exactly when existing starts', async () => {
    // No conflict found (adjacent dates are OK)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [sampleBooking] });

    await bookingService.create({
      room_id: 1,
      guest_name: 'Test',
      check_in: '2024-02-25',
      check_out: '2024-03-01', // ends exactly when existing starts
      rental_type: 'daily',
      platform_source: 'Airbnb',
      total_revenue: 1000,
      commission: 100,
    }, 1);

    // Should succeed without throwing
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
