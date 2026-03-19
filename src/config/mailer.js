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
});

// Verify connection on startup (non-fatal)
transporter.verify((err) => {
  if (err) {
    console.warn('[Mailer] SMTP verification failed:', err.message);
  } else {
    console.log('[Mailer] SMTP ready');
  }
});

module.exports = transporter;
