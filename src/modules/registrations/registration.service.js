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
    eventId, transactionId, teamName, teamMembers,
  } = body;

  console.log('createRegistration called with eventId:', eventId, 'type:', typeof eventId);

  // 1. Fetch event by ID or slug
  if (!eventId || !eventId.trim()) {
    const err = new Error('Event ID is required');
    err.statusCode = 400;
    throw err;
  }
  
  let event;
  
  // Try to find by ObjectId first (if it's a valid ObjectId format)
  try {
    if (mongoose.Types.ObjectId.isValid(eventId)) {
      event = await Event.findById(eventId);
      console.log('Searched by ObjectId:', eventId, 'Found:', !!event);
    }
  } catch (error) {
    console.error('Error searching by ObjectId:', error.message);
  }
  
  // If not found, try to find by slug
  if (!event) {
    event = await Event.findOne({ slug: eventId });
    console.log('Searched by slug:', eventId, 'Found:', !!event);
  }
  
  // If still not found, list all events for debugging
  if (!event) {
    const allEvents = await Event.find({}).select('_id title slug').limit(10);
    console.error('Event not found. Available events:', allEvents.map(e => ({ id: e._id, slug: e.slug, title: e.title })));
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  
  console.log('Event found:', event._id, event.title);

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

  // 5.1. Check for duplicate transaction ID (must be unique across all registrations)
  if (transactionId && transactionId.trim()) {
    const duplicateTransaction = await Registration.findOne({
      transactionId: transactionId.trim(),
      registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
    });

    if (duplicateTransaction) {
      const err = new Error(
        'This transaction ID has already been used for another registration. Please verify your transaction ID.'
      );
      err.statusCode = 409;
      throw err;
    }
  }

  // 6. Team/solo validation
  if (event.participationType === PARTICIPATION_TYPE.TEAM) {
    if (!teamName || !teamName.trim()) {
      const err = new Error('Team name is required for team events');
      err.statusCode = 400;
      throw err;
    }
    
    // Parse teamMembers if it's a string
    let parsedTeamMembers = teamMembers;
    if (typeof teamMembers === 'string') {
      try {
        parsedTeamMembers = JSON.parse(teamMembers);
      } catch (e) {
        const err = new Error('Invalid team members format');
        err.statusCode = 400;
        throw err;
      }
    }
    
    const memberCount = (parsedTeamMembers || []).length;
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

  // For solo events, ignore empty team details (validator adds default empty array)
  // No validation needed for solo events regarding team details

  // 7. Payment verification for paid events ONLY
  if (event.entryFee > 0) {
    // Transaction ID is mandatory for paid events
    if (!transactionId || !transactionId.trim()) {
      const err = new Error('Transaction ID is required for paid events');
      err.statusCode = 400;
      throw err;
    }

    // Payment screenshot is mandatory for paid events
    if (!file) {
      const err = new Error('Payment screenshot is required for paid events');
      err.statusCode = 400;
      throw err;
    }

    // OCR verification: Extract text from payment screenshot and verify transaction ID
    try {
      console.log('Starting OCR verification for transaction ID:', transactionId);
      
      // Convert buffer to base64
      const base64Image = file.buffer.toString('base64');
      
      // Call OCR.space API
      const FormData = require('form-data');
      const axios = require('axios');
      
      const formData = new FormData();
      formData.append('base64Image', `data:${file.mimetype};base64,${base64Image}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');
      
      const ocrResponse = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: {
          'apikey': 'K87899142388957',
          ...formData.getHeaders()
        },
        timeout: 45000 // 45 second timeout for OCR processing
      });
      
      console.log('OCR Response:', JSON.stringify(ocrResponse.data, null, 2));
      
      if (ocrResponse.data.IsErroredOnProcessing) {
        console.error('OCR processing error:', ocrResponse.data.ErrorMessage);
        const err = new Error('Failed to verify payment screenshot. Please ensure the image is clear and readable.');
        err.statusCode = 400;
        throw err;
      }
      
      const extractedText = ocrResponse.data.ParsedResults?.[0]?.ParsedText || '';
      console.log('Extracted text from screenshot:', extractedText);
      
      if (!extractedText || extractedText.trim().length === 0) {
        const err = new Error('Could not extract text from payment screenshot. Please upload a clear screenshot showing the transaction ID.');
        err.statusCode = 400;
        throw err;
      }
      
      // Verify transaction ID exists in extracted text (case-insensitive)
      const normalizedExtractedText = extractedText.toLowerCase().replace(/\s+/g, '');
      const normalizedTransactionId = transactionId.trim().toLowerCase().replace(/\s+/g, '');
      
      if (!normalizedExtractedText.includes(normalizedTransactionId)) {
        console.error('Transaction ID mismatch. Entered:', transactionId, 'Extracted:', extractedText);
        const err = new Error('Transaction ID does not match the payment screenshot. Please verify your transaction ID and upload the correct screenshot.');
        err.statusCode = 400;
        throw err;
      }
      
      console.log('✓ Transaction ID verified successfully in payment screenshot');
      
    } catch (error) {
      // If it's already our custom error, re-throw it
      if (error.statusCode) {
        throw error;
      }
      
      // For network/timeout errors, provide helpful message
      console.error('OCR verification error:', error.message);
      const err = new Error('Payment verification failed. Please ensure you have uploaded a clear payment screenshot and try again.');
      err.statusCode = 400;
      throw err;
    }
  }

  // 8. Upload payment screenshot to Cloudinary (only for paid events)
  let paymentScreenshotUrl = '';
  if (file && event.entryFee > 0) {
    const result = await uploadBuffer(file.buffer, {
      folder: 'techfest2026/payment-screenshots',
      public_id: `screenshot-${Date.now()}`,
    });
    paymentScreenshotUrl = result.secure_url;
  }

  // 9. Generate unique registration ID (atomic Redis INCR)
  const uniqueRegistrationId = await generateRegistrationId();

  // 10. Determine payment and registration status based on entry fee
  let paymentStatus = PAYMENT_STATUS.PENDING_VERIFICATION;
  let registrationStatus = REGISTRATION_STATUS.PENDING;
  
  if (event.entryFee === 0) {
    // Free events: auto-approve
    paymentStatus = PAYMENT_STATUS.PAID;
    registrationStatus = REGISTRATION_STATUS.APPROVED;
  }

  // 11. Create registration with fee from event (not from request body)
  const registration = await Registration.create({
    fullName,
    email,
    phone,
    instituteName,
    department,
    yearOrSemester,
    eventId: event._id,
    eventTitle: event.title,       // snapshot
    eventDay: event.day,           // snapshot
    participationType: event.participationType,
    teamName: teamName || '',
    teamMembers: teamMembers || [],
    amountExpected: event.entryFee, // ALWAYS from event, never from request
    amountPaid: event.entryFee === 0 ? 0 : 0, // Free events: 0, paid events: 0 until verified
    paymentMethod: 'upi',
    transactionId: transactionId || '',
    paymentScreenshotUrl,
    paymentStatus,
    registrationStatus,
    uniqueRegistrationId,
    sourceIp: req.ip || '',
    userAgent: (req.headers && req.headers['user-agent']) || '',
  });

  // 12. Atomically increment event's currentRegistrations
  await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });

  // 13. Invalidate public stats cache
  await cacheDel(CACHE_KEYS.PUBLIC_STATS);

  // 14. Send confirmation email (non-fatal)
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
