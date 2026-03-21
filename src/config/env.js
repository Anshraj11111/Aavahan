'use strict';

require('dotenv').config();

/**
 * Validates that a required environment variable exists.
 * Throws on startup if any required var is missing.
 */
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  isProduction: optional('NODE_ENV', 'development') === 'production',

  // MongoDB
  MONGODB_URI: required('MONGODB_URI'),

  // Redis (optional - can be disabled)
  REDIS_URL: optional('REDIS_URL', 'disabled'),

  // JWT
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  // Cloudinary (optional for local dev)
  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: optional('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET', ''),

  // SMTP (optional)
  SMTP_HOST: optional('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_SECURE: optional('SMTP_SECURE', 'false') === 'true',
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASS: optional('SMTP_PASS', ''),
  EMAIL_FROM: optional('EMAIL_FROM', 'Tech Fest 2026 <noreply@techfest2026.com>'),

  // CORS
  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),

  // Admin alert
  ADMIN_ALERT_EMAIL: optional('ADMIN_ALERT_EMAIL', ''),

  // Fest info
  FEST_NAME: optional('FEST_NAME', 'Tech Fest 2026'),
  FEST_ORG: optional('FEST_ORG', 'Shri Ram Group, Jabalpur'),
  FEST_TAGLINE: optional('FEST_TAGLINE', 'Innovate. Compete. Celebrate.'),
  FEST_START_DATE: optional('FEST_START_DATE', '2026-04-01'),
  FEST_END_DATE: optional('FEST_END_DATE', '2026-04-03'),
};

module.exports = env;
