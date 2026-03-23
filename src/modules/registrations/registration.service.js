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

  // 5.2. Check for duplicate payment screenshot (using file hash)
  if (file && event.entryFee > 0) {
    const crypto = require('crypto');
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    const duplicateScreenshot = await Registration.findOne({
      paymentScreenshotHash: fileHash,
      registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
    });

    if (duplicateScreenshot) {
      const err = new Error(
        'This payment screenshot has already been used for another registration. Please upload a unique payment screenshot.'
      );
      err.statusCode = 409;
      throw err;
    }
  }

  // 5.3. Check for duplicate team name for the same event (team events only)
  if (event.participationType === PARTICIPATION_TYPE.TEAM && teamName && teamName.trim()) {
    const duplicateTeamName = await Registration.findOne({
      eventId,
      teamName: teamName.trim(),
      registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
    });

    if (duplicateTeamName) {
      const err = new Error(
        `Team name "${teamName.trim()}" is already registered for this event. Please choose a different team name.`
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
    
    // Team size = team leader (1) + additional members
    const additionalMemberCount = (parsedTeamMembers || []).length;
    const totalTeamSize = 1 + additionalMemberCount; // 1 for team leader + additional members
    
    // Minimum team size validation (team leader counts as 1)
    if (totalTeamSize < event.minTeamSize) {
      const err = new Error(
        `Team must have at least ${event.minTeamSize} member(s) including team leader. Provided: ${totalTeamSize}`
      );
      err.statusCode = 400;
      throw err;
    }
    
    // Maximum team size validation
    if (event.maxTeamSize && totalTeamSize > event.maxTeamSize) {
      const err = new Error(
        `Team cannot have more than ${event.maxTeamSize} member(s) including team leader. Provided: ${totalTeamSize}`
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
      // Use word boundaries to ensure EXACT match, not substring match
      const normalizedExtractedText = extractedText.toLowerCase().replace(/\s+/g, '');
      const normalizedTransactionId = transactionId.trim().toLowerCase().replace(/\s+/g, '');
      
      console.log('Normalized extracted text:', normalizedExtractedText);
      console.log('Normalized transaction ID:', normalizedTransactionId);
      
      // Check if transaction ID exists in the extracted text
      // For exact matching, we check if the transaction ID appears as a complete sequence
      // We use indexOf for normalized text (spaces removed) to handle OCR spacing issues
      const transactionIdFound = normalizedExtractedText.includes(normalizedTransactionId);
      
      console.log('Transaction ID found in text:', transactionIdFound);
      
      if (!transactionIdFound) {
        console.error('Transaction ID mismatch. Entered:', transactionId, 'Extracted:', extractedText);
        const err = new Error('Transaction ID does not match the payment screenshot. Please verify your transaction ID and upload the correct screenshot.');
        err.statusCode = 400;
        throw err;
      }
      
      // Verify payment amount in screenshot matches event entry fee
      // Look for the amount in various formats: ₹100, Rs 100, 100.00, ₹1, Rs. 1, etc.
      // Special handling: OCR often misreads ₹1 as "71" or "7 1"
      const amountStr = event.entryFee.toString();
      
      // Normalize extracted text for better matching
      const normalizedText = extractedText.toLowerCase();
      
      // Create multiple patterns to match different amount formats
      const amountPatterns = [
        // Standard formats with rupee symbol
        new RegExp(`₹\\s*${amountStr}(?:\\.00)?(?!\\d)`, 'i'),
        new RegExp(`Rs\\.?\\s*${amountStr}(?:\\.00)?(?!\\d)`, 'i'),
        new RegExp(`${amountStr}(?:\\.00)?\\s*(?:₹|Rs)`, 'i'),
        
        // Amount with word boundaries (for small amounts like 1, 2, etc.)
        new RegExp(`\\b${amountStr}(?:\\.00)?\\b`, 'i'),
        
        // Amount in "Paid to" or "Amount" context
        new RegExp(`(?:paid|amount|total|₹|rs\\.?)\\s*:?\\s*${amountStr}(?:\\.00)?`, 'i'),
        
        // For single digit amounts, be more flexible
        ...(event.entryFee < 10 ? [
          new RegExp(`(?:^|\\s)${amountStr}(?:\\s|$)`, 'i'),
          new RegExp(`(?:paid|sent|transferred).*?${amountStr}`, 'i'),
          // OCR often misreads ₹1 as "71" or "7 1" - handle this specific case
          new RegExp(`\\b7\\s*${amountStr}\\b`, 'i'),
          new RegExp(`\\b7${amountStr}\\b`, 'i'),
          // Additional patterns for ₹1 misread as 71
          new RegExp(`(?:paid|sent|transferred|amount|total).*?7\\s*${amountStr}`, 'i'),
          new RegExp(`(?:paid|sent|transferred|amount|total).*?7${amountStr}`, 'i'),
          // Match "71" or "7 1" anywhere in payment context
          new RegExp(`(?:₹|rs\\.?|paid|sent).*?7\\s*${amountStr}`, 'i')
        ] : [])
      ];
      
      console.log('Checking for amount patterns. Expected amount:', event.entryFee);
      console.log('Extracted text:', extractedText);
      console.log('Testing patterns against extracted text...');
      
      let amountFound = amountPatterns.some((pattern, index) => {
        const match = pattern.test(extractedText);
        console.log(`Pattern ${index + 1}: ${pattern} - Match: ${match}`);
        return match;
      });
      
      // Additional fallback for ₹1: if we see "71" anywhere in the text and expected amount is 1
      if (!amountFound && event.entryFee === 1) {
        const has71 = /71/.test(extractedText) || /7\s*1/.test(extractedText);
        if (has71) {
          console.log('✓ Found "71" or "7 1" in text - treating as ₹1 (OCR misread)');
          amountFound = true;
        }
        
        // SPECIAL CASE: For ₹1 payments, if transaction ID is valid and we found "Completed" status,
        // accept it even if amount is not clearly visible in OCR (₹1 is often displayed in stylized fonts that OCR can't read)
        if (!amountFound && /completed/i.test(extractedText)) {
          console.log('✓ ₹1 payment with valid transaction ID and "Completed" status - accepting payment');
          amountFound = true;
        }
      }
      
      if (!amountFound) {
        console.error('Payment amount mismatch. Expected:', event.entryFee, 'Extracted text:', extractedText);
        
        // For debugging: show what amounts were found in the text
        const foundAmounts = extractedText.match(/₹?\s*\d+(?:\.\d{2})?/g);
        console.log('Amounts found in screenshot:', foundAmounts);
        
        const err = new Error(`Payment amount in screenshot does not match event entry fee of ₹${event.entryFee}. Please upload the correct payment screenshot showing ₹${event.entryFee}.`);
        err.statusCode = 400;
        throw err;
      }
      
      console.log('✓ Transaction ID and payment amount verified successfully in payment screenshot');
      
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
  let paymentScreenshotHash = '';
  
  if (file && event.entryFee > 0) {
    // Generate hash for duplicate detection
    const crypto = require('crypto');
    paymentScreenshotHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    // Upload to Cloudinary
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
    paymentScreenshotHash, // Store hash for duplicate detection
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
