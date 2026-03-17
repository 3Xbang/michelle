import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingValidation, updateBookingValidation } from '../validators/bookingValidator.js';
import * as bookingService from '../services/bookingService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/bookings
 * Authenticated - list bookings with filters, sorting, pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await bookingService.list(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/calendar
 * Authenticated - calendar data by month (query: year, month).
 */
router.get('/calendar', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Valid year and month (1-12) are required',
      });
    }
    const data = await bookingService.getCalendarData(year, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/:id
 * Authenticated - get single booking.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getById(req.params.id);
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings
 * Authenticated - create a new booking.
 */
router.post(
  '/',
  validate(createBookingValidation),
  async (req, res, next) => {
    try {
      const booking = await bookingService.create(req.body, req.user.id);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/bookings/:id
 * Authenticated - edit booking.
 */
router.put(
  '/:id',
  validate(updateBookingValidation),
  async (req, res, next) => {
    try {
      const booking = await bookingService.update(req.params.id, req.body);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/bookings/:id/status
 * Authenticated - update booking status.
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { booking_status } = req.body;
    if (!booking_status) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'booking_status is required',
      });
    }
    const booking = await bookingService.updateStatus(req.params.id, booking_status);
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

export default router;
