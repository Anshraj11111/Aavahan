'use strict';

const Event = require('./event.model');
const Registration = require('../registrations/registration.model');
const generateSlug = require('../../utils/generateSlug');
const createAuditLog = require('../../utils/auditLog');
const { invalidateEventCache, invalidateEventSlugCache } = require('../../services/cache');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const { EVENT_STATUS } = require('../../constants/statuses');

/**
 * Create a new event.
 */
async function createEvent(data, admin, req) {
  const slug = generateSlug(data.title);

  const event = await Event.create({
    ...data,
    slug,
    registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
    createdBy: admin._id,
    updatedBy: admin._id,
  });

  await invalidateEventCache();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'CREATE_EVENT',
    targetModel: 'Event',
    targetId: event._id,
    changes: { after: event.toObject() },
    req,
  });

  return event;
}

/**
 * Get all events (admin view) with filters and pagination.
 */
async function getEvents(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.day) filter.day = query.day;
  if (query.category) filter.category = query.category;
  if (query.department) filter.department = new RegExp(query.department, 'i');
  if (query.status) filter.status = query.status;
  if (query.featured !== undefined) filter.featured = query.featured === 'true';
  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, 'i') },
      { tags: new RegExp(query.search, 'i') },
    ];
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  return { events, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Get a single event by ID (admin view).
 */
async function getEventById(id) {
  const event = await Event.findById(id).lean();
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return event;
}

/**
 * Update an event.
 */
async function updateEvent(id, data, admin, req) {
  const event = await Event.findById(id);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  const before = event.toObject();
  const oldSlug = event.slug;

  Object.assign(event, {
    ...data,
    updatedBy: admin._id,
    registrationDeadline: data.registrationDeadline
      ? new Date(data.registrationDeadline)
      : event.registrationDeadline,
  });

  await event.save();

  // Invalidate caches
  await invalidateEventCache();
  await invalidateEventSlugCache(oldSlug);
  if (event.slug !== oldSlug) {
    await invalidateEventSlugCache(event.slug);
  }

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'UPDATE_EVENT',
    targetModel: 'Event',
    targetId: event._id,
    changes: { before, after: event.toObject() },
    req,
  });

  return event;
}

/**
 * Delete an event (force delete even with registrations).
 */
async function deleteEvent(id, admin, req) {
  const event = await Event.findById(id);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete all registrations for this event first
  const regCount = await Registration.countDocuments({ eventId: id });
  if (regCount > 0) {
    await Registration.deleteMany({ eventId: id });
    console.log(`Deleted ${regCount} registrations for event ${id}`);
  }

  const before = event.toObject();
  await event.deleteOne();

  await invalidateEventCache();
  await invalidateEventSlugCache(event.slug);

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'DELETE_EVENT',
    targetModel: 'Event',
    targetId: id,
    changes: { before },
    req,
  });
}

/**
 * Upload event image (poster or banner) to Cloudinary.
 */
async function uploadEventImage(id, imageBuffer, imageType, admin) {
  const { uploadBuffer } = require('../../config/cloudinary');

  const result = await uploadBuffer(imageBuffer, {
    folder: 'techfest2026/events',
    public_id: `${id}-${imageType}-${Date.now()}`,
  });

  const update = imageType === 'poster'
    ? { posterImage: result.secure_url }
    : { bannerImage: result.secure_url };

  const event = await Event.findByIdAndUpdate(
    id,
    { ...update, updatedBy: admin._id },
    { new: true }
  );

  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  await invalidateEventCache();
  await invalidateEventSlugCache(event.slug);

  return event;
}

// ─── Public service methods ──────────────────────────────────────────────────

/**
 * Get all published events (public, with caching).
 */
async function getPublishedEvents(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: EVENT_STATUS.PUBLISHED };

  if (query.day) filter.day = query.day;
  if (query.category) filter.category = query.category;
  if (query.department) filter.department = new RegExp(query.department, 'i');
  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, 'i') },
      { tags: new RegExp(query.search, 'i') },
    ];
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .select('-createdBy -updatedBy -__v')
      .sort({ day: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  return { events, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Get featured published events.
 */
async function getFeaturedEvents() {
  return Event.find({ status: EVENT_STATUS.PUBLISHED, featured: true })
    .select('-createdBy -updatedBy -__v')
    .sort({ day: 1 })
    .lean();
}

/**
 * Get event by slug (public).
 */
async function getEventBySlug(slug) {
  const event = await Event.findOne({ slug, status: EVENT_STATUS.PUBLISHED })
    .select('-createdBy -updatedBy -__v')
    .lean();

  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return event;
}

/**
 * Get day-wise schedule.
 */
async function getDayWiseSchedule(day) {
  const filter = { status: EVENT_STATUS.PUBLISHED };
  if (day) filter.day = day;

  return Event.find(filter)
    .select('title slug category department day date startTime endTime venue participationType entryFee featured')
    .sort({ day: 1, startTime: 1 })
    .lean();
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventImage,
  getPublishedEvents,
  getFeaturedEvents,
  getEventBySlug,
  getDayWiseSchedule,
};
