'use strict';

const { getRedisClient } = require('../config/redis');

const COUNTER_KEY_PREFIX = 'reg:counter:event:';

/**
 * Atomically generate the next sequential registration number for a specific event.
 * Uses Redis INCR to safely handle concurrent requests.
 * Falls back to timestamp-based ID if Redis is unavailable.
 *
 * Format: Sequential number per event (1, 2, 3, ...)
 *
 * @param {string} eventId - The event ID to generate registration number for
 * @returns {Promise<number>} Sequential registration number for the event
 */
async function generateRegistrationId(eventId) {
  const redis = getRedisClient();
  
  // If Redis is not available, use timestamp-based number
  if (!redis) {
    const timestamp = Date.now();
    return timestamp;
  }
  
  // Use Redis counter for atomic increments per event
  const counterKey = `${COUNTER_KEY_PREFIX}${eventId}`;
  const counter = await redis.incr(counterKey);
  return counter;
}

module.exports = generateRegistrationId;
