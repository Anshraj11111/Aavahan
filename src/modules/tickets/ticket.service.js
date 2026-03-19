'use strict';

const Registration = require('../registrations/registration.model');
const { REGISTRATION_STATUS } = require('../../constants/statuses');

/**
 * Get ticket by uniqueRegistrationId. Returns ticket only if approved.
 */
async function getTicketByUniqueId(uniqueRegistrationId) {
  const reg = await Registration.findOne({ uniqueRegistrationId }).lean();
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }
  if (reg.registrationStatus !== REGISTRATION_STATUS.APPROVED &&
      reg.registrationStatus !== REGISTRATION_STATUS.CHECKED_IN) {
    const err = new Error('Ticket is not available. Registration must be approved first.');
    err.statusCode = 403; throw err;
  }
  return reg;
}

/**
 * Get all tickets by email or phone.
 */
async function getTicketsByContact({ email, phone }) {
  if (!email && !phone) {
    const err = new Error('Email or phone is required'); err.statusCode = 400; throw err;
  }
  const filter = { $or: [] };
  if (email) filter.$or.push({ email: email.toLowerCase() });
  if (phone) filter.$or.push({ phone });

  const registrations = await Registration.find(filter)
    .select('uniqueRegistrationId fullName eventTitle eventDay registrationStatus paymentStatus qrCodeUrl createdAt')
    .lean();

  return registrations;
}

module.exports = { getTicketByUniqueId, getTicketsByContact };
