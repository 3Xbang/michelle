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
import platformRoutes from './routes/platforms.js';
import agentRoutes from './routes/agents.js';
import ownerRoutes from './routes/owners.js';
import uploadRoutes from './routes/upload.js';
// Sales CRM routes
import salesPropertiesRoutes from './routes/sales/properties.js';
import salesCustomersRoutes from './routes/sales/customers.js';
import salesViewingRecordsRoutes from './routes/sales/viewingRecords.js';
import salesIntentsRoutes from './routes/sales/intents.js';
import salesReportsRoutes from './routes/sales/reports.js';
import salesRemindersRoutes from './routes/sales/reminders.js';
import salesAdMaterialsRoutes from './routes/sales/adMaterials.js';
import publicInquiryRoutes from './routes/public/inquiry.js';
import publicMiraaRoutes from './routes/public/miraa.js';
import miraaPropertiesRoutes from './routes/miraa/properties.js';
import miraaBannersRoutes from './routes/miraa/banners.js';
import miraaSettingsRoutes from './routes/miraa/settings.js';

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
app.use('/api/platforms', platformRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/upload', uploadRoutes);
// Sales CRM
app.use('/api/sales/properties', salesPropertiesRoutes);
app.use('/api/sales/customers', salesCustomersRoutes);
app.use('/api/sales/viewing-records', salesViewingRecordsRoutes);
app.use('/api/sales/intents', salesIntentsRoutes);
app.use('/api/sales/reports', salesReportsRoutes);
app.use('/api/sales/reminders', salesRemindersRoutes);
app.use('/api/sales/ad-materials', salesAdMaterialsRoutes);
// Public (no auth)
app.use('/api/public/inquiry', publicInquiryRoutes);
app.use('/api/public/miraa', publicMiraaRoutes);
// Miraa CMS (Admin only)
app.use('/api/miraa/properties', miraaPropertiesRoutes);
app.use('/api/miraa/banners', miraaBannersRoutes);
app.use('/api/miraa/settings', miraaSettingsRoutes);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global error handler (must be last)
app.use(errorHandler);

export default app;
