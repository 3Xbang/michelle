import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as reportService from '../services/reportService.js';

const router = Router();

// All report routes require authentication + Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * GET /api/reports/by-room
 * Admin only - aggregate financials by room.
 * Query: ?from=2024-01-01&to=2024-12-31
 */
router.get('/by-room', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.aggregateByRoom(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/by-rental-type
 * Admin only - aggregate financials by rental type.
 */
router.get('/by-rental-type', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.aggregateByRentalType(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/reports/by-platform
 * Admin only - aggregate financials by platform source.
 */
router.get('/by-platform', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.aggregateByPlatform(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/by-month
 * Admin only - aggregate financials by month.
 */
router.get('/by-month', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.aggregateByMonth(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/export
 * Admin only - export report as CSV.
 * Query: ?dimension=room|rental_type|platform|month&granularity=weekly|monthly&from=...&to=...
 */
router.get('/export', async (req, res, next) => {
  try {
    const { dimension, granularity = 'monthly', from, to } = req.query;
    const csv = await reportService.exportCsv(dimension, granularity, from, to);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=report-${dimension}-${timestamp}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
