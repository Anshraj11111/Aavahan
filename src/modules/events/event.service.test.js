'use strict';

jest.mock('./event.model');
jest.mock('../registrations/registration.model');
jest.mock('../../services/cache', () => ({
  invalidateEventCache: jest.fn(async () => {}),
  invalidateEventSlugCache: jest.fn(async () => {}),
}));
jest.mock('../../utils/auditLog', () => jest.fn(async () => {}));
jest.mock('../../config/env', () => ({ isProduction: false }));

const Event = require('./event.model');
const Registration = require('../registrations/registration.model');
const { invalidateEventCache } = require('../../services/cache');
const eventService = require('./event.service');

const mockAdmin = { _id: 'admin1', email: 'admin@test.com' };
const mockReq = { ip: '127.0.0.1', headers: {} };

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    test('generates a slug from the title', async () => {
      const mockEvent = {
        _id: 'evt1',
        title: 'Hackathon 2026',
        slug: 'hackathon-2026-abc12',
        toObject: () => ({ _id: 'evt1', title: 'Hackathon 2026' }),
      };
      Event.create.mockResolvedValue(mockEvent);

      const result = await eventService.createEvent(
        {
          title: 'Hackathon 2026',
          category: 'technical',
          day: 'Day 2',
          date: '2026-04-02',
          participationType: 'team',
        },
        mockAdmin,
        mockReq
      );

      expect(Event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hackathon 2026',
          slug: expect.stringMatching(/^hackathon-2026-/),
        })
      );
      expect(result.slug).toMatch(/^hackathon-2026-/);
    });

    test('invalidates event cache after creation', async () => {
      const mockEvent = {
        _id: 'evt1',
        title: 'Test Event',
        slug: 'test-event-xyz',
        toObject: () => ({}),
      };
      Event.create.mockResolvedValue(mockEvent);

      await eventService.createEvent(
        { title: 'Test Event', category: 'cultural', day: 'Day 1', date: '2026-04-01', participationType: 'solo' },
        mockAdmin,
        mockReq
      );

      expect(invalidateEventCache).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    test('blocks deletion when registrations exist', async () => {
      const mockEvent = {
        _id: 'evt1',
        slug: 'test-event',
        toObject: () => ({}),
        deleteOne: jest.fn(),
      };
      Event.findById.mockResolvedValue(mockEvent);
      Registration.countDocuments.mockResolvedValue(5);

      await expect(
        eventService.deleteEvent('evt1', mockAdmin, mockReq)
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(mockEvent.deleteOne).not.toHaveBeenCalled();
    });

    test('allows deletion when no registrations exist', async () => {
      const mockEvent = {
        _id: 'evt1',
        slug: 'test-event',
        toObject: () => ({}),
        deleteOne: jest.fn(async () => {}),
      };
      Event.findById.mockResolvedValue(mockEvent);
      Registration.countDocuments.mockResolvedValue(0);

      await eventService.deleteEvent('evt1', mockAdmin, mockReq);

      expect(mockEvent.deleteOne).toHaveBeenCalled();
    });

    test('throws 404 when event not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(
        eventService.deleteEvent('nonexistent', mockAdmin, mockReq)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateEvent', () => {
    test('invalidates Redis cache after update', async () => {
      const mockEvent = {
        _id: 'evt1',
        slug: 'old-slug',
        toObject: () => ({}),
        save: jest.fn(async () => {}),
      };
      Event.findById.mockResolvedValue(mockEvent);

      await eventService.updateEvent('evt1', { title: 'Updated' }, mockAdmin, mockReq);

      expect(invalidateEventCache).toHaveBeenCalled();
    });
  });
});
