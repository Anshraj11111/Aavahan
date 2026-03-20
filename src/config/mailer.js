'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10, // max 10 messages/second
  connectionTimeout: 5000, // 5 second timeout
  greetingTimeout: 5000,
});

// Verify connection on startup (non-fatal) - skip in development
if (env.NODE_ENV === 'production') {
  transporter.verify((err) => {
    if (err) {
      console.warn('[Mailer] SMTP verification failed:', err.message);
    } else {
      console.log('[Mailer] SMTP ready');
    }
  });
} else {
  console.log('[Mailer] SMTP verification skipped in development mode');
}

module.exports = transporter;
