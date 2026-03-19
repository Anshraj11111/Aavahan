'use strict';

const Registration = require('../registrations/registration.model');
const CheckInLog = require('./checkin.model');
const createAuditLog = require('../../utils/auditLog');
const { REGISTRATION_STATUS, CHECKIN_METHOD } = require('../../constants/statuses');

/**
 * Verify and check in a participant.
 * Accepts uniqueRegistrationId (from QR scan or manual entry).
 */
async function verifyAndCheckIn({ uniqueRegistrationId, method = CHECKIN_METHOD.MANUAL, admin, req }) {
  const reg = await Registration.findOne({ uniqueRegistrationId });
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }

  if (reg.checkedIn) {
    const err = new Error('Participant has already been checked in');
    err.statusCode = 409; throw err;
  }

  if (reg.registrationStatus !== REGISTRATION_STATUS.APPROVED) {
    const err = new Error(
      `Cannot check in. Registration status is "${reg.registrationStatus}". Must be approved.`
    );
    err.statusCode = 400; throw err;
  }

  reg.checkedIn = true;
  reg.checkedInAt = new Date();
  reg.registrationStatus = REGISTRATION_STATUS.CHECKED_IN;
  await reg.save();

  // Create CheckInLog
  await CheckInLog.create({
    registrationId: reg._id,
    eventId: reg.eventId,
    checkedInBy: admin._id,
    method,
    ipAddress: req ? (req.ip || '') : '',
  });

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'CHECK_IN',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { after: { checkedIn: true, checkedInAt: reg.checkedInAt } },
    req,
  });

  return reg;
}

module.exports = { verifyAndCheckIn };
