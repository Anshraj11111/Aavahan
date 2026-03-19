'use strict';

// Feature: techfest-2026-backend
// Property 13: Duplicate check-in prevention
// Property 14: Check-in sets correct state
// Validates: Requirements 9.2, 9.3

const fc = require('fast-check');
const mongoose = require('mongoose');

jest.mock('../registrations/registration.model');
jest.mock('./checkin.model');
jest.mock('../../utils/auditLog', () => jest.fn(async () => {}));

const Registration = require('../registrations/registration.model');
const CheckInLog = require('./checkin.model');
const { verifyAndCheckIn } = require('./checkin.service');

const mockAdmin = { _id: new mongoose.Types.ObjectId(), email: 'admin@test.com' };
const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'test' } };

function makeReg(overrides = {}) {
  const reg = {
    _id: new mongoose.Types.ObjectId(),
    uniqueRegistrationId: 'SRGTF2026-000001',
    fullName: 'Test Student',
    email: 'student@test.com',
    eventId: new mongoose.Types.ObjectId(),
    eventTitle: 'Test Event',
    eventDay: 'Day 1',
    participationType: 'solo',
    registrationStatus: 'approved',
    checkedIn: false,
    checkedInAt: null,
    ...overrides,
  };
  reg.save = jest.fn(async () => reg);
  return reg;
}

describe('Check-In Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CheckInLog.create.mockResolvedValue({});
  });

  // Property 13: Duplicate check-in prevention
  describe('Property 13: Duplicate check-in prevention', () => {
    test('second check-in returns 409', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 1000 }),
          async (_seed) => {
            const reg = makeReg({ checkedIn: true, registrationStatus: 'checked_in' });
            Registration.findOne.mockResolvedValue(reg);

            try {
              await verifyAndCheckIn({ uniqueRegistrationId: reg.uniqueRegistrationId, admin: mockAdmin, req: mockReq });
              expect(true).toBe(false); // should not reach
            } catch (err) {
              expect(err.statusCode).toBe(409);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 14: Check-in sets correct state
  describe('Property 14: Check-in sets correct state', () => {
    test('after check-in: checkedIn=true, checkedInAt set, registrationStatus=checked_in', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 1000 }),
          async (_seed) => {
            const reg = makeReg();
            Registration.findOne.mockResolvedValue(reg);

            const result = await verifyAndCheckIn({ uniqueRegistrationId: reg.uniqueRegistrationId, admin: mockAdmin, req: mockReq });

            expect(result.checkedIn).toBe(true);
            expect(result.checkedInAt).toBeInstanceOf(Date);
            expect(result.registrationStatus).toBe('checked_in');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
