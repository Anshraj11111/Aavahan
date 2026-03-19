'use strict';

const mongoose = require('mongoose');
const { ANNOUNCEMENT_TYPE } = require('../../constants/statuses');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    type: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_TYPE),
      default: ANNOUNCEMENT_TYPE.INFO,
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ active: 1 });
announcementSchema.index({ startDate: 1 });
announcementSchema.index({ endDate: 1 });
// Compound: public query for active announcements in date range
announcementSchema.index({ active: 1, startDate: 1, endDate: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
