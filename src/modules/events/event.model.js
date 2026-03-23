'use strict';

const mongoose = require('mongoose');
const { EVENT_DAYS, EVENT_CATEGORIES } = require('../../constants/events');
const { EVENT_STATUS, PARTICIPATION_TYPE } = require('../../constants/statuses');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: Object.values(EVENT_CATEGORIES),
      lowercase: true,
    },
    department: { type: String, trim: true, default: '' },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: Object.values(EVENT_DAYS),
    },
    date: { type: Date, required: [true, 'Date is required'] },
    startTime: { type: String, trim: true, default: '' },
    endTime: { type: String, trim: true, default: '' },
    venue: { type: String, trim: true, default: '' },
    shortDescription: { type: String, trim: true, maxlength: 500, default: '' },
    fullDescription: { type: String, trim: true, default: '' },
    rules: [{ type: String, trim: true }],
    eligibility: { type: String, trim: true, default: '' },
    participationType: {
      type: String,
      required: [true, 'Participation type is required'],
      enum: Object.values(PARTICIPATION_TYPE),
    },
    minTeamSize: { type: Number, default: 1, min: 1 },
    maxTeamSize: { type: Number, default: 1, min: 1 },
    entryFee: { type: Number, default: 0, min: 0 },
    prizeDetails: { type: String, trim: true, default: '' },
    coordinatorName: { type: String, trim: true, default: '' },
    coordinatorPhone: { type: String, trim: true, default: '' },
    coordinatorEmail: { type: String, trim: true, lowercase: true, default: '' },
    registrationDeadline: { type: Date, default: null },
    maxRegistrations: { type: Number, default: null },
    currentRegistrations: { type: Number, default: 0, min: 0 },
    posterImage: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },
    featured: { type: Boolean, default: false },
    isScheduleOnly: { type: Boolean, default: false },  // Flag for schedule-only items
    tags: [{ type: String, trim: true, lowercase: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// day: filter events by day
eventSchema.index({ day: 1 });
// category: filter by category
eventSchema.index({ category: 1 });
// department: filter by department
eventSchema.index({ department: 1 });
// featured: quickly fetch featured events
eventSchema.index({ featured: 1 });
// status: filter published/draft/closed
eventSchema.index({ status: 1 });
// registrationDeadline: cron job queries for expired deadlines
eventSchema.index({ registrationDeadline: 1 });
// Compound: public event listing (published + day)
eventSchema.index({ status: 1, day: 1 });
// Compound: featured published events
eventSchema.index({ status: 1, featured: 1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
