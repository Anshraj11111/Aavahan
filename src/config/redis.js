'use strict';

const env = require('./env');

let redisClient = null;
let redisAvailable = false;

function getRedisClient() {
  return redisClient;
}

function isRedisAvailable() {
  return redisAvailable;
}

async function connectRedis() {
  // If no Redis URL or explicitly disabled, skip silently
  if (!env.REDIS_URL || env.REDIS_URL === 'disabled') {
    console.warn('[Redis] Disabled — caching will be bypassed');
    return null;
  }

  try {
    const Redis = require('ioredis');

    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return times * 300;
      },
    });

    redisClient.on('error', () => {}); // suppress error logs after initial connect

    await redisClient.connect();
    await redisClient.ping();

    redisAvailable = true;
    console.log('[Redis] Connected');
    return redisClient;
  } catch (err) {
    console.warn('[Redis] Not available — caching bypassed. Start Redis to enable caching.');
    redisClient = null;
    redisAvailable = false;
    return null;
  }
}

module.exports = { getRedisClient, connectRedis, isRedisAvailable };
