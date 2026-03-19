'use strict';

const { getRedisClient } = require('../config/redis');

const COUNTER_KEY = 'reg:counter';
const PREFIX = 'SRGTF2026';
const PAD_LENGTH = 6;

/**
 * Atomically generate the next unique registration ID.
 * Uses Redis INCR to safely handle concurrent requests.
 *
 * Format: SRGTF2026-000001
 *
 * @returns {Promise<string>} Unique registration ID
 */
async function generateRegistrationId() {
  const redis = getRedisClient();
  const counter = await redis.incr(COUNTER_KEY);
  const padded = String(counter).padStart(PAD_LENGTH, '0');
  return `${PREFIX}-${padded}`;
}

module.exports = generateRegistrationId;
