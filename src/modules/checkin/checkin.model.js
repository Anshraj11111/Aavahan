'use strict';

const mongoose = require('mongoose');
const { CHECKIN_METHOD } = require('../../constants/statuses');

const checkInLogSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    checkedInAt: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: Object.values(CHECKIN_METHOD),
      default: CHECKIN_METHOD.MANUAL,
    },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

checkInLogSchema.index({ registrationId: 1 });
checkInLogSchema.index({ eventId: 1 });
checkInLogSchema.index({ checkedInAt: 1 });
checkInLogSchema.index({ checkedInBy: 1 });

const CheckInLog = mongoose.model('CheckInLog', checkInLogSchema);
module.exports = CheckInLog;
