'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Admin login: 10 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Registration submission: 100 per hour per IP (very lenient for techfest)
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after 1 hour.',
  },
});

/**
 * File upload: 100 per hour per IP (very lenient for techfest)
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many file uploads. Please try again after 1 hour.',
  },
});

/**
 * Payment verification: 20 per hour per IP (more lenient for verification attempts)
 */
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again after 1 hour.',
  },
});

/**
 * Check-in: 60 per minute per IP
 */
const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many check-in requests. Please slow down.',
  },
});

/**
 * General API: 200 per minute per IP (global protection)
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = { authLimiter, registrationLimiter, uploadLimiter, verificationLimiter, checkinLimiter, generalLimiter };
