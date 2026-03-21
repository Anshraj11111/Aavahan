'use strict';

const mongoose = require('mongoose');
const { PAYMENT_STATUS, REGISTRATION_STATUS, PARTICIPATION_TYPE } = require('../../constants/statuses');

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    // Participant info
    fullName: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 150 },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    instituteName: { type: String, required: [true, 'Institute name is required'], trim: true },
    department: { type: String, trim: true, default: '' },
    yearOrSemester: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },

    // Event reference + snapshots
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, trim: true, default: '' },   // snapshot
    eventDay: { type: String, trim: true, default: '' },     // snapshot

    // Team info
    participationType: {
      type: String,
      enum: Object.values(PARTICIPATION_TYPE),
      required: true,
    },
    teamName: { type: String, trim: true, default: '' },
    teamMembers: { type: [teamMemberSchema], default: [] },

    // Payment
    amountExpected: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'upi' },
    transactionId: { type: String, trim: true, default: '' },
    paymentScreenshotUrl: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING_VERIFICATION,
    },

    // Registration status
    registrationStatus: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
    },
    adminRemarks: { type: String, trim: true, default: '' },

    // Unique ID & ticket
    uniqueRegistrationId: { type: String, required: true, unique: true },
    qrCodeUrl: { type: String, default: '' },
    ticketData: { type: mongoose.Schema.Types.Mixed, default: null },

    // Approval/rejection tracking
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedAt: { type: Date, default: null },

    // Check-in
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null },

    // Metadata
    sourceIp: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
registrationSchema.index({ email: 1 });
registrationSchema.index({ phone: 1 });
registrationSchema.index({ eventId: 1 });
registrationSchema.index({ paymentStatus: 1 });
registrationSchema.index({ registrationStatus: 1 });
registrationSchema.index({ checkedIn: 1 });
// Compound: duplicate check (email + event)
registrationSchema.index({ email: 1, eventId: 1 });
// Compound: duplicate check (phone + event)
registrationSchema.index({ phone: 1, eventId: 1 });
// Compound: admin list filtering
registrationSchema.index({ eventId: 1, registrationStatus: 1 });
registrationSchema.index({ eventId: 1, paymentStatus: 1 });
// Cron job: pending verification older than 24h
registrationSchema.index({ paymentStatus: 1, createdAt: 1 });
// Unique transaction ID - sparse index (only non-empty values must be unique)
registrationSchema.index({ transactionId: 1 }, { unique: true, sparse: true, partialFilterExpression: { transactionId: { $ne: '' } } });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
