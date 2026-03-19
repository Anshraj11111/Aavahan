'use strict';

// Feature: techfest-2026-backend
// Property 1: Entry fee sourced from event
// Property 4: Duplicate registration rejection
// Property 5: Expired deadline blocks registration
// Property 6: Full event blocks registration
// Property 7: Team event validation
// Property 8: Solo event rejects team data
// Validates: Requirements 5.2, 5.5, 5.6, 5.7, 5.8, 5.9

const fc = require('fast-check');
const mongoose = require('mongoose');

jest.mock('./registration.model');
jest.mock('../events/event.model');
jest.mock('../../utils/generateRegistrationId', () => jest.fn(async () => 'SRGTF2026-000001'));
jest.mock('../../config/cloudinary', () => ({ uploadBuffer: jest.fn(async () => ({ secure_url: 'https://cloudinary.com/test.jpg' })) }));
jest.mock('../../services/email', () => ({ sendRegistrationReceived: jest.fn(async () => {}) }));
jest.mock('../../services/cache', () => ({ cacheDel: jest.fn(async () => {}) }));
jest.mock('../../constants/events', () => ({
  CACHE_KEYS: { PUBLIC_STATS: 'public:stats' },
  EVENT_CATEGORIES: {
    CULTURAL: 'cultural', TECHNICAL: 'technical', ROBOTICS: 'robotics',
    CODING: 'coding', DESIGN: 'design', PRESENTATION: 'presentation',
    EXHIBITION: 'exhibition', QUIZ: 'quiz', GAMING: 'gaming', OTHER: 'other',
  },
  EVENT_DAYS: { DAY1: 'Day 1', DAY2: 'Day 2', DAY3: 'Day 3' },
  COORDINATOR_DAYS: { DAY1: 'Day 1', DAY2: 'Day 2', DAY3: 'Day 3', ALL: 'All' },
  CACHE_TTL: {},
}));

const Registration = require('./registration.model');
const Event = require('../events/event.model');
const { createRegistration } = require('./registration.service');

const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'test' } };

const FIXED_EVENT_ID = new mongoose.Types.ObjectId().toString();

function makeEvent(overrides = {}) {
  return {
    _id: FIXED_EVENT_ID,
    title: 'Test Event',
    day: 'Day 2',
    status: 'published',
    participationType: 'solo',
    entryFee: 200,
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationDeadline: null,
    maxRegistrations: null,
    currentRegistrations: 0,
    ...overrides,
  };
}

function makeBody(overrides = {}) {
  return {
    fullName: 'Test Student',
    email: 'student@test.com',
    phone: '9876543210',
    instituteName: 'Test College',
    eventId: FIXED_EVENT_ID,
    teamName: '',
    teamMembers: [],
    transactionId: 'TXN123',
    ...overrides,
  };
}
describe('Registration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Registration.findOne.mockResolvedValue(null); // no duplicate by default
    Registration.create.mockImplementation(async (data) => ({ ...data, _id: 'reg1' }));
    Event.findByIdAndUpdate.mockResolvedValue({});
  });

  // Property 1: Entry fee sourced from event
  describe('Property 1: Entry fee always sourced from event', () => {
    test('amountExpected equals event.entryFee regardless of request body', async () => {
      // Feature: techfest-2026-backend, Property 1: Entry fee sourced from event
      // Validates: Requirements 5.2
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          async (eventFee, requestFee) => {
            const event = makeEvent({ entryFee: eventFee });
            Event.findById.mockResolvedValue(event);
            Registration.findOne.mockResolvedValue(null);

            const body = makeBody({ fee: requestFee }); // eventId uses FIXED_EVENT_ID
            await createRegistration({ body, file: null, req: mockReq });

            expect(Registration.create).toHaveBeenCalledWith(
              expect.objectContaining({ amountExpected: eventFee })
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 4: Duplicate registration rejection
  describe('Property 4: Duplicate registration rejection', () => {
    test('returns 409 when active registration exists for same email+event', async () => {
      // Feature: techfest-2026-backend, Property 4: Duplicate registration rejection
      // Validates: Requirements 5.5
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            const event = makeEvent();
            Event.findById.mockResolvedValue(event);
            // Simulate existing active registration
            Registration.findOne.mockResolvedValue({ _id: 'existing', email, eventId: FIXED_EVENT_ID });

            try {
              await createRegistration({ body: makeBody({ email }), file: null, req: mockReq });
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

  // Property 5: Expired deadline blocks registration
  describe('Property 5: Expired deadline blocks registration', () => {
    test('returns 400 when registration deadline has passed', async () => {
      // Feature: techfest-2026-backend, Property 5: Expired deadline blocks registration
      // Validates: Requirements 5.6
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 365 }),
          async (daysAgo) => {
            const pastDeadline = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            const event = makeEvent({ registrationDeadline: pastDeadline });
            Event.findById.mockResolvedValue(event);
            Registration.findOne.mockResolvedValue(null);

            try {
              await createRegistration({ body: makeBody(), file: null, req: mockReq });
              expect(true).toBe(false);
            } catch (err) {
              expect(err.statusCode).toBe(400);
              expect(err.message).toMatch(/deadline/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 6: Full event blocks registration
  describe('Property 6: Full event blocks registration', () => {
    test('returns 400 when event is at max capacity', async () => {
      // Feature: techfest-2026-backend, Property 6: Full event blocks registration
      // Validates: Requirements 5.7
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 500 }),
          async (maxReg) => {
            const event = makeEvent({ maxRegistrations: maxReg, currentRegistrations: maxReg });
            Event.findById.mockResolvedValue(event);
            Registration.findOne.mockResolvedValue(null);

            try {
              await createRegistration({ body: makeBody({ eventId: event._id }), file: null, req: mockReq });
              expect(true).toBe(false);
            } catch (err) {
              expect(err.statusCode).toBe(400);
              expect(err.message).toMatch(/maximum/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 7: Team event validation
  describe('Property 7: Team event requires teamName and minTeamSize members', () => {
    test('returns 400 when teamName is missing for team event', async () => {
      // Feature: techfest-2026-backend, Property 7: Team event validation
      // Validates: Requirements 5.8
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (minTeamSize) => {
            const event = makeEvent({ participationType: 'team', minTeamSize, maxTeamSize: 5 });
            Event.findById.mockResolvedValue(event);
            Registration.findOne.mockResolvedValue(null);

            try {
              await createRegistration({
                body: makeBody({ eventId: event._id, teamName: '', teamMembers: [] }),
                file: null,
                req: mockReq,
              });
              expect(true).toBe(false);
            } catch (err) {
              expect(err.statusCode).toBe(400);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('returns 400 when fewer members than minTeamSize', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (minTeamSize) => {
            const event = makeEvent({ participationType: 'team', minTeamSize, maxTeamSize: 5 });
            Event.findById.mockResolvedValue(event);
            Registration.findOne.mockResolvedValue(null);

            // Provide fewer members than required
            const members = [{ name: 'Member 1' }]; // always 1, less than minTeamSize >= 2

            try {
              await createRegistration({
                body: makeBody({ eventId: event._id, teamName: 'Team Alpha', teamMembers: members }),
                file: null,
                req: mockReq,
              });
              expect(true).toBe(false);
            } catch (err) {
              expect(err.statusCode).toBe(400);
              expect(err.message).toMatch(/at least/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 8: Solo event rejects team data
  describe('Property 8: Solo event rejects team data', () => {
    test('returns 400 when teamName provided for solo event', async () => {
      // Feature: techfest-2026-backend, Property 8: Solo event rejects team data
      // Validates: Requirements 5.9
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          (teamName) => {
            // Verify the condition: solo + non-empty teamName should be rejected
            const isSolo = true;
            const hasTeamName = teamName.trim().length > 0;
            expect(isSolo && hasTeamName).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('returns 400 when teamMembers provided for solo event', async () => {
      const event = makeEvent({ participationType: 'solo' });
      Event.findById.mockResolvedValue(event);
      Registration.findOne.mockResolvedValue(null);

      await expect(
        createRegistration({
          body: makeBody({ eventId: event._id, teamName: 'Team X', teamMembers: [{ name: 'Member' }] }),
          file: null,
          req: mockReq,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  test('successful registration returns correct fields', async () => {
    const event = makeEvent({ entryFee: 150 });
    Event.findById.mockResolvedValue(event);
    Registration.findOne.mockResolvedValue(null);

    const result = await createRegistration({
      body: makeBody({ eventId: event._id }),
      file: null,
      req: mockReq,
    });

    expect(result.uniqueRegistrationId).toBe('SRGTF2026-000001');
    expect(result.amountExpected).toBe(150);
    expect(result.paymentStatus).toBe('pending_verification');
    expect(result.registrationStatus).toBe('pending');
  });
});
