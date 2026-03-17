import { describe, it, expect } from 'vitest';
import { body } from 'express-validator';
import { validate } from '../../src/middleware/validate.js';
import { createBookingValidation, updateBookingValidation } from '../../src/validators/bookingValidator.js';
import { createRoomValidation, updateRoomValidation } from '../../src/validators/roomValidator.js';
import { createTicketValidation } from '../../src/validators/ticketValidator.js';
import { createUserValidation, updateUserValidation } from '../../src/validators/userValidator.js';

/**
 * Helper: run the validate middleware against a mock request and return the response.
 */
async function runValidation(validations, bodyData) {
  const req = { body: bodyData, params: {}, query: {} };
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      jsonBody = data;
      return res;
    },
  };

  const next = () => { nextCalled = true; };
  const middleware = validate(validations);
  await middleware(req, res, next);

  return { statusCode, jsonBody, nextCalled };
}

// ─── validate middleware ────────────────────────────────────────────

describe('validate middleware', () => {
  it('should call next() when validation passes', async () => {
    const validations = [body('name').notEmpty()];
    const { nextCalled, statusCode } = await runValidation(validations, { name: 'Alice' });
    expect(nextCalled).toBe(true);
    expect(statusCode).toBeNull();
  });

  it('should return 400 with VALIDATION_ERROR on failure', async () => {
    const validations = [body('name').notEmpty().withMessage('姓名不能为空')];
    const { statusCode, jsonBody, nextCalled } = await runValidation(validations, { name: '' });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(400);
    expect(jsonBody.error_code).toBe('VALIDATION_ERROR');
    expect(jsonBody.message).toBe('数据验证失败');
    expect(jsonBody.details.fields.name).toBe('姓名不能为空');
  });

  it('should collect multiple field errors', async () => {
    const validations = [
      body('a').notEmpty().withMessage('a required'),
      body('b').isInt().withMessage('b must be int'),
    ];
    const { jsonBody } = await runValidation(validations, { a: '', b: 'xyz' });
    expect(jsonBody.details.fields.a).toBe('a required');
    expect(jsonBody.details.fields.b).toBe('b must be int');
  });
});

// ─── bookingValidator ───────────────────────────────────────────────

describe('bookingValidator', () => {
  const validBooking = {
    guest_name: 'John',
    room_id: 1,
    check_in: '2024-06-01',
    check_out: '2024-06-05',
    rental_type: 'daily',
    platform_source: 'Airbnb',
    total_revenue: 5000,
    commission: 750,
  };

  it('should pass with valid booking data', async () => {
    const { nextCalled } = await runValidation(createBookingValidation, validBooking);
    expect(nextCalled).toBe(true);
  });

  it('should reject empty guest_name', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, guest_name: '' });
    expect(jsonBody.details.fields.guest_name).toBeDefined();
  });

  it('should reject non-integer room_id', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, room_id: 'abc' });
    expect(jsonBody.details.fields.room_id).toBeDefined();
  });

  it('should reject check_out <= check_in', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, {
      ...validBooking,
      check_in: '2024-06-05',
      check_out: '2024-06-05',
    });
    expect(jsonBody.details.fields.check_out).toBeDefined();
  });

  it('should reject check_out before check_in', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, {
      ...validBooking,
      check_in: '2024-06-10',
      check_out: '2024-06-05',
    });
    expect(jsonBody.details.fields.check_out).toBeDefined();
  });

  it('should reject invalid rental_type', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, rental_type: 'weekly' });
    expect(jsonBody.details.fields.rental_type).toBeDefined();
  });

  it('should reject invalid platform_source', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, platform_source: 'Unknown' });
    expect(jsonBody.details.fields.platform_source).toBeDefined();
  });

  it('should accept all 12 valid platform sources', async () => {
    const platforms = ['Airbnb', 'Agoda', 'Booking.com', 'Trip.com', '途家', '小猪', '美团民宿', '飞猪', 'Expedia', 'VRBO', '直客', '其他'];
    for (const p of platforms) {
      const { nextCalled } = await runValidation(createBookingValidation, { ...validBooking, platform_source: p });
      expect(nextCalled).toBe(true);
    }
  });

  it('should reject negative total_revenue', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, total_revenue: -1 });
    expect(jsonBody.details.fields.total_revenue).toBeDefined();
  });

  it('should reject negative commission', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, commission: -5 });
    expect(jsonBody.details.fields.commission).toBeDefined();
  });

  it('should accept optional booking_status when valid', async () => {
    const { nextCalled } = await runValidation(createBookingValidation, { ...validBooking, booking_status: 'checked_in' });
    expect(nextCalled).toBe(true);
  });

  it('should reject invalid booking_status', async () => {
    const { jsonBody } = await runValidation(createBookingValidation, { ...validBooking, booking_status: 'cancelled' });
    expect(jsonBody.details.fields.booking_status).toBeDefined();
  });

  it('updateBookingValidation should pass with partial valid data', async () => {
    const { nextCalled } = await runValidation(updateBookingValidation, { guest_name: 'Jane' });
    expect(nextCalled).toBe(true);
  });
});

// ─── roomValidator ──────────────────────────────────────────────────

describe('roomValidator', () => {
  const validRoom = {
    room_name_cn: '清迈别墅A',
    room_name_en: 'Chiang Mai Villa A',
    room_type: 'villa',
    base_daily_rate: 1500,
  };

  it('should pass with valid room data', async () => {
    const { nextCalled } = await runValidation(createRoomValidation, validRoom);
    expect(nextCalled).toBe(true);
  });

  it('should reject empty room_name_cn', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, room_name_cn: '' });
    expect(jsonBody.details.fields.room_name_cn).toBeDefined();
  });

  it('should reject empty room_name_en', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, room_name_en: '' });
    expect(jsonBody.details.fields.room_name_en).toBeDefined();
  });

  it('should reject invalid room_type', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, room_type: 'house' });
    expect(jsonBody.details.fields.room_type).toBeDefined();
  });

  it('should reject base_daily_rate of 0', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, base_daily_rate: 0 });
    expect(jsonBody.details.fields.base_daily_rate).toBeDefined();
  });

  it('should reject negative base_daily_rate', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, base_daily_rate: -100 });
    expect(jsonBody.details.fields.base_daily_rate).toBeDefined();
  });

  it('should accept optional valid status', async () => {
    const { nextCalled } = await runValidation(createRoomValidation, { ...validRoom, status: 'maintenance' });
    expect(nextCalled).toBe(true);
  });

  it('should reject invalid status', async () => {
    const { jsonBody } = await runValidation(createRoomValidation, { ...validRoom, status: 'deleted' });
    expect(jsonBody.details.fields.status).toBeDefined();
  });

  it('updateRoomValidation should pass with partial data', async () => {
    const { nextCalled } = await runValidation(updateRoomValidation, { room_name_cn: '新名称' });
    expect(nextCalled).toBe(true);
  });
});

// ─── ticketValidator ────────────────────────────────────────────────

describe('ticketValidator', () => {
  const validTicket = {
    room_id: 1,
    issue_type: 'plumbing',
    description: 'Water leak in bathroom',
  };

  it('should pass with valid ticket data', async () => {
    const { nextCalled } = await runValidation(createTicketValidation, validTicket);
    expect(nextCalled).toBe(true);
  });

  it('should reject non-integer room_id', async () => {
    const { jsonBody } = await runValidation(createTicketValidation, { ...validTicket, room_id: 'abc' });
    expect(jsonBody.details.fields.room_id).toBeDefined();
  });

  it('should reject invalid issue_type', async () => {
    const { jsonBody } = await runValidation(createTicketValidation, { ...validTicket, issue_type: 'electrical' });
    expect(jsonBody.details.fields.issue_type).toBeDefined();
  });

  it('should accept all valid issue types', async () => {
    for (const t of ['plumbing', 'furniture', 'cleaning', 'network', 'other']) {
      const { nextCalled } = await runValidation(createTicketValidation, { ...validTicket, issue_type: t });
      expect(nextCalled).toBe(true);
    }
  });

  it('should reject empty description', async () => {
    const { jsonBody } = await runValidation(createTicketValidation, { ...validTicket, description: '' });
    expect(jsonBody.details.fields.description).toBeDefined();
  });

  it('should accept optional valid priority', async () => {
    const { nextCalled } = await runValidation(createTicketValidation, { ...validTicket, priority: 'urgent' });
    expect(nextCalled).toBe(true);
  });

  it('should reject invalid priority', async () => {
    const { jsonBody } = await runValidation(createTicketValidation, { ...validTicket, priority: 'low' });
    expect(jsonBody.details.fields.priority).toBeDefined();
  });
});

// ─── userValidator ──────────────────────────────────────────────────

describe('userValidator', () => {
  const validUser = {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'Admin',
  };

  it('should pass with valid user data', async () => {
    const { nextCalled } = await runValidation(createUserValidation, validUser);
    expect(nextCalled).toBe(true);
  });

  it('should reject empty name', async () => {
    const { jsonBody } = await runValidation(createUserValidation, { ...validUser, name: '' });
    expect(jsonBody.details.fields.name).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const { jsonBody } = await runValidation(createUserValidation, { ...validUser, email: 'not-an-email' });
    expect(jsonBody.details.fields.email).toBeDefined();
  });

  it('should reject invalid role', async () => {
    const { jsonBody } = await runValidation(createUserValidation, { ...validUser, role: 'SuperAdmin' });
    expect(jsonBody.details.fields.role).toBeDefined();
  });

  it('should accept optional valid preferred_lang', async () => {
    const { nextCalled } = await runValidation(createUserValidation, { ...validUser, preferred_lang: 'EN' });
    expect(nextCalled).toBe(true);
  });

  it('should reject invalid preferred_lang', async () => {
    const { jsonBody } = await runValidation(createUserValidation, { ...validUser, preferred_lang: 'TH' });
    expect(jsonBody.details.fields.preferred_lang).toBeDefined();
  });

  it('should accept optional phone', async () => {
    const { nextCalled } = await runValidation(createUserValidation, { ...validUser, phone: '+66123456789' });
    expect(nextCalled).toBe(true);
  });

  it('updateUserValidation should pass with partial data', async () => {
    const { nextCalled } = await runValidation(updateUserValidation, { name: 'Bob' });
    expect(nextCalled).toBe(true);
  });
});
