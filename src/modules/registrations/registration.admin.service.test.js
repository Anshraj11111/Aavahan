'use strict';

// Feature: techfest-2026-backend
// Property 10: Approval sets all required fields
// Property 11: QR ticket payload completeness
// Property 12: Rejection sets all required fields
// Validates: Requirements 7.1, 7.2, 7.4, 8.1

const fc = require('fast-check');
const mongoose = require('mongoose');

jest.mock('./registration.model');
jest.mock('../events/event.model');
jest.mock('../../utils/generateQR', () => jest.fn(async () => 'https://cloudinary.com/qr-test.png'));
jest.mock('../../utils/auditLog', () => jest.fn(async () => {}));
jest.mock('../../services/email', () => ({
  sendApprovalEmail: jest.fn(async () => {}),
  sendRejectionEmail: jest.fn(async () => {}),
}));

const Registration = require('./registration.model');
const { approveRegistration, rejectRegistration } = require('./registration.admin.service');

const mockAdmin = { _id: new mongoose.Types.ObjectId(), email: 'admin@test.com' };
const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'test' } };

function makeReg(overrides = {}) {
  const reg = {
    _id: new mongoose.Types.ObjectId(),
    uniqueRegistrationId: 'SRGTF2026-000001',
    fullName: 'Test Student',
    email: 'student@test.com',
    eventTitle: 'Test Event',
    eventDay: 'Day 1',
    participationType: 'solo',
    registrationStatus: 'pending',
    paymentStatus: 'pending_verification',
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    adminRemarks: '',
    qrCodeUrl: '',
    ticketData: null,
    ...overrides,
  };
  reg.save = jest.fn(async () => reg);
  return reg;
}

describe('Admin Registration Service', () => {
  beforeEach(() => jest.clearAllMocks());

  // Property 10: Approval sets all required fields
  describe('Property 10: Approval sets all required fields', () => {
    test('after approval: paymentStatus=paid, registrationStatus=approved, approvedBy set, approvedAt set, qrCodeUrl non-empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }),
          async (_seed) => {
            const reg = makeReg();
            Registration.findById.mockResolvedValue(reg);

            const result = await approveRegistration({ registrationId: reg._id, admin: mockAdmin, req: mockReq });

            expect(result.paymentStatus).toBe('paid');
            expect(result.registrationStatus).toBe('approved');
            expect(result.approvedBy).toEqual(mockAdmin._id);
            expect(result.approvedAt).toBeInstanceOf(Date);
            expect(result.qrCodeUrl).toBeTruthy();
            expect(result.qrCodeUrl.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 11: QR ticket payload completeness
  describe('Property 11: QR ticket payload completeness', () => {
    test('ticketData contains all required fields after approval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (fullName, eventTitle) => {
            const reg = makeReg({ fullName, eventTitle });
            Registration.findById.mockResolvedValue(reg);

            const result = await approveRegistration({ registrationId: reg._id, admin: mockAdmin, req: mockReq });

            expect(result.ticketData).toBeTruthy();
            expect(result.ticketData.uniqueRegistrationId).toBe(reg.uniqueRegistrationId);
            expect(result.ticketData.fullName).toBe(fullName);
            expect(result.ticketData.eventTitle).toBe(eventTitle);
            expect(result.ticketData.eventDay).toBeDefined();
            expect(result.ticketData.participationType).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 12: Rejection sets all required fields
  describe('Property 12: Rejection sets all required fields', () => {
    test('after rejection: registrationStatus=rejected, paymentStatus=rejected, rejectedBy set, rejectedAt set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (reason) => {
            const reg = makeReg();
            Registration.findById.mockResolvedValue(reg);

            const result = await rejectRegistration({ registrationId: reg._id, reason, admin: mockAdmin, req: mockReq });

            expect(result.registrationStatus).toBe('rejected');
            expect(result.paymentStatus).toBe('rejected');
            expect(result.rejectedBy).toEqual(mockAdmin._id);
            expect(result.rejectedAt).toBeInstanceOf(Date);
            expect(result.adminRemarks).toBe(reason);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
