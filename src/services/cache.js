'use strict';

const { getRedisClient } = require('../config/redis');

async function cacheGet(key) {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

async function cacheDel(key) {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.del(key);
  } catch {}
}

async function cacheInvalidatePattern(pattern) {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {}
}

async function invalidateEventCache() {
  await Promise.all([
    cacheInvalidatePattern('events:list:*'),
    cacheDel('events:featured'),
    cacheDel('public:stats'),
  ]);
}

async function invalidateEventSlugCache(slug) {
  await cacheDel(`events:slug:${slug}`);
}

module.exports = {
  cacheGet, cacheSet, cacheDel,
  cacheInvalidatePattern,
  invalidateEventCache,
  invalidateEventSlugCache,
};
