'use strict';

const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Cron jobs
const startCloseExpiredEventsJob = require('./jobs/closeExpiredEvents');
const startCloseFullEventsJob = require('./jobs/closeFullEvents');
const startPendingVerificationReminderJob = require('./jobs/pendingVerificationReminder');

let server;

async function start() {
  // Connect to MongoDB
  await connectDB();

  // Connect to Redis
  await connectRedis();

  // Start cron jobs
  startCloseExpiredEventsJob();
  startCloseFullEventsJob();
  startPendingVerificationReminderJob();

  // Start HTTP server
  server = app.listen(env.PORT, () => {
    console.log(`[Server] ${env.FEST_NAME} API running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
  shutdown('unhandledRejection');
});

start().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
