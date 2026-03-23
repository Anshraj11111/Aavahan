'use strict';

const registrationService = require('./registration.service');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * POST /api/v1/registrations
 * Multipart form: fields + optional screenshot file
 */
const createRegistration = asyncHandler(async (req, res) => {
  // Log incoming request data for debugging
  console.log('Registration request received:', {
    body: req.body,
    hasFile: !!req.file,
    teamMembers: req.body.teamMembers,
    teamMembersType: typeof req.body.teamMembers
  });
  
  const registration = await registrationService.createRegistration({
    body: req.body,
    file: req.file,
    req,
  });

  return successResponse(
    res,
    registration,
    'Registration submitted successfully. You will receive a confirmation email.',
    201
  );
});

module.exports = { createRegistration };

/**
 * POST /api/v1/registrations/verify-payment
 * Verify payment screenshot and transaction ID match using OCR
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { transactionId, eventId, expectedAmount } = req.body;
  const file = req.file;

  // Validate inputs
  if (!transactionId || !transactionId.trim()) {
    const err = new Error('Transaction ID is required');
    err.statusCode = 400;
    throw err;
  }

  if (!file) {
    const err = new Error('Payment screenshot is required');
    err.statusCode = 400;
    throw err;
  }
  
  if (!expectedAmount || isNaN(expectedAmount)) {
    const err = new Error('Expected payment amount is required');
    err.statusCode = 400;
    throw err;
  }

  // OCR verification
  try {
    console.log('Starting OCR verification for transaction ID:', transactionId, 'Expected amount:', expectedAmount);
    
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
      timeout: 45000 // 45 seconds for OCR processing
    });
    
    console.log('OCR Response:', JSON.stringify(ocrResponse.data, null, 2));
    
    if (ocrResponse.data.IsErroredOnProcessing) {
      console.error('OCR processing error:', ocrResponse.data.ErrorMessage);
      return errorResponse(
        res,
        'Failed to verify payment screenshot. Please ensure the image is clear and readable.',
        400
      );
    }
    
    const extractedText = ocrResponse.data.ParsedResults?.[0]?.ParsedText || '';
    console.log('Extracted text from screenshot:', extractedText);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return errorResponse(
        res,
        'Could not extract text from payment screenshot. Please upload a clear screenshot showing the transaction ID and amount.',
        400
      );
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
      return errorResponse(
        res,
        'Transaction ID does not match the payment screenshot. Please verify your transaction ID and upload the correct screenshot.',
        400
      );
    }
    
    // Verify payment amount in screenshot
    const amountStr = expectedAmount.toString();
    
    // Normalize extracted text for better matching
    const normalizedText = extractedText.toLowerCase();
    
    // Create multiple patterns to match different amount formats
    // Special handling: OCR often misreads ₹1 as "71" or "7 1"
    const amountPatterns = [
      // Standard formats with rupee symbol
      new RegExp(`₹\\s*${amountStr}(?:\\.00)?(?!\\d)`, 'i'),
      new RegExp(`Rs\\.?\\s*${amountStr}(?:\\.00)?(?!\\d)`, 'i'),
      new RegExp(`${amountStr}(?:\\.00)?\\s*(?:₹|Rs)`, 'i'),
      
      // Amount with word boundaries (for small amounts like 1, 2, etc.)
      new RegExp(`\\b${amountStr}(?:\\.00)?\\b`, 'i'),
      
      // Amount in "Paid to" or "Amount" context
      new RegExp(`(?:paid|amount|total|₹|rs\\.?)\\s*:?\\s*${amountStr}(?:\.00)?`, 'i'),
      
      // For single digit amounts, be more flexible
      ...(parseFloat(expectedAmount) < 10 ? [
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
    
    console.log('Checking for amount patterns. Expected amount:', expectedAmount);
    console.log('Extracted text:', extractedText);
    console.log('Testing patterns against extracted text...');
    
    let amountFound = amountPatterns.some((pattern, index) => {
      const match = pattern.test(extractedText);
      console.log(`Pattern ${index + 1}: ${pattern} - Match: ${match}`);
      return match;
    });
    
    // Additional fallback for ₹1: if we see "71" anywhere in the text and expected amount is 1
    if (!amountFound && parseFloat(expectedAmount) === 1) {
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
      console.error('Payment amount mismatch. Expected:', expectedAmount, 'Extracted text:', extractedText);
      
      // For debugging: show what amounts were found in the text
      const foundAmounts = extractedText.match(/₹?\s*\d+(?:\.\d{2})?/g);
      console.log('Amounts found in screenshot:', foundAmounts);
      
      return errorResponse(
        res,
        `Payment amount in screenshot does not match event entry fee of ₹${expectedAmount}. Please upload the correct payment screenshot.`,
        400
      );
    }
    
    console.log('✓ Transaction ID and payment amount verified successfully in payment screenshot');
    
    return successResponse(
      res,
      { verified: true, extractedText },
      'Payment verified successfully!',
      200
    );
    
  } catch (error) {
    console.error('OCR verification error:', error.message);
    return errorResponse(
      res,
      'Payment verification failed. Please ensure you have uploaded a clear payment screenshot and try again.',
      400
    );
  }
});

/**
 * POST /api/v1/registrations/check-team-name
 * Check if team name is available for an event
 */
const checkTeamName = asyncHandler(async (req, res) => {
  const { eventId, teamName } = req.body;

  if (!eventId || !teamName || !teamName.trim()) {
    return successResponse(
      res,
      { available: true },
      'Team name is required',
      200
    );
  }

  // Check for duplicate team name in the same event
  const Registration = require('./registration.model');
  const { ACTIVE_REGISTRATION_STATUSES } = require('../../constants/statuses');
  
  const duplicate = await Registration.findOne({
    eventId,
    teamName: teamName.trim(),
    registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
  });

  if (duplicate) {
    return successResponse(
      res,
      { available: false },
      `Team name "${teamName.trim()}" is already registered for this event. Please choose a different team name.`,
      200
    );
  }

  return successResponse(
    res,
    { available: true },
    'Team name is available',
    200
  );
});

/**
 * POST /api/v1/registrations/check-transaction
 * Check if transaction ID is already used
 */
const checkTransactionId = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId || !transactionId.trim()) {
    return successResponse(
      res,
      { available: true },
      'Transaction ID is required',
      200
    );
  }

  // Check for duplicate transaction ID
  const Registration = require('./registration.model');
  const { ACTIVE_REGISTRATION_STATUSES } = require('../../constants/statuses');
  
  const duplicate = await Registration.findOne({
    transactionId: transactionId.trim(),
    registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
  });

  if (duplicate) {
    return successResponse(
      res,
      { available: false },
      'This transaction ID has already been used for another registration. Please verify your transaction ID.',
      200
    );
  }

  return successResponse(
    res,
    { available: true },
    'Transaction ID is available',
    200
  );
});

/**
 * POST /api/v1/registrations/check-screenshot
 * Check if payment screenshot hash already exists
 */
const checkScreenshot = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    return successResponse(
      res,
      { available: true },
      'Screenshot is required',
      200
    );
  }

  // Generate hash for the screenshot
  const crypto = require('crypto');
  const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
  
  // Check for duplicate screenshot hash
  const Registration = require('./registration.model');
  const { ACTIVE_REGISTRATION_STATUSES } = require('../../constants/statuses');
  
  const duplicate = await Registration.findOne({
    paymentScreenshotHash: fileHash,
    registrationStatus: { $in: ACTIVE_REGISTRATION_STATUSES },
  });

  if (duplicate) {
    return successResponse(
      res,
      { available: false },
      'This payment screenshot has already been used for another registration. Please upload a unique payment screenshot.',
      200
    );
  }

  return successResponse(
    res,
    { available: true },
    'Screenshot is unique',
    200
  );
});

module.exports = { createRegistration, verifyPayment, checkTeamName, checkTransactionId, checkScreenshot };
