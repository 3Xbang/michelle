import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createTicketValidation } from '../validators/ticketValidator.js';
import * as ticketService from '../services/ticketService.js';

const router = Router();

// ─── Multer configuration ───────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/tickets
 * Authenticated - list tickets with optional filters (status, issue_type, room_id).
 */
router.get('/', async (req, res, next) => {
  try {
    const tickets = await ticketService.list(req.query);
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tickets/:id
 * Authenticated - get single ticket.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await ticketService.getById(req.params.id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets
 * Authenticated - create ticket (multipart/form-data with image upload).
 */
router.post(
  '/',
  upload.array('photos', 5),
  validate(createTicketValidation),
  async (req, res, next) => {
    try {
      const photoUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);
      const ticket = await ticketService.create(req.body, req.user.id, photoUrls);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/tickets/:id/complete
 * Admin only - mark ticket as completed.
 */
router.patch(
  '/:id/complete',
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const ticket = await ticketService.markComplete(req.params.id);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
