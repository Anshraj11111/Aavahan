'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../utils/response');
const { cacheGet, cacheSet } = require('../../services/cache');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/events');
const eventService = require('../events/event.service');
const Announcement = require('../announcements/announcement.model');
const PaymentConfig = require('../payments/payment.model');
const Registration = require('../registrations/registration.model');
const Event = require('../events/event.model');
const env = require('../../config/env');

/**
 * GET /api/v1/public/fest-info
 */
const getFestInfo = asyncHandler(async (req, res) => {
  return successResponse(res, {
    name: env.FEST_NAME,
    organization: env.FEST_ORG,
    tagline: env.FEST_TAGLINE,
    startDate: env.FEST_START_DATE,
    endDate: env.FEST_END_DATE,
    days: [
      { day: 'Day 1', date: '2026-04-01', theme: 'Unity in Diversity', type: 'Cultural' },
      { day: 'Day 2', date: '2026-04-02', theme: 'Innovation', type: 'Technical' },
      { day: 'Day 3', date: '2026-04-03', theme: 'Excellence', type: 'Technical' },
    ],
  });
});

/**
 * GET /api/v1/public/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const cached = await cacheGet(CACHE_KEYS.PUBLIC_STATS);
  if (cached) return successResponse(res, cached);

  const [totalEvents, totalRegistrations] = await Promise.all([
    Event.countDocuments({ status: 'published' }),
    Registration.countDocuments({ registrationStatus: { $in: ['approved', 'checked_in'] } }),
  ]);

  const data = { totalEvents, totalRegistrations, totalParticipants: totalRegistrations };
  await cacheSet(CACHE_KEYS.PUBLIC_STATS, data, CACHE_TTL.PUBLIC_STATS);
  return successResponse(res, data);
});

/**
 * GET /api/v1/public/events
 */
const getPublishedEvents = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_KEYS.EVENT_LIST}:${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return paginatedResponse(res, cached.events, cached.pagination);

  const result = await eventService.getPublishedEvents(req.query);
  await cacheSet(cacheKey, result, CACHE_TTL.EVENT_LIST);
  return paginatedResponse(res, result.events, result.pagination);
});

/**
 * GET /api/v1/public/events/featured
 */
const getFeaturedEvents = asyncHandler(async (req, res) => {
  const cached = await cacheGet(CACHE_KEYS.FEATURED_EVENTS);
  if (cached) return successResponse(res, cached);

  const events = await eventService.getFeaturedEvents();
  await cacheSet(CACHE_KEYS.FEATURED_EVENTS, events, CACHE_TTL.FEATURED_EVENTS);
  return successResponse(res, events);
});

/**
 * GET /api/v1/public/events/:slug
 */
const getEventBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_KEYS.EVENT_SLUG}${req.params.slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return successResponse(res, { event: cached });

  const event = await eventService.getEventBySlug(req.params.slug);
  await cacheSet(cacheKey, event, CACHE_TTL.EVENT_DETAIL);
  return successResponse(res, { event });
});

/**
 * GET /api/v1/public/schedule
 */
const getSchedule = asyncHandler(async (req, res) => {
  const date = req.query.date || req.query.day;
  const events = await eventService.getDayWiseSchedule(date);
  return successResponse(res, { events });
});

/**
 * GET /api/v1/public/announcements
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const cached = await cacheGet(CACHE_KEYS.ANNOUNCEMENTS);
  if (cached) return successResponse(res, { announcements: cached });

  const now = new Date();
  const announcements = await Announcement.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .select('-createdBy -__v')
    .sort({ createdAt: -1 })
    .lean();

  await cacheSet(CACHE_KEYS.ANNOUNCEMENTS, announcements, CACHE_TTL.ANNOUNCEMENTS);
  return successResponse(res, { announcements });
});

/**
 * GET /api/v1/public/payment-config
 */
const getPaymentConfig = asyncHandler(async (req, res) => {
  const cached = await cacheGet(CACHE_KEYS.PAYMENT_CONFIG);
  if (cached) return successResponse(res, { config: cached });

  const config = await PaymentConfig.findOne({ active: true })
    .select('qrImage upiId payeeName note')
    .lean();

  if (!config) {
    return successResponse(res, { config: null }, 'Payment config not available');
  }

  await cacheSet(CACHE_KEYS.PAYMENT_CONFIG, config, CACHE_TTL.PAYMENT_CONFIG);
  return successResponse(res, { config });
});

/**
 * GET /api/v1/public/ticket/:uniqueId
 */
const getTicketStatus = asyncHandler(async (req, res) => {
  const registration = await Registration.findOne({
    uniqueRegistrationId: req.params.uniqueId,
  })
    .select('uniqueRegistrationId fullName eventTitle eventDay registrationStatus paymentStatus qrCodeUrl checkedIn checkedInAt')
    .lean();

  if (!registration) {
    const err = new Error('Registration not found');
    err.statusCode = 404;
    throw err;
  }

  return successResponse(res, { registration });
});

module.exports = {
  getFestInfo,
  getStats,
  getPublishedEvents,
  getFeaturedEvents,
  getEventBySlug,
  getSchedule,
  getAnnouncements,
  getPaymentConfig,
  getTicketStatus,
};
