'use strict';

const mongoose = require('mongoose');
const Registration = require('./registration.model');
const Event = require('../events/event.model');
const generateRegistrationId = require('../../utils/generateRegistrationId');
const { uploadBuffer } = require('../../config/cloudinary');
const { sendRegistrationReceived } = require('../../services/email');
const { cacheDel } = require('../../services/cache');
const { CACHE_KEYS } = require('../../constants/events');
const {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  PARTICIPATION_TYPE,
  ACTIVE_REGISTRATION_STATUSES,
  EVENT_STATUS,
} = require('../../constants/statuses');

/**
 * Create a new registration.
 * Enforces all business rules: deadline, capacity, duplicate, team/solo, fee.
 */
async function createRegistration({ body, file, req }) {
  const {
    fullName, email, phone, instituteName, department, yearOrSemester,
    city, gender, eventId, transactionId, teamName, teamMembers,
  } = body;

  // 1. Fetch event (validates eventId is valid ObjectId)
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    const err = new Error('Invalid event ID');
    err.statusCode = 400;
    throw err;
  }

  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check event is published
  if (event.status !== EVENT_STATUS.PUBLISHED) {
    const err = new Error('Registrations are not open for this event');
    err.statusCode = 400;
    throw err;
  }

  // 3. Check registration deadline
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    const err = new Error('Registration deadline has passed for this event');
    err.statusCode = 400;
    throw err;
  }

  // 4. Check max registrations capacity
  if (event.maxRegistrations && event.currentRegistrations >= event.maxRegistrations) {
    const err = new Error('This event has reached maximum registrations');
    err.statusCode = 400;
    throw err;
  }

  // 5. Check for duplicate registration (same email OR phone for same event)
  const duplicate = await Registration.findOne({
    eventId,
    registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
    $or: [{ email }, { phone }],
  });

  if (duplicate) {
    const err = new Error(
      'You already have an active registration for this event. Check your registration status using your Registration ID.'
    );
    err.statusCode = 409;
    throw err;
  }

  // 6. Team/solo validation
  if (event.participationType === PARTICIPATION_TYPE.TEAM) {
    if (!teamName || !teamName.trim()) {
      const err = new Error('Team name is required for team events');
      err.statusCode = 400;
      throw err;
    }
    const memberCount = (teamMembers || []).length;
    if (memberCount < event.minTeamSize) {
      const err = new Error(
        `Team must have at least ${event.minTeamSize} member(s). Provided: ${memberCount}`
      );
      err.statusCode = 400;
      throw err;
    }
    if (event.maxTeamSize && memberCount > event.maxTeamSize) {
      const err = new Error(
        `Team cannot have more than ${event.maxTeamSize} member(s). Provided: ${memberCount}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  if (event.participationType === PARTICIPATION_TYPE.SOLO) {
    if ((teamName && teamName.trim()) || (teamMembers && teamMembers.length > 0)) {
      const err = new Error('Team details are not allowed for solo events');
      err.statusCode = 400;
      throw err;
    }
  }

  // 7. Upload payment screenshot to Cloudinary
  let paymentScreenshotUrl = '';
  if (file) {
    const result = await uploadBuffer(file.buffer, {
      folder: 'techfest2026/payment-screenshots',
      public_id: `screenshot-${Date.now()}`,
    });
    paymentScreenshotUrl = result.secure_url;
  }

  // 8. Generate unique registration ID (atomic Redis INCR)
  const uniqueRegistrationId = await generateRegistrationId();

  // 9. Create registration with fee from event (not from request body)
  const registration = await Registration.create({
    fullName,
    email,
    phone,
    instituteName,
    department,
    yearOrSemester,
    city,
    gender,
    eventId: event._id,
    eventTitle: event.title,       // snapshot
    eventDay: event.day,           // snapshot
    participationType: event.participationType,
    teamName: teamName || '',
    teamMembers: teamMembers || [],
    amountExpected: event.entryFee, // ALWAYS from event, never from request
    amountPaid: 0,
    paymentMethod: 'upi',
    transactionId: transactionId || '',
    paymentScreenshotUrl,
    paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION,
    registrationStatus: REGISTRATION_STATUS.PENDING,
    uniqueRegistrationId,
    sourceIp: req.ip || '',
    userAgent: (req.headers && req.headers['user-agent']) || '',
  });

  // 10. Atomically increment event's currentRegistrations
  await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });

  // 11. Invalidate public stats cache
  await cacheDel(CACHE_KEYS.PUBLIC_STATS);

  // 12. Send confirmation email (non-fatal)
  sendRegistrationReceived({
    to: email,
    fullName,
    eventTitle: event.title,
    uniqueRegistrationId,
    eventDay: event.day,
    amountExpected: event.entryFee,
  }).catch((err) => console.error('[Email] Registration confirmation failed:', err.message));

  return registration;
}

module.exports = { createRegistration };
