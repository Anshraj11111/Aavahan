'use strict';

const registrationService = require('./registration.service');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');

/**
 * POST /api/v1/registrations
 * Multipart form: fields + optional screenshot file
 */
const createRegistration = asyncHandler(async (req, res) => {
  const registration = await registrationService.createRegistration({
    body: req.body,
    file: req.file,
    req,
  });

  return successResponse(
    res,
    {
      uniqueRegistrationId: registration.uniqueRegistrationId,
      registrationStatus: registration.registrationStatus,
      paymentStatus: registration.paymentStatus,
      eventTitle: registration.eventTitle,
      eventDay: registration.eventDay,
      amountExpected: registration.amountExpected,
    },
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
  const { transactionId } = req.body;
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

  // OCR verification
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
      timeout: 45000 // 45 seconds for OCR processing
    });
    
    console.log('OCR Response:', JSON.stringify(ocrResponse.data, null, 2));
    
    if (ocrResponse.data.IsErroredOnProcessing) {
      console.error('OCR processing error:', ocrResponse.data.ErrorMessage);
      return successResponse(
        res,
        { verified: false },
        'Failed to verify payment screenshot. Please ensure the image is clear and readable.',
        400
      );
    }
    
    const extractedText = ocrResponse.data.ParsedResults?.[0]?.ParsedText || '';
    console.log('Extracted text from screenshot:', extractedText);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return successResponse(
        res,
        { verified: false },
        'Could not extract text from payment screenshot. Please upload a clear screenshot showing the transaction ID.',
        400
      );
    }
    
    // Verify transaction ID exists in extracted text (case-insensitive)
    const normalizedExtractedText = extractedText.toLowerCase().replace(/\s+/g, '');
    const normalizedTransactionId = transactionId.trim().toLowerCase().replace(/\s+/g, '');
    
    if (!normalizedExtractedText.includes(normalizedTransactionId)) {
      console.error('Transaction ID mismatch. Entered:', transactionId, 'Extracted:', extractedText);
      return successResponse(
        res,
        { verified: false, extractedText },
        'Transaction ID does not match the payment screenshot. Please verify your transaction ID and upload the correct screenshot.',
        400
      );
    }
    
    console.log('✓ Transaction ID verified successfully in payment screenshot');
    
    return successResponse(
      res,
      { verified: true, extractedText },
      'Payment verified successfully!',
      200
    );
    
  } catch (error) {
    console.error('OCR verification error:', error.message);
    return successResponse(
      res,
      { verified: false },
      'Payment verification failed. Please ensure you have uploaded a clear payment screenshot and try again.',
      400
    );
  }
});

module.exports = { createRegistration, verifyPayment };
