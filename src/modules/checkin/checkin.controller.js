'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { verifyAndCheckIn } = require('./checkin.service');
const { CHECKIN_METHOD } = require('../../constants/statuses');

const checkIn = asyncHandler(async (req, res) => {
  const { uniqueRegistrationId, method } = req.body;
  if (!uniqueRegistrationId) {
    const err = new Error('uniqueRegistrationId is required'); err.statusCode = 400; throw err;
  }
  const reg = await verifyAndCheckIn({
    uniqueRegistrationId,
    method: method || CHECKIN_METHOD.MANUAL,
    admin: req.admin,
    req,
  });
  successResponse(res, { registration: reg }, 'Check-in successful');
});

module.exports = { checkIn };
