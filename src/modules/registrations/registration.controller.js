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
