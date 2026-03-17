import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock pool ──────────────────────────────────────────────

const mockQuery = vi.fn();
vi.mock('../../src/models/db.js', () => ({ default: { query: (...args) => mockQuery(...args) } }));

// Import after mocking
const ticketService = await import('../../src/services/ticketService.js');

// ─── Helpers ────────────────────────────────────────────────

const sampleTicket = {
  id: 1,
  room_id: 3,
  created_by: 1,
  issue_type: 'plumbing',
  description: 'Leaking faucet in bathroom',
  priority: 'urgent',
  ticket_status: 'pending',
  photo_urls: [],
  completed_at: null,
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── create ─────────────────────────────────────────────────

describe('ticketService.create', () => {
  it('should create a ticket without photo_urls', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleTicket] });

    const result = await ticketService.create({
      room_id: 3,
      issue_type: 'plumbing',
      description: 'Leaking faucet in bathroom',
      priority: 'urgent',
    }, 1);

    expect(result).toEqual(sampleTicket);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('INSERT INTO tickets');
    const params = mockQuery.mock.calls[0][1];
    expect(params[0]).toBe(3);           // room_id
    expect(params[1]).toBe(1);           // created_by
    expect(params[2]).toBe('plumbing');  // issue_type
    expect(params[3]).toBe('Leaking faucet in bathroom'); // description
    expect(params[4]).toBe('urgent');    // priority
    expect(params[5]).toBe('[]');        // photo_urls (empty JSON array)
  });

  it('should create a ticket with photo_urls', async () => {
    const ticketWithPhotos = { ...sampleTicket, photo_urls: ['/uploads/a.jpg', '/uploads/b.png'] };
    mockQuery.mockResolvedValueOnce({ rows: [ticketWithPhotos] });

    const result = await ticketService.create({
      room_id: 3,
      issue_type: 'furniture',
      description: 'Broken chair',
    }, 2, ['/uploads/a.jpg', '/uploads/b.png']);

    expect(result.photo_urls).toEqual(['/uploads/a.jpg', '/uploads/b.png']);
    const params = mockQuery.mock.calls[0][1];
    expect(params[5]).toBe('["/uploads/a.jpg","/uploads/b.png"]');
  });

  it('should use default priority=normal when not provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...sampleTicket, priority: 'normal' }] });

    await ticketService.create({
      room_id: 3,
      issue_type: 'cleaning',
      description: 'Room needs cleaning',
    }, 1);

    const params = mockQuery.mock.calls[0][1];
    expect(params[4]).toBe('normal'); // priority default
  });
});

// ─── list ───────────────────────────────────────────────────

describe('ticketService.list', () => {
  it('should return all tickets when no filters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleTicket] });

    const result = await ticketService.list({});

    expect(result).toEqual([sampleTicket]);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('ORDER BY created_at DESC');
    expect(sql).not.toContain('WHERE');
  });

  it('should filter by status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleTicket] });

    await ticketService.list({ status: 'pending' });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('ticket_status = $1');
    expect(mockQuery.mock.calls[0][1]).toEqual(['pending']);
  });

  it('should filter by issue_type', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await ticketService.list({ issue_type: 'network' });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('issue_type = $1');
    expect(mockQuery.mock.calls[0][1]).toEqual(['network']);
  });

  it('should filter by room_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await ticketService.list({ room_id: 5 });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('room_id = $1');
    expect(mockQuery.mock.calls[0][1]).toEqual([5]);
  });

  it('should apply multiple filters together', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await ticketService.list({ status: 'completed', issue_type: 'plumbing', room_id: 2 });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('ticket_status = $1');
    expect(sql).toContain('issue_type = $2');
    expect(sql).toContain('room_id = $3');
    expect(mockQuery.mock.calls[0][1]).toEqual(['completed', 'plumbing', 2]);
  });

  it('should return empty array when no tickets match', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await ticketService.list({ status: 'completed' });

    expect(result).toEqual([]);
  });
});

// ─── getById ────────────────────────────────────────────────

describe('ticketService.getById', () => {
  it('should return ticket when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleTicket] });

    const result = await ticketService.getById(1);

    expect(result).toEqual(sampleTicket);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1],
    );
  });

  it('should throw RESOURCE_NOT_FOUND when ticket not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await ticketService.getById(999);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Ticket not found');
    }
  });
});

// ─── markComplete ───────────────────────────────────────────

describe('ticketService.markComplete', () => {
  it('should mark pending ticket as completed with timestamp', async () => {
    // First call: getById
    mockQuery.mockResolvedValueOnce({ rows: [sampleTicket] });
    // Second call: UPDATE
    const completedTicket = {
      ...sampleTicket,
      ticket_status: 'completed',
      completed_at: '2024-06-02T10:00:00Z',
    };
    mockQuery.mockResolvedValueOnce({ rows: [completedTicket] });

    const result = await ticketService.markComplete(1);

    expect(result.ticket_status).toBe('completed');
    expect(result.completed_at).toBe('2024-06-02T10:00:00Z');
    const updateSql = mockQuery.mock.calls[1][0];
    expect(updateSql).toContain("ticket_status = 'completed'");
    expect(updateSql).toContain('completed_at = NOW()');
    expect(updateSql).toContain('WHERE id = $1');
  });

  it('should return existing ticket if already completed', async () => {
    const alreadyCompleted = {
      ...sampleTicket,
      ticket_status: 'completed',
      completed_at: '2024-06-02T10:00:00Z',
    };
    mockQuery.mockResolvedValueOnce({ rows: [alreadyCompleted] });

    const result = await ticketService.markComplete(1);

    expect(result.ticket_status).toBe('completed');
    // Should only call getById, no UPDATE
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should throw RESOURCE_NOT_FOUND when ticket does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    try {
      await ticketService.markComplete(999);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(err.statusCode).toBe(404);
    }
  });
});
