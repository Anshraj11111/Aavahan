'use strict';

// Feature: techfest-2026-backend
// Property 2: UniqueRegistrationId format invariant
// Property 3: Concurrent ID uniqueness
// Validates: Requirements 5.3, 15.7

const fc = require('fast-check');

// Mock ioredis so tests don't need a real Redis connection
jest.mock('../config/redis', () => {
  let counter = 0;
  const mockClient = {
    incr: jest.fn(async () => ++counter),
    ping: jest.fn(async () => 'PONG'),
    on: jest.fn(),
  };
  return {
    getRedisClient: () => mockClient,
    connectRedis: async () => mockClient,
  };
});

const generateRegistrationId = require('./generateRegistrationId');

const ID_REGEX = /^SRGTF2026-\d{6}$/;

describe('generateRegistrationId', () => {
  beforeEach(() => {
    // Reset counter mock between tests
    const { getRedisClient } = require('../config/redis');
    const client = getRedisClient();
    let counter = 0;
    client.incr.mockImplementation(async () => ++counter);
  });

  // Property 2: UniqueRegistrationId format invariant
  test('Property 2: every generated ID matches SRGTF2026-XXXXXX format', async () => {
    // Feature: techfest-2026-backend, Property 2: UniqueRegistrationId format invariant
    // Validates: Requirements 5.3
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (n) => {
        const { getRedisClient } = require('../config/redis');
        const client = getRedisClient();
        let seq = 0;
        client.incr.mockImplementation(async () => ++seq);

        const ids = await Promise.all(Array.from({ length: n }, () => generateRegistrationId()));
        for (const id of ids) {
          expect(id).toMatch(ID_REGEX);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 3: Concurrent ID uniqueness
  test('Property 3: N concurrent ID generations produce N distinct IDs', async () => {
    // Feature: techfest-2026-backend, Property 3: Concurrent ID uniqueness
    // Validates: Requirements 5.3, 15.7
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 50 }), async (n) => {
        const { getRedisClient } = require('../config/redis');
        const client = getRedisClient();
        let seq = 0;
        client.incr.mockImplementation(async () => ++seq);

        const ids = await Promise.all(Array.from({ length: n }, () => generateRegistrationId()));
        const unique = new Set(ids);
        expect(unique.size).toBe(n);
      }),
      { numRuns: 100 }
    );
  });

  test('ID is zero-padded to 6 digits', async () => {
    const { getRedisClient } = require('../config/redis');
    const client = getRedisClient();
    client.incr.mockResolvedValueOnce(1);
    const id = await generateRegistrationId();
    expect(id).toBe('SRGTF2026-000001');
  });

  test('ID with counter 999999 is correctly formatted', async () => {
    const { getRedisClient } = require('../config/redis');
    const client = getRedisClient();
    client.incr.mockResolvedValueOnce(999999);
    const id = await generateRegistrationId();
    expect(id).toBe('SRGTF2026-999999');
  });
});
