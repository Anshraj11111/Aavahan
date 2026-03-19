'use strict';

// Feature: techfest-2026-backend
// Property 15: Password hashing
// Property 16: Invalid login returns 401
// Validates: Requirements 3.2, 3.6

const fc = require('fast-check');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../admin/admin.model');
jest.mock('../../utils/auditLog', () => jest.fn(async () => {}));
jest.mock('../../config/env', () => ({
  JWT_SECRET: 'test-secret-key-min-32-chars-long!!',
  JWT_EXPIRES_IN: '7d',
  isProduction: false,
}));

const Admin = require('../admin/admin.model');
const authService = require('./auth.service');

describe('Auth Service', () => {
  // Property 15: Password hashing
  describe('Property 15: Password hashing invariant', () => {
    test('bcrypt hash is never equal to plaintext password', async () => {
      // Feature: techfest-2026-backend, Property 15: Password hashing
      // Validates: Requirements 3.6
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            const hash = await bcrypt.hash(password, 12);
            expect(hash).not.toBe(password);
            const isMatch = await bcrypt.compare(password, hash);
            expect(isMatch).toBe(true);
          }
        ),
        { numRuns: 20 } // bcrypt is slow, keep runs low
      );
    });

    test('bcrypt.compare returns false for wrong password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 30 }),
          fc.string({ minLength: 8, maxLength: 30 }),
          async (password, wrongPassword) => {
            fc.pre(password !== wrongPassword);
            const hash = await bcrypt.hash(password, 10);
            const isMatch = await bcrypt.compare(wrongPassword, hash);
            expect(isMatch).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // Property 16: Invalid login returns 401
  describe('Property 16: Invalid login returns 401', () => {
    test('wrong password throws 401 error', async () => {
      // Feature: techfest-2026-backend, Property 16: Invalid login returns 401
      // Validates: Requirements 3.2
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 30 }),
          fc.string({ minLength: 8, maxLength: 30 }),
          async (correctPassword, wrongPassword) => {
            fc.pre(correctPassword !== wrongPassword);

            const hash = await bcrypt.hash(correctPassword, 10);
            const mockAdmin = {
              _id: 'admin123',
              email: 'test@test.com',
              password: hash,
              isActive: true,
              lastLogin: null,
              comparePassword: async (p) => bcrypt.compare(p, hash),
              save: jest.fn(async () => {}),
              toObject: () => ({ _id: 'admin123', email: 'test@test.com' }),
            };

            Admin.findOne.mockReturnValue({
              select: jest.fn().mockResolvedValue(mockAdmin),
            });

            try {
              await authService.login({
                email: 'test@test.com',
                password: wrongPassword,
                req: { ip: '127.0.0.1', headers: {} },
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (err) {
              expect(err.statusCode).toBe(401);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    test('non-existent admin throws 401', async () => {
      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login({
          email: 'nobody@test.com',
          password: 'somepassword',
          req: { ip: '127.0.0.1', headers: {} },
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    test('inactive admin throws 403', async () => {
      const mockAdmin = {
        _id: 'admin123',
        email: 'inactive@test.com',
        password: 'hash',
        isActive: false,
        comparePassword: jest.fn(),
      };

      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin),
      });

      await expect(
        authService.login({
          email: 'inactive@test.com',
          password: 'password',
          req: { ip: '127.0.0.1', headers: {} },
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('valid credentials return token and admin', async () => {
      const password = 'validPassword123';
      const hash = await bcrypt.hash(password, 10);
      const mockAdmin = {
        _id: 'admin123',
        email: 'admin@test.com',
        password: hash,
        isActive: true,
        lastLogin: null,
        comparePassword: async (p) => bcrypt.compare(p, hash),
        save: jest.fn(async () => {}),
        toObject: () => ({ _id: 'admin123', email: 'admin@test.com', role: 'super_admin' }),
      };

      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin),
      });

      const result = await authService.login({
        email: 'admin@test.com',
        password,
        req: { ip: '127.0.0.1', headers: {} },
      });

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.admin).toBeDefined();
      expect(result.admin.password).toBeUndefined();
    });
  });
});
