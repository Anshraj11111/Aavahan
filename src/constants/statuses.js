'use strict';

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PENDING_VERIFICATION: 'pending_verification',
  PAID: 'paid',
  REJECTED: 'rejected',
  FAILED: 'failed',
});

const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  CHECKED_IN: 'checked_in',
});

const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

const PARTICIPATION_TYPE = Object.freeze({
  SOLO: 'solo',
  TEAM: 'team',
});

const ANNOUNCEMENT_TYPE = Object.freeze({
  INFO: 'info',
  URGENT: 'urgent',
  UPDATE: 'update',
});

const CHECKIN_METHOD = Object.freeze({
  QR: 'qr',
  MANUAL: 'manual',
});

// Statuses that are considered "active" (block duplicate registration)
const ACTIVE_REGISTRATION_STATUSES = [
  REGISTRATION_STATUS.PENDING,
  REGISTRATION_STATUS.APPROVED,
  REGISTRATION_STATUS.CHECKED_IN,
];

module.exports = {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  EVENT_STATUS,
  PARTICIPATION_TYPE,
  ANNOUNCEMENT_TYPE,
  CHECKIN_METHOD,
  ACTIVE_REGISTRATION_STATUSES,
};
