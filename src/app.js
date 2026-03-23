'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

// ─── Route imports ───────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const publicRoutes = require('./modules/public/public.routes');
const registrationRoutes = require('./modules/registrations/registration.routes');
const adminRegistrationRoutes = require('./modules/registrations/registration.admin.routes');
const eventRoutes = require('./modules/events/event.routes');
const ticketRoutes = require('./modules/tickets/ticket.routes');
const checkinRoutes = require('./modules/checkin/checkin.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const announcementRoutes = require('./modules/announcements/announcement.routes');
const coordinatorRoutes = require('./modules/coordinators/coordinator.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const exportRoutes = require('./modules/exports/export.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(compression());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: env.FEST_NAME }));

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/public`, publicRoutes);
app.use(`${API}/registrations`, registrationRoutes);
app.use(`${API}/admin/registrations`, adminRegistrationRoutes);
app.use(`${API}/admin/events`, eventRoutes);
app.use(`${API}/admin/tickets`, ticketRoutes);
app.use(`${API}/admin/checkin`, checkinRoutes);
app.use(`${API}/admin/payment-config`, paymentRoutes);
app.use(`${API}/admin/announcements`, announcementRoutes);
app.use(`${API}/admin/coordinators`, coordinatorRoutes);
app.use(`${API}/admin/dashboard`, dashboardRoutes);
app.use(`${API}/admin/exports`, exportRoutes);
app.use(`${API}/admin`, adminRoutes);

// ─── Swagger docs (mounted after routes) ─────────────────────────────────────
// Swagger is configured in Task 24; placeholder here
try {
  const { swaggerUi, swaggerSpec } = require('./config/swagger');
  app.use(`${API}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (_) {
  // swagger config not yet available
}

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
