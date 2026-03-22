'use strict';

const { getRedisClient } = require('../config/redis');

const COUNTER_KEY = 'reg:counter';
const PREFIX = 'SRGTF2026';
const PAD_LENGTH = 6;

/**
 * Atomically generate the next unique registration ID.
 * Uses Redis INCR to safely handle concurrent requests.
 * Falls back to timestamp-based ID if Redis is unavailable.
 *
 * Format: SRGTF2026-000001 (with Redis) or SRGTF2026-TIMESTAMP (without Redis)
 *
 * @returns {Promise<string>} Unique registration ID
 */
async function generateRegistrationId() {
  const redis = getRedisClient();
  
  // If Redis is not available, use timestamp-based ID
  if (!redis) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${PREFIX}-${timestamp}${random}`;
  }
  
  // Use Redis counter for atomic increments
  const counter = await redis.incr(COUNTER_KEY);
  const padded = String(counter).padStart(PAD_LENGTH, '0');
  return `${PREFIX}-${padded}`;
}

module.exports = generateRegistrationId;
