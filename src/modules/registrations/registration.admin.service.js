'use strict';

const Registration = require('./registration.model');
const Event = require('../events/event.model');
const generateQR = require('../../utils/generateQR');
const createAuditLog = require('../../utils/auditLog');
const { sendApprovalEmail, sendRejectionEmail } = require('../../services/email');
const { PAYMENT_STATUS, REGISTRATION_STATUS } = require('../../constants/statuses');

// ─── List Registrations ──────────────────────────────────────────────────────

/**
 * List registrations with filters, search, and pagination.
 */
async function listRegistrations({ query }) {
  const {
    page = 1, limit = 20, eventId, registrationStatus, paymentStatus,
    search, day,
  } = query;

  const filter = {};
  if (eventId) filter.eventId = eventId;
  if (registrationStatus) filter.registrationStatus = registrationStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (day) filter.eventDay = day;

  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [{ fullName: re }, { email: re }, { phone: re }, { uniqueRegistrationId: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Registration.countDocuments(filter),
  ]);

  return {
    registrations,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─── Approve Registration ────────────────────────────────────────────────────

async function approveRegistration({ registrationId, admin, req }) {
  const reg = await Registration.findById(registrationId);
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }
  if (reg.registrationStatus === REGISTRATION_STATUS.APPROVED) {
    const err = new Error('Registration is already approved'); err.statusCode = 400; throw err;
  }

  // Build QR payload
  const qrPayload = {
    uniqueRegistrationId: reg.uniqueRegistrationId,
    fullName: reg.fullName,
    eventTitle: reg.eventTitle,
    eventDay: reg.eventDay,
    participationType: reg.participationType,
  };

  const qrCodeUrl = await generateQR(qrPayload, `qr-${reg.uniqueRegistrationId}`);

  const before = {
    paymentStatus: reg.paymentStatus,
    registrationStatus: reg.registrationStatus,
    approvedBy: reg.approvedBy,
    approvedAt: reg.approvedAt,
  };

  reg.paymentStatus = PAYMENT_STATUS.PAID;
  reg.registrationStatus = REGISTRATION_STATUS.APPROVED;
  reg.approvedBy = admin._id;
  reg.approvedAt = new Date();
  reg.qrCodeUrl = qrCodeUrl;
  reg.ticketData = qrPayload;
  await reg.save();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'APPROVE_REGISTRATION',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { before, after: { paymentStatus: reg.paymentStatus, registrationStatus: reg.registrationStatus } },
    req,
  });

  sendApprovalEmail({
    to: reg.email,
    fullName: reg.fullName,
    eventTitle: reg.eventTitle,
    uniqueRegistrationId: reg.uniqueRegistrationId,
    eventDay: reg.eventDay,
    qrCodeUrl,
  }).catch((e) => console.error('[Email] Approval email failed:', e.message));

  return reg;
}

// ─── Reject Registration ─────────────────────────────────────────────────────

async function rejectRegistration({ registrationId, reason, admin, req }) {
  const reg = await Registration.findById(registrationId);
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }
  if (reg.registrationStatus === REGISTRATION_STATUS.REJECTED) {
    const err = new Error('Registration is already rejected'); err.statusCode = 400; throw err;
  }

  const before = { registrationStatus: reg.registrationStatus, paymentStatus: reg.paymentStatus };

  reg.registrationStatus = REGISTRATION_STATUS.REJECTED;
  reg.paymentStatus = PAYMENT_STATUS.REJECTED;
  reg.rejectedBy = admin._id;
  reg.rejectedAt = new Date();
  reg.adminRemarks = reason || '';
  await reg.save();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'REJECT_REGISTRATION',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { before, after: { registrationStatus: reg.registrationStatus, adminRemarks: reg.adminRemarks } },
    req,
  });

  sendRejectionEmail({
    to: reg.email,
    fullName: reg.fullName,
    eventTitle: reg.eventTitle,
    uniqueRegistrationId: reg.uniqueRegistrationId,
    reason: reason || 'Payment verification failed',
  }).catch((e) => console.error('[Email] Rejection email failed:', e.message));

  return reg;
}

// ─── Edit Registration ───────────────────────────────────────────────────────

async function editRegistration({ registrationId, updates, admin, req }) {
  const reg = await Registration.findById(registrationId);
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }

  const allowedFields = ['fullName', 'phone', 'instituteName', 'department', 'yearOrSemester', 'city', 'gender', 'adminRemarks', 'transactionId'];
  const before = {};
  const after = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      before[field] = reg[field];
      reg[field] = updates[field];
      after[field] = updates[field];
    }
  }

  await reg.save();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'EDIT_REGISTRATION',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { before, after },
    req,
  });

  return reg;
}

// ─── Cancel Registration ─────────────────────────────────────────────────────

async function cancelRegistration({ registrationId, reason, admin, req }) {
  const reg = await Registration.findById(registrationId);
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }
  if (reg.registrationStatus === REGISTRATION_STATUS.CANCELLED) {
    const err = new Error('Registration is already cancelled'); err.statusCode = 400; throw err;
  }

  const before = { registrationStatus: reg.registrationStatus };

  reg.registrationStatus = REGISTRATION_STATUS.CANCELLED;
  reg.adminRemarks = reason || reg.adminRemarks;
  await reg.save();

  // Decrement event's currentRegistrations
  await Event.findByIdAndUpdate(reg.eventId, { $inc: { currentRegistrations: -1 } });

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'CANCEL_REGISTRATION',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { before, after: { registrationStatus: REGISTRATION_STATUS.CANCELLED } },
    req,
  });

  return reg;
}

// ─── Regenerate QR ───────────────────────────────────────────────────────────

async function regenerateQR({ registrationId, admin, req }) {
  const reg = await Registration.findById(registrationId);
  if (!reg) {
    const err = new Error('Registration not found'); err.statusCode = 404; throw err;
  }
  if (reg.registrationStatus !== REGISTRATION_STATUS.APPROVED) {
    const err = new Error('QR can only be regenerated for approved registrations'); err.statusCode = 400; throw err;
  }

  const qrPayload = {
    uniqueRegistrationId: reg.uniqueRegistrationId,
    fullName: reg.fullName,
    eventTitle: reg.eventTitle,
    eventDay: reg.eventDay,
    participationType: reg.participationType,
  };

  const qrCodeUrl = await generateQR(qrPayload, `qr-${reg.uniqueRegistrationId}-${Date.now()}`);
  reg.qrCodeUrl = qrCodeUrl;
  reg.ticketData = qrPayload;
  await reg.save();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'REGENERATE_QR',
    targetModel: 'Registration',
    targetId: reg._id.toString(),
    changes: { after: { qrCodeUrl } },
    req,
  });

  return reg;
}

module.exports = {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  editRegistration,
  cancelRegistration,
  regenerateQR,
};
