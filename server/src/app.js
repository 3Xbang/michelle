import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import requestLogger from './middleware/requestLogger.js';
import { loginLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import ticketRoutes from './routes/tickets.js';
import reportRoutes from './routes/reports.js';
import configRoutes from './routes/config.js';
import labelRoutes from './routes/labels.js';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// JSON body parsing
app.use(express.json());

// URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/config', configRoutes);
app.use('/api/labels', labelRoutes);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global error handler (must be last)
app.use(errorHandler);

export default app;
